import React, { useState } from 'react';

const ChatPanel = ({ sessionId, stage }) => {
    const [messages, setMessages] = useState([
        { sender: 'AI', text: 'Hello! I am your AI Interviewer. Feel free to use this chat during the interview if you need help or guidance.' }
    ]);
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages([...messages, { sender: 'You', text: input }, { sender: 'AI', text: "Chat functionality is currently locally mocked." }]);
        setInput('');
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-3 bg-blue-600 text-white font-bold rounded-t-lg">
                Interviewer Assistant Chat
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {messages.map((msg, i) => (
                    <div key={i} className={`p-2 rounded max-w-[85%] text-sm ${msg.sender === 'AI' ? 'bg-gray-100 self-start border border-gray-300' : 'bg-blue-100 text-blue-900 self-end border border-blue-200'}`}>
                        <div className="font-bold text-xs opacity-75 mb-1">{msg.sender}</div>
                        <div>{msg.text}</div>
                    </div>
                ))}
            </div>
            <div className="p-3 border-t border-gray-200 flex gap-2">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Message AI..."
                    className="flex-1 text-sm border rounded p-2 focus:ring-1 focus:ring-blue-500 outline-none"
                    disabled={!sessionId}
                />
                <button 
                    onClick={handleSend}
                    disabled={!sessionId}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-bold transition-colors disabled:bg-blue-300"
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default ChatPanel;
