"use client";
import React, { useEffect, useState } from 'react';
import { v4 as uuidV4 } from 'uuid';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { IconArrowRight, IconBolt, IconCopyPlus, IconHeadphones, IconShieldCheck, } from '@tabler/icons-react';
const ROOM_SESSION_KEY = 'cosync-room-session';
const roomBenefits = [
    {
        icon: IconBolt,
        title: 'Instant rooms',
        copy: 'Spin up a collaborative room in seconds and re-enter it later without friction.',
    },
    {
        icon: IconHeadphones,
        title: 'Voice built in',
        copy: 'Talk through edits in the same workspace with active-speaker awareness.',
    },
    {
        icon: IconShieldCheck,
        title: 'Recovery aware',
        copy: 'Sessions are optimized for reconnects, room snapshots, and smoother first joins.',
    },
];
export default function Home() {
    const router = useRouter();
    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');
    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        const rawSession = window.sessionStorage.getItem(ROOM_SESSION_KEY);
        if (!rawSession) {
            return;
        }
        try {
            const session = JSON.parse(rawSession);
            if (session.roomId) {
                setRoomId(session.roomId);
            }
            if (session.username) {
                setUsername(session.username);
            }
        }
        catch (error) {
            console.error('Failed to restore room session', error);
        }
    }, []);
    const createNewRoom = () => {
        const id = uuidV4();
        setRoomId(id);
        toast.success('Generated a new room ID.');
    };
    const joinRoom = () => {
        if (!roomId || !username) {
            toast.error('Room ID and username are both required.');
            return;
        }
        window.sessionStorage.setItem(ROOM_SESSION_KEY, JSON.stringify({
            roomId,
            username,
        }));
        router.push(`/editorPage?roomId=${roomId}&username=${encodeURIComponent(username)}`);
    };
    const handleInputEnter = (e) => {
        if (e.code === 'Enter') {
            joinRoom();
        }
    };
    return (<main className="premium-shell relative min-h-screen overflow-hidden px-4 py-8 md:px-8 md:py-10">
            <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
                <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: 'easeOut' }} className="premium-panel rounded-[34px] p-6 md:p-8">
                    <div className="premium-kicker">Workspace Access</div>
                    <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
                        Enter the room with a control panel feel, not a bare form.
                    </h1>
                    <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
                        Start a new collaboration session or return to a recent one. CoSync keeps the entry flow clean, confident, and production-grade.
                    </p>

                    <div className="mt-8 grid gap-4">
                        {roomBenefits.map(({ icon: Icon, title, copy }) => (<div key={title} className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/7 text-[#67e8c8]">
                                        <Icon className="h-5 w-5"/>
                                    </div>
                                    <div>
                                        <div className="text-lg font-semibold tracking-[-0.03em] text-white">{title}</div>
                                        <div className="mt-1 text-sm leading-6 text-slate-300">{copy}</div>
                                    </div>
                                </div>
                            </div>))}
                    </div>
                </motion.section>

                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.1, ease: 'easeOut' }} className="premium-panel-strong premium-glow-border rounded-[34px] p-6 md:p-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm uppercase tracking-[0.24em] text-slate-400">Session Entry</div>
                            <div className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-white">Open a collaboration room</div>
                        </div>
                        <button onClick={createNewRoom} className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/10 md:inline-flex">
                            Generate ID
                        </button>
                    </div>

                    <div className="mt-8 space-y-5">
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                                Room ID
                            </label>
                            <input type="text" className="premium-input" placeholder="Paste or generate a room ID" onChange={(e) => setRoomId(e.target.value)} value={roomId} onKeyUp={handleInputEnter}/>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                                Display Name
                            </label>
                            <input type="text" className="premium-input" placeholder="How the room will see you" onChange={(e) => setUsername(e.target.value)} value={username} onKeyUp={handleInputEnter}/>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <button className="premium-button premium-button-primary inline-flex items-center justify-center gap-2" onClick={joinRoom}>
                                Join Room
                                <IconArrowRight className="h-4 w-4"/>
                            </button>
                            <button onClick={createNewRoom} className="premium-button premium-button-secondary inline-flex items-center justify-center gap-2 md:hidden">
                                <IconCopyPlus className="h-4 w-4"/>
                                Generate ID
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 grid gap-3 sm:grid-cols-3">
                        <div className="premium-stat">
                            <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Audio</div>
                            <div className="mt-2 text-lg font-semibold text-white">Room-native voice</div>
                        </div>
                        <div className="premium-stat">
                            <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Presence</div>
                            <div className="mt-2 text-lg font-semibold text-white">Live member states</div>
                        </div>
                        <div className="premium-stat">
                            <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Recovery</div>
                            <div className="mt-2 text-lg font-semibold text-white">Persistent session handoff</div>
                        </div>
                    </div>
                </motion.section>
            </div>
        </main>);
}
