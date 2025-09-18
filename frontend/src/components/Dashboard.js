import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import useApi from '../hooks/useApi';

const Dashboard = () => {
  const [swarmStatus, setSwarmStatus] = useState(null);
  const [agents, setAgents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [revenueData, setRevenueData] = useState(null);
  const [chatAnalytics, setChatAnalytics] = useState(null);
  const [recentConversations, setRecentConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const api = useApi();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [statusRes, agentsRes, tasksRes, eventsRes, revenueRes, chatRes, conversationsRes] = await Promise.all([
        api.get('/api/swarm/status'),
        api.get('/api/agents'),
        api.get('/api/tasks'),
        api.get('/api/swarm/events?limit=10'),
        api.get('/api/revenue/overview?timeframe=7d').catch(() => ({ data: null })),
        api.get('/api/chat/analytics').catch(() => ({ data: null })),
        api.get('/api/chat/conversations').catch(() => ({ data: [] }))
      ]);
      
      setSwarmStatus(statusRes.data);
      setAgents(agentsRes.data);
      setTasks(tasksRes.data);
      setRecentEvents(eventsRes.data);
      setRevenueData(revenueRes.data);
      setChatAnalytics(chatRes.data);
      setRecentConversations(conversationsRes.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
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

  const activeAgents = agents.filter(a => a.status === 'active' || a.status === 'busy');
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
  const pendingTasks = tasks.filter(t => t.status === 'pending');

  return (
    <div className="dashboard">
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <h2>Dashboard</h2>
            <p className="text-muted">Swarm Command Center Overview</p>
          </div>
        </div>

        {/* Revenue Cards */}
        {revenueData && (
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card bg-gradient text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h3 className="mb-0">${revenueData.summary.totalRevenue.toLocaleString()}</h3>
                      <p className="mb-0">Total Revenue</p>
                    </div>
                    <div className="align-self-center">
                      <i className="fas fa-dollar-sign fa-2x"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-gradient text-white" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h3 className="mb-0">${revenueData.summary.profit.toLocaleString()}</h3>
                      <p className="mb-0">Net Profit</p>
                    </div>
                    <div className="align-self-center">
                      <i className="fas fa-chart-line fa-2x"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-gradient text-white" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h3 className="mb-0">{Math.round(revenueData.summary.profitMargin)}%</h3>
                      <p className="mb-0">Profit Margin</p>
                    </div>
                    <div className="align-self-center">
                      <i className="fas fa-percentage fa-2x"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-gradient text-white" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h3 className="mb-0">{revenueData.summary.transactionCount}</h3>
                      <p className="mb-0">Transactions</p>
                    </div>
                    <div className="align-self-center">
                      <i className="fas fa-receipt fa-2x"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Cards */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card bg-primary text-white">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <div>
                    <h3 className="mb-0">{agents.length}</h3>
                    <p className="mb-0">Total Agents</p>
                  </div>
                  <div className="align-self-center">
                    <i className="fas fa-robot fa-2x"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <div>
                    <h3 className="mb-0">{activeAgents.length}</h3>
                    <p className="mb-0">Active Agents</p>
                  </div>
                  <div className="align-self-center">
                    <i className="fas fa-check-circle fa-2x"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info text-white">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <div>
                    <h3 className="mb-0">{inProgressTasks.length}</h3>
                    <p className="mb-0">Active Tasks</p>
                  </div>
                  <div className="align-self-center">
                    <i className="fas fa-tasks fa-2x"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-warning text-white">
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <div>
                    <h3 className="mb-0">{pendingTasks.length}</h3>
                    <p className="mb-0">Pending Tasks</p>
                  </div>
                  <div className="align-self-center">
                    <i className="fas fa-clock fa-2x"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Swarm Status */}
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Swarm Status</h5>
              </div>
              <div className="card-body">
                {swarmStatus && (
                  <>
                    <div className="d-flex justify-content-between mb-3">
                      <span>Status:</span>
                      <span className="badge bg-success">{swarmStatus.status}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-3">
                      <span>Uptime:</span>
                      <span>{swarmStatus.uptime}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-3">
                      <span>System Load:</span>
                      <span>{swarmStatus.metrics.systemLoad}%</span>
                    </div>
                    <div className="d-flex justify-content-between mb-3">
                      <span>Success Rate:</span>
                      <span>{Math.round(swarmStatus.metrics.successRate * 100)}%</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Avg Response Time:</span>
                      <span>{swarmStatus.metrics.averageResponseTime}ms</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Recent Events */}
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Recent Events</h5>
              </div>
              <div className="card-body">
                {recentEvents.length === 0 ? (
                  <p className="text-muted">No recent events</p>
                ) : (
                  <div className="list-group list-group-flush">
                    {recentEvents.map((event, index) => (
                      <div key={index} className="list-group-item px-0">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="fw-bold">{event.message}</div>
                            <small className="text-muted">{event.type}</small>
                          </div>
                          <small className="text-muted">
                            {new Date(event.timestamp).toLocaleString()}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Agents */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Agent Status Overview</h5>
              </div>
              <div className="card-body">
                {agents.length === 0 ? (
                  <p className="text-muted">No agents registered</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Type</th>
                          <th>Status</th>
                          <th>Last Seen</th>
                          <th>Success Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {agents.slice(0, 5).map(agent => (
                          <tr key={agent.id}>
                            <td>{agent.name}</td>
                            <td>
                              <span className="badge bg-secondary">{agent.type}</span>
                            </td>
                            <td>
                              <span className={`badge bg-${agent.status === 'active' ? 'success' : agent.status === 'busy' ? 'warning' : 'secondary'}`}>
                                {agent.status}
                              </span>
                            </td>
                            <td>
                              <small>{new Date(agent.lastSeen).toLocaleString()}</small>
                            </td>
                            <td>{Math.round(agent.metrics.successRate * 100)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;