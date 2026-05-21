"use client";
import React from 'react';
import Avatar from 'react-avatar';
import { IconMicrophone, IconMicrophoneOff, IconWaveSine } from '@tabler/icons-react';
export default function Client({ username, isAudioEnabled = false, isMuted = true, isSpeaking = false, isSelf = false, }) {
    const showSpeaking = isAudioEnabled && !isMuted && isSpeaking;
    return (<div className={`rounded-[24px] border p-3 transition-all ${showSpeaking
            ? 'border-emerald-300/40 bg-emerald-300/10 shadow-[0_16px_40px_rgba(16,185,129,0.1)]'
            : 'border-white/8 bg-white/[0.035]'}`}>
            <div className="flex items-center gap-3">
                <div className="relative">
                    <Avatar name={username} size="46" round="18px"/>
                    <span className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-[#09131f] ${isAudioEnabled && !isMuted ? 'bg-emerald-300' : 'bg-slate-500'}`}/>
                </div>
                <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold tracking-[-0.02em] text-white">
                        {username}
                        {isSelf ? ' · You' : ''}
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                        {showSpeaking ? 'Speaking now' : isAudioEnabled ? (isMuted ? 'Muted' : 'Voice active') : 'Voice offline'}
                    </div>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${showSpeaking ? 'bg-emerald-300/15 text-emerald-200' : 'bg-white/6 text-slate-300'}`}>
                    {showSpeaking ? (<IconWaveSine className="h-5 w-5"/>) : isAudioEnabled && !isMuted ? (<IconMicrophone className="h-5 w-5"/>) : (<IconMicrophoneOff className="h-5 w-5"/>)}
                </div>
            </div>
        </div>);
}
