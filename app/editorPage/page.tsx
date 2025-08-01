"use client";
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

    useEffect(() => {
        let isInitialized = false;
        
        const init = async () => {
            if (isInitialized) return;
            isInitialized = true;
            
            try {
                socketRef.current = await initSocket();
                
                const handleErrors = (e: unknown) => {
                    console.log('socket error', e);
                    toast.error('Socket connection failed, try again later.');
                    router.push('/');
                };

                socketRef.current.on('connect_error', handleErrors);
                socketRef.current.on('connect_failed', handleErrors);

                socketRef.current.emit(ACTIONS.JOIN, {
                    roomId,
                    username,
                });

                const handleJoined = ({ clients, username: joinedUsername, socketId }: { clients: ClientType[]; username: string; socketId: string }) => {
                    if (joinedUsername !== username) {
                        toast.success(`${joinedUsername} joined the room.`);
                        console.log(`${joinedUsername} joined`);
                    }
                    setClients(clients);
                    socketRef.current?.emit(ACTIONS.SYNC_CODE, {
                        code: codeRef.current,
                        socketId,
                    });
                };

                const handleDisconnected = ({ socketId, username: leftUsername }: { socketId: string; username: string }) => {
                    toast.success(`${leftUsername} left the room.`);
                    setClients((prev) => prev.filter((client) => client.socketId !== socketId));
                };

                socketRef.current.on(ACTIONS.JOINED, handleJoined);
                socketRef.current.on(ACTIONS.DISCONNECTED, handleDisconnected);

                // Store cleanup functions
                return () => {
                    if (socketRef.current) {
                        socketRef.current.off('connect_error', handleErrors);
                        socketRef.current.off('connect_failed', handleErrors);
                        socketRef.current.off(ACTIONS.JOINED, handleJoined);
                        socketRef.current.off(ACTIONS.DISCONNECTED, handleDisconnected);
                        socketRef.current.disconnect();
                    }
                };
            } catch (error) {
                console.error('Failed to initialize socket:', error);
                toast.error('Failed to connect to server');
                router.push('/');
            }
        };

        const cleanup = init();
        
        return () => {
            cleanup.then(cleanupFn => cleanupFn?.());
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
                    <h3 className="text-white mb-4 text-lg font-semibold">Connected</h3>
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