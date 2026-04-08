import React from 'react';
import CodeEditor from './CodeEditor';
import PseudocodeWindow from './PseudocodeWindow';
import Whiteboard from './Whiteboard';
import SQLEditor from './SQLEditor';
import LivePreview from './LivePreview';
import TextPopup from './TextPopup';

const ToolManager = ({ activeTool, onSubmit, sessionId }) => {
    switch (activeTool) {
        case 'codeEditor':
            return <CodeEditor onSubmit={(data) => onSubmit('codeEditor', data)} sessionId={sessionId} />;
        case 'pseudocode':
            return <PseudocodeWindow onSubmit={(data) => onSubmit('pseudocode', data)} />;
        case 'whiteboard':
            return <Whiteboard onSubmit={(data) => onSubmit('whiteboard', data)} />;
        case 'sqlEditor':
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
