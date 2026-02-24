"use client";
import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import * as Y from 'yjs';
// @ts-ignore
import { CodemirrorBinding } from 'y-codemirror';
import * as awarenessProtocol from 'y-protocols/awareness';

import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/python/python';
import 'codemirror/mode/clike/clike';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/css/css';
import 'codemirror/addon/edit/closebrackets';

const { ACTIONS } = require('../Actions');

const Editor = ({ socketRef, roomId, username, onCodeChange, language, fontSize }: any) => {
    const toNumberArray = (u8: Uint8Array): number[] => Array.from(u8);
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const editorInstanceRef = useRef<any>(null);
    const ydocRef = useRef<Y.Doc | null>(null);
    const isApplyingRemote = useRef(false);

    // Apply language change without remounting
    useEffect(() => {
        if (editorInstanceRef.current && language) {
            editorInstanceRef.current.setOption('mode', language.mode);
        }
    }, [language]);

    // Apply font size change without remounting
    useEffect(() => {
        if (editorInstanceRef.current && fontSize) {
            const wrapper = editorInstanceRef.current.getWrapperElement();
            wrapper.style.fontSize = `${fontSize}px`;
            editorInstanceRef.current.refresh();
        }
    }, [fontSize]);

    useEffect(() => {
        const ydoc = new Y.Doc();
        ydocRef.current = ydoc;
        if (!socketRef.current || !editorContainerRef.current) return;

        const textarea = document.createElement('textarea');
        editorContainerRef.current.appendChild(textarea);

        const editor = Codemirror.fromTextArea(textarea, {
            mode: language?.mode ?? 'javascript',
            theme: 'dracula',
            lineNumbers: true,
            autoCloseBrackets: true,
            viewportMargin: Infinity,
        });
        editorInstanceRef.current = editor;

        // Apply initial font size
        if (fontSize) {
            editor.getWrapperElement().style.fontSize = `${fontSize}px`;
        }

        const ytext = ydoc.getText('codemirror');
        const awareness = new awarenessProtocol.Awareness(ydoc);

        awareness.setLocalStateField('user', {
            name: username,
            color: '#' + Math.floor(Math.random() * 16777215).toString(16),
        });

        const binding = new CodemirrorBinding(ytext, editor, awareness);

        const toUint8Array = (data: any): Uint8Array => {
            if (data instanceof Uint8Array) return data;
            if (data instanceof ArrayBuffer) return new Uint8Array(data);
            if (Array.isArray(data)) return new Uint8Array(data);
            if (data?.buffer) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
            if (typeof data === 'object') return new Uint8Array(Object.values(data));
            return new Uint8Array();
        };

        ydoc.on('update', (update: Uint8Array) => {
            if (isApplyingRemote.current) return;
            socketRef.current.emit(ACTIONS.UPDATE, roomId, toNumberArray(update));
        });

        awareness.on('update', () => {
            const state = awarenessProtocol.encodeAwarenessUpdate(awareness, [ydoc.clientID]);
            socketRef.current.emit(ACTIONS.AWARENESS_UPDATE, roomId, toNumberArray(state));
        });

        const handleRemoteUpdate = (incRoomId: string, update: any) => {
            if (incRoomId !== roomId) return;
            isApplyingRemote.current = true;
            Y.applyUpdate(ydoc, toUint8Array(update));
            isApplyingRemote.current = false;
        };

        const handleRemoteAwareness = (incRoomId: string, update: any) => {
            if (incRoomId !== roomId) return;
            awarenessProtocol.applyAwarenessUpdate(awareness, toUint8Array(update), socketRef.current);
        };

        const handleRequestSync = ({ requesterId }: { requesterId: string }) => {
            const fullState = toNumberArray(Y.encodeStateAsUpdate(ydoc));
            socketRef.current.emit(ACTIONS.SEND_SYNC, { targetId: requesterId, state: fullState });
        };

        const handleSyncState = (state: any) => {
            isApplyingRemote.current = true;
            Y.applyUpdate(ydoc, toUint8Array(state));
            isApplyingRemote.current = false;
        };

        socketRef.current.on(ACTIONS.UPDATE, handleRemoteUpdate);
        socketRef.current.on(ACTIONS.AWARENESS_UPDATE, handleRemoteAwareness);
        socketRef.current.on(ACTIONS.REQUEST_SYNC, handleRequestSync);
        socketRef.current.on(ACTIONS.SYNC_STATE, handleSyncState);
        socketRef.current.emit(ACTIONS.REQUEST_SYNC, roomId);

        ytext.observe(() => { onCodeChange(ytext.toString()); });

        return () => {
            binding.destroy();
            ydoc.destroy();
            editor.toTextArea();
            if (editorContainerRef.current) editorContainerRef.current.innerHTML = '';
            socketRef.current?.off(ACTIONS.UPDATE, handleRemoteUpdate);
            socketRef.current?.off(ACTIONS.AWARENESS_UPDATE, handleRemoteAwareness);
            socketRef.current?.off(ACTIONS.REQUEST_SYNC, handleRequestSync);
            socketRef.current?.off(ACTIONS.SYNC_STATE, handleSyncState);
        };
    }, [roomId]);

    return (
        <div className="flex-1 h-full overflow-hidden" ref={editorContainerRef} />
    );
};

export default Editor;