"use client";
import React, { useState, useRef, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Users, Copy, LogOut, Terminal, Zap } from 'lucide-react';
import Client from '../../components/Client';
import { initSocket, resetSocket } from '../../socket';
import { saveSession, clearSession } from '../home/page';

const { ACTIONS } = require('../../Actions');
const Editor = dynamic(() => import("../../components/Editor"), { ssr: false });

const LANGUAGES = [
    { label: 'JavaScript', mode: 'javascript', ext: 'js' },
    { label: 'TypeScript', mode: 'javascript', ext: 'ts' },
    { label: 'Python', mode: 'python', ext: 'py' },
    { label: 'C++', mode: 'clike', ext: 'cpp' },
    { label: 'Java', mode: 'clike', ext: 'java' },
    { label: 'HTML', mode: 'htmlmixed', ext: 'html' },
    { label: 'CSS', mode: 'css', ext: 'css' },
];

const EditorPageContent = () => {
    const socketRef = useRef<any>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const roomId = searchParams.get('roomId') ?? '';
    const username = searchParams.get('username') ?? '';

    const [clients, setClients] = useState<{ socketId: string; username: string }[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [language, setLanguage] = useState(LANGUAGES[0]);
    const [fontSize, setFontSize] = useState(14);

    useEffect(() => {
        // If no roomId/username in URL but session exists, redirect to editor
        if (!roomId || !username) {
            const { getSession } = require('../home/page');
            const session = getSession();
            if (session) {
                router.replace(`/editorPage?roomId=${session.roomId}&username=${encodeURIComponent(session.username)}`);
            } else {
                router.replace('/home');
            }
        }
    }, []);

    useEffect(() => {
        const socket = initSocket();
        socketRef.current = socket;

        socket.on('connect', () => {
            setIsConnected(true);
            socket.emit(ACTIONS.JOIN, { roomId, username });
            saveSession(roomId, username);
        });


        socket.on(ACTIONS.JOINED, ({ clients, username: joinedUser }: any) => {
            setClients(clients);
            if (joinedUser !== username) toast.success(`${joinedUser} joined!`);
        });

        socket.on(ACTIONS.DISCONNECTED, ({ username: leftUser, socketId }: any) => {
            toast(`${leftUser} left the room`, { icon: '👋' });
            setClients((prev) => prev.filter(c => c.socketId !== socketId));
        });

        socket.on(ACTIONS.LANGUAGE_CHANGE, ({ language: incoming }: any) => {
            const found = LANGUAGES.find(l => l.mode === incoming.mode && l.label === incoming.label);
            if (found) {
                setLanguage(found);
                toast(`Language changed to ${found.label}`, { icon: '🌐' });
            }
        });

        socket.on('connect_error', () => router.push('/'));

        return () => { resetSocket(); };
    }, [roomId, username]);

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const found = LANGUAGES.find(l => l.label === e.target.value);
        if (!found) return;
        setLanguage(found);
        socketRef.current?.emit(ACTIONS.LANGUAGE_CHANGE, { roomId, language: found });
        toast(`Switched to ${found.label}`, { icon: '🌐' });
    };

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
                    <button onClick={() => {
                        clearSession();
                        router.push('/')
                    }} className="w-full flex items-center justify-center gap-2 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white py-2.5 rounded-lg transition-all active:scale-95 text-sm font-medium border border-rose-500/20">
                        <LogOut size={16} /> Leave Session
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col bg-[#282a36]">
                {/* Top bar */}
                <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center px-4 justify-between">
                    <div className="flex items-center gap-2">
                        <Zap size={14} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-xs font-mono text-slate-400">
                            main.{language.ext} — Editing
                        </span>
                    </div>
                    {/* Language Selector */}
                    <select
                        value={language.label}
                        onChange={handleLanguageChange}
                        className="bg-slate-800 text-slate-200 text-xs font-mono border border-slate-700 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                        {LANGUAGES.map(l => (
                            <option key={l.label} value={l.label}>{l.label}</option>
                        ))}
                    </select>
                </div>

                {/* Editor wrapper — relative so floating toolbar can position inside */}
                <div className="flex-1 relative overflow-hidden">
                    {/* Floating Toolbar */}
                    <div className="absolute top-3 right-3 z-50 flex items-center gap-2 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg px-3 py-1.5 shadow-xl">
                        {/* Font size */}
                        <span className="text-xs text-slate-400 font-mono">Aa</span>
                        <button
                            onClick={() => setFontSize(s => Math.max(10, s - 1))}
                            className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-700 text-slate-300 text-sm font-bold transition-colors"
                        >−</button>
                        <span className="text-xs font-mono text-slate-300 w-6 text-center">{fontSize}</span>
                        <button
                            onClick={() => setFontSize(s => Math.min(28, s + 1))}
                            className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-700 text-slate-300 text-sm font-bold transition-colors"
                        >+</button>

                        <div className="w-px h-4 bg-slate-700 mx-1" />


                        <button
                            onClick={() => {
                                const code = (window as any).__cosync_code__ ?? '';
                                navigator.clipboard.writeText(code);
                                toast.success('Code copied!');
                            }}
                            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors font-mono"
                        >
                            <Copy size={12} /> Copy Code
                        </button>
                    </div>

                    <Editor
                        socketRef={socketRef}
                        roomId={roomId}
                        username={username}
                        language={language}
                        fontSize={fontSize}
                        onCodeChange={(code: string) => {
                            (window as any).__cosync_code__ = code;
                        }}
                    />
                </div>
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