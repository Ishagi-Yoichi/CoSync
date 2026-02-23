"use client";
import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import * as Y from 'yjs';
// @ts-ignore - y-codemirror lacks a d.ts file but the logic is correct
import { CodemirrorBinding } from 'y-codemirror';
import * as awarenessProtocol from 'y-protocols/awareness';

import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/closebrackets';

const { ACTIONS } = require('../Actions');

const Editor = ({ socketRef, roomId, username, onCodeChange }: any) => {
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const editorInstanceRef = useRef<any>(null);
    const ydocRef = useRef<Y.Doc>(new Y.Doc());

    useEffect(() => {
        if (!socketRef.current || !editorContainerRef.current) return;

        // 1. Initialize CodeMirror on a plain textarea
        const textarea = document.createElement('textarea');
        editorContainerRef.current.appendChild(textarea);

        const editor = Codemirror.fromTextArea(textarea, {
            mode: { name: 'javascript', json: true },
            theme: 'dracula',
            lineNumbers: true,
            autoCloseBrackets: true,
            viewportMargin: Infinity, // Important for visibility sync
        });
        editorInstanceRef.current = editor;

        // 2. Setup Yjs
        const ydoc = ydocRef.current;
        const ytext = ydoc.getText('codemirror');
        const awareness = new awarenessProtocol.Awareness(ydoc);

        // 3. Set User Identity
        awareness.setLocalStateField('user', {
            name: username,
            color: '#' + Math.floor(Math.random() * 16777215).toString(16),
        });

        // 4. Create the Binding
        const binding = new CodemirrorBinding(ytext, editor, awareness);

        // 5. Binary Transmissions (Flat Arguments)
        ydoc.on('update', (update: Uint8Array) => {
            socketRef.current.emit(ACTIONS.UPDATE, roomId, update);
        });

        awareness.on('update', () => {
            const state = awarenessProtocol.encodeAwarenessUpdate(awareness, [ydoc.clientID]);
            socketRef.current.emit(ACTIONS.AWARENESS_UPDATE, roomId, state);
        });

        // 6. Incoming Handlers (Using Uint8Array specifically)
        const handleRemoteUpdate = (incRoomId: string, update: ArrayBuffer) => {
            if (incRoomId !== roomId) return;
            // The check for ArrayBuffer vs Uint8Array is crucial here
            const u8 = update instanceof Uint8Array ? update : new Uint8Array(update);
            Y.applyUpdate(ydoc, u8);
        };

        const handleRemoteAwareness = (incRoomId: string, update: ArrayBuffer) => {
            if (incRoomId !== roomId) return;
            const u8 = update instanceof Uint8Array ? update : new Uint8Array(update);
            awarenessProtocol.applyAwarenessUpdate(awareness, u8, socketRef.current);
        };

        socketRef.current.on(ACTIONS.UPDATE, handleRemoteUpdate);
        socketRef.current.on(ACTIONS.AWARENESS_UPDATE, handleRemoteAwareness);

        ytext.observe(() => {
            onCodeChange(ytext.toString());
        });

        return () => {
            binding.destroy();
            ydoc.destroy();
            editor.toTextArea();
            if (editorContainerRef.current) editorContainerRef.current.innerHTML = '';
            socketRef.current.off(ACTIONS.UPDATE, handleRemoteUpdate);
            socketRef.current.off(ACTIONS.AWARENESS_UPDATE, handleRemoteAwareness);
        };
    }, [roomId]); // Re-run if room changes

    return (
        <div className="flex-1 h-full overflow-hidden" ref={editorContainerRef}>
            {/* CodeMirror will be injected here */}
        </div>
    );
};

export default Editor;