import React, { useEffect, useState } from 'react';
import { fetchScoreReport } from '../services/api';
import { CheckCircle, XCircle, BrainCircuit, Activity, BookOpen, AlertCircle } from 'lucide-react';

const ScoreReport = ({ sessionId, onRestart }) => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const getReport = async () => {
            try {
                const data = await fetchScoreReport(sessionId);
                setReport(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        if (sessionId) getReport();
    }, [sessionId]);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#0b0f19]">
                <div className="flex flex-col items-center">
                    <BrainCircuit size={48} className="text-blue-500 animate-pulse mb-4" />
                    <h2 className="text-xl font-bold text-gray-200">Generating Evaluation Matrix...</h2>
                    <p className="text-gray-500 mt-2">Analyzing tone, vocabulary, and technical gaps</p>
                </div>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-[#0b0f19] text-gray-200">
                <AlertCircle size={48} className="text-rose-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Report Generation Failed</h2>
                <p className="text-gray-400 mb-6">{error || 'Unknown error occurred.'}</p>
                <button onClick={onRestart} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition">Start New Interview</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0b0f19] text-gray-200 p-8 font-sans overflow-auto selection:bg-blue-500/30">
            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center justify-between bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md">
                    <div>
                        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Interview Evaluation Matrix</h1>
                        <p className="text-gray-400 mt-2 text-lg">Detailed analysis of your technical and communication performance.</p>
                    </div>
                    <div className="mt-6 md:mt-0 flex flex-col items-center">
                        <div className="text-6xl font-black text-emerald-400">{report.overallScore}<span className="text-2xl text-gray-500">/100</span></div>
                        <div className="text-sm font-bold text-gray-500 mt-1 uppercase tracking-widest">Aggregate Score</div>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl flex items-start gap-4">
                        <div className="p-3 bg-purple-500/20 rounded-xl"><Activity size={24} className="text-purple-400" /></div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Candidate Tone</h3>
                            <p className="text-xl font-semibold text-gray-100 mt-1">{report.toneLevel || 'Not Analyzed'}</p>
                        </div>
                    </div>
                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl flex items-start gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl"><BookOpen size={24} className="text-blue-400" /></div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Vocabulary Context</h3>
                            <p className="text-xl font-semibold text-gray-100 mt-1">{report.vocabularyContext || 'Not Analyzed'}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Feedback Column */}
                    <div className="space-y-6">
                        <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                            <h3 className="text-emerald-400 font-bold mb-4 flex items-center gap-2">
                                <CheckCircle size={18} /> Validated Strengths
                            </h3>
                            <ul className="space-y-2">
                                {(report.strengths || []).map((s, i) => (
                                    <li key={i} className="text-emerald-100 flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                                        <span>{s}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="p-6 bg-rose-500/5 border border-rose-500/20 rounded-2xl">
                            <h3 className="text-rose-400 font-bold mb-4 flex items-center gap-2">
                                <XCircle size={18} /> Critical Weaknesses
                            </h3>
                            <ul className="space-y-2">
                                {(report.weaknesses || []).map((w, i) => (
                                    <li key={i} className="text-rose-100 flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0" />
                                        <span>{w}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Matrix Column */}
                    <div className="space-y-6">
                        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl h-full flex flex-col">
                            <h3 className="text-blue-400 font-bold mb-4">Coverage Matrix</h3>
                            <div className="space-y-6 flex-1">
                                <div>
                                    <div className="text-sm font-semibold text-gray-400 mb-2">Evaluated Topics (Covered)</div>
                                    <div className="flex flex-wrap gap-2">
                                        {(report.testedTopics || []).map((t, i) => (
                                            <span key={i} className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-full text-xs font-medium">{t}</span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-gray-500 mb-2">Missed Topics (JD vs Transcript)</div>
                                    <div className="flex flex-wrap gap-2">
                                        {(report.notTestedTopics || []).map((t, i) => (
                                            <span key={i} className="px-3 py-1 bg-gray-800 border border-gray-700 text-gray-400 rounded-full text-xs font-medium">{t}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Box */}
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                    <h3 className="text-gray-300 font-bold mb-2">Final Summary</h3>
                    <p className="text-gray-400 leading-relaxed">{report.summary}</p>
                </div>

                <div className="flex justify-center pt-8">
                    <button onClick={onRestart} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                        Start New Interview
                    </button>
                </div>
                
            </div>
        </div>
    );
};

export default ScoreReport;
