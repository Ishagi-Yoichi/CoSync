"use client";
import React from 'react';
import Avatar from 'react-avatar';
import { IconMicrophone, IconMicrophoneOff, IconWaveSine } from '@tabler/icons-react';
export default function Client({ username, isAudioEnabled = false, isMuted = true, isSpeaking = false, isSelf = false, }) {
    const showSpeaking = isAudioEnabled && !isMuted && isSpeaking;
    return (<div className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${showSpeaking ? 'border-emerald-400 bg-emerald-500/10' : 'border-gray-700 bg-gray-700'}`}>
            <Avatar name={username} size="40" round="8px"/>
            <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white">
                    {username}
                    {isSelf ? ' (You)' : ''}
                </div>
                <div className="text-xs text-gray-300">
                    {isAudioEnabled ? (isMuted ? 'Muted' : 'Voice ready') : 'Voice off'}
                </div>
            </div>
            {showSpeaking ? (<IconWaveSine className="h-5 w-5 text-emerald-300"/>) : isAudioEnabled && !isMuted ? (<IconMicrophone className="h-5 w-5 text-sky-300"/>) : (<IconMicrophoneOff className="h-5 w-5 text-gray-400"/>)}
        </div>);
}
