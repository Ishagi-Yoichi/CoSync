"use client";
import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import * as Y from 'yjs';
//@ts-ignore
import { CodemirrorBinding } from 'y-codemirror';
import * as awarenessProtocol from 'y-protocols/awareness';

const { ACTIONS } = require('../Actions');

const Editor = ({ socketRef, roomId, username, onCodeChange }: any) => {
    const editorRef = useRef<any>(null);
    const ydocRef = useRef<Y.Doc>(new Y.Doc());

    useEffect(() => {
        if (!socketRef.current || editorRef.current) return;

        const ydoc = ydocRef.current;
        const ytext = ydoc.getText('codemirror');
        const awareness = new awarenessProtocol.Awareness(ydoc);

        const textarea = document.getElementById('realtimeEditor') as HTMLTextAreaElement;
        editorRef.current = Codemirror.fromTextArea(textarea, {
            mode: { name: 'javascript', json: true },
            theme: 'dracula',
            lineNumbers: true,
            autoCloseBrackets: true,
        });

        const binding = new CodemirrorBinding(ytext, editorRef.current, awareness);

        awareness.setLocalStateField('user', {
            name: username,
            color: '#' + Math.floor(Math.random() * 16777215).toString(16),
        });

        // FIX: Send roomId and update as separate arguments
        ydoc.on('update', (update) => {
            socketRef.current.emit(ACTIONS.UPDATE, roomId, update);
        });

        awareness.on('update', () => {
            const state = awarenessProtocol.encodeAwarenessUpdate(awareness, [ydoc.clientID]);
            socketRef.current.emit(ACTIONS.AWARENESS_UPDATE, roomId, state);
        });

        // FIX: Receive roomId and update as separate arguments
        const handleRemoteUpdate = (incomingRoomId: string, update: ArrayBuffer) => {
            if (incomingRoomId !== roomId) return;
            Y.applyUpdate(ydoc, new Uint8Array(update));
        };

        const handleRemoteAwareness = (incomingRoomId: string, update: ArrayBuffer) => {
            if (incomingRoomId !== roomId) return;
            awarenessProtocol.applyAwarenessUpdate(awareness, new Uint8Array(update), socketRef.current);
        };

        socketRef.current.on(ACTIONS.UPDATE, handleRemoteUpdate);
        socketRef.current.on(ACTIONS.AWARENESS_UPDATE, handleRemoteAwareness);

        ytext.observe(() => onCodeChange(ytext.toString()));

        return () => {
            binding.destroy();
            ydoc.destroy();
            editorRef.current?.toTextArea();
            socketRef.current.off(ACTIONS.UPDATE, handleRemoteUpdate);
            socketRef.current.off(ACTIONS.AWARENESS_UPDATE, handleRemoteAwareness);
        };
    }, [roomId]);

    return (
        <div className="flex-1 h-full border-l border-slate-800">
            <textarea id="realtimeEditor"></textarea>
        </div>
    );
};

export default Editor;