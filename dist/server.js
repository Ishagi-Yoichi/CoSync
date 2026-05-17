"use strict";
const { createServer } = require('http');
const { Server } = require('socket.io');
const { ACTIONS } = require('./Actions');
class CircuitBreaker {
    constructor(threshold = 5, cooldownMs = 10000) {
        this.threshold = threshold;
        this.cooldownMs = cooldownMs;
        this.failureCount = 0;
        this.openedAt = 0;
    }
    isCoolingDown() {
        return this.openedAt > 0 && Date.now() - this.openedAt < this.cooldownMs;
    }
    execute(operation) {
        if (this.isCoolingDown()) {
            throw new Error('Room service is temporarily recovering.');
        }
        try {
            const result = operation();
            this.failureCount = 0;
            this.openedAt = 0;
            return result;
        }
        catch (error) {
            this.failureCount += 1;
            if (this.failureCount >= this.threshold) {
                this.openedAt = Date.now();
            }
            throw error;
        }
    }
}
const server = createServer();
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
        methods: ["GET", "POST"],
        credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 20000,
    connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60000,
        skipMiddlewares: true,
    },
});
const presenceBySocketId = new Map();
const roomCodeSnapshots = new Map();
const roomBreakers = new Map();
function getBreaker(roomId) {
    const existingBreaker = roomBreakers.get(roomId);
    if (existingBreaker) {
        return existingBreaker;
    }
    const breaker = new CircuitBreaker();
    roomBreakers.set(roomId, breaker);
    return breaker;
}
function emitRoomError(socket, message, retryable = true) {
    socket.emit(ACTIONS.ROOM_ERROR, {
        message,
        retryable,
        happenedAt: Date.now(),
    });
}
function withRoomGuard(socket, roomId, operation) {
    try {
        return getBreaker(roomId).execute(operation);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected room failure.';
        emitRoomError(socket, message);
        return null;
    }
}
function getRoomClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || [])
        .map((socketId) => presenceBySocketId.get(socketId))
        .filter((client) => Boolean(client))
        .sort((left, right) => left.joinedAt - right.joinedAt);
}
function emitRoomState(roomId) {
    io.to(roomId).emit(ACTIONS.ROOM_STATE, {
        roomId,
        clients: getRoomClients(roomId),
        updatedAt: Date.now(),
    });
}
function cleanupRoomIfEmpty(roomId) {
    const room = io.sockets.adapter.rooms.get(roomId);
    if (room && room.size > 0) {
        return;
    }
    roomBreakers.delete(roomId);
    if (!roomCodeSnapshots.get(roomId)) {
        roomCodeSnapshots.delete(roomId);
    }
}
function leaveTrackedRoom(socket, reason) {
    const client = presenceBySocketId.get(socket.id);
    if (!(client === null || client === void 0 ? void 0 : client.roomId)) {
        return;
    }
    const { roomId, username } = client;
    socket.leave(roomId);
    presenceBySocketId.set(socket.id, Object.assign(Object.assign({}, client), { roomId: null, isSpeaking: false, isAudioEnabled: false, isMuted: true }));
    socket.to(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username,
        reason,
    });
    emitRoomState(roomId);
    cleanupRoomIfEmpty(roomId);
}
function validateJoinPayload(payload) {
    var _a, _b, _c;
    const roomId = (_a = payload.roomId) === null || _a === void 0 ? void 0 : _a.trim();
    const username = (_b = payload.username) === null || _b === void 0 ? void 0 : _b.trim();
    if (!roomId) {
        throw new Error('Room ID is required to join.');
    }
    if (!username) {
        throw new Error('Username is required to join.');
    }
    return {
        roomId,
        username: username.slice(0, 40),
        lastKnownCode: (_c = payload.lastKnownCode) !== null && _c !== void 0 ? _c : '',
    };
}
function getRoomIdForSocket(socketId) {
    var _a, _b;
    return (_b = (_a = presenceBySocketId.get(socketId)) === null || _a === void 0 ? void 0 : _a.roomId) !== null && _b !== void 0 ? _b : null;
}
io.on('connection', (socket) => {
    console.log('socket connected', socket.id, 'recovered:', Boolean(socket.recovered));
    socket.on(ACTIONS.JOIN, (payload, ack) => {
        const safeAck = typeof ack === 'function' ? ack : () => undefined;
        try {
            const { roomId, username, lastKnownCode } = validateJoinPayload(payload);
            const result = withRoomGuard(socket, roomId, () => {
                var _a, _b, _c, _d;
                const existingRoomId = getRoomIdForSocket(socket.id);
                if (existingRoomId && existingRoomId !== roomId) {
                    leaveTrackedRoom(socket, 'leave');
                }
                socket.join(roomId);
                const previousPresence = presenceBySocketId.get(socket.id);
                const nextPresence = {
                    socketId: socket.id,
                    username,
                    roomId,
                    isAudioEnabled: (_a = previousPresence === null || previousPresence === void 0 ? void 0 : previousPresence.isAudioEnabled) !== null && _a !== void 0 ? _a : false,
                    isMuted: (_b = previousPresence === null || previousPresence === void 0 ? void 0 : previousPresence.isMuted) !== null && _b !== void 0 ? _b : true,
                    isSpeaking: false,
                    joinedAt: (_c = previousPresence === null || previousPresence === void 0 ? void 0 : previousPresence.joinedAt) !== null && _c !== void 0 ? _c : Date.now(),
                };
                presenceBySocketId.set(socket.id, nextPresence);
                if (!roomCodeSnapshots.has(roomId) && lastKnownCode) {
                    roomCodeSnapshots.set(roomId, lastKnownCode);
                }
                const code = (_d = roomCodeSnapshots.get(roomId)) !== null && _d !== void 0 ? _d : '';
                const clients = getRoomClients(roomId);
                emitRoomState(roomId);
                socket.to(roomId).emit(ACTIONS.JOINED, {
                    socketId: socket.id,
                    username,
                    clients,
                });
                return {
                    ok: true,
                    clients,
                    client: nextPresence,
                    code,
                    recovered: Boolean(socket.recovered),
                };
            });
            if (!result) {
                safeAck({
                    ok: false,
                    error: 'Room join failed. Please retry.',
                });
                return;
            }
            safeAck(result);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Could not join the room.';
            emitRoomError(socket, message, false);
            safeAck({
                ok: false,
                error: message,
            });
        }
    });
    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        const result = withRoomGuard(socket, roomId, () => {
            roomCodeSnapshots.set(roomId, code);
            socket.to(roomId).emit(ACTIONS.CODE_CHANGE, { code });
        });
        if (result === null) {
            console.error('Failed to broadcast code change for room', roomId);
        }
    });
    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        const roomId = getRoomIdForSocket(socketId);
        if (!roomId) {
            return;
        }
        roomCodeSnapshots.set(roomId, code);
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });
    socket.on(ACTIONS.PEER_OFFER, ({ roomId, targetId, description }) => {
        const result = withRoomGuard(socket, roomId, () => {
            if (getRoomIdForSocket(targetId) !== roomId) {
                throw new Error('The selected participant is no longer in the room.');
            }
            io.to(targetId).emit(ACTIONS.PEER_OFFER, {
                description,
                senderId: socket.id,
            });
        });
        if (result === null) {
            console.error('Failed to relay peer offer for room', roomId);
        }
    });
    socket.on(ACTIONS.PEER_ANSWER, ({ roomId, targetId, description }) => {
        const result = withRoomGuard(socket, roomId, () => {
            if (getRoomIdForSocket(targetId) !== roomId) {
                throw new Error('The selected participant is no longer in the room.');
            }
            io.to(targetId).emit(ACTIONS.PEER_ANSWER, {
                description,
                senderId: socket.id,
            });
        });
        if (result === null) {
            console.error('Failed to relay peer answer for room', roomId);
        }
    });
    socket.on(ACTIONS.PEER_ICE_CANDIDATE, ({ roomId, targetId, candidate }) => {
        const result = withRoomGuard(socket, roomId, () => {
            if (getRoomIdForSocket(targetId) !== roomId) {
                throw new Error('The selected participant is no longer in the room.');
            }
            io.to(targetId).emit(ACTIONS.PEER_ICE_CANDIDATE, {
                candidate,
                senderId: socket.id,
            });
        });
        if (result === null) {
            console.error('Failed to relay ICE candidate for room', roomId);
        }
    });
    socket.on(ACTIONS.AUDIO_STATE_CHANGED, ({ roomId, isAudioEnabled, isMuted }) => {
        const client = presenceBySocketId.get(socket.id);
        if (!client || client.roomId !== roomId) {
            return;
        }
        presenceBySocketId.set(socket.id, Object.assign(Object.assign({}, client), { isAudioEnabled,
            isMuted, isSpeaking: isAudioEnabled && !isMuted ? client.isSpeaking : false }));
        emitRoomState(roomId);
    });
    socket.on(ACTIONS.SPEAKING_STATE_CHANGED, ({ roomId, isSpeaking }) => {
        const client = presenceBySocketId.get(socket.id);
        if (!client || client.roomId !== roomId) {
            return;
        }
        const nextSpeaking = client.isAudioEnabled && !client.isMuted ? isSpeaking : false;
        if (client.isSpeaking === nextSpeaking) {
            return;
        }
        presenceBySocketId.set(socket.id, Object.assign(Object.assign({}, client), { isSpeaking: nextSpeaking }));
        socket.to(roomId).emit(ACTIONS.SPEAKING_STATE_CHANGED, {
            socketId: socket.id,
            isSpeaking: nextSpeaking,
        });
    });
    socket.on(ACTIONS.LEAVE, () => {
        leaveTrackedRoom(socket, 'leave');
    });
    socket.on('disconnecting', () => {
        leaveTrackedRoom(socket, 'disconnecting');
    });
    socket.on('disconnect', (reason) => {
        presenceBySocketId.delete(socket.id);
        console.log('socket disconnected', socket.id, reason);
    });
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
