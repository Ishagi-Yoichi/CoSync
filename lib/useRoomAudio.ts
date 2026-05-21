"use client";

import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import type { RoomClient } from './room-types';

const { ACTIONS } = require('../Actions');

const ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
];

interface UseRoomAudioProps {
    socket: Socket | null;
    roomId: string;
    selfSocketId: string;
    clients: RoomClient[];
}

interface PeerState {
    pc: RTCPeerConnection;
    polite: boolean;
    makingOffer: boolean;
    ignoreOffer: boolean;
    audioElement: HTMLAudioElement | null;
}

function getMediaErrorMessage(error: unknown) {
    if (error instanceof DOMException) {
        switch (error.name) {
            case 'NotAllowedError':
                return 'Microphone access was blocked. Allow mic access and try again.';
            case 'NotFoundError':
                return 'No microphone was found on this device.';
            case 'NotReadableError':
                return 'Your microphone is busy in another application.';
            default:
                return error.message || 'Could not access the microphone.';
        }
    }

    return 'Could not access the microphone.';
}

export function useRoomAudio({ socket, roomId, selfSocketId, clients }: UseRoomAudioProps) {
    const [isSupported, setIsSupported] = useState(true);
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [isMicBusy, setIsMicBusy] = useState(false);
    const [audioError, setAudioError] = useState<string | null>(null);

    const peerStatesRef = useRef(new Map<string, PeerState>());
    const localStreamRef = useRef<MediaStream | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const speakingIntervalRef = useRef<number | null>(null);
    const lastSpeakingRef = useRef(false);
    const previousSelfSocketIdRef = useRef('');
    const isVoiceEnabledRef = useRef(false);
    const isMutedRef = useRef(true);
    const socketRef = useRef<Socket | null>(socket);
    const roomIdRef = useRef(roomId);
    const selfSocketIdRef = useRef(selfSocketId);

    useEffect(() => {
        socketRef.current = socket;
        roomIdRef.current = roomId;
        selfSocketIdRef.current = selfSocketId;
    }, [socket, roomId, selfSocketId]);

    useEffect(() => {
        isVoiceEnabledRef.current = isVoiceEnabled;
        isMutedRef.current = isMuted;
    }, [isMuted, isVoiceEnabled]);

    useEffect(() => {
        const supported =
            typeof window !== 'undefined' &&
            typeof window.RTCPeerConnection !== 'undefined' &&
            typeof navigator !== 'undefined' &&
            Boolean(navigator.mediaDevices?.getUserMedia);

        setIsSupported(supported);
    }, []);

    function emitAudioState(nextEnabled: boolean, nextMuted: boolean) {
        socketRef.current?.emit(ACTIONS.AUDIO_STATE_CHANGED, {
            roomId: roomIdRef.current,
            isAudioEnabled: nextEnabled,
            isMuted: nextMuted,
        });
    }

    function emitSpeakingState(isSpeaking: boolean) {
        socketRef.current?.emit(ACTIONS.SPEAKING_STATE_CHANGED, {
            roomId: roomIdRef.current,
            isSpeaking,
        });
    }

    function stopSpeakingDetection() {
        if (speakingIntervalRef.current) {
            window.clearInterval(speakingIntervalRef.current);
            speakingIntervalRef.current = null;
        }

        lastSpeakingRef.current = false;
        analyserRef.current = null;
        if (audioContextRef.current) {
            void audioContextRef.current.close();
            audioContextRef.current = null;
        }
    }

    function startSpeakingDetection(stream: MediaStream) {
        stopSpeakingDetection();

        if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') {
            return;
        }

        const audioContext = new window.AudioContext();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const samples = new Uint8Array(analyser.fftSize);
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        speakingIntervalRef.current = window.setInterval(() => {
            const activeStream = localStreamRef.current;
            if (!activeStream || !isVoiceEnabledRef.current || isMutedRef.current) {
                if (lastSpeakingRef.current) {
                    lastSpeakingRef.current = false;
                    emitSpeakingState(false);
                }
                return;
            }

            analyser.getByteTimeDomainData(samples);

            let sumSquares = 0;
            for (const sample of samples) {
                const normalized = (sample - 128) / 128;
                sumSquares += normalized * normalized;
            }

            const rms = Math.sqrt(sumSquares / samples.length);
            const nextSpeaking = rms > 0.045;

            if (nextSpeaking !== lastSpeakingRef.current) {
                lastSpeakingRef.current = nextSpeaking;
                emitSpeakingState(nextSpeaking);
            }
        }, 250);
    }

    function ensureAudioElement(peerId: string) {
        const peerState = peerStatesRef.current.get(peerId);
        if (!peerState) {
            return null;
        }

        if (peerState.audioElement) {
            return peerState.audioElement;
        }

        const audioElement = document.createElement('audio');
        audioElement.autoplay = true;
        audioElement.setAttribute('playsinline', 'true');
        audioElement.dataset.peerId = peerId;
        audioElement.style.display = 'none';
        document.body.appendChild(audioElement);
        peerState.audioElement = audioElement;
        return audioElement;
    }

    function syncLocalTracks(pc: RTCPeerConnection) {
        const stream = localStreamRef.current;
        const audioTrackIds = new Set(stream?.getAudioTracks().map((track) => track.id) ?? []);

        for (const sender of pc.getSenders()) {
            if (sender.track && !audioTrackIds.has(sender.track.id)) {
                pc.removeTrack(sender);
            }
        }

        if (!stream) {
            return;
        }

        const existingTrackIds = new Set(
            pc.getSenders()
                .map((sender) => sender.track?.id)
                .filter((trackId): trackId is string => Boolean(trackId)),
        );

        for (const track of stream.getAudioTracks()) {
            if (!existingTrackIds.has(track.id)) {
                pc.addTrack(track, stream);
            }
        }
    }

    function destroyPeer(peerId: string) {
        const peerState = peerStatesRef.current.get(peerId);
        if (!peerState) {
            return;
        }

        peerState.pc.ontrack = null;
        peerState.pc.onicecandidate = null;
        peerState.pc.onnegotiationneeded = null;
        peerState.pc.onconnectionstatechange = null;
        peerState.pc.close();
        peerState.audioElement?.remove();
        peerStatesRef.current.delete(peerId);
    }

    function destroyAllPeers() {
        for (const peerId of peerStatesRef.current.keys()) {
            destroyPeer(peerId);
        }
    }

    function createPeer(peerId: string) {
        const existing = peerStatesRef.current.get(peerId);
        if (existing) {
            return existing;
        }

        let peerConnection: RTCPeerConnection;
        try {
            peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        } catch (error) {
            console.error('Failed to create RTCPeerConnection for peer', peerId, error);
            setAudioError('Voice transport setup failed in this browser. Text collaboration is still available.');
            return null;
        }

        const peerState: PeerState = {
            pc: peerConnection,
            polite: selfSocketIdRef.current.localeCompare(peerId) > 0,
            makingOffer: false,
            ignoreOffer: false,
            audioElement: null,
        };

        peerConnection.onicecandidate = ({ candidate }) => {
            if (!candidate) {
                return;
            }

            socketRef.current?.emit(ACTIONS.PEER_ICE_CANDIDATE, {
                roomId: roomIdRef.current,
                targetId: peerId,
                candidate,
            });
        };

        peerConnection.ontrack = ({ streams }) => {
            const [remoteStream] = streams;
            if (!remoteStream) {
                return;
            }

            const audioElement = ensureAudioElement(peerId);
            if (!audioElement) {
                return;
            }

            if (audioElement.srcObject !== remoteStream) {
                audioElement.srcObject = remoteStream;
                void audioElement.play().catch(() => undefined);
            }
        };

        peerConnection.onconnectionstatechange = () => {
            if (peerConnection.connectionState === 'failed') {
                peerConnection.restartIce();
            }
        };

        peerConnection.onnegotiationneeded = async () => {
            if (!socketRef.current) {
                return;
            }

            try {
                peerState.makingOffer = true;
                await peerConnection.setLocalDescription();
                socketRef.current.emit(ACTIONS.PEER_OFFER, {
                    roomId: roomIdRef.current,
                    targetId: peerId,
                    description: peerConnection.localDescription,
                });
            } catch (error) {
                console.error('Negotiation failed for peer', peerId, error);
                setAudioError('Voice connection negotiation failed. Retrying may help.');
            } finally {
                peerState.makingOffer = false;
            }
        };

        syncLocalTracks(peerConnection);
        peerStatesRef.current.set(peerId, peerState);
        return peerState;
    }

    useEffect(() => {
        if (!socket || !selfSocketId) {
            return;
        }

        const handleOffer = async ({
            senderId,
            description,
        }: {
            senderId: string;
            description?: RTCSessionDescriptionInit;
        }) => {
            if (!description) {
                return;
            }

            const peerState = createPeer(senderId);
            if (!peerState) {
                return;
            }
            const { pc } = peerState;
            const offerCollision = peerState.makingOffer || pc.signalingState !== 'stable';
            peerState.ignoreOffer = !peerState.polite && offerCollision;

            if (peerState.ignoreOffer) {
                return;
            }

            try {
                if (offerCollision) {
                    await Promise.all([
                        pc.setLocalDescription({ type: 'rollback' }),
                        pc.setRemoteDescription(description),
                    ]);
                } else {
                    await pc.setRemoteDescription(description);
                }

                syncLocalTracks(pc);
                await pc.setLocalDescription();
                socket.emit(ACTIONS.PEER_ANSWER, {
                    roomId,
                    targetId: senderId,
                    description: pc.localDescription,
                });
            } catch (error) {
                console.error('Failed to handle peer offer', senderId, error);
                setAudioError('Voice connection setup failed for one participant.');
            }
        };

        const handleAnswer = async ({
            senderId,
            description,
        }: {
            senderId: string;
            description?: RTCSessionDescriptionInit;
        }) => {
            if (!description) {
                return;
            }

            const peerState = createPeer(senderId);
            if (!peerState) {
                return;
            }

            try {
                await peerState.pc.setRemoteDescription(description);
            } catch (error) {
                console.error('Failed to handle peer answer', senderId, error);
                setAudioError('Voice response handling failed for one participant.');
            }
        };

        const handleCandidate = async ({
            senderId,
            candidate,
        }: {
            senderId: string;
            candidate?: RTCIceCandidateInit;
        }) => {
            if (!candidate) {
                return;
            }

            const peerState = createPeer(senderId);
            if (!peerState) {
                return;
            }

            try {
                await peerState.pc.addIceCandidate(candidate);
            } catch (error) {
                if (!peerState.ignoreOffer) {
                    console.error('Failed to add ICE candidate', senderId, error);
                }
            }
        };

        socket.on(ACTIONS.PEER_OFFER, handleOffer);
        socket.on(ACTIONS.PEER_ANSWER, handleAnswer);
        socket.on(ACTIONS.PEER_ICE_CANDIDATE, handleCandidate);

        return () => {
            socket.off(ACTIONS.PEER_OFFER, handleOffer);
            socket.off(ACTIONS.PEER_ANSWER, handleAnswer);
            socket.off(ACTIONS.PEER_ICE_CANDIDATE, handleCandidate);
        };
    }, [roomId, selfSocketId, socket]);

    useEffect(() => {
        if (previousSelfSocketIdRef.current && previousSelfSocketIdRef.current !== selfSocketId) {
            destroyAllPeers();
        }

        previousSelfSocketIdRef.current = selfSocketId;
    }, [selfSocketId]);

    useEffect(() => {
        if (!socket || !selfSocketId) {
            return;
        }

        emitAudioState(Boolean(localStreamRef.current), localStreamRef.current ? isMutedRef.current : true);
        if (!localStreamRef.current || isMutedRef.current) {
            emitSpeakingState(false);
        }
    }, [selfSocketId, socket]);

    useEffect(() => {
        if (!selfSocketId) {
            destroyAllPeers();
            return;
        }

        const activePeerIds = new Set(
            clients
                .filter((client) => client.socketId !== selfSocketId)
                .map((client) => client.socketId),
        );

        for (const peerId of peerStatesRef.current.keys()) {
            if (!activePeerIds.has(peerId)) {
                destroyPeer(peerId);
            }
        }

        for (const peerId of activePeerIds) {
            const peerState = createPeer(peerId);
            if (!peerState) {
                continue;
            }
            syncLocalTracks(peerState.pc);
        }
    }, [clients, selfSocketId]);

    useEffect(() => {
        return () => {
            stopSpeakingDetection();
            emitAudioState(false, true);
            emitSpeakingState(false);
            localStreamRef.current?.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
            destroyAllPeers();
        };
    }, []);

    async function enableVoice() {
        if (!isSupported) {
            setAudioError('This browser does not support room voice.');
            return;
        }

        if (localStreamRef.current) {
            return;
        }

        setAudioError(null);
        setIsMicBusy(true);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });

            localStreamRef.current = stream;
            setIsVoiceEnabled(true);
            setIsMuted(false);
            emitAudioState(true, false);
            emitSpeakingState(false);
            startSpeakingDetection(stream);

            for (const peerId of clients
                .filter((client) => client.socketId !== selfSocketIdRef.current)
                .map((client) => client.socketId)) {
                const peerState = createPeer(peerId);
                if (!peerState) {
                    continue;
                }
                syncLocalTracks(peerState.pc);
            }
        } catch (error) {
            setAudioError(getMediaErrorMessage(error));
        } finally {
            setIsMicBusy(false);
        }
    }

    function toggleMute() {
        if (!localStreamRef.current) {
            return;
        }

        const nextMuted = !isMuted;
        for (const track of localStreamRef.current.getAudioTracks()) {
            track.enabled = !nextMuted;
        }

        setIsMuted(nextMuted);
        emitAudioState(true, nextMuted);

        if (nextMuted && lastSpeakingRef.current) {
            lastSpeakingRef.current = false;
            emitSpeakingState(false);
        }
    }

    return {
        isSupported,
        isVoiceEnabled,
        isMuted,
        isMicBusy,
        audioError,
        enableVoice,
        toggleMute,
    };
}
