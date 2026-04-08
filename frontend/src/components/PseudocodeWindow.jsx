import React, { useState } from 'react';
import { Send } from 'lucide-react';

const PseudocodeWindow = ({ onSubmit }) => {
    const [code, setCode] = useState('');

    return (
        <div className="flex-1 flex flex-col p-6 bg-gray-950 text-gray-200">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span> Approach & Pseudocode
                </h3>
            </div>
            
            <textarea 
                className="flex-1 bg-gray-900 border border-gray-700 rounded-xl p-4 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none shadow-inner"
                placeholder="// Outline your approach here before coding..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
            />
            
            <div className="mt-4 flex justify-end">
                <button 
                    onClick={() => onSubmit({ text: code })}
                    disabled={!code.trim()}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white rounded-xl font-bold transition shadow-lg"
                >
                    <Send size={18} /> Submit Outline
                </button>
            </div>
        </div>
    );
};

export default PseudocodeWindow;
