// In-memory storage for development
// Note: This will reset on every deployment and is not suitable for production

const users = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@swarm.local',
    password: '$2b$10$rOeJgYcZlg8x7nJl7YdROO7PdmLKG8yGNKxZpjIYQK4RJqVgNq1qK', // 'admin123'
    role: 'admin',
    createdAt: new Date().toISOString(),
    lastLogin: null
  },
  {
    id: '2',
    username: 'operator',
    email: 'operator@swarm.local',
    password: '$2b$10$rOeJgYcZlg8x7nJl7YdROO7PdmLKG8yGNKxZpjIYQK4RJqVgNq1qK', // 'operator123'
    role: 'operator',
    createdAt: new Date().toISOString(),
    lastLogin: null
  }
];

const swarmState = {
  agents: new Map([
    ['agent-1', {
      id: 'agent-1',
      name: 'Scanner Agent Alpha',
      type: 'scanner',
      status: 'active',
      capabilities: ['scan', 'report', 'monitor'],
      lastSeen: new Date().toISOString(),
      securityLevel: 'high',
      metrics: {
        tasksCompleted: 145,
        successRate: 0.92,
        averageResponseTime: 1200,
        uptime: 95.5,
        totalRevenue: 1250.00,
        totalCosts: 150.00,
        profit: 1100.00
      },
      security: {
        verificationStatus: 'verified',
        lastVerified: new Date().toISOString(),
        encryptionLevel: 'AES-256'
      }
    }],
    ['agent-2', {
      id: 'agent-2',
      name: 'Control Agent Beta',
      type: 'controller',
      status: 'active',
      capabilities: ['control', 'coordinate', 'distribute'],
      lastSeen: new Date(Date.now() - 30000).toISOString(), // 30 seconds ago
      securityLevel: 'critical',
      metrics: {
        tasksCompleted: 89,
        successRate: 0.98,
        averageResponseTime: 800,
        uptime: 99.2,
        totalRevenue: 850.00,
        totalCosts: 100.00,
        profit: 750.00
      },
      security: {
        verificationStatus: 'verified',
        lastVerified: new Date().toISOString(),
        encryptionLevel: 'AES-256'
      }
    }],
    ['agent-3', {
      id: 'agent-3',
      name: 'Worker Agent Gamma',
      type: 'worker',
      status: 'busy',
      capabilities: ['execute', 'process', 'transform'],
      lastSeen: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
      securityLevel: 'medium',
      metrics: {
        tasksCompleted: 234,
        successRate: 0.75,
        averageResponseTime: 2100,
        uptime: 87.3,
        totalRevenue: 450.00,
        totalCosts: 200.00,
        profit: 250.00
      },
      security: {
        verificationStatus: 'pending',
        lastVerified: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        encryptionLevel: 'AES-128'
      }
    }]
  ]),
  tasks: new Map([
    ['task-1', {
      id: 'task-1',
      title: 'System Health Scan',
      description: 'Perform comprehensive health scan of all agents',
      type: 'scan',
      priority: 'high',
      status: 'in-progress',
      assignedTo: 'agent-1',
      createdBy: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedCompletion: new Date(Date.now() + 1800000).toISOString(), // 30 minutes from now
      progress: 65
    }],
    ['task-2', {
      id: 'task-2',
      title: 'Security Verification',
      description: 'Verify security credentials for all unverified agents',
      type: 'security',
      priority: 'critical',
      status: 'pending',
      assignedTo: null,
      createdBy: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedCompletion: null,
      progress: 0
    }]
  ]),
  events: [
    {
      id: 'event-1',
      type: 'agent_registered',
      message: 'Agent Scanner Agent Alpha registered successfully',
      timestamp: new Date().toISOString(),
      severity: 'info',
      source: 'system'
    },
    {
      id: 'event-2',
      type: 'security_alert',
      message: 'Agent Worker Agent Gamma requires security verification',
      timestamp: new Date().toISOString(),
      severity: 'warning',
      source: 'security'
    }
  ],
  alerts: [
    {
      id: 'alert-1',
      type: 'security',
      title: 'Unverified Agent Detected',
      message: 'Agent Worker Agent Gamma has not been verified for over 24 hours',
      severity: 'warning',
      status: 'active',
      createdAt: new Date().toISOString(),
      acknowledgedBy: null,
      resolvedAt: null
    }
  ],
  scans: new Map(),
  revenue: {
    transactions: new Map([
      ['txn-1', {
        id: 'txn-1',
        type: 'income',
        amount: 1250.00,
        description: 'Task completion - Data Analysis',
        category: 'services',
        agent_id: 'agent-1',
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        created_by: 'system'
      }],
      ['txn-2', {
        id: 'txn-2',
        type: 'expense',
        amount: 200.00,
        description: 'Server hosting costs',
        category: 'infrastructure',
        agent_id: null,
        timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        created_by: 'admin'
      }],
      ['txn-3', {
        id: 'txn-3',
        type: 'income',
        amount: 850.00,
        description: 'Task completion - Report Generation',
        category: 'services',
        agent_id: 'agent-2',
        timestamp: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        created_by: 'system'
      }]
    ])
  },
  chat: {
    conversations: new Map([
      ['conv-1', {
        id: 'conv-1',
        title: 'Chat with Scanner Agent Alpha',
        participants: ['1', 'agent-1'],
        messages: [
          {
            id: 'msg-1',
            conversationId: 'conv-1',
            senderId: '1',
            senderName: 'admin',
            senderType: 'user',
            content: 'How is the current scanning progress?',
            type: 'text',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            status: 'read'
          },
          {
            id: 'msg-2',
            conversationId: 'conv-1',
            senderId: 'agent-1',
            senderName: 'Scanner Agent Alpha',
            senderType: 'agent',
            content: 'Current scan is 75% complete. Expected completion in 10 minutes.',
            type: 'text',
            timestamp: new Date(Date.now() - 3500000).toISOString(),
            status: 'read'
          }
        ],
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        lastActivity: new Date(Date.now() - 3500000).toISOString(),
        status: 'active'
      }]
    ])
  },
  metrics: {
    totalAgents: 3,
    activeAgents: 2,
    totalTasks: 2,
    completedTasks: 0,
    failedTasks: 0,
    averageResponseTime: 1367,
    systemLoad: 45.2,
    successRate: 0.88
  },
  security: {
    blockedIPs: new Set(),
    suspiciousActivities: []
  }
};

module.exports = {
  users,
  swarmState
};