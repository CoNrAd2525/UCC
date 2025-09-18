import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useApi from '../hooks/useApi';

const AgentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const api = useApi();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAgent();
  }, [id]);

  const fetchAgent = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/agents/${id}`);
      setAgent(res.data);
    } catch (e) {
      setError('Agent not found');
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    try {
      await api.post(`/api/agents/${id}/verify`);
      fetchAgent();
    } catch {}
  };

  const changeStatus = async (status) => {
    try {
      await api.patch(`/api/agents/${id}/status`, { status });
      fetchAgent();
    } catch {}
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

  if (!agent) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>Back</button>
      </div>
    );
  }

  return (
    <div className="agent-details">
      <div className="container-fluid">
        <div className="row mb-3">
          <div className="col-12 d-flex justify-content-between align-items-center">
            <div>
              <h2>{agent.name}</h2>
              <p className="text-muted">Agent ID: <code>{agent.id}</code></p>
            </div>
            <div className="d-flex gap-2">
              <div className="btn-group">
                <button className="btn btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">Set Status</button>
                <ul className="dropdown-menu">
                  {['active','inactive','busy','error'].map(s => (
                    <li key={s}><button className="dropdown-item" onClick={() => changeStatus(s)}>{s}</button></li>
                  ))}
                </ul>
              </div>
              {agent.security.verificationStatus !== 'verified' && (
                <button className="btn btn-success" onClick={verify}>Verify</button>
              )}
              <Link className="btn btn-outline-primary" to="/agents">Back to Agents</Link>
            </div>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-md-4">
            <div className="card">
              <div className="card-header"><h5 className="mb-0">Overview</h5></div>
              <div className="card-body">
                <div className="mb-2">Type: <span className="badge bg-secondary">{agent.type}</span></div>
                <div className="mb-2">Status: <span className={`badge bg-${agent.status === 'active' ? 'success' : agent.status === 'busy' ? 'warning' : agent.status === 'error' ? 'danger' : 'secondary'}`}>{agent.status}</span></div>
                <div className="mb-2">Last Seen: <small>{new Date(agent.lastSeen).toLocaleString()}</small></div>
                <div>Capabilities: {agent.capabilities.join(', ')}</div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card">
              <div className="card-header"><h5 className="mb-0">Metrics</h5></div>
              <div className="card-body">
                <div className="d-flex justify-content-between mb-2"><span>Tasks Completed</span><strong>{agent.metrics.tasksCompleted}</strong></div>
                <div className="d-flex justify-content-between mb-2"><span>Success Rate</span><strong>{Math.round(agent.metrics.successRate * 100)}%</strong></div>
                <div className="d-flex justify-content-between mb-2"><span>Avg Response Time</span><strong>{agent.metrics.averageResponseTime}ms</strong></div>
                <div className="d-flex justify-content-between"><span>Uptime</span><strong>{agent.metrics.uptime}%</strong></div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card">
              <div className="card-header"><h5 className="mb-0">Security</h5></div>
              <div className="card-body">
                <div className="d-flex justify-content-between mb-2"><span>Level</span><strong>{agent.securityLevel}</strong></div>
                <div className="d-flex justify-content-between mb-2"><span>Verification</span><span className={`badge bg-${agent.security.verificationStatus === 'verified' ? 'success' : 'warning'}`}>{agent.security.verificationStatus}</span></div>
                <div className="d-flex justify-content-between mb-2"><span>Last Verified</span><small>{agent.security.lastVerified ? new Date(agent.security.lastVerified).toLocaleString() : '-'}</small></div>
                <div className="d-flex justify-content-between"><span>Encryption</span><strong>{agent.security.encryptionLevel}</strong></div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Revenue Metrics</h5>
                <span className="text-muted small">(if tracked)</span>
              </div>
              <div className="card-body">
                <div className="row text-center">
                  <div className="col-md-3 mb-3"><div className="p-3 bg-light border rounded"><div className="text-muted">Revenue</div><div className="fw-bold">${(agent.metrics.totalRevenue || 0).toLocaleString()}</div></div></div>
                  <div className="col-md-3 mb-3"><div className="p-3 bg-light border rounded"><div className="text-muted">Costs</div><div className="fw-bold">${(agent.metrics.totalCosts || 0).toLocaleString()}</div></div></div>
                  <div className="col-md-3 mb-3"><div className="p-3 bg-light border rounded"><div className="text-muted">Profit</div><div className={`fw-bold ${((agent.metrics.profit || 0) >= 0) ? 'text-success' : 'text-danger'}`}>${(agent.metrics.profit || 0).toLocaleString()}</div></div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDetails;




