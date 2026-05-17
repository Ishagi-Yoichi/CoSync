export interface RoomClient {
    socketId: string;
    username: string;
    roomId?: string | null;
    isAudioEnabled: boolean;
    isMuted: boolean;
    isSpeaking: boolean;
    joinedAt?: number;
}

export interface JoinRoomResponse {
    ok: boolean;
    error?: string;
    clients?: RoomClient[];
    client?: RoomClient;
    code?: string;
    recovered?: boolean;
}

export interface RoomErrorPayload {
    message: string;
    retryable?: boolean;
    happenedAt?: number;
}
