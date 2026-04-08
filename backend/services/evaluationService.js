const geminiService = require('./geminiService');

/**
 * Service to aggregate inputs and generate the final interview report.
 */
class EvaluationService {

    /**
     * @param {Object} interviewSession - Backend variable with answers, scores, and context.
     * @returns {Object} Formatted evaluation response.
     */
    async generateReport(interviewSession) {
        try {
            console.log(`[EvaluationService] Integration point: Generating final evaluation report`);

            // Combine session state with AI analysis 
            const geminiResult = await geminiService.generateFinalEvaluation(interviewSession);
            
            if (!geminiResult.success || !geminiResult.data) {
                console.error("[EvaluationService] Failed to retrieve AI evaluation");
                throw new Error("AI Evaluation failed");
            }

            const aiData = geminiResult.data.structuredData || {};

            // Internal scores tracker from session memory
            const scores = interviewSession.scores || {};
            
            const problemSolvingSc = scores.approach || aiData.overallScore || 70;
            const codeQualitySc = scores.coding || aiData.overallScore || 70;
            const debuggingSc = scores.debugging || aiData.overallScore || 70;
            // Simplified logic combining AI overall output with internal session heuristics
            const calculatedOverall = Math.floor((problemSolvingSc + codeQualitySc + debuggingSc) / 3);

            return {
                overallScore: aiData.overallScore || calculatedOverall,
                categoryScores: {
                    problemSolving: problemSolvingSc,
                    communication: aiData.overallScore || 80, // Stub/Fallback
                    codeQuality: codeQualitySc,
                    debugging: debuggingSc
                },
                strengths: aiData.strengths || ['Good attempt', 'Determined'],
                weaknesses: aiData.weaknesses || ['Needs more algorithm practice'],
                recommendations: aiData.recommendations || ['Review data structures'],
                transcript: interviewSession.answers || [] // The conversation array history
            };

        } catch (error) {
            console.error(`[EvaluationService] Error while generating report: ${error.message}`);
            
            // Return safe fallback conforming to expected structure
            return {
                overallScore: 0,
                categoryScores: {
                    problemSolving: 0,
                    communication: 0,
                    codeQuality: 0,
                    debugging: 0
                },
                strengths: [],
                weaknesses: [],
                recommendations: ["Failed to generate evaluation report."],
                transcript: []
            };
        }
    }
}

module.exports = new EvaluationService();
