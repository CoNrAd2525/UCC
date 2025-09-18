const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Import route handlers
const authRoutes = require('./auth');
const agentRoutes = require('./agents');
const taskRoutes = require('./tasks');
const securityRoutes = require('./security');
const swarmRoutes = require('./swarm');
const scanRoutes = require('./scan');
const revenueRoutes = require('./revenue');
const chatRoutes = require('./chat');
const productsRoutes = require('./products');
const listingsRoutes = require('./listings');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/swarm', swarmRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/listings', listingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Swarm Command Center Backend running on port ${port}`);
});

module.exports = app;