import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useApi from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const AgentManagement = () => {
  const api = useApi();
  const { user } = useAuth();
  const toast = useToast();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', type: 'worker', capabilities: '', securityLevel: 'medium', encryptionLevel: 'AES-128' });

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/agents');
      setAgents(res.data.map(a => ({ ...a, selected: false })));
    } catch (e) {
      setError('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const activeCount = useMemo(
    () => agents.filter(a => a.status === 'active' || a.status === 'busy').length,
    [agents]
  );

  const verifyAgent = async (agentId) => {
    try {
      await api.post(`/api/agents/${agentId}/verify`);
      toast.show('Agent verified', 'success');
      fetchAgents();
    } catch (e) {
      // no-op UI error for brevity
    }
  };

  const setStatus = async (agentId, status) => {
    try {
      await api.patch(`/api/agents/${agentId}/status`, { status });
      toast.show('Status updated', 'success');
      fetchAgents();
    } catch (e) {
      // no-op UI error for brevity
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

  return (
    <div className="agent-management">
      <div className="container-fluid">
        {/* Create Agent */}
        {(user?.role === 'admin' || user?.role === 'operator') && (
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Register New Agent</h5>
            </div>
            <div className="card-body">
              <form className="row g-3" onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await api.post('/api/agents', {
                    name: form.name,
                    type: form.type,
                    capabilities: form.capabilities.split(',').map(s => s.trim()).filter(Boolean),
                    securityLevel: form.securityLevel,
                    encryptionLevel: form.encryptionLevel
                  });
                  setForm({ name: '', type: 'worker', capabilities: '', securityLevel: 'medium', encryptionLevel: 'AES-128' });
                  toast.show('Agent created', 'success');
                  fetchAgents();
                } catch (e) {
                  setError(e.response?.data?.error || 'Failed to register agent');
                  toast.show('Failed to create agent', 'danger');
                }
              }}>
                <div className="col-md-3">
                  <label className="form-label">Name</label>
                  <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Type</label>
                  <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="worker">worker</option>
                    <option value="scanner">scanner</option>
                    <option value="controller">controller</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Capabilities</label>
                  <input className="form-control" placeholder="comma,separated,values" value={form.capabilities} onChange={e => setForm({ ...form, capabilities: e.target.value })} />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Security Level</label>
                  <select className="form-select" value={form.securityLevel} onChange={e => setForm({ ...form, securityLevel: e.target.value })}>
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                    <option value="critical">critical</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Encryption</label>
                  <select className="form-select" value={form.encryptionLevel} onChange={e => setForm({ ...form, encryptionLevel: e.target.value })}>
                    <option value="AES-128">AES-128</option>
                    <option value="AES-256">AES-256</option>
                  </select>
                </div>
                <div className="col-12 d-flex justify-content-end">
                  <button className="btn btn-primary" type="submit">
                    <i className="fas fa-plus me-2"></i>
                    Register
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        <div className="row mb-3">
          <div className="col-12">
            <h2>Agent Management</h2>
            <p className="text-muted">Manage and monitor individual agents</p>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card bg-primary text-white">
              <div className="card-body d-flex justify-content-between">
                <div>
                  <h3 className="mb-0">{agents.length}</h3>
                  <p className="mb-0">Total Agents</p>
                </div>
                <i className="fas fa-robot fa-2x"></i>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white">
              <div className="card-body d-flex justify-content-between">
                <div>
                  <h3 className="mb-0">{activeCount}</h3>
                  <p className="mb-0">Active</p>
                </div>
                <i className="fas fa-check-circle fa-2x"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Agents</h5>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary btn-sm" onClick={fetchAgents}>
              <i className="fas fa-sync-alt me-1"></i>
              Refresh
              </button>
              <button className="btn btn-outline-primary btn-sm" onClick={() => {
                // CSV export
                const header = ['id','name','type','status','successRate','avgResponseTime','uptime','verification'];
                const rows = agents.map(a => [a.id, a.name, a.type, a.status, Math.round(a.metrics.successRate*100)+'%', a.metrics.averageResponseTime, a.metrics.uptime, a.security.verificationStatus]);
                const csv = [header.join(','), ...rows.map(r => r.map(v => `"${String(v).replaceAll('"','""')}"`).join(','))].join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'agents.csv';
                document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
                toast.show('Agents exported as CSV', 'success');
              }}>
                <i className="fas fa-file-csv me-1"></i>
                Export CSV
              </button>
            </div>
          </div>
          <div className="card-body">
            {agents.length === 0 ? (
              <p className="text-muted">No agents available.</p>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      {(user?.role === 'admin') && <th><input type="checkbox" onChange={(e) => setAgents(agents.map(a => ({ ...a, selected: e.target.checked })))} /></th>}
                      <th>Name</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Success</th>
                      <th>Avg RT</th>
                      <th>Uptime</th>
                      <th>Security</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map(agent => (
                      <tr key={agent.id}>
                        {(user?.role === 'admin') && (
                          <td>
                            <input type="checkbox" checked={!!agent.selected} onChange={(e) => setAgents(agents.map(a => a.id === agent.id ? { ...a, selected: e.target.checked } : a))} />
                          </td>
                        )}
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <Link to={`/agents/${agent.id}`}>{agent.name}</Link>
                            <Link className="badge bg-light text-dark text-decoration-none" to={`/chat?agent_id=${agent.id}`}>Chat</Link>
                          </div>
                        </td>
                        <td><span className="badge bg-secondary">{agent.type}</span></td>
                        <td>
                          <span className={`badge bg-${agent.status === 'active' ? 'success' : agent.status === 'busy' ? 'warning' : agent.status === 'error' ? 'danger' : 'secondary'}`}>
                            {agent.status}
                          </span>
                        </td>
                        <td>{Math.round(agent.metrics.successRate * 100)}%</td>
                        <td>{agent.metrics.averageResponseTime}ms</td>
                        <td>{agent.metrics.uptime}%</td>
                        <td>
                          <span className={`badge bg-${agent.security.verificationStatus === 'verified' ? 'success' : 'warning'}`}>
                            {agent.security.verificationStatus}
                          </span>
                        </td>
                        <td className="d-flex gap-2">
                          <div className="btn-group">
                            <button className="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                              Status
                            </button>
                            <ul className="dropdown-menu">
                              {['active','inactive','busy','error'].map(s => (
                                <li key={s}><button className="dropdown-item" onClick={() => setStatus(agent.id, s)}>{s}</button></li>
                              ))}
                            </ul>
                          </div>
                          {(user?.role === 'admin') && agent.security.verificationStatus !== 'verified' && (
                            <button className="btn btn-sm btn-outline-success" onClick={() => verifyAgent(agent.id)}>
                              Verify
                            </button>
                          )}
                          {(user?.role === 'admin') && (
                            <button className="btn btn-sm btn-outline-danger" onClick={async () => {
                              if (!window.confirm('Delete this agent?')) return;
                              try {
                                await api.delete(`/api/agents/${agent.id}`);
                                toast.show('Agent deleted', 'success');
                                fetchAgents();
                              } catch {
                                toast.show('Failed to delete agent', 'danger');
                              }
                            }}>Delete</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {(user?.role === 'admin') && agents.some(a => a.selected) && (
              <div className="mt-3 d-flex gap-2">
                <button className="btn btn-danger btn-sm" onClick={async () => {
                  const selected = agents.filter(a => a.selected);
                  if (selected.length === 0) return;
                  if (!window.confirm(`Delete ${selected.length} agents?`)) return;
                  for (const a of selected) {
                    try { await api.delete(`/api/agents/${a.id}`); } catch {}
                  }
                  toast.show('Selected agents deleted', 'success');
                  fetchAgents();
                }}>Delete Selected</button>
                <button className="btn btn-success btn-sm" onClick={async () => {
                  const selected = agents.filter(a => a.selected && a.security.verificationStatus !== 'verified');
                  for (const a of selected) {
                    try { await api.post(`/api/agents/${a.id}/verify`); } catch {}
                  }
                  toast.show('Selected agents verified', 'success');
                  fetchAgents();
                }}>Verify Selected</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentManagement;