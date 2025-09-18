import React, { useEffect, useMemo, useState } from 'react';
import useApi from '../hooks/useApi';

const TaskManagement = () => {
  const api = useApi();
  const [tasks, setTasks] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', description: '', type: 'general', priority: 'medium', assignedTo: '' });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [tasksRes, agentsRes] = await Promise.all([
        api.get('/api/tasks'),
        api.get('/api/agents')
      ]);
      setTasks(tasksRes.data);
      setAgents(agentsRes.data);
    } catch (e) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/tasks', {
        title: form.title,
        description: form.description,
        type: form.type,
        priority: form.priority,
        assignedTo: form.assignedTo || null
      });
      setForm({ title: '', description: '', type: 'general', priority: 'medium', assignedTo: '' });
      fetchAll();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to create task');
    }
  };

  const updateStatus = async (taskId, status) => {
    try {
      await api.put(`/api/tasks/${taskId}`, { status });
      fetchAll();
    } catch {}
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/api/tasks/${taskId}`);
      fetchAll();
    } catch {}
  };

  const pendingCount = useMemo(() => tasks.filter(t => t.status === 'pending').length, [tasks]);
  const inProgressCount = useMemo(() => tasks.filter(t => t.status === 'in-progress').length, [tasks]);
  const completedCount = useMemo(() => tasks.filter(t => t.status === 'completed').length, [tasks]);

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
    <div className="task-management">
      <div className="container-fluid">
        <div className="row mb-3">
          <div className="col-12">
            <h2>Task Management</h2>
            <p className="text-muted">Create and monitor tasks for agents</p>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        {/* Summary cards */}
        <div className="row mb-4">
          <div className="col-md-4">
            <div className="card bg-warning text-white">
              <div className="card-body d-flex justify-content-between">
                <div>
                  <h3 className="mb-0">{pendingCount}</h3>
                  <p className="mb-0">Pending</p>
                </div>
                <i className="fas fa-clock fa-2x"></i>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card bg-info text-white">
              <div className="card-body d-flex justify-content-between">
                <div>
                  <h3 className="mb-0">{inProgressCount}</h3>
                  <p className="mb-0">In Progress</p>
                </div>
                <i className="fas fa-play fa-2x"></i>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card bg-success text-white">
              <div className="card-body d-flex justify-content-between">
                <div>
                  <h3 className="mb-0">{completedCount}</h3>
                  <p className="mb-0">Completed</p>
                </div>
                <i className="fas fa-check fa-2x"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Create task */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Create Task</h5>
          </div>
          <div className="card-body">
            <form className="row g-3" onSubmit={createTask}>
              <div className="col-md-4">
                <label className="form-label">Title</label>
                <input className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">Type</label>
                <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="general">General</option>
                  <option value="scan">Scan</option>
                  <option value="security">Security</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Priority</label>
                <select className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="col-12">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows="2" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}></textarea>
              </div>
              <div className="col-md-6">
                <label className="form-label">Assign to Agent (optional)</label>
                <select className="form-select" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
                  <option value="">Unassigned</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 d-flex align-items-end justify-content-end">
                <button className="btn btn-primary" type="submit">
                  <i className="fas fa-plus me-2"></i>
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Tasks table */}
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Tasks</h5>
            <button className="btn btn-outline-secondary btn-sm" onClick={fetchAll}>
              <i className="fas fa-sync-alt me-1"></i>
              Refresh
            </button>
          </div>
          <div className="card-body">
            {tasks.length === 0 ? (
              <p className="text-muted">No tasks found.</p>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Assigned To</th>
                      <th>Progress</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(task => (
                      <tr key={task.id}>
                        <td>{task.title}</td>
                        <td><span className="badge bg-secondary">{task.type}</span></td>
                        <td>
                          <span className={`badge bg-${task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'info'}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td>
                          <span className={`badge bg-${task.status === 'completed' ? 'success' : task.status === 'in-progress' ? 'info' : 'secondary'}`}>
                            {task.status}
                          </span>
                        </td>
                        <td>{agents.find(a => a.id === task.assignedTo)?.name || '-'}</td>
                        <td>
                          <div className="progress" style={{ height: '16px', width: '140px' }}>
                            <div className="progress-bar" style={{ width: `${task.progress || 0}%` }}>{task.progress || 0}%</div>
                          </div>
                        </td>
                        <td className="d-flex gap-2">
                          <div className="btn-group">
                            <button className="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                              Set Status
                            </button>
                            <ul className="dropdown-menu">
                              {['pending','in-progress','completed','failed'].map(s => (
                                <li key={s}><button className="dropdown-item" onClick={() => updateStatus(task.id, s)}>{s}</button></li>
                              ))}
                            </ul>
                          </div>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => deleteTask(task.id)}>Delete</button>
                        </td>
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
  );
};

export default TaskManagement;