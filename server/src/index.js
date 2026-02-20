const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const championshipRoutes = require('./routes/championshipRoutes');
const teamRoutes = require('./routes/teamRoutes');
const playerRoutes = require('./routes/playerRoutes');
const matchRoutes = require('./routes/matchRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middlewares
app.use(helmet()); // Set security HTTP headers

// Rate limiting
// Rate limiting (High limit to allow for 10-second polling in FanZone)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 2000, // Increased limit
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { message: 'Muitas requisições deste IP, tente novamente mais tarde.' }
});

// Apply rate limiter to all requests (can be adjusted to specific routes later)
app.use(limiter);

// CORS configuration - adjust origin when in production
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', // Allow specific origin or all if not set
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
// app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/championships', championshipRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/public', require('./routes/publicRoutes'));

app.get('/', (req, res) => {
    res.send('Futkings Manager API is running');
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Ocorreu um erro interno no servidor.',
        // Only show detailed error in development
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});