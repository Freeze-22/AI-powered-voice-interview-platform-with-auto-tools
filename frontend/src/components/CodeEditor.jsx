import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { executeCode } from '../services/api';
import { Terminal, Play, Send } from 'lucide-react';

const CodeEditor = ({ onSubmit, sessionId }) => {
    const [code, setCode] = useState('def solution():\n    # Write your solution here\n    pass');
    const [language, setLanguage] = useState('python');
    const [output, setOutput] = useState('');
    const [running, setRunning] = useState(false);

    const handleRunCode = async () => {
        setRunning(true);
        setOutput('Executing code...');
        try {
            const result = await executeCode(sessionId, code, language);
            if (result.error) {
                setOutput(`Error:\n${result.error}`);
            } else {
                setOutput(result.output || 'No output.');
            }
        } catch (err) {
            setOutput(`Execution Failed: ${err.message}`);
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col p-4 bg-gray-950 rounded-xl overflow-hidden shadow-2xl m-2 border border-gray-800">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <Terminal className="text-blue-500" size={20} />
                    <select 
                        value={language} 
                        onChange={(e) => setLanguage(e.target.value)}
                        className="bg-gray-800 text-gray-200 text-sm rounded-lg px-3 py-1 border border-gray-700 focus:outline-none focus:border-blue-500"
                    >
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                        <option value="java">Java</option>
                    </select>
                </div>
                
                <div className="flex gap-4">
                    <button 
                        onClick={handleRunCode}
                        disabled={running}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-blue-400 rounded-lg font-bold border border-blue-900 transition text-sm"
                    >
                        <Play size={16} /> {running ? 'Running...' : 'Run Code'}
                    </button>
                    <button 
                        onClick={() => onSubmit({ code, language, recentOutput: output })}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition shadow-lg shadow-blue-500/20 text-sm"
                    >
                        <Send size={16} /> Submit Solution
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-2">
                <div className="flex-1 border border-gray-800 rounded-xl overflow-hidden">
                    <Editor
                        height="100%"
                        language={language}
                        theme="vs-dark"
                        value={code}
                        onChange={(value) => setCode(value)}
                        options={{ minimap: { enabled: false }, fontSize: 14 }}
                    />
                </div>
                
                <div className="h-48 bg-black rounded-xl p-4 font-mono text-sm overflow-auto text-gray-300 border border-gray-800 shadow-inner">
                    <div className="text-gray-500 mb-2 border-b border-gray-800 pb-1 text-xs">Terminal Output</div>
                    <pre className="whitespace-pre-wrap font-mono">{output}</pre>
                </div>
            </div>
        </div>
    );
};

export default CodeEditor;
