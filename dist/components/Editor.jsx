"use client";
import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
const { ACTIONS } = require('../Actions');
const Editor = ({ socket, roomId, initialCode, onCodeChange, onReady }) => {
    const editorRef = useRef(null);
    const textareaRef = useRef(null);
    const socketRef = useRef(socket);
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
        var _a;
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
            var _a;
            const code = editor.getValue();
            onCodeChangeRef.current(code);
            if (changes.origin !== 'setValue') {
                (_a = socketRef.current) === null || _a === void 0 ? void 0 : _a.emit(ACTIONS.CODE_CHANGE, {
                    roomId,
                    code,
                });
            }
        });
        editorRef.current = instance;
        (_a = onReadyRef.current) === null || _a === void 0 ? void 0 : _a.call(onReadyRef);
        return () => {
            var _a;
            (_a = editorRef.current) === null || _a === void 0 ? void 0 : _a.toTextArea();
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
        const handleCodeChange = ({ code }) => {
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
    return (<div className="h-full w-full">
            <textarea ref={textareaRef} id="realtimeEditor" className="h-full w-full" style={{ height: '100%', minHeight: '100%' }} defaultValue={initialCode}/>
        </div>);
};
export default Editor;
