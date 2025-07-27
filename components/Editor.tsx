import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import { ACTIONS } from '../Actions';

interface EditorProps {
    socketRef: React.MutableRefObject<any>;
    roomId: string;
    onCodeChange: (code: string) => void;
}

const Editor = ({ socketRef, roomId, onCodeChange }: EditorProps) => {
    const editorRef = useRef<any>(null);
    useEffect(() => {
        async function init() {
            editorRef.current = Codemirror.fromTextArea(
                document.getElementById('realtimeEditor') as HTMLTextAreaElement,
                {
                    mode: { name: 'javascript', json: true },
                    theme: 'dracula',
                    autoCloseTags: true,
                    autoCloseBrackets: true,
                    lineNumbers: true,
                }
            );

            editorRef.current.on('change', (instance: any, changes: any) => {
                const { origin } = changes;
                const code = instance.getValue();
                onCodeChange(code);
                if (origin !== 'setValue') {
                    socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                        roomId,
                        code,
                    });
                }
            });
        }
        init();
    }, []);

    useEffect(() => {
        if (socketRef.current) {
            const handler = ({ code }: { code: string }) => {
                if (code !== null && editorRef.current) {
                    editorRef.current.setValue(code);
                }
            };
            socketRef.current.on(ACTIONS.CODE_CHANGE, handler);
            return () => {
                socketRef.current.off(ACTIONS.CODE_CHANGE, handler);
            };
        }
    }, [socketRef.current]);
    return <textarea id="realtimeEditor"></textarea>;
};

export default Editor;