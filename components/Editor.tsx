"use client";
import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import * as Y from 'yjs';
//@ts-ignore
import { CodemirrorBinding } from 'y-codemirror';
import * as awarenessProtocol from 'y-protocols/awareness'; // Correct import for 2026 standards

// Standard CM5 styles
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';

const { ACTIONS } = require('../Actions');

const Editor = ({ socketRef, roomId, username, onCodeChange }: any) => {
    const editorRef = useRef<any>(null);
    const ydocRef = useRef<Y.Doc | null>(null);

    useEffect(() => {
        if (!socketRef.current || editorRef.current) return;

        // 1. Initialize Yjs and Awareness
        const ydoc = new Y.Doc();
        ydocRef.current = ydoc;
        const ytext = ydoc.getText('codemirror');
        const awareness = new awarenessProtocol.Awareness(ydoc);

        // 2. Setup CodeMirror 5
        const textarea = document.getElementById('realtimeEditor') as HTMLTextAreaElement;
        editorRef.current = Codemirror.fromTextArea(textarea, {
            mode: { name: 'javascript', json: true },
            theme: 'dracula',
            lineNumbers: true,
            autoCloseBrackets: true,
        });

        // 3. The Binding (This links CM5 + Yjs + Awareness)
        const binding = new CodemirrorBinding(ytext, editorRef.current, awareness);

        // 4. Set local user state for cursors
        awareness.setLocalStateField('user', {
            name: username,
            color: '#' + Math.floor(Math.random() * 16777215).toString(16),
        });

        // 5. SENDING: Emit updates to server
        ydoc.on('update', (update) => {
            // Force it into a Buffer to ensure Socket.io treats it as binary
            socketRef.current.emit(ACTIONS.UPDATE, roomId, update);
        });

        awareness.on('update', () => {
            const state = awarenessProtocol.encodeAwarenessUpdate(awareness, [ydoc.clientID]);
            socketRef.current.emit(ACTIONS.AWARENESS_UPDATE, roomId, state);
        });

        // 6. RECEIVING: Handle incoming binary data
        const handleRemoteUpdate = (incomingRoomId: any, update: any) => {
            // CRITICAL FIX: Ensure 'update' is a Uint8Array
            if (incomingRoomId !== roomId) return;
            Y.applyUpdate(ydoc, new Uint8Array(update));
        };

        const handleRemoteAwareness = (incomingRoomId: any, update: any) => {
            if (incomingRoomId !== roomId) return;
            awarenessProtocol.applyAwarenessUpdate(awareness, new Uint8Array(update), socketRef.current);
        };

        socketRef.current.on(ACTIONS.UPDATE, handleRemoteUpdate);
        socketRef.current.on(ACTIONS.AWARENESS_UPDATE, handleRemoteAwareness);

        // Track code for the parent component
        ytext.observe(() => onCodeChange(ytext.toString()));

        return () => {
            binding.destroy();
            ydoc.destroy();
            editorRef.current?.toTextArea();
            socketRef.current.off(ACTIONS.UPDATE);
            socketRef.current.off(ACTIONS.AWARENESS_UPDATE);
        };
    }, [roomId]);

    return (
        <div className="flex-1 h-full border-l border-slate-800">
            <textarea id="realtimeEditor"></textarea>
        </div>
    );
};

export default Editor;