"use client";
import React from 'react';
import Avatar from 'react-avatar';
export default function Client({ username }) {
    return (<div className='flex items-center gap-3 p-2 bg-gray-700 rounded-lg'>
            <Avatar name={username} size="40" round="8px"/>
            <span className='text-white text-sm font-medium'>{username}</span>
        </div>);
}
