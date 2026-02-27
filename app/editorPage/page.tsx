"use client";
import React, { useState, useRef, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import Client from '../../components/Client';
import { initSocket, resetSocket } from '../../socket';
import { saveSession, clearSession } from '../home/page';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Terminal, Users, Copy, LogOut, Zap,
    Settings, Play, Shield, ChevronDown,
    Code2, Share2, Sparkles
} from 'lucide-react';

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

        socket.on('session_taken_over', () => {
            toast('This session was opened in another tab', { icon: '⚠️' });
            clearSession();
            router.replace('/home');
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
        <div className="h-screen w-screen overflow-hidden bg-[#050508] text-slate-300 font-sans selection:bg-blue-500/30 flex">

            {/* Background Decorative Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

            {/* --- SIDEBAR --- */}
            <aside className="w-80 h-full bg-[#0A0A0F]/80 backdrop-blur-xl border-r border-white/5 flex flex-col z-20 shadow-2xl shrink-0">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500 blur-lg opacity-40 animate-pulse" />
                            <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-2xl">
                                <Terminal size={22} className="text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="font-bold text-lg tracking-tight text-white leading-none">CoSync</h1>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="relative flex h-2 w-2">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                </span>
                                <span className={`text-[10px] uppercase tracking-[0.15em] font-bold ${isConnected ? 'text-emerald-500/80' : 'text-red-500/80'}`}>
                                    {isConnected ? 'System Live' : 'Offline'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Users size={14} className="opacity-70" />
                                <span className="text-[11px] font-bold uppercase tracking-widest">Collaborators</span>
                            </div>
                            <span className="bg-white/5 px-2 py-0.5 rounded text-[10px] font-mono text-slate-500">{clients.length} online</span>
                        </div>

                        <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                            <AnimatePresence mode="popLayout">
                                {clients.map((client) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        key={client.socketId}
                                    >
                                        <Client username={client.username} />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <div className="mt-auto p-6 space-y-3 border-t border-white/5 bg-black/20">
                    <button onClick={copyRoomId} className="w-full flex items-center justify-center gap-2 bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 py-2.5 rounded-xl transition-all border border-white/5 text-sm font-semibold active:scale-[0.98]">
                        <Copy size={16} className="opacity-60" /> Copy Room Link
                    </button>
                    <button onClick={() => { clearSession(); router.push('/'); }} className="w-full flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white py-2.5 rounded-xl transition-all text-sm font-semibold active:scale-[0.98] group">
                        <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" /> Leave Session
                    </button>
                </div>
            </aside>

            {/* --- MAIN CONTENT AREA --- */}
            <main className="flex-1 flex flex-col h-full overflow-hidden">

                <header className="h-14 bg-[#0A0A0F]/50 backdrop-blur-md border-b border-white/5 flex items-center px-6 justify-between shrink-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                            <Code2 size={14} className="text-blue-400" />
                            <span className="text-xs font-mono text-slate-300 tracking-tight">
                                main.{language.ext}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <select
                                value={language.label}
                                onChange={handleLanguageChange}
                                className="appearance-none bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold border border-white/10 rounded-lg pl-3 pr-8 py-1.5 focus:outline-none cursor-pointer transition-all"
                            >
                                {LANGUAGES.map(l => (
                                    <option key={l.label} value={l.label} className="bg-[#0A0A0F]">{l.label}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
                        </div>
                        <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95">
                            Run
                        </button>
                    </div>
                </header>

                {/* THE FIX: Wrapper is relative, Editor is absolute inset-0 */}
                <div className="flex-1 relative w-full bg-[#0D0D14] overflow-hidden">

                    {/* Floating Toolbar */}
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-4 right-6 z-50 flex items-center gap-4 bg-[#16161E]/80 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2 shadow-2xl">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setFontSize(s => Math.max(10, s - 1))} className="text-slate-400 hover:text-white transition-colors">−</button>
                            <span className="text-xs font-mono font-bold text-blue-400">{fontSize}</span>
                            <button onClick={() => setFontSize(s => Math.min(28, s + 1))} className="text-slate-400 hover:text-white transition-colors">+</button>
                        </div>
                        <div className="w-[1px] h-6 bg-white/10" />
                        <button onClick={() => { navigator.clipboard.writeText((window as any).__cosync_code__ ?? ''); toast.success('Copied!'); }} className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors">
                            <Share2 size={14} className="text-blue-400" /> Copy
                        </button>
                    </motion.div>

                    {/* THE NUCLEAR FIX: Absolute positioning forces Editor into the box */}
                    <div className="absolute inset-0">
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