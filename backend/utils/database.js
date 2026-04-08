const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../interviews_db.json');

function initDb() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ interviews: [], transcripts: [] }, null, 2));
        console.log('[Database] Initialized new JSON database.');
    } else {
        console.log('[Database] Connected to existing JSON database.');
    }
}
initDb();

function getDb() {
    return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
}

function saveDb(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function saveInterview(session, reportData) {
    return new Promise((resolve) => {
        try {
            const db = getDb();
            const existingIndex = db.interviews.findIndex(i => i.session_id === session.sessionId);
            
            const interviewObj = {
                session_id: session.sessionId,
                interview_type: session.context.interviewType,
                interviewer_name: session.context.interviewerName,
                resume_text: session.context.resume,
                job_description: session.context.jobDescription,
                completed_at: new Date().toISOString(),
                overall_score: reportData.overallScore || 0,
                report_json: reportData
            };

            if (existingIndex >= 0) {
                db.interviews[existingIndex] = interviewObj;
            } else {
                db.interviews.push(interviewObj);
            }
            saveDb(db);
            resolve(true);
        } catch (err) {
            console.error('[Database] Save Error:', err);
            resolve(false);
        }
    });
}

function saveTranscriptMessage(sessionId, message) {
    return new Promise((resolve) => {
        try {
            const db = getDb();
            db.transcripts.push({
                id: Date.now() + Math.random(),
                session_id: sessionId,
                speaker: message.speaker,
                speech: message.speech,
                tool_trigger: message.toolTrigger || null,
                created_at: new Date().toISOString()
            });
            saveDb(db);
            resolve(true);
        } catch (err) {
            console.error('[Database] Save Error:', err);
            resolve(false);
        }
    });
}

module.exports = { saveInterview, saveTranscriptMessage };
