import React from 'react';
import { Mic, Loader, Volume2, AlertCircle } from 'lucide-react';

const VoiceStatus = ({ status }) => {
    // status can be: 'listening', 'thinking', 'speaking', 'error', 'waiting'
    
    let config = {
        label: 'Ready',
        icon: <Mic size={24} className="text-gray-400" />,
        colors: 'from-gray-500/20 to-gray-600/20 border-gray-600/30',
        animation: ''
    };

    if (status === 'listening') {
        config = {
            label: 'Listening...',
            icon: <Mic size={24} className="text-emerald-400 animate-pulse" />,
            colors: 'from-emerald-500/20 to-teal-600/20 border-emerald-500/50',
            animation: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]'
        };
    } else if (status === 'thinking') {
        config = {
            label: 'AI is thinking...',
            icon: <Loader size={24} className="text-blue-400 animate-spin" />,
            colors: 'from-blue-500/20 to-indigo-600/20 border-blue-500/50',
            animation: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]'
        };
    } else if (status === 'speaking') {
        config = {
            label: 'Speaking...',
            icon: <Volume2 size={24} className="text-purple-400 animate-bounce" />,
            colors: 'from-purple-500/20 to-fuchsia-600/20 border-purple-500/50',
            animation: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]'
        };
    } else if (status === 'error') {
        config = {
            label: 'Error. Please retry.',
            icon: <AlertCircle size={24} className="text-red-400" />,
            colors: 'from-red-500/20 to-rose-600/20 border-red-500/50',
            animation: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]'
        };
    }
    
    return (
        <div className={`flex flex-col items-center justify-center p-8 rounded-3xl border bg-gradient-to-br backdrop-blur-md transition-all duration-500 ${config.colors} ${config.animation}`}>
            <div className={`p-4 rounded-full bg-gray-900/50 mb-4 backdrop-blur-sm`}>
                {config.icon}
            </div>
            
            {status === 'listening' && (
                <div className="flex gap-1.5 mb-3">
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className="w-1.5 bg-emerald-400 rounded-full animate-pulse" style={{ height: `${16 + Math.random() * 16}px`, animationDelay: `${i * 0.15}s`}} />
                    ))}
                </div>
            )}
            
            {status === 'speaking' && (
                <div className="flex gap-1.5 mb-3">
                    {[0, 1, 2, 3, 4].map(i => (
                        <div key={i} className="w-1.5 bg-purple-400 rounded-full animate-bounce" style={{ height: `${12 + Math.random() * 20}px`, animationDelay: `${i * 0.1}s`}} />
                    ))}
                </div>
            )}
            
            <h3 className="text-lg font-medium text-gray-100 tracking-wide">{config.label}</h3>
        </div>
    );
};

export default VoiceStatus;
