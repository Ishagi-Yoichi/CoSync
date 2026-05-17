const { createServer } = require('http');
const { Server } = require('socket.io');
const { ACTIONS } = require('./Actions');

interface ClientPresence {
    socketId: string;
    username: string;
    roomId: string | null;
    isAudioEnabled: boolean;
    isMuted: boolean;
    isSpeaking: boolean;
    joinedAt: number;
}

interface JoinData {
    roomId: string;
    username: string;
    lastKnownCode?: string;
}

interface JoinAck {
    ok: boolean;
    error?: string;
    clients?: ClientPresence[];
    client?: ClientPresence;
    code?: string;
    recovered?: boolean;
}

interface CodeChangeData {
    roomId: string;
    code: string;
}

interface SyncCodeData {
    socketId: string;
    code: string;
}

interface SignalPayload {
    roomId: string;
    targetId: string;
    description?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
}

interface AudioStatePayload {
    roomId: string;
    isAudioEnabled: boolean;
    isMuted: boolean;
}

interface SpeakingStatePayload {
    roomId: string;
    isSpeaking: boolean;
}

class CircuitBreaker {
    private failureCount = 0;
    private openedAt = 0;

    constructor(
        private readonly threshold = 5,
        private readonly cooldownMs = 10_000,
    ) {}

    private isCoolingDown() {
        return this.openedAt > 0 && Date.now() - this.openedAt < this.cooldownMs;
    }

    execute<T>(operation: () => T): T {
        if (this.isCoolingDown()) {
            throw new Error('Room service is temporarily recovering.');
        }

        try {
            const result = operation();
            this.failureCount = 0;
            this.openedAt = 0;
            return result;
        } catch (error) {
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
    pingInterval: 25_000,
    pingTimeout: 20_000,
    connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60_000,
        skipMiddlewares: true,
    },
});

const presenceBySocketId = new Map<string, ClientPresence>();
const roomCodeSnapshots = new Map<string, string>();
const roomBreakers = new Map<string, CircuitBreaker>();

function getBreaker(roomId: string) {
    const existingBreaker = roomBreakers.get(roomId);
    if (existingBreaker) {
        return existingBreaker;
    }

    const breaker = new CircuitBreaker();
    roomBreakers.set(roomId, breaker);
    return breaker;
}

function emitRoomError(socket: any, message: string, retryable = true) {
    socket.emit(ACTIONS.ROOM_ERROR, {
        message,
        retryable,
        happenedAt: Date.now(),
    });
}

function withRoomGuard<T>(socket: any, roomId: string, operation: () => T): T | null {
    try {
        return getBreaker(roomId).execute(operation);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected room failure.';
        emitRoomError(socket, message);
        return null;
    }
}

function getRoomClients(roomId: string) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || [])
        .map((socketId: unknown) => presenceBySocketId.get(socketId as string))
        .filter((client): client is ClientPresence => Boolean(client))
        .sort((left, right) => left.joinedAt - right.joinedAt);
}

function emitRoomState(roomId: string) {
    io.to(roomId).emit(ACTIONS.ROOM_STATE, {
        roomId,
        clients: getRoomClients(roomId),
        updatedAt: Date.now(),
    });
}

function cleanupRoomIfEmpty(roomId: string) {
    const room = io.sockets.adapter.rooms.get(roomId);
    if (room && room.size > 0) {
        return;
    }

    roomBreakers.delete(roomId);
    if (!roomCodeSnapshots.get(roomId)) {
        roomCodeSnapshots.delete(roomId);
    }
}

function leaveTrackedRoom(socket: any, reason: 'leave' | 'disconnecting') {
    const client = presenceBySocketId.get(socket.id);
    if (!client?.roomId) {
        return;
    }

    const { roomId, username } = client;
    socket.leave(roomId);
    presenceBySocketId.set(socket.id, {
        ...client,
        roomId: null,
        isSpeaking: false,
        isAudioEnabled: false,
        isMuted: true,
    });

    socket.to(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username,
        reason,
    });
    emitRoomState(roomId);
    cleanupRoomIfEmpty(roomId);
}

function validateJoinPayload(payload: JoinData) {
    const roomId = payload.roomId?.trim();
    const username = payload.username?.trim();

    if (!roomId) {
        throw new Error('Room ID is required to join.');
    }

    if (!username) {
        throw new Error('Username is required to join.');
    }

    return {
        roomId,
        username: username.slice(0, 40),
        lastKnownCode: payload.lastKnownCode ?? '',
    };
}

function getRoomIdForSocket(socketId: string) {
    return presenceBySocketId.get(socketId)?.roomId ?? null;
}

io.on('connection', (socket: any) => {
    console.log('socket connected', socket.id, 'recovered:', Boolean(socket.recovered));

    socket.on(ACTIONS.JOIN, (payload: JoinData, ack?: (response: JoinAck) => void) => {
        const safeAck = typeof ack === 'function' ? ack : () => undefined;

        try {
            const { roomId, username, lastKnownCode } = validateJoinPayload(payload);
            const result = withRoomGuard(socket, roomId, () => {
                const existingRoomId = getRoomIdForSocket(socket.id);
                if (existingRoomId && existingRoomId !== roomId) {
                    leaveTrackedRoom(socket, 'leave');
                }

                socket.join(roomId);

                const previousPresence = presenceBySocketId.get(socket.id);
                const nextPresence: ClientPresence = {
                    socketId: socket.id,
                    username,
                    roomId,
                    isAudioEnabled: previousPresence?.isAudioEnabled ?? false,
                    isMuted: previousPresence?.isMuted ?? true,
                    isSpeaking: false,
                    joinedAt: previousPresence?.joinedAt ?? Date.now(),
                };

                presenceBySocketId.set(socket.id, nextPresence);

                if (!roomCodeSnapshots.has(roomId) && lastKnownCode) {
                    roomCodeSnapshots.set(roomId, lastKnownCode);
                }

                const code = roomCodeSnapshots.get(roomId) ?? '';
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
                } satisfies JoinAck;
            });

            if (!result) {
                safeAck({
                    ok: false,
                    error: 'Room join failed. Please retry.',
                });
                return;
            }

            safeAck(result);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Could not join the room.';
            emitRoomError(socket, message, false);
            safeAck({
                ok: false,
                error: message,
            });
        }
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }: CodeChangeData) => {
        const result = withRoomGuard(socket, roomId, () => {
            roomCodeSnapshots.set(roomId, code);
            socket.to(roomId).emit(ACTIONS.CODE_CHANGE, { code });
        });

        if (result === null) {
            console.error('Failed to broadcast code change for room', roomId);
        }
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }: SyncCodeData) => {
        const roomId = getRoomIdForSocket(socketId);
        if (!roomId) {
            return;
        }

        roomCodeSnapshots.set(roomId, code);
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.PEER_OFFER, ({ roomId, targetId, description }: SignalPayload) => {
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

    socket.on(ACTIONS.PEER_ANSWER, ({ roomId, targetId, description }: SignalPayload) => {
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

    socket.on(ACTIONS.PEER_ICE_CANDIDATE, ({ roomId, targetId, candidate }: SignalPayload) => {
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

    socket.on(ACTIONS.AUDIO_STATE_CHANGED, ({ roomId, isAudioEnabled, isMuted }: AudioStatePayload) => {
        const client = presenceBySocketId.get(socket.id);
        if (!client || client.roomId !== roomId) {
            return;
        }

        presenceBySocketId.set(socket.id, {
            ...client,
            isAudioEnabled,
            isMuted,
            isSpeaking: isAudioEnabled && !isMuted ? client.isSpeaking : false,
        });
        emitRoomState(roomId);
    });

    socket.on(ACTIONS.SPEAKING_STATE_CHANGED, ({ roomId, isSpeaking }: SpeakingStatePayload) => {
        const client = presenceBySocketId.get(socket.id);
        if (!client || client.roomId !== roomId) {
            return;
        }

        const nextSpeaking = client.isAudioEnabled && !client.isMuted ? isSpeaking : false;
        if (client.isSpeaking === nextSpeaking) {
            return;
        }

        presenceBySocketId.set(socket.id, {
            ...client,
            isSpeaking: nextSpeaking,
        });
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

    socket.on('disconnect', (reason: string) => {
        presenceBySocketId.delete(socket.id);
        console.log('socket disconnected', socket.id, reason);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
