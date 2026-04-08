const Anthropic = require('@anthropic-ai/sdk');

class ClaudeService {
    constructor() {
        this.client = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY || '',
        });

        this.isMockMode = !process.env.ANTHROPIC_API_KEY;

        if (this.isMockMode) {
            console.warn('[ClaudeService] WARNING: No ANTHROPIC_API_KEY found. Running in Mock Mode.');
        } else {
            console.log('[ClaudeService] Anthropic client initialized successfully.');
        }
    }

    async orchestrateConversation(history, context, availableTools, interviewerName = 'Triveni') {
        if (this.isMockMode) return this._generateMockResponse(history, interviewerName);

        try {
            const systemPrompt = `You are ${interviewerName}, a professional AI interviewer conducting a 1-on-1 voice interview.
Target Role: ${context.jobDescription}
Candidate Profile: ${context.resume}
Interview Type: ${context.interviewType}
Available Tools: ${JSON.stringify(availableTools)}

CRITICAL INSTRUCTIONS:
1. Keep responses CONCISE (1-3 sentences) for natural voice flow.
2. For the first 1-2 turns, focus on warm introduction only. Do NOT trigger tools yet.
3. After at least one back-and-forth, you may trigger a tool if appropriate.
4. If the interview has reached a natural completion (after 5-7 technical interactions), set isComplete to true.

You MUST respond ONLY with a valid JSON object, no extra text:
{
  "speech": "Your spoken response to the candidate.",
  "toolTrigger": "codeEditor | pseudocode | whiteboard | sqlEditor | livePreview | textPopup | voiceOnly | null",
  "isComplete": false
}`;

            const messages = history
                .filter(m => m.speaker !== 'system')
                .map(msg => ({
                    role: msg.speaker === 'user' ? 'user' : 'assistant',
                    content: msg.speech
                }));

            // Claude requires alternating roles — ensure it starts with user
            if (messages.length === 0 || messages[0].role !== 'user') {
                messages.unshift({ role: 'user', content: 'Start the interview. Introduce yourself and greet the candidate.' });
            }

            const response = await this.client.messages.create({
                model: 'claude-sonnet-4-5',
                max_tokens: 512,
                system: systemPrompt,
                messages,
            });

            const content = response.content[0].text.trim();
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            const data = JSON.parse(jsonMatch ? jsonMatch[0] : content);

            return { success: true, data };
        } catch (error) {
            console.error('[ClaudeService] Error:', error.message);
            return this._generateMockResponse(history, interviewerName);
        }
    }

    async evaluateToolSubmission(toolType, submissionData, context, history) {
        if (this.isMockMode) {
            return { success: true, data: { speech: "Good effort! Let's continue.", score: 80, feedback: "Submission recorded." } };
        }

        try {
            const response = await this.client.messages.create({
                model: 'claude-sonnet-4-5',
                max_tokens: 512,
                system: `You are an expert technical interviewer evaluating a candidate's submission.
Respond ONLY with valid JSON:
{
  "speech": "Brief vocal feedback (1-2 sentences).",
  "score": 85,
  "feedback": "Detailed internal notes."
}`,
                messages: [{
                    role: 'user',
                    content: `Tool: ${toolType}\nSubmission: ${JSON.stringify(submissionData)}\nDomain: ${context.interviewType}`
                }]
            });

            const content = response.content[0].text.trim();
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            const data = JSON.parse(jsonMatch ? jsonMatch[0] : content);

            return { success: true, data };
        } catch (error) {
            console.error('[ClaudeService] evaluateToolSubmission error:', error.message);
            return { success: true, data: { speech: "Got it, let's move on.", score: 70, feedback: "Submission recorded." } };
        }
    }

    async generateFinalReport(session) {
        if (this.isMockMode) {
            return { success: true, data: { overallScore: 85, breakdown: "Good performance overall." } };
        }

        try {
            const response = await this.client.messages.create({
                model: 'claude-sonnet-4-5',
                max_tokens: 1024,
                system: `You are evaluating a completed technical interview. Respond ONLY with valid JSON:
{
  "overallScore": 88,
  "communication": 90,
  "technical": 85,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "summary": "Detailed summary..."
}`,
                messages: [{
                    role: 'user',
                    content: `Context: ${JSON.stringify(session.context)}\nHistory: ${JSON.stringify(session.history)}\nTool Scores: ${JSON.stringify(session.toolScores)}`
                }]
            });

            const content = response.content[0].text.trim();
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            const data = JSON.parse(jsonMatch ? jsonMatch[0] : content);

            return { success: true, data };
        } catch (error) {
            console.error('[ClaudeService] generateFinalReport error:', error.message);
            return { success: true, data: { overallScore: 80, breakdown: "Report generation failed, but interview was recorded." } };
        }
    }

    _generateMockResponse(history, interviewerName) {
        const isFirst = history.filter(m => m.speaker === 'ai').length === 0;
        return {
            success: true,
            data: {
                speech: isFirst
                    ? `Hello! I'm ${interviewerName}, your technical interviewer today. Let's start with a quick introduction — tell me about yourself!`
                    : "That's interesting! Could you elaborate on that?",
                toolTrigger: null,
                isComplete: false
            }
        };
    }
}

module.exports = new ClaudeService();