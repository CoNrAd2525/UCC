const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { swarmState } = require('../utils/storage');
const { authenticate, authorize } = require('../utils/auth');
const router = express.Router();

// Middleware
router.use(authenticate);

// Get all agents
router.get('/', (req, res) => {
  const agents = Array.from(swarmState.agents.values());
  res.json(agents);
});

// Get agent by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const agent = swarmState.agents.get(id);
  
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  res.json(agent);
});

// Register new agent
router.post('/', authorize(['admin', 'operator']), (req, res) => {
  const {
    name,
    type,
    capabilities,
    securityLevel,
    encryptionLevel
  } = req.body;

  if (!name || !type || !capabilities) {
    return res.status(400).json({ error: 'Name, type, and capabilities are required' });
  }

  const agentId = uuidv4();
  const agent = {
    id: agentId,
    name,
    type,
    status: 'inactive',
    capabilities: Array.isArray(capabilities) ? capabilities : [capabilities],
    lastSeen: new Date().toISOString(),
    securityLevel: securityLevel || 'medium',
    metrics: {
      tasksCompleted: 0,
      successRate: 1.0,
      averageResponseTime: 0,
      uptime: 100.0
    },
    security: {
      verificationStatus: 'pending',
      lastVerified: null,
      encryptionLevel: encryptionLevel || 'AES-128'
    }
  };

  swarmState.agents.set(agentId, agent);
  swarmState.metrics.totalAgents = swarmState.agents.size;

  // Add event
  swarmState.events.push({
    id: uuidv4(),
    type: 'agent_registered',
    message: `Agent ${name} registered successfully`,
    timestamp: new Date().toISOString(),
    severity: 'info',
    source: 'system'
  });

  res.status(201).json(agent);
});

// Update agent
router.put('/:id', authorize(['admin', 'operator']), (req, res) => {
  const { id } = req.params;
  const agent = swarmState.agents.get(id);
  
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  const updates = req.body;
  const updatedAgent = { ...agent, ...updates };
  
  // Preserve certain fields
  updatedAgent.id = id;
  updatedAgent.lastSeen = new Date().toISOString();
  
  swarmState.agents.set(id, updatedAgent);
  
  res.json(updatedAgent);
});

// Update agent status
router.patch('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const agent = swarmState.agents.get(id);
  
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  if (!['active', 'inactive', 'busy', 'error'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  agent.status = status;
  agent.lastSeen = new Date().toISOString();
  
  swarmState.agents.set(id, agent);
  
  // Update metrics
  swarmState.metrics.activeAgents = Array.from(swarmState.agents.values())
    .filter(a => a.status === 'active' || a.status === 'busy').length;
  
  res.json(agent);
});

// Verify agent security
router.post('/:id/verify', authorize(['admin']), (req, res) => {
  const { id } = req.params;
  const agent = swarmState.agents.get(id);
  
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  agent.security.verificationStatus = 'verified';
  agent.security.lastVerified = new Date().toISOString();
  
  swarmState.agents.set(id, agent);
  
  // Add event
  swarmState.events.push({
    id: uuidv4(),
    type: 'agent_verified',
    message: `Agent ${agent.name} has been verified`,
    timestamp: new Date().toISOString(),
    severity: 'info',
    source: 'security'
  });

  res.json({ message: 'Agent verified successfully', agent });
});

// Delete agent
router.delete('/:id', authorize(['admin']), (req, res) => {
  const { id } = req.params;
  const agent = swarmState.agents.get(id);
  
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  swarmState.agents.delete(id);
  swarmState.metrics.totalAgents = swarmState.agents.size;
  swarmState.metrics.activeAgents = Array.from(swarmState.agents.values())
    .filter(a => a.status === 'active' || a.status === 'busy').length;

  // Add event
  swarmState.events.push({
    id: uuidv4(),
    type: 'agent_deregistered',
    message: `Agent ${agent.name} has been removed`,
    timestamp: new Date().toISOString(),
    severity: 'warning',
    source: 'system'
  });

  res.json({ message: 'Agent deleted successfully' });
});

// Get agent metrics
router.get('/:id/metrics', (req, res) => {
  const { id } = req.params;
  const agent = swarmState.agents.get(id);
  
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  res.json(agent.metrics);
});

// Update agent metrics
router.patch('/:id/metrics', authorize(['admin', 'operator']), (req, res) => {
  const { id } = req.params;
  const agent = swarmState.agents.get(id);
  
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  const metrics = req.body;
  agent.metrics = { ...agent.metrics, ...metrics };
  agent.lastSeen = new Date().toISOString();
  
  swarmState.agents.set(id, agent);
  
  res.json(agent.metrics);
});

// Agent heartbeat
router.post('/:id/heartbeat', (req, res) => {
  const { id } = req.params;
  const agent = swarmState.agents.get(id);
  
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  agent.lastSeen = new Date().toISOString();
  
  // Update status to active if it was inactive
  if (agent.status === 'inactive') {
    agent.status = 'active';
  }
  
  swarmState.agents.set(id, agent);
  
  res.json({ 
    message: 'Heartbeat received',
    timestamp: agent.lastSeen,
    status: agent.status
  });
});

module.exports = router;