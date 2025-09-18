import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import useApi from '../hooks/useApi';

const Analytics = () => {
  const [revenueData, setRevenueData] = useState(null);
  const [chatAnalytics, setChatAnalytics] = useState(null);
  const [agentPerformance, setAgentPerformance] = useState([]);
  const [timeframe, setTimeframe] = useState('30d');
  const [loading, setLoading] = useState(true);
  
  const api = useApi();

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeframe]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const [revenueRes, chatRes, agentsRes] = await Promise.all([
        api.get(`/api/revenue/overview?timeframe=${timeframe}`),
        api.get('/api/chat/analytics'),
        api.get('/api/agents')
      ]);
      
      setRevenueData(revenueRes.data);
      setChatAnalytics(chatRes.data);
      
      // Process agent performance data
      const processedAgents = agentsRes.data.map(agent => ({
        name: agent.name,
        revenue: agent.metrics.totalRevenue || 0,
        costs: agent.metrics.totalCosts || 0,
        profit: (agent.metrics.totalRevenue || 0) - (agent.metrics.totalCosts || 0),
        successRate: Math.round(agent.metrics.successRate * 100),
        tasksCompleted: agent.metrics.tasksCompleted || 0,
        uptime: agent.metrics.uptime || 0
      }));
      
      setAgentPerformance(processedAgents);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const formatCurrency = (value) => `$${value.toLocaleString()}`;
  const formatPercent = (value) => `${value}%`;

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
    <div className="analytics">
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2>Analytics Dashboard</h2>
                <p className="text-muted">Comprehensive performance insights and metrics</p>
              </div>
              <div className="d-flex gap-2">
                <select 
                  className="form-select" 
                  value={timeframe} 
                  onChange={(e) => setTimeframe(e.target.value)}
                  style={{ width: 'auto' }}
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
                <button className="btn btn-outline-primary" onClick={fetchAnalyticsData}>
                  <i className="fas fa-sync-alt me-2"></i>Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Overview Cards */}
        {revenueData && (
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card bg-primary text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h3 className="mb-0">{formatCurrency(revenueData.summary.totalRevenue)}</h3>
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
              <div className="card bg-success text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h3 className="mb-0">{formatCurrency(revenueData.summary.profit)}</h3>
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
              <div className="card bg-info text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h3 className="mb-0">{formatPercent(Math.round(revenueData.summary.profitMargin))}</h3>
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
              <div className="card bg-warning text-white">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h3 className="mb-0">{formatCurrency(revenueData.summary.averageDailyRevenue)}</h3>
                      <p className="mb-0">Daily Avg</p>
                    </div>
                    <div className="align-self-center">
                      <i className="fas fa-calendar-day fa-2x"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="row mb-4">
          {/* Revenue Trend Chart */}
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Revenue Trend</h5>
              </div>
              <div className="card-body">
                {revenueData && revenueData.dailyBreakdown && (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueData.dailyBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={formatCurrency} />
                      <Tooltip 
                        formatter={(value, name) => [formatCurrency(value), name]}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stackId="1" 
                        stroke="#82ca9d" 
                        fill="#82ca9d" 
                        name="Revenue"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="costs" 
                        stackId="2" 
                        stroke="#ff7c7c" 
                        fill="#ff7c7c" 
                        name="Costs"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="profit" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        name="Profit"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Agent Performance Pie Chart */}
          <div className="col-lg-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Agent Revenue Distribution</h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={agentPerformance}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {agentPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-4">
          {/* Agent Performance Bar Chart */}
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Agent Performance Metrics</h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={agentPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="successRate" fill="#8884d8" name="Success Rate (%)" />
                    <Bar dataKey="uptime" fill="#82ca9d" name="Uptime (%)" />
                    <Bar dataKey="tasksCompleted" fill="#ffc658" name="Tasks Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Communication Stats */}
          <div className="col-lg-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Communication Analytics</h5>
              </div>
              <div className="card-body">
                {chatAnalytics && (
                  <>
                    <div className="d-flex justify-content-between mb-3">
                      <span>Total Conversations:</span>
                      <strong>{chatAnalytics.totalConversations}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-3">
                      <span>Active Chats:</span>
                      <strong>{chatAnalytics.activeConversations}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-3">
                      <span>Total Messages:</span>
                      <strong>{chatAnalytics.totalMessages}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-3">
                      <span>Avg Response Time:</span>
                      <strong>{Math.round(chatAnalytics.responseTimes?.average / 1000) || 0}s</strong>
                    </div>
                    
                    <hr />
                    
                    <h6>Most Active Agents</h6>
                    {chatAnalytics.mostActiveAgents?.slice(0, 3).map((agent, index) => (
                      <div key={agent.id} className="d-flex justify-content-between mb-2">
                        <span className="text-truncate">{agent.name}</span>
                        <span className="badge bg-primary">{agent.messages} msgs</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Categories */}
        {revenueData && revenueData.revenueByCategory && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Revenue by Category</h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Income</th>
                          <th>Expenses</th>
                          <th>Profit</th>
                          <th>Transactions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {revenueData.revenueByCategory.map((category, index) => (
                          <tr key={index}>
                            <td>
                              <span className="badge bg-secondary">{category.category}</span>
                            </td>
                            <td className="text-success">{formatCurrency(category.income)}</td>
                            <td className="text-danger">{formatCurrency(category.expense)}</td>
                            <td className={category.profit >= 0 ? 'text-success' : 'text-danger'}>
                              {formatCurrency(category.profit)}
                            </td>
                            <td>{category.transactionCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Performing Agents */}
        {revenueData && revenueData.topAgents && (
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Top Performing Agents</h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Agent</th>
                          <th>Total Revenue</th>
                          <th>Total Costs</th>
                          <th>Profit</th>
                          <th>Tasks Completed</th>
                          <th>Success Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {revenueData.topAgents.map((agent, index) => (
                          <tr key={agent.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className={`badge bg-${index < 3 ? 'warning' : 'secondary'} me-2`}>
                                  #{index + 1}
                                </div>
                                {agent.name}
                              </div>
                            </td>
                            <td className="text-success">{formatCurrency(agent.totalRevenue)}</td>
                            <td className="text-danger">{formatCurrency(agent.totalCosts)}</td>
                            <td className={agent.profit >= 0 ? 'text-success' : 'text-danger'}>
                              {formatCurrency(agent.profit)}
                            </td>
                            <td>{agent.tasksCompleted}</td>
                            <td>{formatPercent(Math.round(agent.successRate * 100))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;