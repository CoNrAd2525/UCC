import React, { useEffect, useState } from 'react';
import useApi from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Users = () => {
  const { user } = useAuth();
  const api = useApi();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'operator' });

  useEffect(() => { fetchUsers(); }, []);

  if (user?.role !== 'admin') {
    return <div className="container py-4"><div className="alert alert-danger">Access denied</div></div>;
  }

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/auth/users');
      setUsers(res.data);
    } finally {
      setLoading(false);
    }
  };

  const register = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/auth/register', form);
      toast.show('User created', 'success');
      setForm({ username: '', email: '', password: '', role: 'operator' });
      fetchUsers();
    } catch {
      toast.show('Failed to create user', 'danger');
    }
  };

  const updateRole = async (id, role) => {
    try {
      await api.patch(`/api/auth/users/${id}`, { role });
      toast.show('Role updated', 'success');
      fetchUsers();
    } catch {}
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/api/auth/users/${id}`);
      toast.show('User deleted', 'success');
      fetchUsers();
    } catch {}
  };

  return (
    <div className="container-fluid py-3">
      <h2>Users</h2>
      <div className="card mb-3">
        <div className="card-header">Create User</div>
        <div className="card-body">
          <form className="row g-3" onSubmit={register}>
            <div className="col-md-3"><input className="form-control" placeholder="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required /></div>
            <div className="col-md-3"><input type="email" className="form-control" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
            <div className="col-md-3"><input type="password" className="form-control" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required /></div>
            <div className="col-md-2">
              <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="operator">operator</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <div className="col-md-1 d-flex justify-content-end"><button className="btn btn-primary" type="submit">Create</button></div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header">All Users</div>
        <div className="card-body">
          {loading ? (
            <div className="spinner-border" role="status"></div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Created</th><th>Actions</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td>
                        <select className="form-select form-select-sm" value={u.role} onChange={e => updateRole(u.id, e.target.value)}>
                          <option value="operator">operator</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td>{new Date(u.createdAt).toLocaleString()}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => remove(u.id)}>Delete</button>
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
  );
};

export default Users;




