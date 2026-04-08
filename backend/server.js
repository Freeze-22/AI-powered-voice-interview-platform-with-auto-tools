require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware setup
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

console.log('[Server] ULTRA-RESILIENT-SERVER: Middleware initialized');

// Mount routes
try {
    const interviewRoutes = require('./routes/interviewRoutes');
    app.use('/api', interviewRoutes);
    console.log('[Server] Routes mounted at /api');
} catch (error) {
    console.error('[Server] ERROR MUNTING ROUTES:', error.message);
    console.warn('[Server] WARNING: Could not mount interviewRoutes. Check if ./routes/interviewRoutes exists.');
}

// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(`[Server] Error caught in global middleware: ${err.message}`);
    res.status(500).json({
        success: false,
        data: null,
        error: err.message || 'Internal Server Error'
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
