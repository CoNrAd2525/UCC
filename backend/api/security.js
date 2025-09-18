const express = require('express');
const { swarmState } = require('../utils/storage');
const { authenticate, authorize } = require('../utils/auth');
const router = express.Router();

router.use(authenticate);
router.use(authorize(['admin', 'operator']));

// Get security overview
router.get('/overview', (req, res) => {
  const agents = Array.from(swarmState.agents.values());
  const unverifiedAgents = agents.filter(a => a.security.verificationStatus !== 'verified');
  const criticalAgents = agents.filter(a => a.securityLevel === 'critical');
  
  res.json({
    totalAgents: agents.length,
    verifiedAgents: agents.length - unverifiedAgents.length,
    unverifiedAgents: unverifiedAgents.length,
    criticalAgents: criticalAgents.length,
    blockedIPs: swarmState.security.blockedIPs.size,
    suspiciousActivities: swarmState.security.suspiciousActivities.length,
    alerts: swarmState.alerts.filter(a => a.type === 'security' && a.status === 'active').length
  });
});

// Get all alerts
router.get('/alerts', (req, res) => {
  res.json(swarmState.alerts);
});

// Get security events
router.get('/events', (req, res) => {
  const securityEvents = swarmState.events.filter(e => e.source === 'security');
  res.json(securityEvents);
});

module.exports = router;