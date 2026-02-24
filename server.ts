// const { createServer } = require('http');
// const { Server } = require('socket.io');
// const { ACTIONS } = require('./Actions');

// interface UserSocketMap {
//     [socketId: string]: string;
// }

// interface JoinData {
//     roomId: string;
//     username: string;
// }

// interface CodeChangeData {
//     roomId: string;
//     code: string;
// }

// interface SyncCodeData {
//     socketId: string;
//     code: string;
// }

// const server = createServer((req: any, res: any) => {
//     if (req.url === '/debug/rooms' && req.method === 'GET') {
//         res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
//         const rooms: any[] = [];
//         for (const [roomId, sockets] of io.sockets.adapter.rooms.entries()) {
//             if (typeof roomId === 'string' && roomId.length > 10) { // Skip socket IDs that are not room IDs
//                 rooms.push({
//                     roomId,
//                     clientCount: sockets.size,
//                     clients: Array.from(sockets).map((socketId: any) => ({
//                         socketId,
//                         username: userSocketMap[socketId] || 'Unknown'
//                     }))
//                 });
//             }
//         }
//         res.end(JSON.stringify(rooms, null, 2));
//         return;
//     }

//     res.writeHead(404);
//     res.end('Not found');
// });

// const io = new Server(server, {
//     cors: {
//         origin: ["http://localhost:3000", "http://127.0.0.1:3000"], // Allow Next.js dev server
//         methods: ["GET", "POST"],
//         credentials: true
//     },
//     pingTimeout: 60000,
//     pingInterval: 25000,
//     transports: ['websocket', 'polling']
// });

// const userSocketMap: UserSocketMap = {};

// function getAllConnectedClients(roomId: string) {
//     const room = io.sockets.adapter.rooms.get(roomId);
//     if (!room) {
//         console.log(`Room ${roomId} does not exist`);
//         return [];
//     }

//     const clients = Array.from(room).map((socketId: unknown) => ({
//         socketId: socketId as string,
//         username: userSocketMap[socketId as string],
//     }));

//     console.log(`Room ${roomId} has ${clients.length} clients:`, clients.map(c => c.username));
//     return clients;
// }

// io.on('connection', (socket: any) => {
//     console.log('socket connected', socket.id);

//     // Send a ping to keep the connection alive
//     const pingInterval = setInterval(() => {
//         socket.emit('ping');
//     }, 30000);

//     // Log all rooms for debugging
//     socket.on('disconnect', () => {
//         console.log('socket disconnected', socket.id);
//         clearInterval(pingInterval);
//     });

//     socket.on('pong', () => {
//         // Client responded to ping, connection is alive
//         console.log('Received pong from', socket.id);
//     });

//     socket.on(ACTIONS.JOIN, ({ roomId, username }: JoinData) => {
//         userSocketMap[socket.id] = username;
//         socket.join(roomId);
//         const clients = getAllConnectedClients(roomId);

//         // Emit to all clients in the room (including the one who just joined)
//         io.in(roomId).emit(ACTIONS.JOINED, {
//             clients,
//             username,
//             socketId: socket.id,
//         });

//         console.log(`User ${username} joined room ${roomId}. Total clients: ${clients.length}`);
//     });

//     socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }: CodeChangeData) => {
//         socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
//     });

//     socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }: SyncCodeData) => {
//         io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
//     });

//     socket.on('disconnecting', () => {
//         clearInterval(pingInterval);
//         for (const roomId of socket.rooms) {
//             if (roomId === socket.id) continue;
//             socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
//                 socketId: socket.id,
//                 username: userSocketMap[socket.id],
//             });
//         }
//         delete userSocketMap[socket.id];
//     });
// });

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
const { createServer } = require("http");
const { Server } = require("socket.io");
const { ACTIONS } = require("./Actions");

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

const roomStates: { [roomId: string]: number[] } = {};

const server = createServer();
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://co-sync-six.vercel.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
  maxHttpBufferSize: 1e8, // 100MB, default is 1MB which can drop large Yjs state vectors
  pingTimeout: 60000,
  pingInterval: 25000,
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

io.on("connection", (socket: any) => {
  console.log("socket connected", socket.id);

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
    const existingClient = clients.find((c) => c.socketId !== socket.id);
    if (existingClient) {
      io.to(existingClient.socketId).emit(ACTIONS.REQUEST_SYNC, {
        requesterId: socket.id, // who needs the state
      });
    }
  });

  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }: CodeChangeData) => {
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }: SyncCodeData) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on(ACTIONS.UPDATE, (roomId: any, update: any) => {
    const room = io.sockets.adapter.rooms.get(roomId);
    console.log("UPDATE received, roomId:", roomId);
    console.log("Room exists:", !!room, "Room size:", room?.size);
    console.log("All rooms for this socket:", [...socket.rooms]);
    socket.to(roomId).emit(ACTIONS.UPDATE, roomId, update);
  });

  socket.on(ACTIONS.REQUEST_SYNC, (roomId: string) => {
    if (roomStates[roomId]) {
      socket.emit(ACTIONS.SYNC_STATE, roomStates[roomId]);
    }
  });

  socket.on(
    ACTIONS.SEND_SYNC,
    ({ targetId, state }: { targetId: string; state: number[] }) => {
      io.to(targetId).emit(ACTIONS.SYNC_STATE, state);
    }
  );

  socket.on(ACTIONS.AWARENESS_UPDATE, (roomId: any, update: any) => {
    socket.to(roomId).emit(ACTIONS.AWARENESS_UPDATE, roomId, update);
  });

  socket.on("disconnecting", () => {
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
