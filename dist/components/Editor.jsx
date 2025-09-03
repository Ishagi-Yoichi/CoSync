"use client";
import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
const { ACTIONS } = require('../Actions');
const Editor = ({ socketRef, roomId, onCodeChange }) => {
    var _a;
    const editorRef = useRef(null);
    const isInitialized = useRef(false);
    useEffect(() => {
        if (isInitialized.current)
            return;
        async function init() {
            const textareaElement = document.getElementById('realtimeEditor');
            if (!textareaElement)
                return;
            editorRef.current = Codemirror.fromTextArea(textareaElement, {
                mode: { name: 'javascript', json: true },
                theme: 'dracula',
                autoCloseTags: true,
                autoCloseBrackets: true,
                lineNumbers: true,
            });
            editorRef.current.on('change', (instance, changes) => {
                var _a;
                const { origin } = changes;
                const code = instance.getValue();
                onCodeChange(code);
                if (origin !== 'setValue') {
                    (_a = socketRef.current) === null || _a === void 0 ? void 0 : _a.emit(ACTIONS.CODE_CHANGE, {
                        roomId,
                        code,
                    });
                }
            });
            isInitialized.current = true;
        }
        init();
        return () => {
            if (editorRef.current) {
                editorRef.current.toTextArea();
                editorRef.current = null;
                isInitialized.current = false;
            }
        };
    }, [roomId, onCodeChange]);
    useEffect(() => {
        if (socketRef.current) {
            const handler = ({ code }) => {
                if (code !== null && editorRef.current) {
                    editorRef.current.setValue(code);
                }
            };
            socketRef.current.on(ACTIONS.CODE_CHANGE, handler);
            return () => {
                var _a;
                (_a = socketRef.current) === null || _a === void 0 ? void 0 : _a.off(ACTIONS.CODE_CHANGE, handler);
            };
        }
    }, [(_a = socketRef.current) === null || _a === void 0 ? void 0 : _a.connected]);
    return (<div className="h-full w-full">
            <textarea id="realtimeEditor" className="h-full w-full" style={{ height: '100%', minHeight: '100%' }}></textarea>
        </div>);
};
export default Editor;
