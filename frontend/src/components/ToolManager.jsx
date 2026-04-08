import React from 'react';
import CodeEditor from './CodeEditor';
import PseudocodeWindow from './PseudocodeWindow';
import Whiteboard from './Whiteboard';
import SQLEditor from './SQLEditor';
import LivePreview from './LivePreview';
import TextPopup from './TextPopup';

const ToolManager = ({ activeTool, onSubmit, sessionId }) => {
    switch (activeTool) {
        // All possible variants the AI might return for code editor
        case 'code_editor':
        case 'codeEditor':
        case 'CODE_EDITOR':
            return <CodeEditor onSubmit={(data) => onSubmit('code_editor', data)} sessionId={sessionId} />;
        case 'pseudocode':
            return <PseudocodeWindow onSubmit={(data) => onSubmit('pseudocode', data)} />;
        // All variants for whiteboard
        case 'whiteboard':
        case 'WHITEBOARD':
        case 'white_board':
            return <Whiteboard onSubmit={(data) => onSubmit('whiteboard', data)} />;
        // All variants for SQL
        case 'sqlEditor':
        case 'sql_editor':
        case 'SQL_EDITOR':
            return <SQLEditor onSubmit={(data) => onSubmit('sqlEditor', data)} sessionId={sessionId} />;
        case 'livePreview':
            return <LivePreview onSubmit={(data) => onSubmit('livePreview', data)} />;
        case 'textPopup':
            return <TextPopup onSubmit={(data) => onSubmit('textPopup', data)} />;
        default:
            return null;
    }
};

export default ToolManager;
