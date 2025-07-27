"use client";
import React, { useState } from 'react';
import { v4 as uuidV4 } from 'uuid';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const Home = () => {
    const router = useRouter();

    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');

    const createNewRoom = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        e.preventDefault();
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
        <div className='bg-white w-44 h-56 rounded-lg'>
            <h4>Paste invitation Room ID</h4>
            <input
             type ="text"
             className='p-10 border-2 border-gray-300 rounded-lg w-full mb-4 text-white'
             placeholder='Room ID'
             onChange={(e) => setRoomId(e.target.value)}
                value={roomId}
                onKeyUp={handleInputEnter}
             >

             </input>
        </div>
    )
};

export default Home;
