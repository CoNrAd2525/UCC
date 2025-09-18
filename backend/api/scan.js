const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { swarmState } = require('../utils/storage');
const { authenticate, authorize } = require('../utils/auth');
const router = express.Router();

// Middleware to authenticate and authorize
router.use(authenticate);
router.use(authorize(['admin', 'operator']));

// Initiate agent scan
router.post('/initiate', async (req, res) => {
  const scanId = uuidv4();
  const scan = {
    id: scanId,
    status: 'initiated',
    startTime: new Date().toISOString(),
    endTime: null,
    agentsScanned: 0,
    agentsFound: [],
    issuesFound: [],
    progress: 0,
    parameters: req.body.parameters || {}
  };

  // Store scan in swarmState
  if (!swarmState.scans) {
    swarmState.scans = new Map();
  }
  swarmState.scans.set(scanId, scan);

  // Start scanning process (async)
  setImmediate(() => executeAgentScan(scanId));

  res.json({ 
    message: 'Agent scan initiated',
    scanId,
    status: scan.status
  });
});

// Get scan status
router.get('/status/:scanId', (req, res) => {
  const { scanId } = req.params;
  
  if (!swarmState.scans || !swarmState.scans.has(scanId)) {
    return res.status(404).json({ error: 'Scan not found' });
  }

  const scan = swarmState.scans.get(scanId);
  res.json(scan);
});

// Get all scans
router.get('/history', (req, res) => {
  if (!swarmState.scans) {
    return res.json([]);
  }

  const scans = Array.from(swarmState.scans.values()).sort((a, b) => 
    new Date(b.startTime) - new Date(a.startTime)
  );

  res.json(scans);
});

// Get scan report
router.get('/report/:scanId', (req, res) => {
  const { scanId } = req.params;
  
  if (!swarmState.scans || !swarmState.scans.has(scanId)) {
    return res.status(404).json({ error: 'Scan not found' });
  }

  const scan = swarmState.scans.get(scanId);
  
  if (scan.status !== 'completed') {
    return res.status(400).json({ error: 'Scan not completed yet' });
  }

  // Generate detailed report
  const report = {
    scanId,
    summary: {
      startTime: scan.startTime,
      endTime: scan.endTime,
      duration: new Date(scan.endTime) - new Date(scan.startTime),
      totalAgents: scan.agentsScanned,
      healthyAgents: scan.agentsFound.filter(a => a.health === 'healthy').length,
      issuesFound: scan.issuesFound.length,
      criticalIssues: scan.issuesFound.filter(i => i.severity === 'critical').length
    },
    agents: scan.agentsFound,
    issues: scan.issuesFound,
    recommendations: generateRecommendations(scan)
  };

  res.json(report);
});

// Delete scan
router.delete('/:scanId', authorize(['admin']), (req, res) => {
  const { scanId } = req.params;
  
  if (!swarmState.scans || !swarmState.scans.has(scanId)) {
    return res.status(404).json({ error: 'Scan not found' });
  }

  swarmState.scans.delete(scanId);
  res.json({ message: 'Scan deleted successfully' });
});

// Execute agent scan
async function executeAgentScan(scanId) {
  if (!swarmState.scans || !swarmState.scans.has(scanId)) {
    return;
  }

  const scan = swarmState.scans.get(scanId);
  scan.status = 'scanning';
  scan.agentsFound = [];
  scan.issuesFound = [];

  const agents = Array.from(swarmState.agents.values());
  const totalAgents = agents.length;

  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];
    
    try {
      // Simulate agent health check
      const agentHealth = await checkAgentHealth(agent);
      scan.agentsFound.push(agentHealth);
      
      // Check for issues
      const issues = checkAgentIssues(agent, agentHealth);
      scan.issuesFound.push(...issues);
      
    } catch (error) {
      scan.issuesFound.push({
        type: 'scan_error',
        agentId: agent.id,
        message: `Failed to scan agent: ${error.message}`,
        severity: 'error',
        timestamp: new Date().toISOString()
      });
    }

    // Update progress
    scan.agentsScanned = i + 1;
    scan.progress = Math.round(((i + 1) / totalAgents) * 100);
    
    // Update scan in storage
    swarmState.scans.set(scanId, scan);
    
    // Simulate delay for scanning
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  }

  // Complete scan
  scan.status = 'completed';
  scan.endTime = new Date().toISOString();
  swarmState.scans.set(scanId, scan);
}

// Check agent health
async function checkAgentHealth(agent) {
  // In a real implementation, this would make HTTP requests to the agent's endpoint
  // For this example, we'll simulate based on agent data
  
  const lastSeen = new Date(agent.lastSeen);
  const timeSinceLastSeen = Date.now() - lastSeen.getTime();
  
  const health = {
    id: agent.id,
    name: agent.name,
    type: agent.type,
    status: agent.status,
    lastSeen: agent.lastSeen,
    responseTime: Math.random() * 2000 + 500, // Simulated response time
    health: 'healthy',
    capabilities: agent.capabilities,
    metrics: agent.metrics,
    security: agent.security
  };

  // Determine health status
  if (timeSinceLastSeen > 300000) { // 5 minutes
    health.health = 'unresponsive';
  } else if (timeSinceLastSeen > 60000) { // 1 minute
    health.health = 'slow';
  } else if (agent.metrics.successRate < 0.8) {
    health.health = 'degraded';
  } else if (agent.metrics.averageResponseTime > 3000) {
    health.health = 'slow';
  }

  return health;
}

// Check for agent issues
function checkAgentIssues(agent, agentHealth) {
  const issues = [];
  
  // Check responsiveness
  if (agentHealth.health === 'unresponsive') {
    issues.push({
      type: 'unresponsive_agent',
      agentId: agent.id,
      message: `Agent has not responded for over 5 minutes`,
      severity: 'critical',
      timestamp: new Date().toISOString()
    });
  }
  
  // Check performance
  if (agent.metrics.successRate < 0.8) {
    issues.push({
      type: 'poor_performance',
      agentId: agent.id,
      message: `Agent success rate (${Math.round(agent.metrics.successRate * 100)}%) below threshold`,
      severity: 'warning',
      timestamp: new Date().toISOString()
    });
  }
  
  // Check response time
  if (agent.metrics.averageResponseTime > 3000) {
    issues.push({
      type: 'slow_response',
      agentId: agent.id,
      message: `Agent response time (${agent.metrics.averageResponseTime}ms) above threshold`,
      severity: 'warning',
      timestamp: new Date().toISOString()
    });
  }
  
  // Check security
  if (agent.securityLevel === 'critical' && agent.security.verificationStatus !== 'verified') {
    issues.push({
      type: 'security_verification',
      agentId: agent.id,
      message: `Critical agent not verified`,
      severity: 'critical',
      timestamp: new Date().toISOString()
    });
  }
  
  // Check uptime
  if (agent.metrics.uptime < 90) {
    issues.push({
      type: 'low_uptime',
      agentId: agent.id,
      message: `Agent uptime (${agent.metrics.uptime}%) below acceptable threshold`,
      severity: 'warning',
      timestamp: new Date().toISOString()
    });
  }
  
  return issues;
}

// Generate recommendations based on scan results
function generateRecommendations(scan) {
  const recommendations = [];
  
  // Check for unresponsive agents
  const unresponsiveCount = scan.agentsFound.filter(a => a.health === 'unresponsive').length;
  if (unresponsiveCount > 0) {
    recommendations.push({
      priority: 'high',
      category: 'agent_health',
      message: `${unresponsiveCount} agents are unresponsive. Check network connectivity and agent processes.`,
      action: 'Restart unresponsive agents or investigate network issues.'
    });
  }
  
  // Check for performance issues
  const degradedCount = scan.agentsFound.filter(a => a.health === 'degraded').length;
  if (degradedCount > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'performance',
      message: `${degradedCount} agents have degraded performance.`,
      action: 'Review agent logs and optimize resource allocation.'
    });
  }
  
  // Check for security issues
  const securityIssues = scan.issuesFound.filter(i => i.type === 'security_verification');
  if (securityIssues.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'security',
      message: `${securityIssues.length} critical agents require verification.`,
      action: 'Verify critical agents immediately and update security tokens.'
    });
  }
  
  // Check for slow agents
  const slowCount = scan.agentsFound.filter(a => a.health === 'slow').length;
  if (slowCount > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'performance',
      message: `${slowCount} agents have slow response times.`,
      action: 'Optimize agent processing or increase resource allocation.'
    });
  }
  
  // General optimization recommendations
  const totalAgents = scan.agentsFound.length;
  if (totalAgents > 0) {
    const avgSuccessRate = scan.agentsFound.reduce((sum, a) => sum + a.metrics.successRate, 0) / totalAgents;
    
    if (avgSuccessRate < 0.9) {
      recommendations.push({
        priority: 'medium',
        category: 'optimization',
        message: `Overall success rate (${Math.round(avgSuccessRate * 100)}%) could be improved.`,
        action: 'Implement load balancing and optimize task distribution.'
      });
    }
  }
  
  // Always include general recommendations
  recommendations.push({
    priority: 'low',
    category: 'maintenance',
    message: 'Regular system maintenance recommended.',
    action: 'Schedule periodic health checks and system updates.'
  });
  
  return recommendations;
}

module.exports = router;