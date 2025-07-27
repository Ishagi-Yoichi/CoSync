import React from 'react';
import Avatar from 'react-avatar';

interface ClientType{
    username: string;
}

export default function Client({username}:ClientType){
    return(
        <div className='client'>
            <Avatar name={username} size="50" round="14px"/>
            <span className='userName'>{username}</span>
        </div>
    )
}
