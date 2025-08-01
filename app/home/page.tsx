"use client";
import React, { useState } from 'react';
import { v4 as uuidV4 } from 'uuid';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { DotBackgroundDemo } from '@/components/Dotbg';

const Home = () => {
    const router = useRouter();

    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');

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
        router.push(`/editorPage?roomId=${roomId}&username=${encodeURIComponent(username)}`);
    };

    const handleInputEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.code === 'Enter') {
            joinRoom();
        }
    };

    return (
        <DotBackgroundDemo>
            <div className='flex flex-col items-center justify-center h-screen'>
                <div className='bg-white/95 backdrop-blur-sm w-96 h-auto rounded-2xl shadow-2xl border border-white/20 p-8'>
                    <div className='text-center mb-8'>
                        <h2 className='text-2xl font-bold text-gray-800 mb-2'>Join a Room</h2>
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
                            Create New Room
                        </button>
                    </div>
                </div>
            </div>
        </DotBackgroundDemo>
    )
};

export default Home;
