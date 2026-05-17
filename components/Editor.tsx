"use client";

import React, { useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';

const { ACTIONS } = require('../Actions');

interface EditorProps {
    socket: Socket | null;
    roomId: string;
    initialCode: string;
    onCodeChange: (code: string) => void;
    onReady?: () => void;
}

const Editor = ({ socket, roomId, initialCode, onCodeChange, onReady }: EditorProps) => {
    const editorRef = useRef<Codemirror.EditorFromTextArea | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const socketRef = useRef<Socket | null>(socket);
    const onCodeChangeRef = useRef(onCodeChange);
    const onReadyRef = useRef(onReady);
    const initialCodeRef = useRef(initialCode);

    useEffect(() => {
        socketRef.current = socket;
    }, [socket]);

    useEffect(() => {
        onCodeChangeRef.current = onCodeChange;
        onReadyRef.current = onReady;
        initialCodeRef.current = initialCode;
    }, [onCodeChange, onReady]);

    useEffect(() => {
        initialCodeRef.current = initialCode;
    }, [initialCode]);

    useEffect(() => {
        if (!textareaRef.current || editorRef.current) {
            return;
        }

        const instance = Codemirror.fromTextArea(textareaRef.current, {
            mode: { name: 'javascript', json: true },
            theme: 'dracula',
            autoCloseTags: true,
            autoCloseBrackets: true,
            lineNumbers: true,
        });

        instance.setSize('100%', '100%');
        instance.setValue(initialCodeRef.current);
        onCodeChangeRef.current(initialCodeRef.current);

        instance.on('change', (editor, changes) => {
            const code = editor.getValue();
            onCodeChangeRef.current(code);

            if (changes.origin !== 'setValue') {
                socketRef.current?.emit(ACTIONS.CODE_CHANGE, {
                    roomId,
                    code,
                });
            }
        });

        editorRef.current = instance;
        onReadyRef.current?.();

        return () => {
            editorRef.current?.toTextArea();
            editorRef.current = null;
        };
    }, [roomId]);

    useEffect(() => {
        if (!editorRef.current) {
            return;
        }

        const currentCode = editorRef.current.getValue();
        if (initialCode !== currentCode) {
            editorRef.current.setValue(initialCode);
            onCodeChangeRef.current(initialCode);
        }
    }, [initialCode]);

    useEffect(() => {
        if (!socket) {
            return;
        }

        const handleCodeChange = ({ code }: { code: string }) => {
            if (!editorRef.current || code === editorRef.current.getValue()) {
                return;
            }

            editorRef.current.setValue(code);
            onCodeChangeRef.current(code);
        };

        socket.on(ACTIONS.CODE_CHANGE, handleCodeChange);

        return () => {
            socket.off(ACTIONS.CODE_CHANGE, handleCodeChange);
        };
    }, [socket]);

    return (
        <div className="h-full w-full">
            <textarea
                ref={textareaRef}
                id="realtimeEditor"
                className="h-full w-full"
                style={{ height: '100%', minHeight: '100%' }}
                defaultValue={initialCode}
            />
        </div>
    );
};

export default Editor;
