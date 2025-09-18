import React, { useState } from 'react';
import useApi from '../hooks/useApi';
import { useToast } from '../context/ToastContext';

const ResetPassword = () => {
  const api = useApi();
  const toast = useToast();
  const [stage, setStage] = useState('request');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');

  const request = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/auth/password/reset-request', { usernameOrEmail });
      if (res.data?.token) {
        setToken(res.data.token);
      }
      toast.show('If the account exists, a reset token was issued.', 'info');
      setStage('reset');
    } catch { toast.show('Request failed', 'danger'); }
  };

  const reset = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/auth/password/reset', { token, newPassword: password });
      toast.show('Password reset successful', 'success');
      window.location.href = '/';
    } catch (err) {
      toast.show(err.response?.data?.error || 'Reset failed', 'danger');
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: 600 }}>
      <div className="card">
        <div className="card-header"><h5 className="mb-0">Reset Password</h5></div>
        <div className="card-body">
          {stage === 'request' ? (
            <form onSubmit={request} className="row g-3">
              <div className="col-12">
                <label className="form-label">Username or Email</label>
                <input className="form-control" value={usernameOrEmail} onChange={e => setUsernameOrEmail(e.target.value)} required />
              </div>
              <div className="col-12 d-flex justify-content-end">
                <button className="btn btn-primary" type="submit">Send Reset Link</button>
              </div>
            </form>
          ) : (
            <form onSubmit={reset} className="row g-3">
              <div className="col-12">
                <label className="form-label">Reset Token</label>
                <input className="form-control" value={token} onChange={e => setToken(e.target.value)} required />
                <small className="text-muted">For demo, the token appears in the API response.</small>
              </div>
              <div className="col-12">
                <label className="form-label">New Password</label>
                <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
                <small className="text-muted">Must be 8+ chars, include a number and uppercase letter.</small>
              </div>
              <div className="col-12 d-flex justify-content-end">
                <button className="btn btn-primary" type="submit">Reset Password</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;




