"use client";
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initSocket = () => {
    if(!socket){
    const options = {
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5,
        timeout: 10000,
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        withCredentials: true,
    };
    const serverUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
   
   
//     if(typeof window !=="undefined"){
//     return io(serverUrl, options);
//    }
        socket = io(serverUrl,options);

}
    
   return socket;
    
};
