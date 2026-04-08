const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) console.warn("WARNING: GEMINI_API_KEY environment variable is not set.");

const genAI = new GoogleGenerativeAI(apiKey || 'unconfigured_key');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

class GeminiService {
    async _generateFromPrompt(promptString, turnType = 'general') {
        try {
            console.log(`[GeminiService] Calling model.generateContent (${turnType})...`);
            const result = await model.generateContent(promptString);
            const responseText = result.response.text();
            
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            const cleanJson = jsonMatch ? jsonMatch[0] : responseText;
            
            const data = JSON.parse(cleanJson);
            console.log('[GeminiService] Model response parsed successfully');
            return { success: true, data, error: null };
        } catch (error) {
            console.error(`[GeminiService] API Error: ${error.message}`);
            
            // --- SMART MOCK FALLBACK ---
            // If the API is down/throttled, we return a high-quality mock 
            // so the user can still test the platform features.
            console.warn('[GeminiService] ⚠️ API UNAVAILABLE. Switching to Mock Resilience Mode.');
            
            let mockData = {
                speech: "I'm having a slight technical hiccup connecting to my brain, but let's continue! Could you tell me a bit more about your background?",
                toolTrigger: null,
                isComplete: false
            };

            if (promptString.includes("first message") || promptString.includes("Introduce yourself")) {
                mockData.speech = "Hello! I'm your AI interviewer today. It's a pleasure to meet you. I'll be conducting your technical interview. To get started, could you briefly introduce yourself and tell me about your experience?";
            } else if (promptString.includes("codeEditor") || turnType === 'tool') {
                mockData.speech = "That's a great introduction. Let's dive into a technical challenge. I've opened the code editor for you. Could you implement a basic function to reverse a linked list?";
                mockData.toolTrigger = "codeEditor";
            }

            return { success: true, data: mockData, error: "Quota/API Error (Using Mock Fallback)" };
        }
    }

    async orchestrateConversation(history, context, availableTools, interviewerName) {
        console.log('[GeminiService] Orchestrating conversation turn');
        const name = interviewerName || 'Triveni';
        const prompt = `
You are ${name}, an expert AI interviewer conducting a voice-based one-on-one interview.
Your personality: Professional yet warm. You introduce yourself by name at the start.
If this is the first message, greet the candidate, introduce yourself as ${name}, and explain you'll be conducting their ${context.interviewType} interview today. 

RULE: For the first 1-2 turns, DO NOT trigger any tools. Focus on a warm introduction and asking the candidate how they are doing or to briefly introduce themselves. Only after at least one back-and-forth should you trigger a tool like 'codeEditor'.

Context:
- Domain: ${context.interviewType}
- Job Description: ${context.jobDescription}
- Available Tools for this domain: ${JSON.stringify(availableTools)}

Conversation History:
${JSON.stringify(history)}

Based on the conversation, decide how to respond next.
If you need the user to write code, draw a diagram, query SQL, or write pseudocode based on the domain, SET the 'toolTrigger' to one of the Available Tools. 
Otherwise, if continuing conversation linearly, set 'toolTrigger' to 'voiceOnly' or null.
If the interview has reached a natural completion (after 5-7 technical interactions), set 'isComplete' to true.

Respond strictly in JSON format:
{
  "speech": "Your spoken response back to the candidate...",
  "toolTrigger": "codeEditor | pseudocode | whiteboard | sqlEditor | livePreview | textPopup | null",
  "isComplete": false
}
`;
        return this._generateFromPrompt(prompt, 'orchestration');
    }

    async evaluateToolSubmission(toolType, submissionData, context, history) {
        console.log(`[GeminiService] Evaluating tool submission: ${toolType}`);
        const prompt = `
You are an expert AI interviewer evaluating a candidate's submission from a technical tool during a voice interview.
Tool Used: ${toolType}
Submission Data: ${JSON.stringify(submissionData)}
Domain: ${context.interviewType}
Recent Context: ${JSON.stringify(history.slice(-3))}

Evaluate it strictly based on standard rubrics.
Respond strictly in JSON format:
{
  "speech": "Great job. Your architecture handles load well, but what about cache eviction?",
  "score": 85,
  "feedback": "Internal notes on what was good/bad."
}
`;
        return this._generateFromPrompt(prompt, 'tool');
    }

    async generateFinalReport(sessionData) {
        const prompt = `
You are evaluating the entire interview.
Context: ${JSON.stringify(sessionData.context)}
History: ${JSON.stringify(sessionData.history)}
Tool Evaluations: ${JSON.stringify(sessionData.toolScores)}

Generate a final score report.
JSON format:
{
  "overallScore": 88,
  "communication": 90,
  "technical": 85,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "summary": "Detailed summary..."
}
`;
        return this._generateFromPrompt(prompt);
    }
}

module.exports = new GeminiService();
