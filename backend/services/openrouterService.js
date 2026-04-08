const axios = require('axios');
const { FALLBACK_MODELS } = require('../utils/constants');

class OpenRouterService {
    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY;
        this.baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
        this.model = process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free';

        if (!this.apiKey) {
            console.warn('[OpenRouter] WARNING: No API key found');
        } else {
            console.log('[OpenRouter] Service initialized with model:', this.model);
        }
    }

    async orchestrateConversation(history, context, availableTools, interviewerName = 'Triveni') {
        try {
            // Expand truncation to 3000 chars to pass comprehensive resume/JD data
            const truncatedResume = (context.resume || '').substring(0, 3000);
            const truncatedJD = (context.jobDescription || '').substring(0, 3000);

            // Keep only last 8 messages to save tokens
            const limitedHistory = history.slice(-8);

            // FIXED: Proper backtick string that includes everything
            const systemPrompt = `You are ${interviewerName}, a professional AI interviewer.

Job Description: ${truncatedJD}
Candidate Resume: ${truncatedResume}
Interview Type: ${context.interviewType || 'Technical'}

YOUR MISSION: Perform a quiet internal "Gap Analysis". Compare the Candidate Resume to the Job Description. Identify what skills the candidate HAS, and what requirements they are MISSING.
Use this analysis to formulate your questions from that perspective. Grill them objectively on the missing areas, but evaluate their claimed strengths.

RULES:
1. Keep responses VERY SHORT (1-2 sentences max). Do NOT output your entire gap analysis to the user.
2. Return ONLY JSON: {"speech":"your response","toolTrigger":null,"isComplete":false}
3. Ask ONE question at a time.
4. Be conversational and natural.

First message: Introduce yourself, mention their resume, and ask an opening question pointing at their experience.`;

            const messages = [
                { role: "system", content: systemPrompt },
                ...limitedHistory.map(msg => ({
                    role: msg.speaker === 'user' ? 'user' : 'assistant',
                    content: (msg.speech || msg.content || '').substring(0, 500)
                }))
            ];

            const targetModels = [this.model, ...FALLBACK_MODELS];
            let response = null;
            let usedModel = null;

            for (const currentModel of targetModels) {
                try {
                    console.log(`[OpenRouter] Trying model: ${currentModel}`);
                    response = await axios.post(
                        `${this.baseURL}/chat/completions`,
                        {
                            model: currentModel,
                            messages: messages,
                            response_format: { type: "json_object" },
                            max_tokens: 300,
                            temperature: 0.7
                        },
                        {
                            headers: {
                                'Authorization': `Bearer ${this.apiKey}`,
                                'Content-Type': 'application/json',
                                'HTTP-Referer': 'http://localhost:3000',
                                'X-Title': 'Voice Interview Platform'
                            },
                            timeout: 10000 // 10 second timeout per model
                        }
                    );
                    usedModel = currentModel;
                    break; // Success! Break out of the fallback loop.
                } catch (error) {
                    console.warn(`[OpenRouter] Model ${currentModel} failed:`, error.response?.data?.error?.message || error.message);
                    // continue to next model
                }
            }

            if (!response) {
                console.error('[OpenRouter] All free fallback models failed.');
                return this._getMockResponse(history);
            }

            let cleanContent = response.data.choices[0].message.content;
            
            // Strip DeepSeek R1 reasoning tags
            cleanContent = cleanContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
            // Strip markdown JSON wrappers if present
            cleanContent = cleanContent.replace(/^```json/i, '').replace(/```$/i, '').trim();

            let parsedData;
            try {
                parsedData = JSON.parse(cleanContent);
            } catch (parseError) {
                console.error('[OpenRouter] JSON parse failed after fallbacks:', cleanContent.substring(0, 200));
                return this._getMockResponse(history);
            }

            return { success: true, data: parsedData };

        } catch (error) {
            console.error('[OpenRouter] Unexpected Error:', error.message);
            return this._getMockResponse(history);
        }
    }

    async evaluateToolSubmission(toolType, submissionData, context, history) {
        try {
            const response = await axios.post(
                `${this.baseURL}/chat/completions`,
                {
                    model: this.model,
                    messages: [
                        {
                            role: "system",
                            content: "Evaluate submission. Return JSON: {\"speech\":\"1 sentence feedback\",\"score\":0-100,\"feedback\":\"brief notes\"}"
                        },
                        {
                            role: "user",
                            content: `Tool: ${toolType}\nData: ${JSON.stringify(submissionData).substring(0, 500)}`
                        }
                    ],
                    max_tokens: 200
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'http://localhost:3000',
                        'X-Title': 'Voice Interview Platform'
                    }
                }
            );

            const content = response.data.choices[0].message.content;
            return { success: true, data: JSON.parse(content) };
        } catch (error) {
            return { success: true, data: { speech: "Got it. Let's continue.", score: 75, feedback: "Good work." } };
        }
    }

    async generateFinalReport(sessionData) {
        try {
            const systemPrompt = `Analyze the complete interview transcript.
Return ONLY JSON. DO NOT wrap it in Markdown or \`\`\` tags.
Format exactly:
{
  "overallScore": 0-100,
  "strengths": [".."],
  "weaknesses": [".."],
  "summary": "...",
  "toneLevel": "Confident/Hesitant/Professional",
  "vocabularyContext": "Basic/Advanced/Excellent",
  "testedTopics": ["topics they were explicitly asked"],
  "notTestedTopics": ["topics in JD that you skipped over"]
}`;

            const response = await axios.post(
                `${this.baseURL}/chat/completions`,
                {
                    model: this.model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: JSON.stringify(sessionData).substring(0, 3000) }
                    ],
                    response_format: { type: "json_object" },
                    max_tokens: 600,
                    temperature: 0.5
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'http://localhost:3000',
                        'X-Title': 'Voice Interview Platform'
                    }
                }
            );

            let cleanContent = response.data.choices[0].message.content;
            cleanContent = cleanContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
            cleanContent = cleanContent.replace(/^```json/i, '').replace(/```$/i, '').trim();

            return { success: true, data: JSON.parse(cleanContent) };
        } catch (error) {
            return { 
                success: true, 
                data: { 
                    overallScore: 75, 
                    strengths: ["Communication"], 
                    weaknesses: ["Needs detail"], 
                    summary: "Fallback reporting mode activated.",
                    toneLevel: "Unknown",
                    vocabularyContext: "Unknown",
                    testedTopics: [],
                    notTestedTopics: []
                } 
            };
        }
    }

    _getMockResponse(history = []) {
        // If it's the very first message, return the greeting.
        if (history.length <= 1) {
            return {
                success: true,
                data: {
                    speech: "Hello! I'm your AI interviewer. Could you tell me about your experience?",
                    toolTrigger: null,
                    isComplete: false
                }
            };
        }
        
        // Otherwise return a generic conversational continuation
        return {
            success: true,
            data: {
                speech: "That's very interesting. Can you elaborate more on that point?",
                toolTrigger: null,
                isComplete: false
            }
        };
    }
}

module.exports = new OpenRouterService();