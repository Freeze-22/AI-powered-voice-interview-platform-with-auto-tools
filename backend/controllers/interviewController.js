// CHANGE THIS: Use OpenRouter instead of Gemini
// const geminiService = require('../services/geminiService');
const OpenRouterService = require('../services/openrouterService');
const { TOOL_TYPES } = require('../utils/constants');
const executionService = require('../services/executionService');
const dbClient = require('../utils/database');

const sessions = new Map();

const startInterview = async (req, res) => {
    try {
        const { resume, jobDescription, interviewType, interviewerName } = req.body;
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        const interviewSession = {
            context: { resume: resume || "", jobDescription: jobDescription || "", interviewType, interviewerName: interviewerName || 'Triveni' },
            history: [],
            toolScores: [],
            isComplete: false,
            activeTool: null
        };
        
        
        const availableTools = Object.values(TOOL_TYPES);
        
        // FIXED: Use OpenRouterService instead of geminiService
        const aiResult = await OpenRouterService.orchestrateConversation(
            [{ speaker: 'system', speech: 'Start the interview. Introduce yourself by name and greet the candidate warmly.' }], 
            interviewSession.context, 
            availableTools,
            interviewSession.context.interviewerName
        );
        
        const speech = aiResult?.data?.speech || "Hello, let's begin your interview.";
        const toolTrigger = null; 
        
        const initialMsg = { speaker: 'ai', speech, toolTrigger };
        interviewSession.history.push(initialMsg);
        interviewSession.activeTool = null;
        interviewSession.sessionId = sessionId;
        
        sessions.set(sessionId, interviewSession);
        
        // Log to database async
        dbClient.saveTranscriptMessage(sessionId, initialMsg).catch(console.error);
        
        return res.status(200).json({ success: true, data: { sessionId, speech, activeTool: toolTrigger } });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

const talk = async (req, res) => {
    try {
        const { sessionId, userSpeech } = req.body;
        const session = sessions.get(sessionId);
        if (!session) return res.status(404).json({ error: "Session not found" });

        session.history.push({ speaker: 'user', speech: userSpeech });
        
        const availableTools = Object.values(TOOL_TYPES);
        
        // FIXED: Use OpenRouterService instead of geminiService
        const aiResult = await OpenRouterService.orchestrateConversation(
            session.history, 
            session.context, 
            availableTools, 
            session.context.interviewerName
        );
        
        const speech = aiResult?.data?.speech || "Could you clarify that?";
        const toolTrigger = aiResult?.data?.toolTrigger || null;
        const isComplete = aiResult?.data?.isComplete || false;

        const aiMsg = { speaker: 'ai', speech, toolTrigger };
        session.history.push(aiMsg);
        session.activeTool = toolTrigger;
        session.isComplete = isComplete;
        sessions.set(sessionId, session);
        
        // Async db saving
        dbClient.saveTranscriptMessage(sessionId, { speaker: 'user', speech: userSpeech }).catch(console.error);
        dbClient.saveTranscriptMessage(sessionId, aiMsg).catch(console.error);
        
        return res.status(200).json({ success: true, data: { speech, activeTool: toolTrigger, isComplete } });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

const evalTool = async (req, res) => {
    try {
        const { sessionId, toolType, submissionData } = req.body;
        const session = sessions.get(sessionId);
        if (!session) return res.status(404).json({ error: "Session not found" });

        // FIXED: Use OpenRouterService
        const aiResult = await OpenRouterService.evaluateToolSubmission(
            toolType, 
            submissionData, 
            session.context, 
            session.history
        );
        
        const speech = aiResult?.data?.speech || "Thanks for submitting the tool data. Let's move on.";
        const score = aiResult?.data?.score || 0;
        const feedback = aiResult?.data?.feedback || "";

        session.toolScores.push({ toolType, score, feedback });
        session.history.push({ speaker: 'user', speech: `[Submitted ${toolType}]` });
        session.history.push({ speaker: 'ai', speech, toolTrigger: null });
        session.activeTool = null;

        sessions.set(sessionId, session);
        
        return res.status(200).json({ success: true, data: { speech, activeTool: null } });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

const submitCode = async (req, res) => {
    try {
        const { code, language } = req.body;
        const executionResult = await executionService.runCode(code, language);
        return res.status(200).json({ success: true, data: executionResult?.data || {} });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

const finishInterview = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = sessions.get(sessionId);
        if (!session) return res.status(404).json({ error: "Session not found" });

        // FIXED: Use OpenRouterService
        const report = await OpenRouterService.generateFinalReport(session);
        
        // Save overall interview and final report JSON to DB
        dbClient.saveInterview(session, report.data || {}).catch(console.error);
        
        return res.status(200).json({ success: true, data: report?.data || {} });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { startInterview, talk, evalTool, submitCode, finishInterview };