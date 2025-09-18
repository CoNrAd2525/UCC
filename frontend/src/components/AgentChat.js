import React, { useState, useEffect, useRef } from 'react';
import useApi from '../hooks/useApi';

const AgentChat = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [agents, setAgents] = useState([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [selectedAgentForChat, setSelectedAgentForChat] = useState('');
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef(null);
  const api = useApi();

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      
      // Set up polling for new messages
      const interval = setInterval(() => {
        fetchMessages(selectedConversation.id);
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [conversationsRes, agentsRes] = await Promise.all([
        api.get('/api/chat/conversations'),
        api.get('/api/agents')
      ]);
      
      setConversations(conversationsRes.data);
      setAgents(agentsRes.data);
      
      // Select first conversation if available
      if (conversationsRes.data.length > 0) {
        setSelectedConversation(conversationsRes.data[0]);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await api.get(`/api/chat/conversations/${conversationId}/messages`);
      setMessages(response.data.messages.reverse()); // Reverse to show oldest first
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    try {
      const response = await api.post(`/api/chat/conversations/${selectedConversation.id}/messages`, {
        content: newMessage,
        type: 'text'
      });
      
      // Add message to current messages
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
      
      // Refresh messages after a short delay to get agent response
      setTimeout(() => {
        fetchMessages(selectedConversation.id);
      }, 1000);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const createNewChat = async () => {
    if (!selectedAgentForChat) return;
    
    try {
      const response = await api.post('/api/chat/conversations', {
        agent_id: selectedAgentForChat
      });
      
      setConversations(prev => [response.data, ...prev]);
      setSelectedConversation(response.data);
      setShowNewChatModal(false);
      setSelectedAgentForChat('');
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="agent-chat">
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2>Agent Communication</h2>
                <p className="text-muted">Chat with agents in real-time</p>
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => setShowNewChatModal(true)}
              >
                <i className="fas fa-plus me-2"></i>New Chat
              </button>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Conversations Sidebar */}
          <div className="col-md-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Conversations</h5>
              </div>
              <div className="card-body p-0">
                {conversations.length === 0 ? (
                  <div className="p-3 text-center text-muted">
                    No conversations yet. Start a new chat!
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {conversations.map(conversation => (
                      <div
                        key={conversation.id}
                        className={`list-group-item list-group-item-action cursor-pointer ${
                          selectedConversation?.id === conversation.id ? 'active' : ''
                        }`}
                        onClick={() => setSelectedConversation(conversation)}
                      >
                        <div className="d-flex w-100 justify-content-between">
                          <h6 className="mb-1">{conversation.title}</h6>
                          <small>{new Date(conversation.lastActivity).toLocaleDateString()}</small>
                        </div>
                        <p className="mb-1 text-muted small">
                          {conversation.metadata?.agentName}
                        </p>
                        <small>
                          <span className={`badge bg-${conversation.status === 'active' ? 'success' : 'secondary'}`}>
                            {conversation.status}
                          </span>
                        </small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="col-md-8">
            {selectedConversation ? (
              <div className="card">
                <div className="card-header">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-0">{selectedConversation.title}</h5>
                      <small className="text-muted">
                        Last active: {formatTimestamp(selectedConversation.lastActivity)}
                      </small>
                    </div>
                    <div>
                      <span className={`badge bg-${selectedConversation.status === 'active' ? 'success' : 'secondary'}`}>
                        {selectedConversation.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Messages Area */}
                <div className="card-body" style={{ height: '400px', overflowY: 'auto' }}>
                  {messages.length === 0 ? (
                    <div className="text-center text-muted mt-5">
                      <i className="fas fa-comments fa-3x mb-3"></i>
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    <div>
                      {messages.map(message => (
                        <div
                          key={message.id}
                          className={`mb-3 d-flex ${
                            message.senderType === 'user' ? 'justify-content-end' : 'justify-content-start'
                          }`}
                        >
                          <div
                            className={`message-bubble p-3 rounded ${
                              message.senderType === 'user'
                                ? 'bg-primary text-white'
                                : 'bg-light border'
                            }`}
                            style={{ maxWidth: '70%' }}
                          >
                            <div className="message-content">
                              {message.content}
                            </div>
                            <div className={`message-meta mt-2 small ${
                              message.senderType === 'user' ? 'text-white-50' : 'text-muted'
                            }`}>
                              <div>{message.senderName}</div>
                              <div>{formatTimestamp(message.timestamp)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
                
                {/* Message Input */}
                <div className="card-footer">
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <button 
                      className="btn btn-primary" 
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                    >
                      <i className="fas fa-paper-plane"></i>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="card-body text-center">
                  <i className="fas fa-comments fa-3x text-muted mb-3"></i>
                  <h5>Select a conversation to start chatting</h5>
                  <p className="text-muted">Choose a conversation from the sidebar or start a new chat</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Start New Chat</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowNewChatModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Select Agent</label>
                  <select 
                    className="form-select" 
                    value={selectedAgentForChat} 
                    onChange={(e) => setSelectedAgentForChat(e.target.value)}
                  >
                    <option value="">Choose an agent...</option>
                    {agents.map(agent => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} ({agent.type}) - {agent.status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowNewChatModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={createNewChat}
                  disabled={!selectedAgentForChat}
                >
                  Start Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentChat;