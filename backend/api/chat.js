const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { swarmState } = require('../utils/storage');
const { authenticate, authorize } = require('../utils/auth');
const router = express.Router();

router.use(authenticate);

// Get chat conversations
router.get('/conversations', (req, res) => {
  const { agent_id } = req.query;
  
  let conversations = Array.from(swarmState.chat.conversations.values());
  
  if (agent_id) {
    conversations = conversations.filter(c => 
      c.participants.includes(agent_id) || 
      c.participants.includes(req.user.id)
    );
  } else {
    // Filter conversations that include the current user
    conversations = conversations.filter(c => 
      c.participants.includes(req.user.id)
    );
  }
  
  // Sort by last activity
  conversations.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
  
  res.json(conversations);
});

// Get specific conversation
router.get('/conversations/:id', (req, res) => {
  const { id } = req.params;
  const conversation = swarmState.chat.conversations.get(id);
  
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  
  // Check if user has access to this conversation
  if (!conversation.participants.includes(req.user.id) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  res.json(conversation);
});

// Create new conversation
router.post('/conversations', (req, res) => {
  const { agent_id, title } = req.body;
  
  if (!agent_id) {
    return res.status(400).json({ error: 'Agent ID is required' });
  }
  
  // Check if agent exists
  if (!swarmState.agents.has(agent_id)) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  const conversationId = uuidv4();
  const conversation = {
    id: conversationId,
    title: title || `Chat with ${swarmState.agents.get(agent_id).name}`,
    participants: [req.user.id, agent_id],
    messages: [],
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    status: 'active',
    metadata: {
      agentName: swarmState.agents.get(agent_id).name,
      userRole: req.user.role
    }
  };
  
  swarmState.chat.conversations.set(conversationId, conversation);
  
  res.status(201).json(conversation);
});

// Get messages for a conversation
router.get('/conversations/:id/messages', (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 50 } = req.query;
  
  const conversation = swarmState.chat.conversations.get(id);
  
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  
  // Check access
  if (!conversation.participants.includes(req.user.id) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const messages = conversation.messages || [];
  const startIndex = (page - 1) * limit;
  const paginatedMessages = messages
    .slice(startIndex, startIndex + parseInt(limit))
    .reverse(); // Show newest first
  
  res.json({
    messages: paginatedMessages,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: messages.length,
      pages: Math.ceil(messages.length / limit)
    }
  });
});

// Send message
router.post('/conversations/:id/messages', (req, res) => {
  const { id } = req.params;
  const { content, type = 'text' } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: 'Message content is required' });
  }
  
  const conversation = swarmState.chat.conversations.get(id);
  
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  
  // Check access
  if (!conversation.participants.includes(req.user.id) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const messageId = uuidv4();
  const message = {
    id: messageId,
    conversationId: id,
    senderId: req.user.id,
    senderName: req.user.username,
    senderType: 'user',
    content,
    type,
    timestamp: new Date().toISOString(),
    status: 'sent',
    metadata: {}
  };
  
  // Add message to conversation
  if (!conversation.messages) {
    conversation.messages = [];
  }
  conversation.messages.push(message);
  conversation.lastActivity = new Date().toISOString();
  
  swarmState.chat.conversations.set(id, conversation);
  
  // Simulate agent response for demo purposes
  setTimeout(() => {
    generateAgentResponse(id, message);
  }, 1000 + Math.random() * 3000);
  
  res.status(201).json(message);
});

// Update message status
router.patch('/messages/:messageId/status', (req, res) => {
  const { messageId } = req.params;
  const { status } = req.body;
  
  if (!['sent', 'delivered', 'read'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  // Find conversation containing the message
  let found = false;
  for (const conversation of swarmState.chat.conversations.values()) {
    const messageIndex = conversation.messages?.findIndex(m => m.id === messageId);
    if (messageIndex !== -1) {
      conversation.messages[messageIndex].status = status;
      conversation.messages[messageIndex].statusUpdatedAt = new Date().toISOString();
      swarmState.chat.conversations.set(conversation.id, conversation);
      found = true;
      break;
    }
  }
  
  if (!found) {
    return res.status(404).json({ error: 'Message not found' });
  }
  
  res.json({ message: 'Status updated successfully' });
});

// Get chat analytics
router.get('/analytics', authorize(['admin', 'operator']), (req, res) => {
  const conversations = Array.from(swarmState.chat.conversations.values());
  const allMessages = conversations.reduce((acc, conv) => 
    acc.concat(conv.messages || []), []
  );
  
  const analytics = {
    totalConversations: conversations.length,
    activeConversations: conversations.filter(c => c.status === 'active').length,
    totalMessages: allMessages.length,
    messagesPerDay: getMessagesPerDay(allMessages),
    responseTimes: calculateResponseTimes(conversations),
    mostActiveAgents: getMostActiveAgents(conversations),
    userEngagement: getUserEngagement(allMessages)
  };
  
  res.json(analytics);
});

// Archive conversation
router.patch('/conversations/:id/archive', authorize(['admin', 'operator']), (req, res) => {
  const { id } = req.params;
  const conversation = swarmState.chat.conversations.get(id);
  
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  
  conversation.status = 'archived';
  conversation.archivedAt = new Date().toISOString();
  conversation.archivedBy = req.user.username;
  
  swarmState.chat.conversations.set(id, conversation);
  
  res.json({ message: 'Conversation archived successfully' });
});

// Helper function to generate agent responses
function generateAgentResponse(conversationId, userMessage) {
  const conversation = swarmState.chat.conversations.get(conversationId);
  if (!conversation) return;
  
  const agentId = conversation.participants.find(p => p !== userMessage.senderId);
  const agent = swarmState.agents.get(agentId);
  if (!agent) return;
  
  // Generate contextual responses based on message content
  const responses = [
    "I understand your request. Let me process that for you.",
    "Thank you for the information. I'm analyzing the data now.",
    "Task received and acknowledged. Initiating processing sequence.",
    "I'm currently working on your request. Expected completion time: 5-10 minutes.",
    "Request processed successfully. Results are available in the system.",
    "I need additional parameters to complete this task. Could you provide more details?",
    "Task completed. Performance metrics have been updated.",
    "I'm experiencing some processing delays. Please allow extra time for completion.",
    "Your request has been added to my task queue. Current position: 2nd in line.",
    "All systems operational. Ready to process your next request."
  ];
  
  const responseContent = responses[Math.floor(Math.random() * responses.length)];
  
  const responseMessage = {
    id: uuidv4(),
    conversationId,
    senderId: agentId,
    senderName: agent.name,
    senderType: 'agent',
    content: responseContent,
    type: 'text',
    timestamp: new Date().toISOString(),
    status: 'sent',
    metadata: {
      agentType: agent.type,
      processingTime: Math.random() * 2000 + 500
    }
  };
  
  conversation.messages.push(responseMessage);
  conversation.lastActivity = new Date().toISOString();
  
  swarmState.chat.conversations.set(conversationId, conversation);
  
  // Add chat event
  swarmState.events.push({
    id: uuidv4(),
    type: 'agent_message',
    message: `Agent ${agent.name} sent a message`,
    timestamp: new Date().toISOString(),
    severity: 'info',
    source: 'chat'
  });
}

function getMessagesPerDay(messages) {
  const messagesByDay = {};
  messages.forEach(message => {
    const day = new Date(message.timestamp).toISOString().split('T')[0];
    messagesByDay[day] = (messagesByDay[day] || 0) + 1;
  });
  
  return Object.entries(messagesByDay).map(([date, count]) => ({
    date,
    count
  }));
}

function calculateResponseTimes(conversations) {
  const responseTimes = [];
  
  conversations.forEach(conversation => {
    if (!conversation.messages) return;
    
    for (let i = 1; i < conversation.messages.length; i++) {
      const prevMessage = conversation.messages[i - 1];
      const currMessage = conversation.messages[i];
      
      if (prevMessage.senderType !== currMessage.senderType) {
        const responseTime = new Date(currMessage.timestamp) - new Date(prevMessage.timestamp);
        responseTimes.push({
          time: responseTime,
          agentId: currMessage.senderType === 'agent' ? currMessage.senderId : prevMessage.senderId
        });
      }
    }
  });
  
  const avgResponseTime = responseTimes.length > 0 ? 
    responseTimes.reduce((sum, rt) => sum + rt.time, 0) / responseTimes.length : 0;
  
  return {
    average: avgResponseTime,
    count: responseTimes.length,
    breakdown: responseTimes
  };
}

function getMostActiveAgents(conversations) {
  const agentActivity = {};
  
  conversations.forEach(conversation => {
    conversation.participants?.forEach(participantId => {
      if (swarmState.agents.has(participantId)) {
        const agent = swarmState.agents.get(participantId);
        const messageCount = conversation.messages?.filter(m => m.senderId === participantId).length || 0;
        
        if (!agentActivity[participantId]) {
          agentActivity[participantId] = {
            id: participantId,
            name: agent.name,
            conversations: 0,
            messages: 0
          };
        }
        
        agentActivity[participantId].conversations++;
        agentActivity[participantId].messages += messageCount;
      }
    });
  });
  
  return Object.values(agentActivity)
    .sort((a, b) => b.messages - a.messages)
    .slice(0, 10);
}

function getUserEngagement(messages) {
  const userMessages = messages.filter(m => m.senderType === 'user');
  const agentMessages = messages.filter(m => m.senderType === 'agent');
  
  return {
    userMessages: userMessages.length,
    agentMessages: agentMessages.length,
    ratio: userMessages.length > 0 ? agentMessages.length / userMessages.length : 0,
    avgUserMessageLength: userMessages.length > 0 ? 
      userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length : 0,
    avgAgentMessageLength: agentMessages.length > 0 ? 
      agentMessages.reduce((sum, m) => sum + m.content.length, 0) / agentMessages.length : 0
  };
}

module.exports = router;