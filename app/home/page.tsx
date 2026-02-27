"use client";
import React, { useState, useEffect } from 'react';
import { v4 as uuidV4 } from 'uuid';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { DotBackgroundDemo } from '@/components/Dotbg';

const SESSION_KEY = 'cosync_session';

export interface CoSyncSession {
    roomId: string;
    username: string;
    joinedAt: number;
}

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const saveSession = (roomId: string, username: string) => {
    const session: CoSyncSession = { roomId, username, joinedAt: Date.now() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const getSession = (): CoSyncSession | null => {
    try {
        const raw = localStorage.getItem(SESSION_KEY);


        if (!raw) return null;
        const session: CoSyncSession = JSON.parse(raw);
        // Expire after 24 hours
        if (Date.now() - session.joinedAt > SESSION_TTL_MS) {
            localStorage.removeItem(SESSION_KEY);
            return null;
        }
        return session;
    } catch {
        return null;
    }
};

export const clearSession = () => localStorage.removeItem(SESSION_KEY);

const Home = () => {
    const router = useRouter();
    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');
    const [existingSession, setExistingSession] = useState<CoSyncSession | null>(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const session = getSession();
        const dismissed = sessionStorage.getItem('cosync_dismissed');
        if (session && !dismissed) {
            router.replace(`/editorPage?roomId=${session.roomId}&username=${encodeURIComponent(session.username)}`);
            return;
        }

        if (session) {
            setExistingSession(session);
            setRoomId(session.roomId);
            setUsername(session.username);
        }
        setChecking(false);
    }, []);

    const navigateToEditor = (rId: string, uname: string) => {
        saveSession(rId, uname);
        router.push(`/editorPage?roomId=${rId}&username=${encodeURIComponent(uname)}`);
    };

    const createNewRoom = () => {
        const id = uuidV4();
        setRoomId(id);
        toast.success('Created a new room');
    };

    const joinRoom = () => {
        if (!roomId || !username) {
            toast.error('ROOM ID & username is required');
            return;
        }
        navigateToEditor(roomId, username);
    };

    const rejoinRoom = () => {
        if (!existingSession) return;
        navigateToEditor(existingSession.roomId, existingSession.username);
    };

    const dismissSession = () => {
        sessionStorage.setItem('cosync_dismissed', 'true'); // only persists for this tab's lifetime
        clearSession();
        setExistingSession(null);
        setRoomId('');
        setUsername('');
    };

    const handleInputEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.code === 'Enter') joinRoom();
    };

    if (checking) return null; // avoid flash

    return (
        <DotBackgroundDemo>
            <div className='flex flex-col items-center justify-center min-h-screen p-4'>

                {/* Rejoin Banner */}
                {existingSession && (
                    <div className='w-full max-w-md sm:max-w-lg mb-4 bg-blue-950/80 border border-blue-500/40 rounded-2xl p-4 flex items-center justify-between gap-3 backdrop-blur-sm shadow-lg'>
                        <div>
                            <p className='text-blue-300 text-xs font-semibold uppercase tracking-wider mb-0.5'>Active Session Found</p>
                            <p className='text-white text-sm font-medium'>
                                <span className='text-blue-400'>{existingSession.username}</span>
                                {' · '}
                                <span className='font-mono text-xs text-slate-300'>{existingSession.roomId.slice(0, 8)}...</span>
                            </p>
                        </div>
                        <div className='flex gap-2 shrink-0'>
                            <button
                                onClick={rejoinRoom}
                                className='bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors'
                            >
                                Rejoin
                            </button>
                            <button
                                onClick={dismissSession}
                                className='bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors'
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}

                <div className='bg-white/95 backdrop-blur-sm w-full max-w-md sm:max-w-lg h-auto rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8'>
                    <div className='text-center mb-6 sm:mb-8'>
                        <h2 className='text-xl sm:text-2xl font-bold text-gray-800 mb-2'>Join a Room</h2>
                        <p className='text-gray-600 text-sm'>Enter your room ID and username to get started</p>
                    </div>

                    <div className='space-y-4'>
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>Room ID</label>
                            <input
                                type="text"
                                className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500'
                                placeholder='Enter room ID'
                                onChange={(e) => setRoomId(e.target.value)}
                                value={roomId}
                                onKeyUp={handleInputEnter}
                            />
                        </div>

                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>Username</label>
                            <input
                                type="text"
                                className='w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500'
                                placeholder='Enter your username'
                                onChange={(e) => setUsername(e.target.value)}
                                value={username}
                                onKeyUp={handleInputEnter}
                            />
                        </div>

                        <button
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                            onClick={joinRoom}
                        >
                            Join Room
                        </button>
                    </div>

                    <div className='mt-8 text-center'>
                        <p className='text-gray-600 text-sm mb-4'>Don't have a room? Create one!</p>
                        <button
                            onClick={createNewRoom}
                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-2 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                        >
                            Create Room ID
                        </button>
                    </div>
                </div>
            </div>
        </DotBackgroundDemo>
    );
};

export default Home;