export type EditorLanguage =
    | 'javascript'
    | 'typescript'
    | 'python'
    | 'html'
    | 'css'
    | 'markdown'
    | 'sql';

export const EDITOR_LANGUAGE_OPTIONS: Array<{
    label: string;
    value: EditorLanguage;
}> = [
    { label: 'JavaScript', value: 'javascript' },
    { label: 'TypeScript', value: 'typescript' },
    { label: 'Python', value: 'python' },
    { label: 'HTML', value: 'html' },
    { label: 'CSS', value: 'css' },
    { label: 'Markdown', value: 'markdown' },
    { label: 'SQL', value: 'sql' },
];
