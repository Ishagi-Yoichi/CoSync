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
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
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

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsLangMenuOpen(false);
        };

        if (isLangMenuOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLangMenuOpen]);

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
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <motion.div
                        animate={{ translateY: ['-100%', '200%'] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                        className="w-full h-40 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent opacity-50"
                    />
                </div>
                {/* Logo Section */}
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

                    {/* Collaborators Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Users size={14} className="opacity-70" />
                                <span className="text-[11px] font-bold uppercase tracking-widest">Collaborators</span>
                            </div>
                            <span className="bg-white/5 px-2 py-0.5 rounded text-[10px] font-mono text-slate-500">{clients.length} online</span>
                        </div>

                        {/* Independent Scroll for User List with smooth layout transitions */}
                        <div className="space-y-2 max-h-[45vh] overflow-y-auto custom-scrollbar pr-2">
                            <AnimatePresence mode="popLayout">
                                {clients.map((client) => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, x: -20 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        key={client.socketId}
                                    >
                                        <Client username={client.username} />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Sidebar Bottom: Identity & Actions */}
                <div className="mt-auto border-t border-white/5 bg-black/40 p-4">
                    {/* User Identity Mockup */}
                    <div className="flex items-center gap-3 p-3 mb-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg">
                            {username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-white tracking-tight">{username}</span>
                            <span className="text-[10px] text-slate-500 font-medium">Session Owner</span>
                        </div>
                        <div className="ml-auto">
                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={copyRoomId}
                            className="flex items-center justify-center gap-2 bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 py-2 rounded-lg transition-all border border-white/5 text-xs font-semibold active:scale-95"
                        >
                            <Copy size={14} /> Link
                        </button>
                        <button
                            onClick={() => { clearSession(); router.push('/'); }}
                            className="flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white py-2 rounded-lg transition-all text-xs font-semibold active:scale-95"
                        >
                            <LogOut size={14} /> Leave
                        </button>
                    </div>
                </div>
            </aside>

            {/* --- MAIN CONTENT AREA --- */}
            <main className="flex-1 flex flex-col h-full overflow-hidden">

                {/* Modern Header */}
                <header className="h-14 bg-[#0A0A0F]/50 backdrop-blur-md border-b border-white/5 flex items-center px-6 justify-between shrink-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 group cursor-default transition-colors hover:border-blue-500/30">
                            <Code2 size={14} className="text-blue-400" />
                            <span className="text-xs font-mono text-slate-300 tracking-tight">
                                main.{language.ext}
                            </span>
                        </div>
                        <div className="h-4 w-[1px] bg-white/10" />
                        <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-500 font-medium tracking-wide">
                            <Sparkles size={12} className="text-yellow-500/50" />
                            REAL-TIME SYNC ON
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* --- CUSTOM PREMIUM DROPDOWN --- */}
                        {/* --- CUSTOM PREMIUM DROPDOWN --- */}
                        <div className="relative">
                            {/* Trigger Button */}
                            <button
                                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                                className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 border group ${isLangMenuOpen
                                    ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                                    }`}
                            >
                                <div className="flex flex-col items-start">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter leading-none mb-1">
                                        Language
                                    </span>
                                    <span className="text-xs font-bold text-white font-mono leading-none">
                                        {language.label}
                                    </span>
                                </div>
                                <motion.div
                                    animate={{ rotate: isLangMenuOpen ? 180 : 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                >
                                    <ChevronDown size={16} className={isLangMenuOpen ? 'text-blue-400' : 'text-slate-500'} />
                                </motion.div>
                            </button>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                                {isLangMenuOpen && (
                                    <>
                                        {/* Overlay to close menu when clicking outside */}
                                        <div
                                            className="fixed inset-0 z-[60]"
                                            onClick={() => setIsLangMenuOpen(false)}
                                        />

                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95, filter: "blur(4px)" }}
                                            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95, filter: "blur(4px)" }}
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            className="absolute right-0 mt-3 w-56 bg-[#12121A]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.7)] z-[70] overflow-hidden p-2"
                                        >
                                            <div className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">
                                                Select Environment
                                            </div>

                                            <div className="space-y-1">
                                                {LANGUAGES.map((l) => {
                                                    const isActive = language.label === l.label;
                                                    return (
                                                        <button
                                                            key={l.label}
                                                            onClick={() => {
                                                                handleLanguageChange({ target: { value: l.label } } as any);
                                                                setIsLangMenuOpen(false);
                                                            }}
                                                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all group/item ${isActive
                                                                ? 'bg-blue-600/20 text-blue-400'
                                                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isActive
                                                                    ? 'bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,1)] scale-125'
                                                                    : 'bg-slate-600 group-hover/item:bg-slate-400'
                                                                    }`} />
                                                                {l.label}
                                                            </div>

                                                            {isActive && (
                                                                <motion.div layoutId="activeHighlight">
                                                                    <Sparkles size={12} className="text-blue-400 opacity-50" />
                                                                </motion.div>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        <button className="relative group overflow-hidden bg-blue-600 hover:bg-blue-500 text-white px-5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] active:scale-95 flex items-center gap-2">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <Play size={14} fill="currentColor" />
                            Run Code
                        </button>
                    </div>
                </header>

                {/* Editor Area */}
                <div className="flex-1 relative w-full bg-[#0D0D14] overflow-hidden">

                    {/* Floating Toolbar with Framer Motion */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="absolute top-4 right-8 z-50 flex items-center gap-4 bg-[#16161E]/90 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                    >
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setFontSize(s => Math.max(10, s - 1))}
                                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            >
                                <span className="text-lg leading-none">−</span>
                            </button>
                            <div className="flex flex-col items-center">
                                <span className="text-[9px] text-slate-500 font-black uppercase tracking-tighter leading-none mb-0.5">SIZE</span>
                                <span className="text-xs font-mono font-bold text-blue-400 leading-none">{fontSize}</span>
                            </div>
                            <button
                                onClick={() => setFontSize(s => Math.min(28, s + 1))}
                                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            >
                                <span className="text-lg leading-none">+</span>
                            </button>
                        </div>

                        <div className="w-[1px] h-6 bg-white/10" />

                        <button
                            onClick={() => {
                                const code = (window as any).__cosync_code__ ?? '';
                                navigator.clipboard.writeText(code);
                                toast.success('Ready to share!');
                            }}
                            className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
                        >
                            <Share2 size={14} className="text-blue-400" />
                            Share
                        </button>
                    </motion.div>

                    {/* Fixed Editor Wrapper */}
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