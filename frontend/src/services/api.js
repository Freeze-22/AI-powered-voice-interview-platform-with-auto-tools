import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const apiClient = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' }
});

apiClient.interceptors.request.use((config) => {
    const sessionId = localStorage.getItem('voiceSessionId');
    if (sessionId) config.headers['X-Session-Id'] = sessionId;
    return config;
});

apiClient.interceptors.response.use((response) => response, (error) => {
    console.error(`[API Error]`, error.message);
    return Promise.reject(error);
});

export const startVoiceInterview = async (resumeText, jobDescription, interviewType, interviewerName) => {
    const response = await apiClient.post('/start', { resume: resumeText, jobDescription, interviewType, interviewerName });
    const { sessionId, speech, activeTool } = response.data.data;
    if (sessionId) localStorage.setItem('voiceSessionId', sessionId);
    return { sessionId, speech, activeTool };
};

export const talkToAI = async (sessionId, userSpeech) => {
    const response = await apiClient.post('/talk', { sessionId, userSpeech });
    return response.data.data; // { speech, activeTool, isComplete }
};

export const submitToolData = async (sessionId, toolType, submissionData) => {
    const response = await apiClient.post('/eval-tool', { sessionId, toolType, submissionData });
    return response.data.data; // { speech, activeTool }
};

export const executeCode = async (sessionId, code, language) => {
    const response = await apiClient.post('/code', { sessionId, code, language });
    return response.data.data; // { output, error }
};

export const fetchScoreReport = async (sessionId) => {
    const response = await apiClient.get(`/finish/${sessionId}`);
    return response.data.data; 
};
