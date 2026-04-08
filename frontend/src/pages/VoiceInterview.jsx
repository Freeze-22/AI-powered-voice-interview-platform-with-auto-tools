import React, { useState, useEffect, useRef } from 'react';
import { Send, TerminalSquare, AlertCircle } from 'lucide-react';
import { startVoiceInterview, talkToAI, submitToolData } from '../services/api';
import ToolManager from '../components/ToolManager';
import VoiceStatus from '../components/VoiceStatus';

const VoiceInterview = ({ params, onExit, onFinish }) => {
    const [activeTool, setActiveTool] = useState(null);
    const [status, setStatus] = useState('waiting');
    const [transcript, setTranscript] = useState('');
    const [conversation, setConversation] = useState([]);
    const [interviewerName, setInterviewerName] = useState('AI');
    const [textInput, setTextInput] = useState('');
    const [errorMsg, setErrorMsg] = useState(null);

    const sessionIdRef = useRef(null);
    const recognitionRef = useRef(null);
    const silenceTimerRef = useRef(null);
    const finalTranscriptRef = useRef('');
    const mountedRef = useRef(true);
    mountedRef.current = true; // FIX: React 18 StrictMode closure persistence
    const chosenVoiceRef = useRef(null);
    const recognitionActiveRef = useRef(false);

    const fullCleanup = () => {
        mountedRef.current = false;
        clearTimeout(silenceTimerRef.current);
        try { recognitionRef.current?.stop(); } catch (e) {}
        try { window.speechSynthesis?.cancel(); } catch (e) {}
    };

    const pickVoice = () => {
        const synth = window.speechSynthesis;
        if (!synth) return;
        const voices = synth.getVoices();
        if (voices.length === 0) return;

        const englishVoices = voices.filter(v => v.lang.startsWith('en'));
        const pool = englishVoices.length > 0 ? englishVoices : voices;

        const femaleKeywords = ['female', 'zira', 'samantha', 'victoria', 'karen', 'moira', 'tessa', 'fiona', 'google uk english female'];
        
        const femaleVoice = pool.find(v => femaleKeywords.some(k => v.name.toLowerCase().includes(k)));
        if (femaleVoice) {
            chosenVoiceRef.current = femaleVoice;
            setInterviewerName('Triveni');
            return;
        }
        
        chosenVoiceRef.current = pool[0];
        setInterviewerName(pool[0].name.toLowerCase().includes('male') ? 'Bholu' : 'Triveni');
    };

    const speakText = (text) => {
        if (!text || !mountedRef.current) return;
        const synth = window.speechSynthesis;
        
        let ended = false;
        const onDone = () => {
            if (ended || !mountedRef.current) return;
            ended = true;
            setStatus('waiting');
            setTimeout(() => { if (mountedRef.current) startListening(); }, 400);
        };

        const voices = synth?.getVoices() || [];
        
        // Timeout guarantee
        const estimatedMs = Math.max(text.length * 70, 2000) + 3000;
        const safetyOverride = setTimeout(onDone, estimatedMs);
        
        setStatus('speaking');

        if (!synth || voices.length === 0) {
            console.log('[Voice] Using Network TTS Fallback (MP3 Stream)');
            const audio = new Audio(`https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`);
            audio.onended = () => { clearTimeout(safetyOverride); onDone(); };
            audio.onerror = () => { clearTimeout(safetyOverride); onDone(); };
            audio.play().catch(() => { clearTimeout(safetyOverride); onDone(); });
            return;
        }

        synth.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.lang = 'en-US';

        if (chosenVoiceRef.current) {
            utterance.voice = chosenVoiceRef.current;
        }

        utterance.onend = () => { clearTimeout(safetyOverride); onDone(); };
        utterance.onerror = () => { clearTimeout(safetyOverride); onDone(); };

        try {
            synth.speak(utterance);
        } catch (e) {
            clearTimeout(safetyOverride);
            onDone();
        }
    };

    const startListening = () => {
        if (!mountedRef.current) return;
        if (recognitionActiveRef.current) return;
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition || !recognitionRef.current) {
            setStatus('waiting'); // Fully fallback to text
            return;
        }

        finalTranscriptRef.current = '';
        setTranscript('');

        try {
            recognitionRef.current.start();
            recognitionActiveRef.current = true;
            setStatus('listening');
        } catch (e) {
            recognitionActiveRef.current = false;
            setStatus('waiting'); // text mode fallback
        }
    };

    const sendToAI = async (text) => {
        if (!text?.trim() || !sessionIdRef.current) return;

        clearTimeout(silenceTimerRef.current);
        try { recognitionRef.current?.stop(); } catch (e) {}
        recognitionActiveRef.current = false;

        setStatus('thinking');
        setConversation(prev => [...prev, { speaker: 'You', text: text.trim() }]);
        setTranscript('');
        finalTranscriptRef.current = '';

        try {
            const result = await talkToAI(sessionIdRef.current, text.trim());
            if (!mountedRef.current) return;

            if (result.isComplete) {
                speakText('Interview complete. Generating your score report.');
                setTimeout(() => {
                    if (onFinish) onFinish(sessionIdRef.current);
                }, 4000);
                return;
            }

            if (result.activeTool) setActiveTool(result.activeTool);
            setConversation(prev => [...prev, { speaker: interviewerName, text: result.speech }]);
            setTimeout(() => speakText(result.speech), 100);
        } catch (error) {
            if (!mountedRef.current) return;
            setStatus('error');
            setErrorMsg('API Error: ' + error.message);
            setTimeout(() => speakText('Sorry, I had an error processing that.'), 100);
        }
    };

    const sendToAIRef = useRef(sendToAI);
    sendToAIRef.current = sendToAI;

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setErrorMsg('Voice not supported. Switched to Text Mode.');
            setStatus('waiting');
            return;
        }

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                stream.getTracks().forEach(t => t.stop());
                setErrorMsg(null);
            })
            .catch(() => {
                setErrorMsg('Microphone access denied.');
                setStatus('error');
            });

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            let interim = '';
            let final = '';
            for (let i = 0; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript + ' ';
                } else {
                    interim += event.results[i][0].transcript;
                }
            }
            finalTranscriptRef.current = final.trim();
            setTranscript(final + interim);

            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
                const textToSend = finalTranscriptRef.current;
                if (textToSend) sendToAIRef.current(textToSend);
            }, 2500);
        };

        recognition.onstart = () => { recognitionActiveRef.current = true; };
        recognition.onend = () => { recognitionActiveRef.current = false; };
        recognition.onerror = (event) => {
            recognitionActiveRef.current = false;
            if (event.error !== 'no-speech') console.warn('[Recognition] error:', event.error);
        };

        recognitionRef.current = recognition;

        pickVoice();
        window.speechSynthesis?.addEventListener('voiceschanged', pickVoice);

        return () => {
            fullCleanup();
            window.speechSynthesis?.removeEventListener('voiceschanged', pickVoice);
        };
    }, []);

    const initRequestedRef = useRef(false);
    useEffect(() => {
        if (!params || initRequestedRef.current) return;
        initRequestedRef.current = true;

        const init = async () => {
            try {
                setStatus('thinking');
                const result = await startVoiceInterview(
                    params.resumeText || 'No resume provided',
                    params.jobDescription || 'General technical interview',
                    params.interviewType || 'Technical Coding',
                    interviewerName
                );
                
                if (!result.sessionId) throw new Error('No Session ID returned');

                sessionIdRef.current = result.sessionId;
                setActiveTool(result.activeTool);
                setConversation([{ speaker: interviewerName, text: result.speech }]);
                
                setTimeout(() => speakText(result.speech), 100);
            } catch (error) {
                setStatus('error');
                setErrorMsg(error.message);
            }
        };
        init();
    }, [params]);

    const handleToolSubmit = async (toolType, data) => {
        setStatus('thinking');
        try {
            const result = await submitToolData(sessionIdRef.current, toolType, data);
            setActiveTool(null);
            setConversation(prev => [...prev, { speaker: 'You', text: `[Submitted ${toolType}]` }]);
            setConversation(prev => [...prev, { speaker: interviewerName, text: result.speech }]);
            speakText(result.speech);
        } catch (error) {
            speakText('Tool submission failed. Moving on.');
            startListening();
        }
    };

    return (
        <div className="h-screen flex flex-col bg-[#0b0f19] text-gray-100 overflow-hidden font-sans selection:bg-blue-500/30">
            {/* Minimal Header */}
            <div className="h-14 flex items-center justify-between px-6 bg-white/5 backdrop-blur-md border-b border-white/10 z-10 box-border">
                <div className="flex items-center gap-3">
                    <TerminalSquare size={20} className="text-blue-400" />
                    <span className="font-semibold tracking-wide">Voice Interview Platform</span>
                </div>
                <button
                    onClick={() => { fullCleanup(); onExit(); }}
                    className="px-4 py-1.5 text-sm bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
                >
                    Exit Interview
                </button>
            </div>

            {/* Layout: Three Panels or Two depending on Tool */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* Panel 1: Voice Status (Left/Top) */}
                <div className={`flex flex-col items-center justify-center p-8 bg-black/20 ${activeTool ? 'w-1/4 min-w-[300px]' : 'flex-1'} border-r border-white/5 transition-all duration-500`}>
                    <VoiceStatus status={status} />
                    
                    {errorMsg && (
                        <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm max-w-xs text-center">
                            <AlertCircle size={16} className="inline mr-2 -mt-0.5" />
                            {errorMsg}
                        </div>
                    )}

                    {!errorMsg && (
                        <p className="mt-8 text-sm text-gray-400 text-center max-w-xs leading-relaxed">
                            {status === 'speaking' ? `Wait for ${interviewerName} to finish.` :
                             status === 'listening' ? 'Speak naturally. A 2.5s pause sends your answer.' :
                             'The conversation flows automatically.'}
                        </p>
                    )}

                    {transcript && status === 'listening' && (
                        <div className="mt-8 w-full max-w-xs p-4 rounded-2xl bg-white/5 border border-white/10 text-gray-300 text-sm shadow-xl backdrop-blur-sm">
                            <div className="text-[10px] text-emerald-400 uppercase tracking-widest font-semibold mb-2">Live Transcript</div>
                            {transcript}
                        </div>
                    )}
                </div>

                {/* Panel 2 (Conditional): Tool Area (Middle) */}
                {activeTool && activeTool !== 'voiceOnly' && (
                    <div className="relative flex-1 flex flex-col border-r border-white/5 bg-[#0f1422]">
                        <ToolManager activeTool={activeTool} onSubmit={handleToolSubmit} sessionId={sessionIdRef.current} />
                    </div>
                )}

                {/* Panel 3: Conversation Log & Text Fallback (Right) */}
                <div className="w-[400px] flex flex-col bg-[#080b13]">
                    <div className="p-5 border-b border-white/5 bg-white/5">
                        <div className="text-sm text-gray-400 font-medium uppercase tracking-wider mb-1">Interviewer</div>
                        <div className="font-semibold text-gray-100 flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${status === 'speaking' ? 'bg-purple-500 animate-pulse' : 'bg-gray-600'}`} />
                           {interviewerName}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
                        {conversation.length === 0 && (
                            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                                No messages yet.
                            </div>
                        )}
                        {conversation.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.speaker === 'You' ? 'items-end' : 'items-start'}`}>
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 ml-1 mr-1">{msg.speaker}</span>
                                <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-[15px] leading-relaxed shadow-md ${
                                    msg.speaker === 'You'
                                        ? 'bg-blue-600/20 text-blue-100 border border-blue-500/30 rounded-br-sm'
                                        : 'bg-white/10 text-gray-200 border border-white/10 rounded-bl-sm'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Text Fallback Input */}
                    <div className="p-4 bg-white/5 border-t border-white/5">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Type response here..."
                                value={textInput}
                                onChange={e => setTextInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && textInput.trim()) {
                                        sendToAIRef.current(textInput.trim());
                                        setTextInput('');
                                    }
                                }}
                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 placeholder-gray-600 transition-all"
                            />
                            <button
                                onClick={() => { if (textInput.trim()) { sendToAIRef.current(textInput.trim()); setTextInput(''); } }}
                                disabled={!textInput.trim() || status === 'thinking'}
                                className="px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-xl transition-all flex items-center justify-center shadow-lg shadow-blue-500/20"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default VoiceInterview;