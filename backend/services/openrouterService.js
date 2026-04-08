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

            const interviewType = context.interviewType || 'Technical';
            const toolInstructions = interviewType.toLowerCase().includes('data') || interviewType.toLowerCase().includes('sql')
                ? `TOOL RULES:
- When you ask a SQL or data analysis question, set "toolTrigger": "sqlEditor"
- When you ask a system design or architecture question, set "toolTrigger": "whiteboard"
- For coding questions, set "toolTrigger": "code_editor"
- Otherwise keep "toolTrigger": null`
                : interviewType.toLowerCase().includes('system')
                ? `TOOL RULES:
- When you ask a system design or architecture question, set "toolTrigger": "whiteboard"
- When you ask a coding implementation question, set "toolTrigger": "code_editor"
- Otherwise keep "toolTrigger": null`
                : `TOOL RULES:
- When you give a coding challenge (arrays, strings, algorithms, implement a function, etc.), you MUST set "toolTrigger": "code_editor". This opens a live code editor for the candidate.
- When you ask a system design or architecture drawing question, set "toolTrigger": "whiteboard"
- IMPORTANT: If the conversation involves writing any code AT ALL, always set "toolTrigger": "code_editor"
- Otherwise keep "toolTrigger": null`;

            // Always use Madhu as the hard-coded interviewer name
            const systemPrompt = `You are Madhu, a professional AI interviewer conducting a ${interviewType} interview.

Job Description: ${truncatedJD}
Candidate Resume: ${truncatedResume}

YOUR MISSION: Perform a quiet internal "Gap Analysis". Compare the Candidate Resume to the Job Description.
Identify what skills the candidate HAS vs. what the role REQUIRES but is MISSING from their resume.
Use this gap analysis to drive your question strategy: probe the gaps rigorously, validate the claimed strengths.

${toolInstructions}

OTHER RULES:
1. Keep speech SHORT (1-3 sentences max). Do NOT reveal your internal gap analysis.
2. Return ONLY valid JSON, NO markdown, NO backticks: {"speech":"your response","toolTrigger":null,"isComplete":false}
3. Ask ONE question at a time.
4. Set "isComplete": true only when fully done (at least 5 exchanges).
5. Be professional but warm and encouraging.

FIRST MESSAGE: Introduce yourself as Madhu (say your name clearly). Then in 1-2 sentences outline what you will cover: their background, ${interviewType} skills, and relevant projects from their resume. Then ask your first targeted question based on the gap analysis. Keep the entire opening under 4 sentences total.`;

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
                return this._getMockResponse(history, context);
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
                return this._getMockResponse(history, context);
            }

            return { success: true, data: parsedData };

        } catch (error) {
            console.error('[OpenRouter] Unexpected Error:', error.message);
            return this._getMockResponse(history, context);
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
Return ONLY valid JSON. NO markdown, NO backticks, NO explanation outside the JSON object.
Format exactly:
{
  "overallScore": 0-100,
  "strengths": ["specific strength 1","specific strength 2"],
  "weaknesses": ["specific weakness 1","specific weakness 2"],
  "summary": "2-3 sentence overall assessment",
  "toneLevel": "Confident|Hesitant|Professional|Nervous|Mixed",
  "vocabularyContext": "Basic|Intermediate|Advanced|Excellent",
  "testedTopics": ["topic 1","topic 2"],
  "notTestedTopics": ["missed topic 1","missed topic 2"]
}`;

            // Build a clean text summary of conversation history
            const transcriptText = (sessionData.history || [])
                .map(m => `${m.speaker === 'ai' ? 'Interviewer' : 'Candidate'}: ${m.speech || ''}`)
                .join('\n');
            const contextText = `Interview Type: ${sessionData.context?.interviewType || 'Technical'}\nJob Description: ${(sessionData.context?.jobDescription || '').substring(0, 500)}\n\nTranscript:\n${transcriptText.substring(0, 3000)}`;

            const targetModels = [this.model, ...FALLBACK_MODELS];
            let response = null;

            for (const currentModel of targetModels) {
                try {
                    console.log(`[OpenRouter:Report] Trying model: ${currentModel}`);
                    response = await axios.post(
                        `${this.baseURL}/chat/completions`,
                        {
                            model: currentModel,
                            messages: [
                                { role: "system", content: systemPrompt },
                                { role: "user", content: contextText }
                            ],
                            response_format: { type: "json_object" },
                            max_tokens: 700,
                            temperature: 0.3
                        },
                        {
                            headers: {
                                'Authorization': `Bearer ${this.apiKey}`,
                                'Content-Type': 'application/json',
                                'HTTP-Referer': 'http://localhost:3000',
                                'X-Title': 'Voice Interview Platform'
                            },
                            timeout: 20000
                        }
                    );
                    break; // success — stop trying
                } catch (e) {
                    console.warn(`[OpenRouter:Report] Model ${currentModel} failed:`, e.response?.data?.error?.message || e.message);
                }
            }

            if (!response) throw new Error('All models failed for report generation');

            let cleanContent = response.data.choices[0].message.content;
            cleanContent = cleanContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
            cleanContent = cleanContent.replace(/^```json/i, '').replace(/```$/i, '').trim();

            return { success: true, data: JSON.parse(cleanContent) };
        } catch (error) {
            console.error('[OpenRouter:Report] Error:', error.message);

            // Smart fallback: analyze the actual history to build a meaningful report
            const history = sessionData.history || [];
            const userTurns = history.filter(m => m.speaker === 'user').length;
            const aiTurns = history.filter(m => m.speaker === 'ai').length;
            const usedTools = [...new Set(history.filter(m => m.toolTrigger).map(m => m.toolTrigger))];

            // Topics covered based on AI questions in history
            const aiSpeeches = history.filter(m => m.speaker === 'ai').map(m => (m.speech || '').toLowerCase());
            const tested = [];
            if (aiSpeeches.some(s => s.includes('project') || s.includes('challenge'))) tested.push('Project Experience');
            if (aiSpeeches.some(s => s.includes('code') || s.includes('function') || s.includes('algorithm'))) tested.push('Coding / Algorithms');
            if (aiSpeeches.some(s => s.includes('sql') || s.includes('query'))) tested.push('SQL / Database Queries');
            if (aiSpeeches.some(s => s.includes('system design') || s.includes('architecture'))) tested.push('System Design');
            if (aiSpeeches.some(s => s.includes('complexity') || s.includes('big o'))) tested.push('Time & Space Complexity');
            if (aiSpeeches.some(s => s.includes('api') || s.includes('rest'))) tested.push('REST APIs');
            if (aiSpeeches.some(s => s.includes('feedback') || s.includes('deadline') || s.includes('see yourself'))) tested.push('Behavioral');

            const interviewType = (sessionData.context?.interviewType || '').toLowerCase();
            const notTested = [];
            if (!tested.includes('SQL / Database Queries') && (interviewType.includes('data') || interviewType.includes('sql'))) notTested.push('SQL Queries');
            if (!tested.includes('System Design') && !interviewType.includes('hr')) notTested.push('System Design');
            if (!tested.includes('Behavioral')) notTested.push('Behavioral Questions');
            if (!usedTools.length) notTested.push('Live Code / Design Tools');

            const engagement = userTurns / Math.max(aiTurns, 1);
            const score = Math.min(85, Math.max(40, Math.round(50 + userTurns * 3 + usedTools.length * 5)));

            return {
                success: true,
                data: {
                    overallScore: score,
                    strengths: [
                        userTurns >= 5 ? "Maintained engagement across multiple questions" : "Attempted to respond to questions",
                        usedTools.length > 0 ? `Engaged with live ${usedTools.join(', ')} tool` : "Communicated responses verbally",
                        "Showed willingness to be transparent about knowledge gaps"
                    ],
                    weaknesses: [
                        userTurns < 4 ? "Interview ended prematurely — aim to complete all phases" : "Could provide more technical depth in answers",
                        "Needs more hands-on project experience in the target domain"
                    ],
                    summary: `The candidate completed ${userTurns} response turns across ${aiTurns} interviewer questions. ${usedTools.length > 0 ? `Interactive tools used: ${usedTools.join(', ')}.` : ''} The interview was conducted in offline mode — AI scoring based on conversation structure.`,
                    toneLevel: engagement >= 0.8 ? "Engaged" : engagement >= 0.5 ? "Hesitant" : "Minimal",
                    vocabularyContext: userTurns >= 8 ? "Intermediate" : "Basic",
                    testedTopics: tested.length > 0 ? tested : ["Background & Introduction"],
                    notTestedTopics: notTested
                }
            };
        }
    }

    _getMockResponse(history = [], context = {}) {
        const turn = history.length;
        const interviewType = (context.interviewType || 'Technical Coding').toLowerCase();
        const isDataSci = interviewType.includes('data') || interviewType.includes('sql');
        const isSystem = interviewType.includes('system');
        const isBehavioral = interviewType.includes('hr') || interviewType.includes('behavioral');

        // Extract candidate name from history
        const candidateName = (() => {
            for (const msg of history) {
                if (msg.speaker === 'user') {
                    const m = (msg.speech || '').match(/(?:my name is|i am|i'm)\s+([A-Z][a-z]+)/i);
                    if (m) return m[1];
                }
            }
            return null;
        })();
        const greet = candidateName ? `${candidateName}` : 'there';

        // ── PHASE 1: OPENING (turns 0-2) ──────────────────────────────────
        if (turn <= 1) {
            return { success: true, data: {
                speech: `Hi, I am Madhu, your AI interviewer for today's ${context.interviewType || 'Technical'} interview. We will go through your background, explore your projects, test your technical depth, and wrap up with a few behavioral questions. Let's begin — could you introduce yourself and tell me what you are currently working on or studying?`,
                toolTrigger: null, isComplete: false
            }};
        }

        if (turn === 2) {
            return { success: true, data: {
                speech: `Thank you for that introduction! I can see from your resume that you have worked on some interesting projects. What motivated you to pursue ${interviewType.includes('cloud') ? 'cloud computing' : interviewType.includes('data') ? 'data science' : 'software engineering'}, and what has been your biggest learning so far?`,
                toolTrigger: null, isComplete: false
            }};
        }

        // ── PHASE 2: PROJECT DEEP-DIVE (turns 3-5) ────────────────────────
        if (turn === 3) {
            return { success: true, data: {
                speech: `That's a great perspective. Can you walk me through your most significant project — what problem it solved, your specific role, and the main technical decisions you made?`,
                toolTrigger: null, isComplete: false
            }};
        }

        if (turn === 4) {
            return { success: true, data: {
                speech: `Interesting! What was the biggest technical challenge you faced in that project and how did you overcome it?`,
                toolTrigger: null, isComplete: false
            }};
        }

        if (turn === 5) {
            return { success: true, data: {
                speech: `Good. If you had to rebuild that project today with what you know now, what would you do differently?`,
                toolTrigger: null, isComplete: false
            }};
        }

        // ── PHASE 3: CORE TECHNICAL CONCEPTS (turns 6-8) ──────────────────
        if (turn === 6) {
            if (isDataSci) {
                return { success: true, data: {
                    speech: `Let's shift to core concepts. Can you explain the difference between supervised and unsupervised learning, and give me a use case for each?`,
                    toolTrigger: null, isComplete: false
                }};
            }
            if (isSystem) {
                return { success: true, data: {
                    speech: `Let's talk core concepts. Can you explain the CAP theorem and how you would apply it when choosing a database for a distributed system?`,
                    toolTrigger: null, isComplete: false
                }};
            }
            if (isBehavioral) {
                return { success: true, data: {
                    speech: `Tell me about a time you had to work under tight deadlines. How did you prioritize tasks and what was the outcome?`,
                    toolTrigger: null, isComplete: false
                }};
            }
            return { success: true, data: {
                speech: `Let's talk about fundamentals. Can you explain the difference between a stack and a queue, and give me a real-world example where each would be preferred?`,
                toolTrigger: null, isComplete: false
            }};
        }

        if (turn === 7) {
            if (isDataSci) {
                return { success: true, data: {
                    speech: `Good. How do you handle missing values and class imbalance in a machine learning dataset?`,
                    toolTrigger: null, isComplete: false
                }};
            }
            if (isSystem) {
                return { success: true, data: {
                    speech: `How would you design a caching layer for a high-traffic API? What eviction strategies would you consider?`,
                    toolTrigger: null, isComplete: false
                }};
            }
            return { success: true, data: {
                speech: `Can you explain what time and space complexity mean? What is the Big O of searching in a hash map, and why?`,
                toolTrigger: null, isComplete: false
            }};
        }

        if (turn === 8) {
            if (isDataSci) {
                return { success: true, data: {
                    speech: `What is the difference between precision and recall, and when would you optimize for one over the other?`,
                    toolTrigger: null, isComplete: false
                }};
            }
            return { success: true, data: {
                speech: `Great. Can you explain what RESTful APIs are and the difference between GET, POST, PUT, and DELETE?`,
                toolTrigger: null, isComplete: false
            }};
        }

        // ── PHASE 4: LIVE CHALLENGE (turns 9-11) ──────────────────────────
        if (turn === 9) {
            if (isDataSci) {
                return { success: true, data: {
                    speech: `Now let's write a SQL query. I've opened the editor — write a query to find all employees who earn more than the average salary in their department.`,
                    toolTrigger: 'sqlEditor', isComplete: false
                }};
            }
            if (isSystem) {
                return { success: true, data: {
                    speech: `Let's do a system design exercise. I've opened the whiteboard — sketch the architecture of a scalable notification system (push, email, SMS) that handles 1 million users.`,
                    toolTrigger: 'whiteboard', isComplete: false
                }};
            }
            return { success: true, data: {
                speech: `Time for a coding challenge. I've opened the editor — write a function that takes an array of integers and returns all pairs that sum to a target value. Consider time complexity in your solution.`,
                toolTrigger: 'code_editor', isComplete: false
            }};
        }

        if (turn === 10) {
            return { success: true, data: {
                speech: `Good attempt! Now, can you tell me the time complexity of your solution and how you would optimize it further?`,
                toolTrigger: null, isComplete: false
            }};
        }

        if (turn === 11) {
            return { success: true, data: {
                speech: `Excellent. What about edge cases — what happens if the array is empty, has duplicates, or no valid pairs exist?`,
                toolTrigger: null, isComplete: false
            }};
        }

        // ── PHASE 5: BEHAVIORAL & WRAP-UP (turns 12-14) ───────────────────
        if (turn === 12) {
            return { success: true, data: {
                speech: `We're in the final stretch. Tell me about a time you received critical feedback on your work. How did you respond and what did you learn?`,
                toolTrigger: null, isComplete: false
            }};
        }

        if (turn === 13) {
            return { success: true, data: {
                speech: `Last question — where do you see yourself professionally in the next two to three years, and how does this role align with that goal?`,
                toolTrigger: null, isComplete: false
            }};
        }

        // ── WRAP-UP (turn 14+) ─────────────────────────────────────────────
        if (turn >= 14) {
            return { success: true, data: {
                speech: `Thank you ${greet}, this has been a great conversation! We covered your background, your projects, core technical concepts, a live challenge, and your career direction. I'll now generate your detailed evaluation report. Well done today!`,
                toolTrigger: null, isComplete: true
            }};
        }

        // Safety fallback for any unexpected turns
        return { success: true, data: {
            speech: `That's a good point. Can you expand on that with a specific example from your experience?`,
            toolTrigger: null, isComplete: false
        }};
    }
}

module.exports = new OpenRouterService();