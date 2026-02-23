"use client";

import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import * as Y from 'yjs';
//@ts-ignore
import { CodemirrorBinding } from 'y-codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import * as awarenessProtocol from 'y-protocols/awareness.js'

const { ACTIONS } = require('../Actions');

interface EditorProps {
    socketRef: React.MutableRefObject<any>;
    roomId: string;
    username: string;
    onCodeChange: (code: string) => void;
}

const Editor = ({ socketRef, roomId, username, onCodeChange }: EditorProps) => {
    const editorRef = useRef<any>(null);
    const ydocRef = useRef<Y.Doc>(new Y.Doc());

    useEffect(() => {
        const textareaElement = document.getElementById('realtimeEditor') as HTMLTextAreaElement;
        if (!textareaElement || editorRef.current) return;

        // 1. Init CodeMirror
        editorRef.current = Codemirror.fromTextArea(textareaElement, {
            mode: { name: 'javascript', json: true },
            theme: 'dracula',
            autoCloseTags: true,
            autoCloseBrackets: true,
            lineNumbers: true,
            lineWrapping: true,
        });

        const ytext = ydocRef.current.getText('codemirror');
        const awareness = new awarenessProtocol.Awareness(ydocRef.current);

        // 2. Set Cursor Identity
        const color = '#' + Math.floor(Math.random() * 16777215).toString(16);
        awareness.setLocalStateField('user', { name: username, color });

        // 3. Binding
        const binding = new CodemirrorBinding(ytext, editorRef.current, awareness);

        // 4. Outgoing Sync
        ydocRef.current.on('update', (update) => {
            socketRef.current?.emit(ACTIONS.UPDATE, { roomId, update: Buffer.from(update) });
        });

        awareness.on('update', () => {
            const state = awarenessProtocol.encodeAwarenessUpdate(awareness, [ydocRef.current.clientID]);
            socketRef.current?.emit(ACTIONS.AWARENESS_UPDATE, { roomId, update: Buffer.from(state) });
        });

        // 5. Parent Callback
        ytext.observe(() => onCodeChange(ytext.toString()));

        // 6. Incoming Sync
        const handleUpdate = ({ update }: any) => Y.applyUpdate(ydocRef.current, new Uint8Array(update));
        const handleAwareness = ({ update }: any) => awarenessProtocol.applyAwarenessUpdate(awareness, new Uint8Array(update), socketRef.current);

        socketRef.current.on(ACTIONS.UPDATE, handleUpdate);
        socketRef.current.on(ACTIONS.AWARENESS_UPDATE, handleAwareness);

        return () => {
            binding.destroy();
            editorRef.current?.toTextArea();
            socketRef.current?.off(ACTIONS.UPDATE);
            socketRef.current?.off(ACTIONS.AWARENESS_UPDATE);
            ydocRef.current.destroy();
        };
    }, [roomId, username]);

    return (
        <div className="flex-1 h-full overflow-hidden border-l border-slate-700">
            <textarea id="realtimeEditor"></textarea>
        </div>
    );
};

export default Editor;