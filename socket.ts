import { io } from 'socket.io-client';

export const initSocket = async () => {
    const options = {
        'force new connection': true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
    };
    
    // Use environment variable or default to localhost:5000
    const serverUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    return io(serverUrl, options);
};
