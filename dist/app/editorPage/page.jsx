"use client";
import dynamic from 'next/dynamic';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { IconAlertTriangle, IconLoader2, IconMicrophone, IconMicrophoneOff, IconRefresh, } from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Client from '../../components/Client';
import { initSocket } from '../../socket';
import { useRoomAudio } from '../../lib/useRoomAudio';
const { ACTIONS } = require('../../Actions');
const Editor = dynamic(() => import("../../components/Editor"), {
    ssr: false,
});
const ROOM_SESSION_KEY = 'cosync-room-session';
const wait = (durationMs) => new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
});
const getStatusCopy = (status, editorReady) => {
    switch (status) {
        case 'connecting':
            return 'Connecting to the room service...';
        case 'joining':
            return 'Syncing participants and the latest room snapshot...';
        case 'reconnecting':
            return 'Recovering the room connection...';
        case 'ready':
            return editorReady ? 'Room is stable.' : 'Preparing the editor...';
        case 'error':
            return 'The room needs attention before it can continue.';
        default:
            return 'Bootstrapping the room...';
    }
};
const EditorPageContent = () => {
    var _a, _b;
    const router = useRouter();
    const searchParams = useSearchParams();
    const roomId = (_a = searchParams.get('roomId')) !== null && _a !== void 0 ? _a : '';
    const username = (_b = searchParams.get('username')) !== null && _b !== void 0 ? _b : '';
    const socketRef = useRef(null);
    const codeRef = useRef('');
    const isUnmountingRef = useRef(false);
    const [socket, setSocket] = useState(null);
    const [clients, setClients] = useState([]);
    const [selfSocketId, setSelfSocketId] = useState('');
    const [initialCode, setInitialCode] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [roomStatus, setRoomStatus] = useState('booting');
    const [roomError, setRoomError] = useState(null);
    const [editorReady, setEditorReady] = useState(false);
    const { isSupported: isVoiceSupported, isVoiceEnabled, isMuted, isMicBusy, audioError, enableVoice, toggleMute, } = useRoomAudio({
        socket,
        roomId,
        selfSocketId,
        clients,
    });
    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        if (roomId && username) {
            window.sessionStorage.setItem(ROOM_SESSION_KEY, JSON.stringify({
                roomId,
                username,
            }));
        }
    }, [roomId, username]);
    useEffect(() => {
        if (roomId && username) {
            return;
        }
        if (typeof window === 'undefined') {
            router.replace('/');
            return;
        }
        const rawSession = window.sessionStorage.getItem(ROOM_SESSION_KEY);
        if (!rawSession) {
            router.replace('/');
            return;
        }
        try {
            const session = JSON.parse(rawSession);
            if (session.roomId && session.username) {
                router.replace(`/editorPage?roomId=${session.roomId}&username=${encodeURIComponent(session.username)}`);
                return;
            }
        }
        catch (error) {
            console.error('Failed to restore room session', error);
        }
        router.replace('/');
    }, [roomId, router, username]);
    useEffect(() => {
        if (!roomId || !username || typeof window === 'undefined') {
            return;
        }
        const socketInstance = initSocket();
        socketRef.current = socketInstance;
        setSocket(socketInstance);
        setRoomStatus('connecting');
        isUnmountingRef.current = false;
        const joinRoom = async (attempt = 1) => {
            var _a, _b;
            if (!socketInstance.connected) {
                return;
            }
            setRoomStatus(attempt > 1 ? 'reconnecting' : 'joining');
            setRoomError(null);
            try {
                const response = await new Promise((resolve, reject) => {
                    socketInstance.timeout(7000).emit(ACTIONS.JOIN, {
                        roomId,
                        username,
                        lastKnownCode: codeRef.current,
                    }, (error, result) => {
                        if (error) {
                            reject(error);
                            return;
                        }
                        resolve(result);
                    });
                });
                if (!response.ok || !response.client || !response.clients) {
                    throw new Error(response.error || 'The room did not acknowledge the join request.');
                }
                setSelfSocketId(response.client.socketId);
                setClients(response.clients);
                const latestCode = (_b = (_a = response.code) !== null && _a !== void 0 ? _a : codeRef.current) !== null && _b !== void 0 ? _b : '';
                codeRef.current = latestCode;
                setInitialCode(latestCode);
                setRoomStatus('ready');
                setRoomError(null);
                if (response.recovered) {
                    toast.success('Room connection restored.');
                }
            }
            catch (error) {
                const nextMessage = error instanceof Error
                    ? error.message
                    : 'Unexpected join failure. Please retry.';
                if (attempt < 3 && !isUnmountingRef.current) {
                    await wait(500 * attempt);
                    await joinRoom(attempt + 1);
                    return;
                }
                setRoomStatus('error');
                setRoomError(nextMessage);
                toast.error(nextMessage);
            }
        };
        const handleConnect = () => {
            setIsConnected(true);
            void joinRoom();
        };
        const handleConnectError = (error) => {
            console.error('socket connect error', error);
            setIsConnected(false);
            setRoomStatus('error');
            setRoomError('Could not reach the room service. Please retry in a moment.');
        };
        const handleDisconnect = (reason) => {
            if (isUnmountingRef.current) {
                return;
            }
            setIsConnected(false);
            setRoomStatus('reconnecting');
            setRoomError('Connection interrupted. Recovering your room session...');
            if (reason === 'io server disconnect') {
                socketInstance.connect();
            }
        };
        const handleRoomState = ({ clients: nextClients }) => {
            setClients(nextClients);
        };
        const handleJoined = ({ username: joinedUsername, }) => {
            if (joinedUsername !== username) {
                toast.success(`${joinedUsername} joined the room.`);
            }
        };
        const handleDisconnected = ({ socketId, username: leftUsername, }) => {
            setClients((previousClients) => previousClients.filter((client) => client.socketId !== socketId));
            if (leftUsername) {
                toast(`${leftUsername} left the room.`);
            }
        };
        const handleRoomError = ({ message }) => {
            setRoomError(message);
        };
        const handleSpeakingState = ({ socketId, isSpeaking, }) => {
            setClients((previousClients) => previousClients.map((client) => client.socketId === socketId ? Object.assign(Object.assign({}, client), { isSpeaking }) : client));
        };
        socketInstance.on('connect', handleConnect);
        socketInstance.on('connect_error', handleConnectError);
        socketInstance.on('disconnect', handleDisconnect);
        socketInstance.on(ACTIONS.ROOM_STATE, handleRoomState);
        socketInstance.on(ACTIONS.JOINED, handleJoined);
        socketInstance.on(ACTIONS.DISCONNECTED, handleDisconnected);
        socketInstance.on(ACTIONS.ROOM_ERROR, handleRoomError);
        socketInstance.on(ACTIONS.SPEAKING_STATE_CHANGED, handleSpeakingState);
        if (!socketInstance.connected) {
            socketInstance.connect();
        }
        else {
            handleConnect();
        }
        return () => {
            isUnmountingRef.current = true;
            socketInstance.emit(ACTIONS.LEAVE);
            socketInstance.off('connect', handleConnect);
            socketInstance.off('connect_error', handleConnectError);
            socketInstance.off('disconnect', handleDisconnect);
            socketInstance.off(ACTIONS.ROOM_STATE, handleRoomState);
            socketInstance.off(ACTIONS.JOINED, handleJoined);
            socketInstance.off(ACTIONS.DISCONNECTED, handleDisconnected);
            socketInstance.off(ACTIONS.ROOM_ERROR, handleRoomError);
            socketInstance.off(ACTIONS.SPEAKING_STATE_CHANGED, handleSpeakingState);
            socketInstance.disconnect();
        };
    }, [roomId, router, username]);
    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID copied to your clipboard.');
        }
        catch (error) {
            console.error(error);
            toast.error('Could not copy the room ID.');
        }
    }
    function leaveRoom() {
        var _a;
        if (typeof window !== 'undefined') {
            window.sessionStorage.removeItem(ROOM_SESSION_KEY);
        }
        (_a = socketRef.current) === null || _a === void 0 ? void 0 : _a.emit(ACTIONS.LEAVE);
        router.push('/');
    }
    function reconnect() {
        var _a;
        setRoomError(null);
        setRoomStatus('reconnecting');
        (_a = socketRef.current) === null || _a === void 0 ? void 0 : _a.connect();
    }
    if (!roomId || !username) {
        return <EditorPageLoading />;
    }
    const activeVoiceUsers = clients.filter((client) => client.isAudioEnabled).length;
    const statusCopy = getStatusCopy(roomStatus, editorReady);
    return (<div className="flex h-screen bg-gray-900">
            <div className="w-72 border-r border-gray-700 bg-gray-800 p-5">
                <div className="flex h-full flex-col">
                    <div className="mb-5 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-blue-600">
                            <span className="text-2xl font-bold text-white">Co</span>
                        </div>
                    </div>

                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">Room Status</h3>
                        <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}/>
                    </div>

                    <div className="mb-4 rounded-lg border border-gray-700 bg-gray-900/70 p-3 text-xs text-gray-300">
                        <div className="mb-1">Room: {roomId}</div>
                        <div className="mb-1">Members: {clients.length}</div>
                        <div>Voice ready: {activeVoiceUsers}</div>
                    </div>

                    <div className={`mb-4 rounded-lg border p-3 text-sm ${roomStatus === 'error'
            ? 'border-red-500/40 bg-red-500/10 text-red-100'
            : 'border-blue-500/30 bg-blue-500/10 text-blue-100'}`}>
                        <div className="flex items-start gap-2">
                            {roomStatus === 'error' ? (<IconAlertTriangle className="mt-0.5 h-4 w-4 shrink-0"/>) : (<IconLoader2 className={`mt-0.5 h-4 w-4 shrink-0 ${roomStatus === 'ready' && editorReady ? '' : 'animate-spin'}`}/>)}
                            <div>
                                <div className="font-medium">{statusCopy}</div>
                                {roomError ? <div className="mt-1 text-xs text-gray-300">{roomError}</div> : null}
                                {audioError ? <div className="mt-1 text-xs text-amber-200">{audioError}</div> : null}
                            </div>
                        </div>
                    </div>

                    <div className="mb-4 grid grid-cols-1 gap-3">
                        {!isVoiceEnabled ? (<button className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-600" disabled={!isVoiceSupported || isMicBusy || roomStatus !== 'ready'} onClick={enableVoice}>
                                <IconMicrophone className="h-4 w-4"/>
                                {isMicBusy ? 'Starting Voice...' : 'Enable Voice'}
                            </button>) : (<button className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold text-white transition-colors ${isMuted
                ? 'bg-yellow-600 hover:bg-yellow-700'
                : 'bg-sky-600 hover:bg-sky-700'}`} onClick={toggleMute}>
                                {isMuted ? (<>
                                        <IconMicrophone className="h-4 w-4"/>
                                        Unmute Mic
                                    </>) : (<>
                                        <IconMicrophoneOff className="h-4 w-4"/>
                                        Mute Mic
                                    </>)}
                            </button>)}

                        {!isConnected || roomStatus === 'error' ? (<button className="flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-yellow-700" onClick={reconnect}>
                                <IconRefresh className="h-4 w-4"/>
                                Reconnect
                            </button>) : null}
                    </div>

                    <div className="mb-4 text-xs text-gray-400">
                        Voice uses direct WebRTC peer links with Socket.IO signaling and automatic room recovery.
                    </div>

                    <div className="flex-1 space-y-2 overflow-y-auto">
                        {clients.map((client) => (<Client key={client.socketId} username={client.username} isAudioEnabled={client.isAudioEnabled} isMuted={client.isMuted} isSpeaking={client.isSpeaking} isSelf={client.socketId === selfSocketId}/>))}
                    </div>

                    <button className="mb-3 mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700" onClick={copyRoomId}>
                        Copy ROOM ID
                    </button>
                    <button className="w-full rounded-lg bg-red-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-red-700" onClick={leaveRoom}>
                        Leave
                    </button>
                </div>
            </div>

            <div className="relative flex-1">
                <div className={`h-full ${roomStatus === 'ready' && editorReady ? 'opacity-100' : 'opacity-50'}`}>
                    <Editor socket={socket} roomId={roomId} initialCode={initialCode} onCodeChange={(code) => {
            codeRef.current = code;
        }} onReady={() => setEditorReady(true)}/>
                </div>

                {roomStatus !== 'ready' || !editorReady ? (<div className="absolute inset-0 flex items-center justify-center bg-gray-950/45">
                        <div className="rounded-xl border border-gray-700 bg-gray-900/95 px-6 py-5 text-center text-white shadow-xl">
                            <div className="mb-2 flex justify-center">
                                <IconLoader2 className="h-6 w-6 animate-spin text-blue-300"/>
                            </div>
                            <div className="font-medium">{statusCopy}</div>
                            <div className="mt-1 text-sm text-gray-300">
                                We are waiting for a confirmed room state before opening the editor.
                            </div>
                        </div>
                    </div>) : null}
            </div>
        </div>);
};
const EditorPageLoading = () => (<div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="text-xl text-white">Loading editor...</div>
    </div>);
const EditorPage = () => {
    return (<Suspense fallback={<EditorPageLoading />}>
            <EditorPageContent />
        </Suspense>);
};
export default EditorPage;
