const express = require('express');
const { swarmState } = require('../utils/storage');
const { authenticate } = require('../utils/auth');
const router = express.Router();

router.use(authenticate);

// Get swarm status
router.get('/status', (req, res) => {
  res.json({
    status: 'operational',
    uptime: '99.2%',
    lastUpdate: new Date().toISOString(),
    metrics: swarmState.metrics
  });
});

// Get swarm metrics
router.get('/metrics', (req, res) => {
  res.json(swarmState.metrics);
});

// Get recent events
router.get('/events', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const events = swarmState.events.slice(-limit).reverse();
  res.json(events);
});

// Get system health
router.get('/health', (req, res) => {
  const agents = Array.from(swarmState.agents.values());
  const activeAgents = agents.filter(a => a.status === 'active' || a.status === 'busy');
  const healthyAgents = agents.filter(a => {
    const lastSeen = new Date(a.lastSeen);
    const timeSince = Date.now() - lastSeen.getTime();
    return timeSince < 300000; // 5 minutes
  });

  res.json({
    overall: healthyAgents.length / Math.max(agents.length, 1) > 0.8 ? 'healthy' : 'degraded',
    agentHealth: {
      total: agents.length,
      active: activeAgents.length,
      healthy: healthyAgents.length,
      percentage: Math.round((healthyAgents.length / Math.max(agents.length, 1)) * 100)
    },
    systemLoad: swarmState.metrics.systemLoad,
    averageResponseTime: swarmState.metrics.averageResponseTime
  });
});

module.exports = router;