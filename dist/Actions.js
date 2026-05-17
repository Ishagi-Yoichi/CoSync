"use strict";
const SOCKET_ACTIONS = {
    JOIN: 'join',
    JOINED: 'joined',
    ROOM_STATE: 'room-state',
    ROOM_ERROR: 'room-error',
    DISCONNECTED: 'disconnected',
    CODE_CHANGE: 'code-change',
    SYNC_CODE: 'sync-code',
    PEER_OFFER: 'peer-offer',
    PEER_ANSWER: 'peer-answer',
    PEER_ICE_CANDIDATE: 'peer-ice-candidate',
    AUDIO_STATE_CHANGED: 'audio-state-changed',
    SPEAKING_STATE_CHANGED: 'speaking-state-changed',
    LEAVE: 'leave',
};
module.exports = { ACTIONS: SOCKET_ACTIONS };
