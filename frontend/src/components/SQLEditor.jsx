import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Send, Database, BarChart2, Table as TableIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const SQLEditor = ({ onSubmit, sessionId }) => {
    const [code, setCode] = useState('-- Write your SQL query here\nSELECT name, score FROM user_metrics ORDER BY score DESC LIMIT 5;');
    const [results, setResults] = useState(null);
    const [running, setRunning] = useState(false);
    const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'chart'

    const handleRun = () => {
        setRunning(true);
        // Mocking an execution layer for SQL 
        setTimeout(() => {
            setResults({
                columns: ['name', 'metric_score'],
                rows: [
                    ['Alice Smith', 95],
                    ['Bob Johnson', 82],
                    ['Charlie Davis', 74],
                    ['Diana Prince', 88],
                    ['Evan Wright', 61]
                ],
                chartData: [
                    { name: 'Alice', value: 95 },
                    { name: 'Bob', value: 82 },
                    { name: 'Charlie', value: 74 },
                    { name: 'Diana', value: 88 },
                    { name: 'Evan', value: 61 }
                ]
            });
            setRunning(false);
            setActiveTab('chart'); // Auto-switch to chart for impact
        }, 1200);
    };

    return (
        <div className="flex-1 flex flex-col p-4 bg-gray-950 font-sans">
            <div className="flex items-center justify-between mb-4 mt-2">
                <h3 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                    <Database size={20} className="text-emerald-500" /> SQL Data Analysis
                </h3>
                <div className="flex gap-4">
                    <button 
                        onClick={handleRun}
                        disabled={running}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-emerald-400 rounded-lg font-bold border border-emerald-900 transition"
                    >
                        <Play size={16} /> {running ? 'Executing...' : 'Run Query'}
                    </button>
                    <button 
                        onClick={() => onSubmit({ code, latestResults: results })}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition shadow-lg shadow-emerald-600/20"
                    >
                        <Send size={16} /> Submit Query
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-4">
                <div className="h-2/3 border border-gray-800 rounded-xl overflow-hidden">
                    <Editor
                        height="100%"
                        language="sql"
                        theme="vs-dark"
                        value={code}
                        onChange={(value) => setCode(value)}
                        options={{ minimap: { enabled: false }, fontSize: 14 }}
                    />
                </div>
                
                <div className="h-1/3 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
                    <div className="bg-gray-800 p-2 border-b border-gray-700 flex gap-2">
                        <button 
                            onClick={() => setActiveTab('grid')} 
                            className={`flex items-center gap-1 text-xs font-bold uppercase px-3 py-1.5 rounded transition ${activeTab === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'}`}
                        >
                            <TableIcon size={14} /> Data Grid
                        </button>
                        <button 
                            onClick={() => setActiveTab('chart')} 
                            className={`flex items-center gap-1 text-xs font-bold uppercase px-3 py-1.5 rounded transition ${activeTab === 'chart' ? 'bg-emerald-600/20 text-emerald-400' : 'text-gray-400 hover:text-emerald-400/80 hover:bg-emerald-900/20'}`}
                        >
                            <BarChart2 size={14} /> Visualization
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-auto p-4">
                        {!results ? (
                            <div className="h-full flex items-center justify-center text-gray-600 italic">
                                Execute query to view output...
                            </div>
                        ) : activeTab === 'grid' ? (
                            <table className="w-full text-left border-collapse text-sm text-gray-300">
                                <thead>
                                    <tr>
                                        {results.columns.map(col => (
                                            <th key={col} className="p-2 border-b border-gray-700 bg-gray-800/50 font-semibold">{col}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.rows.map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-800/30 transition">
                                            {row.map((cell, j) => (
                                                <td key={j} className="p-2 border-b border-gray-800/50">{cell}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="h-full w-full pt-4 pr-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={results.chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                        <XAxis dataKey="name" stroke="#9CA3AF" tick={{fill: '#9CA3AF', fontSize: 12}} />
                                        <YAxis stroke="#9CA3AF" tick={{fill: '#9CA3AF', fontSize: 12}} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                                            itemStyle={{ color: '#34D399' }}
                                        />
                                        <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SQLEditor;
