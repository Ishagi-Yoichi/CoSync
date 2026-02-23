"use client";
import React, { useState, useRef, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Users, Copy, LogOut, Terminal, Zap } from 'lucide-react';
import { initSocket } from '../../socket';
import Client from '../../components/Client';

const { ACTIONS } = require('../../Actions');
const Editor = dynamic(() => import("../../components/Editor"), { ssr: false });

const EditorPageContent = () => {
    const socketRef = useRef<any>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const roomId = searchParams.get('roomId') ?? '';
    const username = searchParams.get('username') ?? '';

    const [clients, setClients] = useState<{ socketId: string; username: string }[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const socket = initSocket();
        socketRef.current = socket;

        socket.on('connect', () => {
            setIsConnected(true);
            socket.emit(ACTIONS.JOIN, { roomId, username });
        });

        socket.on(ACTIONS.JOINED, ({ clients, username: joinedUser }: any) => {
            setClients(clients);
            if (joinedUser !== username) toast.success(`${joinedUser} joined!`);
        });

        socket.on(ACTIONS.DISCONNECTED, ({ username: leftUser, socketId }: any) => {
            toast(`${leftUser} left the room`, { icon: '👋' });
            setClients((prev) => prev.filter(c => c.socketId !== socketId));
        });

        socket.on('connect_error', () => router.push('/'));

        return () => socket.disconnect();
    }, [roomId, username]);

    const copyRoomId = async () => {
        await navigator.clipboard.writeText(roomId);
        toast.success('Room ID Copied!');
    };

    if (!username) return null;

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 font-sans">
            {/* Sidebar */}
            <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl">
                <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-900/20">
                        <Terminal size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-xl tracking-tight text-white">CoSync</h1>
                        <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                            <span className="text-[10px] uppercase font-bold text-slate-500">{isConnected ? 'Live' : 'Offline'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="flex items-center gap-2 mb-4 text-slate-400 px-2">
                        <Users size={16} />
                        <span className="text-xs font-semibold uppercase tracking-wider">Collaborators ({clients.length})</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {clients.map((client) => (
                            <Client key={client.socketId} username={client.username} />
                        ))}
                    </div>
                </div>

                <div className="p-4 bg-slate-900/50 border-t border-slate-800 space-y-3">
                    <button onClick={copyRoomId} className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-lg transition-all active:scale-95 text-sm font-medium border border-slate-700">
                        <Copy size={16} /> Copy Room ID
                    </button>
                    <button onClick={() => router.push('/')} className="w-full flex items-center justify-center gap-2 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white py-2.5 rounded-lg transition-all active:scale-95 text-sm font-medium border border-rose-500/20">
                        <LogOut size={16} /> Leave Session
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col bg-[#282a36]">
                <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center px-4 justify-between">
                    <div className="flex items-center gap-2">
                        <Zap size={14} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-xs font-mono text-slate-400">main.js — Editing</span>
                    </div>
                </div>
                <Editor socketRef={socketRef} roomId={roomId} username={username} onCodeChange={(code) => { }} />
            </main>
        </div>
    );
};

const EditorPage = () => (
    <Suspense fallback={<div className="h-screen bg-slate-950 flex items-center justify-center text-white font-mono">Initializing CoSync...</div>}>
        <EditorPageContent />
    </Suspense>
);

export default EditorPage;