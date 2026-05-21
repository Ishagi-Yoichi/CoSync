"use client";

import React, { useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/selection/active-line';
import 'codemirror/mode/clike/clike';
import 'codemirror/mode/css/css';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/markdown/markdown';
import 'codemirror/mode/python/python';
import 'codemirror/mode/sql/sql';
import type { EditorLanguage } from '../lib/editor-options';

const { ACTIONS } = require('../Actions');

interface EditorProps {
    socket: Socket | null;
    roomId: string;
    initialCode: string;
    language: EditorLanguage;
    zoomLevel: number;
    onCodeChange: (code: string) => void;
    onReady?: () => void;
}

const editorModeByLanguage: Record<EditorLanguage, string> = {
    javascript: 'javascript',
    typescript: 'text/typescript',
    python: 'python',
    html: 'htmlmixed',
    css: 'css',
    markdown: 'markdown',
    sql: 'sql',
};

const Editor = ({
    socket,
    roomId,
    initialCode,
    language,
    zoomLevel,
    onCodeChange,
    onReady,
}: EditorProps) => {
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
    }, [initialCode, onCodeChange, onReady]);

    useEffect(() => {
        if (!textareaRef.current || editorRef.current) {
            return;
        }

        const instance = Codemirror.fromTextArea(textareaRef.current, {
            mode: editorModeByLanguage[language],
            theme: 'dracula',
            autoCloseTags: true,
            autoCloseBrackets: true,
            lineNumbers: true,
            styleActiveLine: true,
            lineWrapping: true,
            indentUnit: 2,
            tabSize: 2,
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
    }, [language, roomId]);

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) {
            return;
        }

        editor.setOption('mode', editorModeByLanguage[language]);
    }, [language]);

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) {
            return;
        }

        const wrapper = editor.getWrapperElement();
        wrapper.style.fontSize = `${zoomLevel}%`;
        editor.refresh();
    }, [zoomLevel]);

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
