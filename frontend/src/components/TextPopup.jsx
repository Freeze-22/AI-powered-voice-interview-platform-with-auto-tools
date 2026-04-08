import React, { useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';

const TextPopup = ({ onSubmit }) => {
    const [text, setText] = useState('');

    return (
        <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="w-full max-w-xl bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="bg-gray-800 p-4 border-b border-gray-700 flex items-center gap-2">
                    <MessageSquare size={18} className="text-purple-400" />
                    <span className="font-bold text-gray-200">Clarification Prompt</span>
                </div>
                <div className="p-6">
                    <textarea 
                        autoFocus
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-gray-100 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none h-32"
                        placeholder="Type your brief response here..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                    <div className="mt-4 flex justify-end">
                        <button 
                            onClick={() => onSubmit({ text })}
                            disabled={!text.trim()}
                            className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 text-white rounded-lg font-bold transition"
                        >
                            <Send size={16} /> Send Clarification
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TextPopup;
