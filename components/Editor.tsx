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
    const toNumberArray = (u8: Uint8Array): number[] => Array.from(u8);
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const editorInstanceRef = useRef<any>(null);
    const ydocRef = useRef<Y.Doc | null>(null);

    useEffect(() => {
        const ydoc = new Y.Doc();
        ydocRef.current = ydoc;
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
        //const ydoc = ydocRef.current;
        const ytext = ydoc.getText('codemirror');
        const awareness = new awarenessProtocol.Awareness(ydoc);

        // 3. Set User Identity
        awareness.setLocalStateField('user', {
            name: username,
            color: '#' + Math.floor(Math.random() * 16777215).toString(16),
        });

        // 4. Create the Binding
        const binding = new CodemirrorBinding(ytext, editor, awareness);

        const toUint8Array = (data: any): Uint8Array => {
            if (data instanceof Uint8Array) return data;
            if (data instanceof ArrayBuffer) return new Uint8Array(data);
            if (Array.isArray(data)) return new Uint8Array(data); // our number[]
            if (data?.buffer) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
            if (typeof data === 'object') return new Uint8Array(Object.values(data));
            return new Uint8Array();
        };

        // 5. Binary Transmissions (Flat Arguments)
        ydoc.on('update', (update: Uint8Array, origin: any) => {
            if (origin === 'remote') return;
            socketRef.current.emit(ACTIONS.UPDATE, roomId, toNumberArray(update));
        });

        awareness.on('update', () => {
            const state = awarenessProtocol.encodeAwarenessUpdate(awareness, [ydoc.clientID]);
            socketRef.current.emit(ACTIONS.AWARENESS_UPDATE, roomId, toNumberArray(state));
        });



        // 6. Incoming Handlers (Using Uint8Array specifically)
        const handleRemoteUpdate = (incRoomId: string, update: any) => {
            console.log('received update for room:', incRoomId, 'my room:', roomId);
            console.log('update data:', update, 'type:', typeof update, Array.isArray(update));
            if (incRoomId !== roomId) {
                console.log('ROOM MISMATCH — skipping');
                return;
            }
            const u8 = toUint8Array(update);
            console.log('applying u8 of length:', u8.length);
            Y.applyUpdate(ydoc, u8, 'remote');
        };

        const handleRemoteAwareness = (incRoomId: string, update: any) => {
            if (incRoomId !== roomId) return;
            awarenessProtocol.applyAwarenessUpdate(awareness, toUint8Array(update), socketRef.current);
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
            socketRef.current?.off(ACTIONS.UPDATE, handleRemoteUpdate);
            socketRef.current?.off(ACTIONS.AWARENESS_UPDATE, handleRemoteAwareness);
            // No socket.disconnect() here — that's handled by editorPage cleanup
        };
    }, [roomId]); // Re-run if room changes

    return (
        <div className="flex-1 h-full overflow-hidden" ref={editorContainerRef}>
            {/* CodeMirror will be injected here */}
        </div>
    );
};

export default Editor;