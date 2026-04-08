import React, { useState } from 'react';
import { Send, Eye, Code } from 'lucide-react';

const LivePreview = ({ onSubmit }) => {
    const [html, setHtml] = useState('<div class="box">Dynamic UI</div>');
    const [css, setCss] = useState('.box {\n  color: white;\n  background: blue;\n  padding: 20px;\n  border-radius: 8px;\n  text-align: center;\n}');

    return (
        <div className="flex-1 flex flex-col p-4 bg-gray-950 text-gray-200 h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                    <Eye size={20} className="text-pink-500" /> UI Architecture
                </h3>
                <button 
                    onClick={() => onSubmit({ html, css })}
                    className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-bold transition text-sm shadow-lg shadow-pink-500/20"
                >
                    <Send size={16} /> Submit Implementation
                </button>
            </div>
            
            <div className="flex-1 flex gap-4 overflow-hidden">
                <div className="w-1/2 flex flex-col gap-4">
                    <div className="flex-1 flex flex-col">
                        <span className="text-xs font-semibold text-gray-400 mb-2 uppercase flex items-center gap-1"><Code size={12}/> HTML</span>
                        <textarea className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-4 font-mono text-sm focus:outline-none resize-none" value={html} onChange={e => setHtml(e.target.value)} />
                    </div>
                    <div className="flex-1 flex flex-col">
                        <span className="text-xs font-semibold text-gray-400 mb-2 uppercase flex items-center gap-1"><Code size={12}/> CSS</span>
                        <textarea className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-4 font-mono text-sm focus:outline-none resize-none" value={css} onChange={e => setCss(e.target.value)} />
                    </div>
                </div>
                
                <div className="w-1/2 bg-white rounded-xl overflow-hidden border-2 border-gray-700 relative">
                    <iframe 
                        title="preview"
                        sandbox="allow-scripts"
                        className="w-full h-full border-none"
                        srcDoc={`
                            <!DOCTYPE html>
                            <html>
                            <head><style>${css}</style></head>
                            <body>${html}</body>
                            </html>
                        `}
                    />
                </div>
            </div>
        </div>
    );
};

export default LivePreview;
