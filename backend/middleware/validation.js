const { rateLimit } = require('express-rate-limit');

/**
 * Validates that a session exists in the request.
 */
const validateSession = (req, res, next) => {
    // Check multiple locations for the session identifier safely
    const sessionId = req.body?.sessionId || req.params?.sessionId || req.headers?.['x-session-id'];
    
    if (!sessionId) {
        console.warn('[Validation] Request blocked: Missing session ID');
        return res.status(401).json({ success: false, data: null, error: 'Session ID is required' });
    }
    
    // Attach safely for downstream usage
    req.sessionId = sessionId;
    next();
};

/**
 * Validates that required payload fields are present.
 * @param {Array<string>} requiredFields 
 */
const validateBody = (requiredFields) => {
    return (req, res, next) => {
        for (const field of requiredFields) {
            if (req.body[field] === undefined || req.body[field] === null) {
                console.warn(`[Validation] Request blocked: Missing field ${field}`);
                return res.status(400).json({ success: false, data: null, error: `Missing required field: ${field}` });
            }
        }
        next();
    };
};

/**
 * Rate limits to prevent spam logic per IP/session.
 */
const sessionRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
    message: { success: false, data: null, error: 'Too many requests, slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    validateSession,
    validateBody,
    sessionRateLimiter
};
