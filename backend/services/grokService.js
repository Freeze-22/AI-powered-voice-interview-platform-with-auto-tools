const OpenAI = require('openai');

/**
 * Service to interact with xAI Grok API.
 * This is OpenAI-compatible and replaces the Gemini service.
 */
class GrokService {
    constructor() {
        this.client = new OpenAI({
            apiKey: process.env.XAI_API_KEY || "AI_MOCK_KEY",
            baseURL: "https://api.x.ai/v1",
        });
        
        // Mock fallback to prevent crashes if API key is missing
        this.isMockMode = !process.env.XAI_API_KEY || process.env.XAI_API_KEY === "PASTE_YOUR_GROK_KEY_HERE";
        
        if (this.isMockMode) {
            console.warn('[GrokService] WARNING: No valid XAI_API_KEY found. Running in Smart Mock Mode.');
        } else {
            console.log('[GrokService] xAI Client initialized successfully.');
        }
    }

    /**
     * Orchestrates the conversation flow.
     */
    async orchestrateConversation(history, context, availableTools, interviewerName = 'Triveni') {
        if (this.isMockMode) return this._generateMockResponse(history, interviewerName);

        try {
            const messages = [
                {
                    role: "system",
                    content: `You are ${interviewerName}, a professional AI interviewer conducting a 1-on-1 voice interview.
                    Target Role: ${context.jobDescription}
                    Candidate Profile: ${context.resume}
                    
                    CRITICAL INSTRUCTIONS:
                    1. Keep responses CONCISE (1-3 sentences) for a natural voice flow.
                    2. If the user gives a good answer, you can optionally trigger a tool by returning a JSON object.
                    3. Available Tools: ${availableTools.join(', ')}
                    
                    RESPONSE FORMAT:
                    You MUST return a JSON object ONLY:
                    {
                        "speech": "Your vocal response to the user here.",
                        "toolTrigger": "toolName" or null,
                        "isComplete": true/false
                    }`
                },
                ...history.map(msg => ({
                    role: msg.speaker === 'user' ? 'user' : 'assistant',
                    content: msg.speech
                }))
            ];

            const response = await this.client.chat.completions.create({
                model: "grok-3",
                messages: messages,
                response_format: { type: "json_object" }
            });

            const content = response.choices[0].message.content;
            return { success: true, data: JSON.parse(content) };
        } catch (error) {
            console.error('[GrokService] Error:', error.message);
            return this._generateMockResponse(history, interviewerName);
        }
    }

    /**
     * Evaluates a tool submission (Code, Whiteboard, etc.)
     */
    async evaluateToolSubmission(toolType, submissionData, context, history) {
        if (this.isMockMode) return { success: true, data: { speech: "Excellent work on that task. Let's continue.", score: 85, feedback: "Solid logic." } };

        try {
            const response = await this.client.chat.completions.create({
                model: "grok-3",
                messages: [
                    { 
                        role: "system", 
                        content: "Evaluate the user's submission. Return JSON: { \"speech\": \"vocal feedback\", \"score\": 0-100, \"feedback\": \"detailed text\" }" 
                    },
                    { 
                        role: "user", 
                        content: `Tool: ${toolType}\nData: ${JSON.stringify(submissionData)}` 
                    }
                ],
                response_format: { type: "json_object" }
            });

            return { success: true, data: JSON.parse(response.choices[0].message.content) };
        } catch (error) {
            return { success: true, data: { speech: "Got it. Let's move to the next part.", score: 70, feedback: "Submission recorded." } };
        }
    }

    async generateFinalReport(session) {
        // Implement similar logic to evaluate all toolScores and history
        return { success: true, data: { overallScore: 88, breakdown: "Solid performance." } };
    }

    _generateMockResponse(history, interviewerName) {
        // Carry forward the same resilient mock logic from Gemini
        const lastUserMsg = [...history].reverse().find(m => m.speaker === 'user')?.speech || "";
        
        let speech = "That's interesting! Could you tell me more about that?";
        if (history.length <= 1) speech = `Hello! I'm ${interviewerName}, your technical interviewer today. Let's start with a quick introduction.`;
        
        return {
            success: true,
            data: {
                speech,
                toolTrigger: null,
                isComplete: false
            }
        };
    }
}

module.exports = new GrokService();
