const { createServer } = require('http');
const { Server } = require('socket.io');
const { ACTIONS } = require('./Actions');

interface UserSocketMap {
    [socketId: string]: string;
}

interface JoinData {
    roomId: string;
    username: string;
}

interface CodeChangeData {
    roomId: string;
    code: string;
}

interface SyncCodeData {
    socketId: string;
    code: string;
}

const server = createServer();
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "http://127.0.0.1:3000"], // Allow Next.js dev server
        methods: ["GET", "POST"],
        credentials: true
    }
});

const userSocketMap: UserSocketMap = {};

function getAllConnectedClients(roomId: string) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId: unknown) => ({
            socketId: socketId as string,
            username: userSocketMap[socketId as string],
        })
    );
}

io.on('connection', (socket: any) => {
    console.log('socket connected', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }: JoinData) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);
        const clients = getAllConnectedClients(roomId);
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
            });
        });
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }: CodeChangeData) => {
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }: SyncCodeData) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on('disconnecting', () => {
        for (const roomId of socket.rooms) {
            if (roomId === socket.id) continue;
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        }
        delete userSocketMap[socket.id];
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
