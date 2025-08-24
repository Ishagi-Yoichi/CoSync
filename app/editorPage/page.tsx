"use client";
export const dynamic = "force-dynamic";
import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
const { ACTIONS } = require('../../Actions');
import Client from '../../components/Client';
import Editor from '../../components/Editor';
import { initSocket } from '../../socket';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Socket } from "socket.io-client";


type ClientType = {
    socketId: string;
    username: string;
};

const EditorPage = () => {
    const socketRef = useRef<Socket | null>(null);
    const codeRef = useRef<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const roomId = searchParams.get('roomId') ?? '';
    const username = searchParams.get('username') ?? '';
    const [clients, setClients] = useState<ClientType[]>([]);
    const [isConnected, setIsConnected] = useState(false);

      
   

    useEffect(() => {
        if(typeof window === "undefined") return;
        let isMounted = true;
        const socket = initSocket();
        if(!socket) return;
        socketRef.current = socket;
                
                const handleErrors = (e: unknown) => {
                    console.log('socket error', e);
                    toast.error('Socket connection failed, trying to reconnect...');
                    router.push('/');
                };

                const handleDisconnect = (reason: string) => {
                    console.log('socket disconnected:', reason);
                    setIsConnected(false);
                    if (reason === 'io server disconnect') {
                        // the disconnection was initiated by the server, you need to reconnect manually
                       socket.connect();
                    }
                    toast.error('Connection lost, attempting to reconnect...');
                };

                const handleConnect = () => {
                    console.log('socket connected');
                    setIsConnected(true);
                };

                const handleReconnect = (attemptNumber: number) => {
                    console.log('socket reconnected after', attemptNumber, 'attempts');
                    setIsConnected(true);
                    toast.success('Reconnected to server!');
                    // Re-join the room after reconnection
                    socket.emit(ACTIONS.JOIN, {
                        roomId,
                        username,
                    });
                };
                    //Register listneres
                socket.on('connect', handleConnect);
                socket.on('connect_error', handleErrors);
                socket.on('connect_failed', handleErrors);
                socket.on('disconnect', handleDisconnect);
                socket.on('reconnect', handleReconnect);
                
                // Handle ping/pong for connection health
                socket.on('ping', () => {
                    socket?.emit('pong');
                });

                console.log('Joining room:', { roomId, username });
                socket.emit(ACTIONS.JOIN, {
                    roomId,
                    username,
                });

                const handleJoined = ({ clients, username: joinedUsername, socketId }: { clients: ClientType[]; username: string; socketId: string }) => {
                    console.log('JOINED event received:', { clients, joinedUsername, socketId, currentUsername: username });
                    
                    // Update the clients list
                    setClients(clients);
                    
                    // Show notification for other users joining
                    if (joinedUsername !== username) {
                        toast.success(`${joinedUsername} joined the room.`);
                        console.log(`${joinedUsername} joined the room`);
                    } else {
                        console.log('You joined the room successfully');
                    }
                    
                    // Sync code with the new user
                    if (codeRef.current) {
                        socket?.emit(ACTIONS.SYNC_CODE, {
                            code: codeRef.current,
                            socketId,
                        });
                    }
                };

                const handleDisconnected = ({ socketId, username: leftUsername }: { socketId: string; username: string }) => {
                    toast.success(`${leftUsername} left the room.`);
                    setClients((prev) => prev.filter((client) => client.socketId !== socketId));
                };

                socket.on(ACTIONS.JOINED, handleJoined);
                socket.on(ACTIONS.DISCONNECTED, handleDisconnected);

                // Store cleanup functions
                return () => {
                    if (socket) {
                        socket.off('connect', handleConnect);
                        socket.off('connect_error', handleErrors);
                        socket.off('connect_failed', handleErrors);
                        socket.off('disconnect', handleDisconnect);
                        socket.off('reconnect', handleReconnect);
                        socket.off('ping');
                        socket.off(ACTIONS.JOINED, handleJoined);
                        socket.off(ACTIONS.DISCONNECTED, handleDisconnected);
                        socket.disconnect();
                    }
                };
    }, [roomId, username, router]);

    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID has been copied to your clipboard');
        } catch (err) {
            toast.error('Could not copy the Room ID');
            console.error(err);
        }
    }

    function leaveRoom() {
        router.push('/');
    }
    

    function reconnect() {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current.connect();
        }
    }

    if (!username) {
        router.push('/');
        return null;
    }

    return (
        <div className="flex h-screen bg-gray-900">
            <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col p-5">
                <div className="flex-1">
                    <div className="mb-5 text-center">
                        <div className="w-16 h-16 mx-auto bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-2xl font-bold text-white">CoSync</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white text-lg font-semibold">Connected</h3>
                        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                    </div>
                    <div className="mb-4 p-2 bg-gray-700 rounded text-xs text-gray-300">
                        <div>Room: {roomId}</div>
                        <div>Users: {clients.length}</div>
                    </div>
                    <div className="space-y-2">
                        {clients.map((client) => (
                            <Client
                                key={client.socketId}
                                username={client.username}
                            />
                        ))}
                    </div>
                </div>
                <button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors mb-3"
                    onClick={copyRoomId}
                >
                    Copy ROOM ID
                </button>
                {!isConnected && (
                    <button 
                        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors mb-3"
                        onClick={reconnect}
                    >
                        Reconnect
                    </button>
                )}
                <button 
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                    onClick={leaveRoom}
                >
                    Leave
                </button>
            </div>
            <div className="flex-1 flex flex-col h-full">
                <Editor
                    socketRef={socketRef}
                    roomId={roomId}
                    onCodeChange={(code) => {
                        codeRef.current = code;
                    }}
                />
            </div>
        </div>
    );
};
export default EditorPage;