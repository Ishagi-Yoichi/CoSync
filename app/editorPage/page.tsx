"use client";
import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ACTIONS } from '../../Actions';
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
        const init = async () => {
            socketRef.current = await initSocket();
            socketRef.current.on('connect_error', (err: unknown) => handleErrors(err));
            socketRef.current.on('connect_failed', (err: unknown) => handleErrors(err));

            function handleErrors(e: unknown) {
                console.log('socket error', e);
                toast.error('Socket connection failed, try again later.');
                router.push('/');
            }

            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username,
            });

            socketRef.current.on(
                ACTIONS.JOINED,
                ({ clients, username: joinedUsername, socketId }: { clients: ClientType[]; username: string; socketId: string }) => {
                    if (joinedUsername !== username) {
                        toast.success(`${joinedUsername} joined the room.`);
                        console.log(`${joinedUsername} joined`);
                    }
                    setClients(clients);
                    socketRef.current?.emit(ACTIONS.SYNC_CODE, {
                        code: codeRef.current,
                        socketId,
                    });
                }
            );

            socketRef.current.on(
                ACTIONS.DISCONNECTED,
                ({ socketId, username: leftUsername }: { socketId: string; username: string }) => {
                    toast.success(`${leftUsername} left the room.`);
                    setClients((prev) => prev.filter((client) => client.socketId !== socketId));
                }
            );
        };
        init();
        return () => {
            socketRef.current?.disconnect();
            socketRef.current?.off(ACTIONS.JOINED);
            socketRef.current?.off(ACTIONS.DISCONNECTED);
        }
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
        <div className="mainWrap">
            <div className="aside">
                <div className="asideInner">
                    <div className="logo">
                        <img
                            className="logoImage"
                            src="/image.png"
                            alt="logo"
                        />
                    </div>
                    <h3>Connected</h3>
                    <div className="clientsList">
                        {clients.map((client) => (
                            <Client
                                key={client.socketId}
                                username={client.username}
                            />
                        ))}
                    </div>
                </div>
                <button className="btn copyBtn" onClick={copyRoomId}>
                    Copy ROOM ID
                </button>
                <button className="btn leaveBtn" onClick={leaveRoom}>
                    Leave
                </button>
            </div>
            <div className="editorWrap">
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