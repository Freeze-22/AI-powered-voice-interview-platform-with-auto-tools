import React, { useState, useEffect } from 'react';
import { startInterview, submitAnswer, getStatus } from '../services/api';

// Components (To be created in the next steps)
import StageIndicator from '../components/StageIndicator';
import ChatPanel from '../components/ChatPanel';
import CodeEditor from '../components/CodeEditor';
import ResumeUpload from '../components/ResumeUpload';

const Interview = () => {
    // Required states
    const [showUpload, setShowUpload] = useState(!localStorage.getItem('interviewSessionId'));
    const [stage, setStage] = useState('problem');
    const [question, setQuestion] = useState('');
    const [feedback, setFeedback] = useState('');
    const [sessionId, setSessionId] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Additional state for text user input
    const [answerInput, setAnswerInput] = useState('');

    useEffect(() => {
        const initSession = async () => {
            try {
                console.log('[Interview.jsx] Integration point: Loading session on mount');
                const storedSessionId = localStorage.getItem('interviewSessionId');
                
                if (storedSessionId) {
                    setSessionId(storedSessionId);
                    const status = await getStatus(storedSessionId);
                    if (status) {
                        setStage(status.stage || 'problem');
                        setQuestion(status.currentQuestion || '');
                        setFeedback(status.currentFeedback || '');
                    }
                    setShowUpload(false);
                }
            } catch (error) {
                console.error('[Interview.jsx] Error initializing session:', error.message);
                // Graceful rollback in case backend restarted destroying memory caches
                localStorage.removeItem('interviewSessionId');
                setSessionId(null);
                setShowUpload(true);
                setLoading(false);
            }
        };

        if (!showUpload) {
             initSession();
        }
    }, [showUpload]);

    const handleStartInterview = async (resumeText, jobDescription) => {
        try {
            console.log('[Interview.jsx] User submitted resume');
            const result = await startInterview(resumeText, jobDescription);
            setSessionId(result.sessionId);
            setStage(result.stage);
            setQuestion(result.question || '');
            setShowUpload(false);
        } catch (error) {
            console.error('[Interview.jsx] Error submitting resume/jd:', error.message);
        }
    };

    if (showUpload) {
        return <ResumeUpload onStart={handleStartInterview} />
    }

    const handleSubmit = async (answer) => {
        try {
            console.log(`[Interview.jsx] Integration point: handleSubmit for stage: ${stage}`);
            setLoading(true);
            const result = await submitAnswer(sessionId, answer);
            setStage(result.stage);
            setQuestion(result.question || '');
            setFeedback(result.feedback || '');
            setAnswerInput('');
            setLoading(false);
        } catch (error) {
            console.error('[Interview.jsx] Error submitting answer:', error.message);
            setLoading(false);
        }
    };

    const renderStageContent = () => {
        switch (stage) {
            case 'problem':
                return (
                    <div className="flex-1 p-6 bg-white rounded-lg shadow-sm">
                        <h2 className="text-2xl font-bold mb-4">Problem Statement</h2>
                        <div className="mb-6 whitespace-pre-wrap">{question || 'Loading problem...'}</div>
                        <textarea 
                            className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500"
                            rows="4"
                            placeholder="Type your understanding of the problem here..."
                            value={answerInput}
                            onChange={(e) => setAnswerInput(e.target.value)}
                        />
                    </div>
                );
            case 'clarification':
                return (
                    <div className="flex-1 p-6 bg-white rounded-lg shadow-sm">
                        <h2 className="text-2xl font-bold mb-4">Clarification phase</h2>
                        <div className="mb-6">{feedback || 'Review the problem details and ask clarifying questions.'}</div>
                        <textarea 
                            className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500"
                            rows="3"
                            placeholder="Ask clarifying questions..."
                            value={answerInput}
                            onChange={(e) => setAnswerInput(e.target.value)}
                        />
                    </div>
                );
            case 'approach':
                return (
                    <div className="flex-1 p-6 bg-white rounded-lg shadow-sm">
                        <h2 className="text-2xl font-bold mb-4">Determine Approach</h2>
                        <div className="mb-6 text-gray-700">{question || 'Describe your intended approach.'}</div>
                        <textarea 
                            className="w-full p-3 border rounded font-sans focus:ring-2 focus:ring-blue-500"
                            rows="6"
                            placeholder="Explain the time/space complexity and algorithms you plan to use..."
                            value={answerInput}
                            onChange={(e) => setAnswerInput(e.target.value)}
                        />
                    </div>
                );
            case 'pseudocode':
                return (
                    <div className="flex-1 p-6 bg-white rounded-lg shadow-sm">
                        <h2 className="text-2xl font-bold mb-4">Write Pseudocode</h2>
                        <textarea 
                            className="w-full p-3 border rounded font-mono bg-gray-50 focus:ring-2 focus:ring-blue-500"
                            rows="10"
                            placeholder="Write out high-level pseudocode logic here..."
                            value={answerInput}
                            onChange={(e) => setAnswerInput(e.target.value)}
                        />
                    </div>
                );
            case 'coding':
                return (
                    <div className="flex-1 flex flex-col p-6 bg-white rounded-lg shadow-sm">
                        <h2 className="text-2xl font-bold mb-4">Coding</h2>
                        {/* Note: Submit/Run button is handled natively within CodeEditor based on instructions */}
                        <div className="flex-1">
                            <CodeEditor sessionId={sessionId} onStageChange={setStage} />
                        </div>
                    </div>
                );
            case 'debugging':
                return (
                    <div className="flex-1 flex flex-col p-6 bg-white rounded-lg shadow-sm">
                        <h2 className="text-2xl font-bold mb-4">Debugging</h2>
                        <div className="bg-red-50 text-red-700 p-4 mb-4 rounded border border-red-200">
                            <strong>Execution Error:</strong> {feedback || 'Review your logic for faults.'}
                        </div>
                        <div className="mb-4 bg-yellow-50 text-yellow-700 p-4 rounded border border-yellow-200">
                            <strong>Hint:</strong> {question || 'Find the bug.'}
                        </div>
                        <div className="flex-1">
                            <CodeEditor sessionId={sessionId} onStageChange={setStage} />
                        </div>
                    </div>
                );
            case 'evaluation':
                return (
                    <div className="flex-1 p-6 bg-white rounded-lg shadow-sm">
                        <h2 className="text-2xl font-bold mb-4">Final Evaluation</h2>
                        <div className="prose max-w-none mb-6">
                            {feedback || 'Tallying scores and preparing feedback report...'}
                        </div>
                        <button className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">
                            Download Report
                        </button>
                    </div>
                );
            default:
                return <div className="flex-1 p-6">Loading Interview environment...</div>;
        }
    };

    return (
        <div className="h-screen w-full bg-gray-100 flex flex-col overflow-hidden text-gray-900">
            {/* Top Indicator */}
            <StageIndicator currentStage={stage} />

            {/* Main Area */}
            <div className="flex-1 flex gap-4 p-4 overflow-hidden">
                {/* Left panel for dynamic stage content */}
                <div className="flex-1 flex flex-col overflow-y-auto">
                    {renderStageContent()}

                    {/* Standard Submit Button outside coding/debugging/evaluation stages */}
                    {['problem', 'clarification', 'approach', 'pseudocode'].includes(stage) && (
                        <div className="flex justify-end mt-4">
                            <button 
                                onClick={() => handleSubmit(answerInput)}
                                disabled={loading || !answerInput.trim()}
                                className={`px-8 py-3 rounded text-white font-bold shadow transition-colors ${loading || !answerInput.trim() ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {loading ? 'Submitting...' : 'Submit'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Panel for continual Chat interface */}
                <div className="w-80 flex-shrink-0 bg-white rounded-lg shadow-sm">
                    <ChatPanel sessionId={sessionId} stage={stage} />
                </div>
            </div>
        </div>
    );
};

export default Interview;
