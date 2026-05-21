"use client";
import dynamic from 'next/dynamic';
import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { IconAlertTriangle, IconCode, IconCopy, IconHeadphones, IconLoader2, IconMicrophone, IconMicrophoneOff, IconMinus, IconPlus, IconRefresh, IconSparkles, IconWaveSine, IconX, } from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Client from '../../components/Client';
import { initSocket } from '../../socket';
import { EDITOR_LANGUAGE_OPTIONS } from '../../lib/editor-options';
import { useRoomAudio } from '../../lib/useRoomAudio';
const { ACTIONS } = require('../../Actions');
const Editor = dynamic(() => import("../../components/Editor"), {
    ssr: false,
});
const ROOM_SESSION_KEY = 'cosync-room-session';
const MIN_ZOOM = 80;
const MAX_ZOOM = 150;
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
            return editorReady ? 'Room is stable and ready for work.' : 'Preparing the workspace surface...';
        case 'error':
            return 'The room needs attention before it can continue.';
        default:
            return 'Bootstrapping the room...';
    }
};
const EditorPageContent = () => {
    var _a, _b, _c, _d;
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
    const [currentCode, setCurrentCode] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [zoomLevel, setZoomLevel] = useState(100);
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
                setCurrentCode(latestCode);
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
    function changeZoom(direction) {
        setZoomLevel((currentZoom) => {
            if (direction === 'in') {
                return Math.min(MAX_ZOOM, currentZoom + 10);
            }
            return Math.max(MIN_ZOOM, currentZoom - 10);
        });
    }
    const activeVoiceUsers = clients.filter((client) => client.isAudioEnabled).length;
    const speakingUsers = clients.filter((client) => client.isSpeaking).length;
    const lineCount = currentCode ? currentCode.split('\n').length : 1;
    const characterCount = currentCode.length;
    const statusCopy = getStatusCopy(roomStatus, editorReady);
    const collaboratorLabel = useMemo(() => {
        if (clients.length <= 1) {
            return 'Solo room';
        }
        return `${clients.length} people live`;
    }, [clients.length]);
    if (!roomId || !username) {
        return <EditorPageLoading />;
    }
    return (<div className="premium-shell h-screen overflow-hidden p-3 md:p-4">
            <div className="grid h-full gap-3 xl:grid-cols-[320px_minmax(0,1fr)]">
                <aside className="premium-panel-strong flex min-h-0 flex-col rounded-[30px] p-4 md:p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#67e8c8,#f6b365)] text-sm font-extrabold text-slate-950">
                                Co
                            </div>
                            <div>
                                <div className="text-[1.02rem] font-semibold tracking-[-0.045em] text-white">CoSync Room</div>
                                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{collaboratorLabel}</div>
                            </div>
                        </div>
                        <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.6)]' : 'bg-rose-400'}`}/>
                    </div>

                    <div className="mt-5 rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
                        <div className="flex items-center justify-between text-[0.68rem] uppercase tracking-[0.16em] text-slate-400">
                            <span>Room Health</span>
                            <span>{roomStatus === 'ready' ? 'Live' : 'Syncing'}</span>
                        </div>
                        <div className="mt-3 text-[1.05rem] font-semibold tracking-[-0.035em] text-white">{roomId}</div>
                        <div className="mt-3 text-[0.93rem] leading-6 text-slate-300">{statusCopy}</div>
                        {roomError ? (<div className="mt-3 flex items-start gap-2 rounded-2xl border border-rose-300/20 bg-rose-400/8 px-3 py-3 text-sm text-rose-200">
                                <IconAlertTriangle className="mt-0.5 h-4 w-4 shrink-0"/>
                                <span>{roomError}</span>
                            </div>) : null}
                        {audioError ? (<div className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-300/20 bg-amber-300/8 px-3 py-3 text-sm text-amber-100">
                                <IconHeadphones className="mt-0.5 h-4 w-4 shrink-0"/>
                                <span>{audioError}</span>
                            </div>) : null}
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                        <div className="premium-stat">
                            <div className="text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">Voice Ready</div>
                            <div className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">{activeVoiceUsers}</div>
                        </div>
                        <div className="premium-stat">
                            <div className="text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">Speaking</div>
                            <div className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">{speakingUsers}</div>
                        </div>
                        <div className="premium-stat">
                            <div className="text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">Language</div>
                            <div className="mt-2 text-[1rem] font-semibold tracking-[-0.03em] text-white">
                                {(_c = EDITOR_LANGUAGE_OPTIONS.find((option) => option.value === language)) === null || _c === void 0 ? void 0 : _c.label}
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 rounded-[26px] border border-white/10 bg-white/[0.035] p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-white">
                            <IconWaveSine className="h-4 w-4 text-[#67e8c8]"/>
                            Voice Controls
                        </div>
                        <div className="mt-4 grid gap-3">
                            {!isVoiceEnabled ? (<button className="premium-button premium-button-primary inline-flex items-center justify-center gap-2" disabled={!isVoiceSupported || isMicBusy || roomStatus !== 'ready'} onClick={enableVoice}>
                                    <IconMicrophone className="h-4 w-4"/>
                                    {isMicBusy ? 'Starting Voice...' : 'Enable Voice'}
                                </button>) : (<button className={`premium-button inline-flex items-center justify-center gap-2 ${isMuted ? 'premium-button-warm' : 'premium-button-primary'}`} onClick={toggleMute}>
                                    {isMuted ? (<>
                                            <IconMicrophone className="h-4 w-4"/>
                                            Unmute Mic
                                        </>) : (<>
                                            <IconMicrophoneOff className="h-4 w-4"/>
                                            Mute Mic
                                        </>)}
                                </button>)}

                            {!isConnected || roomStatus === 'error' ? (<button className="premium-button premium-button-secondary inline-flex items-center justify-center gap-2" onClick={reconnect}>
                                    <IconRefresh className="h-4 w-4"/>
                                    Reconnect
                                </button>) : null}
                        </div>
                    </div>

                    <div className="mt-5 min-h-0 flex-1">
                        <div className="mb-3 flex items-center justify-between">
                            <div className="text-[0.95rem] font-semibold tracking-[-0.02em] text-white">Room Members</div>
                            <div className="text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">{clients.length} active</div>
                        </div>
                        <div className="h-full space-y-3 overflow-y-auto pr-1">
                            {clients.map((client) => (<Client key={client.socketId} username={client.username} isAudioEnabled={client.isAudioEnabled} isMuted={client.isMuted} isSpeaking={client.isSpeaking} isSelf={client.socketId === selfSocketId}/>))}
                        </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                        <button className="premium-button premium-button-secondary inline-flex items-center justify-center gap-2" onClick={copyRoomId}>
                            <IconCopy className="h-4 w-4"/>
                            Copy Room ID
                        </button>
                        <button className="premium-button inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#ff7b7b,#ffc4a4)] text-slate-950" onClick={leaveRoom}>
                            <IconX className="h-4 w-4"/>
                            Leave Room
                        </button>
                    </div>
                </aside>

                <section className="flex min-h-0 flex-col gap-3">
                    <div className="premium-panel-strong rounded-[30px] p-4 md:p-5">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                            <div>
                                <div className="premium-kicker">Collaboration Workspace</div>
                                <div className="mt-2 text-[2rem] font-semibold tracking-[-0.055em] text-white md:text-[2.25rem]">
                                    Premium editor experience for {username}
                                </div>
                                <div className="mt-2 text-[0.94rem] leading-6 text-slate-300">
                                    Shared editing, room voice, resilient recovery, and editor controls in one polished surface.
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3">
                                    <div className="text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">Characters</div>
                                    <div className="mt-2 text-[1.55rem] font-semibold tracking-[-0.045em] text-white">{characterCount}</div>
                                </div>
                                <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3">
                                    <div className="text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">Lines</div>
                                    <div className="mt-2 text-[1.55rem] font-semibold tracking-[-0.045em] text-white">{lineCount}</div>
                                </div>
                                <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3">
                                    <div className="text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">Zoom</div>
                                    <div className="mt-2 text-[1.55rem] font-semibold tracking-[-0.045em] text-white">{zoomLevel}%</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="premium-panel-strong flex min-h-0 flex-1 flex-col rounded-[30px] p-3 md:p-4">
                        <div className="mb-3 flex flex-col gap-3 rounded-[24px] border border-white/10 bg-white/[0.035] p-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200">
                                    <IconCode className="h-4 w-4 text-[#67e8c8]"/>
                                    Room Workspace
                                </div>
                                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200">
                                    <IconSparkles className="h-4 w-4 text-[#f6b365]"/>
                                    {isVoiceEnabled ? 'Voice live' : 'Voice optional'}
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 md:flex-row md:items-center">
                                <div className="min-w-[170px]">
                                    <select className="premium-select h-[46px]" value={language} onChange={(event) => setLanguage(event.target.value)}>
                                        {EDITOR_LANGUAGE_OPTIONS.map((option) => (<option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>))}
                                    </select>
                                </div>

                                <div className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-2 py-2 md:justify-start">
                                    <button className="flex h-10 w-10 items-center justify-center rounded-full text-slate-200 transition-colors hover:bg-white/10" onClick={() => changeZoom('out')} disabled={zoomLevel <= MIN_ZOOM}>
                                        <IconMinus className="h-4 w-4"/>
                                    </button>
                                    <div className="min-w-[64px] text-center text-sm font-semibold text-white">{zoomLevel}%</div>
                                    <button className="flex h-10 w-10 items-center justify-center rounded-full text-slate-200 transition-colors hover:bg-white/10" onClick={() => changeZoom('in')} disabled={zoomLevel >= MAX_ZOOM}>
                                        <IconPlus className="h-4 w-4"/>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,15,26,0.96),rgba(6,12,22,0.98))] p-2">
                            <div className={`h-full transition-opacity ${roomStatus === 'ready' && editorReady ? 'opacity-100' : 'opacity-35'}`}>
                                <Editor socket={socket} roomId={roomId} initialCode={initialCode} language={language} zoomLevel={zoomLevel} onCodeChange={(code) => {
            codeRef.current = code;
            setCurrentCode(code);
        }} onReady={() => setEditorReady(true)}/>
                            </div>

                            {roomStatus !== 'ready' || !editorReady ? (<div className="absolute inset-0 flex items-center justify-center bg-[#07111c]/72">
                                    <div className="rounded-[28px] border border-white/10 bg-[rgba(8,14,24,0.94)] px-8 py-6 text-center text-white shadow-[0_30px_80px_rgba(0,0,0,0.32)]">
                                        <div className="mb-3 flex justify-center">
                                            <IconLoader2 className="h-6 w-6 animate-spin text-[#67e8c8]"/>
                                        </div>
                                        <div className="text-lg font-semibold tracking-[-0.03em]">{statusCopy}</div>
                                        <div className="mt-2 text-sm text-slate-300">
                                            We wait for a confirmed room state before opening the editor canvas.
                                        </div>
                                    </div>
                                </div>) : null}
                        </div>

                        <div className="mt-3 flex flex-col gap-2 rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300 md:flex-row md:items-center md:justify-between">
                            <div className="flex flex-wrap items-center gap-3">
                                <span>Language: {(_d = EDITOR_LANGUAGE_OPTIONS.find((option) => option.value === language)) === null || _d === void 0 ? void 0 : _d.label}</span>
                                <span>Lines: {lineCount}</span>
                                <span>Characters: {characterCount}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <span>{activeVoiceUsers} voice-ready</span>
                                <span>{speakingUsers} speaking</span>
                                <span>{isConnected ? 'Connected' : 'Offline'}</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>);
};
const EditorPageLoading = () => (<div className="premium-shell flex h-screen items-center justify-center bg-[#07111c]">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] px-6 py-5 text-lg font-medium text-white">
            Loading workspace...
        </div>
    </div>);
const EditorPage = () => {
    return (<Suspense fallback={<EditorPageLoading />}>
            <EditorPageContent />
        </Suspense>);
};
export default EditorPage;
