const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const { validateSession, sessionRateLimiter } = require('../middleware/validation');

// Apply rate limiting loosely
router.use(sessionRateLimiter);

router.post('/start', interviewController.startInterview);
router.post('/talk', validateSession, interviewController.talk);
router.post('/eval-tool', validateSession, interviewController.evalTool);
router.post('/code', validateSession, interviewController.submitCode);
router.get('/finish/:sessionId', interviewController.finishInterview);

module.exports = router;
