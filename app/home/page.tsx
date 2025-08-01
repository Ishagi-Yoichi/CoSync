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
    <div className='flex flex-col items-center justify-center h-screen '>
        <div className='bg-white w-96 h-auto rounded-lg justify-center items-center'>
            <h4 className='text-center font-bold'>Paste invitation Room ID</h4>
            <input
             type ="text"
             className=' border-2 border-black rounded-lg w-72 mb-4 text-black font-bold'
             placeholder='Room ID'
             onChange={(e) => setRoomId(e.target.value)}
                value={roomId}
                onKeyUp={handleInputEnter}
             />
             
            <input
                type="text"
                className="border-2 border-black rounded-lg w-72 mb-4 text-black font-bold"
                placeholder="USERNAME"
                onChange={(e) => setUsername(e.target.value)}
                value={username}
                 onKeyUp={handleInputEnter}
            />
            <br />
            <button className="bg-blue-500 rounded-lg p-2 cursor-pointer hover:bg-blue-600 text-black font-bold" onClick={joinRoom}>
                Join
            </button>
            <br />
             <span className="createInfo">
                        If you don`t have an invite then create &nbsp; <br /><br />
                        <a
                            onClick={createNewRoom}
                            href=""
                            className="bg-green-400 border-b-green-600 border-solid transition-all duration-300 ease-in-out hover:bg-green-500 rounded-lg p-2 cursor-pointer hover:border-b-2 text-black font-bold"
                        >
                            new room
                        </a>
            </span>
        </div>
    </div>
    )
};

export default Home;
