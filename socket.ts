import { io } from 'socket.io-client';

export const initSocket = async () => {
    const options = {
        'force new connection': true,
        reconnectionAttempt: 'Infinity',
        timeout: 10000,
        transports: ['websocket'],
    };
    
    // Use environment variable or default to localhost:5000
    const serverUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    return io(serverUrl, options);
};
