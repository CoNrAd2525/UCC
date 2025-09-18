import React, { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import useApi from '../hooks/useApi';
import { useToast } from '../context/ToastContext';

const Revenue = () => {
  const api = useApi();
  const toast = useToast();
  const [overview, setOverview] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ type: 'income', amount: '', description: '', category: 'general', agent_id: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ description: '', category: '', amount: 0 });

  useEffect(() => {
    fetchAll();
  }, [pagination.page, pagination.limit]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [ov, tx] = await Promise.all([
        api.get('/api/revenue/overview?timeframe=30d'),
        api.get(`/api/revenue/transactions?page=${pagination.page}&limit=${pagination.limit}`)
      ]);
      setOverview(ov.data);
      setTransactions(tx.data.transactions);
      setPagination(p => ({ ...p, total: tx.data.pagination.total, pages: tx.data.pagination.pages }));
    } catch (e) {
      setError('Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/revenue/transactions', {
        type: form.type,
        amount: parseFloat(form.amount),
        description: form.description,
        category: form.category,
        agent_id: form.agent_id || null
      });
      setForm({ type: 'income', amount: '', description: '', category: 'general', agent_id: '' });
      toast.show('Transaction added', 'success');
      fetchAll();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to create transaction');
      toast.show('Failed to add transaction', 'danger');
    }
  };

  const deleteTransaction = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/api/revenue/transactions/${id}`);
      toast.show('Transaction deleted', 'success');
      fetchAll();
    } catch {}
  };

  const formatCurrency = (v) => `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  const chartData = useMemo(() => overview?.dailyBreakdown || [], [overview]);

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
    <div className="revenue">
      <div className="container-fluid">
        <div className="row mb-3">
          <div className="col-12 d-flex justify-content-between align-items-center">
            <div>
              <h2>Revenue</h2>
              <p className="text-muted">Overview and transactions</p>
            </div>
            <button className="btn btn-outline-secondary" onClick={fetchAll}>
              <i className="fas fa-sync-alt me-1"></i>
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        {overview && (
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card bg-success text-white">
                <div className="card-body d-flex justify-content-between">
                  <div>
                    <h3 className="mb-0">{formatCurrency(overview.summary.totalRevenue)}</h3>
                    <p className="mb-0">Revenue</p>
                  </div>
                  <i className="fas fa-dollar-sign fa-2x"></i>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-danger text-white">
                <div className="card-body d-flex justify-content-between">
                  <div>
                    <h3 className="mb-0">{formatCurrency(overview.summary.totalCosts)}</h3>
                    <p className="mb-0">Costs</p>
                  </div>
                  <i className="fas fa-receipt fa-2x"></i>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-primary text-white">
                <div className="card-body d-flex justify-content-between">
                  <div>
                    <h3 className="mb-0">{formatCurrency(overview.summary.profit)}</h3>
                    <p className="mb-0">Profit</p>
                  </div>
                  <i className="fas fa-chart-line fa-2x"></i>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-info text-white">
                <div className="card-body d-flex justify-content-between">
                  <div>
                    <h3 className="mb-0">{Math.round(overview.summary.profitMargin)}%</h3>
                    <p className="mb-0">Margin</p>
                  </div>
                  <i className="fas fa-percentage fa-2x"></i>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="row">
          <div className="col-lg-5 mb-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Add Transaction</h5>
              </div>
              <div className="card-body">
                <form className="row g-3" onSubmit={createTransaction}>
                  <div className="col-md-4">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Amount</label>
                    <input type="number" step="0.01" className="form-control" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Category</label>
                    <input className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Description</label>
                    <input className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
                  </div>
                  <div className="col-12 d-flex justify-content-end">
                    <button className="btn btn-primary" type="submit">
                      <i className="fas fa-plus me-2"></i>
                      Add
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="col-lg-7 mb-4">
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Revenue Trend (Daily)</h5>
              </div>
              <div className="card-body">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={formatCurrency} />
                      <Tooltip formatter={(value, name) => [formatCurrency(value), name]} />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" stroke="#28a745" fill="#28a745" name="Revenue" />
                      <Area type="monotone" dataKey="costs" stroke="#dc3545" fill="#dc3545" name="Costs" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted">No data available.</p>
                )}
              </div>
            </div>
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Transactions</h5>
                <div className="d-flex align-items-center gap-2">
                  <select className="form-select" style={{ width: 'auto' }} value={pagination.limit} onChange={e => setPagination(p => ({ ...p, limit: Number(e.target.value), page: 1 }))}>
                    {[10,20,50].map(n => <option key={n} value={n}>{n}/page</option>)}
                  </select>
                  <button className="btn btn-outline-primary btn-sm" onClick={() => {
                    const header = ['id','type','description','category','amount','timestamp'];
                    const rows = transactions.map(t => [t.id, t.type, t.description, t.category, t.amount, t.timestamp]);
                    const csv = [header.join(','), ...rows.map(r => r.map(v => `"${String(v).replaceAll('"','""')}"`).join(','))].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = 'transactions.csv';
                    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
                    toast.show('Transactions exported as CSV', 'success');
                  }}>
                    <i className="fas fa-file-csv me-1"></i>
                    Export CSV
                  </button>
                </div>
              </div>
              <div className="card-body">
                {transactions.length === 0 ? (
                  <p className="text-muted">No transactions.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Description</th>
                          <th>Category</th>
                          <th>Amount</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map(tx => (
                          <tr key={tx.id}>
                            <td>{new Date(tx.timestamp).toLocaleString()}</td>
                            <td>
                              <span className={`badge bg-${tx.type === 'income' ? 'success' : 'danger'}`}>{tx.type}</span>
                            </td>
                            <td>
                              {editingId === tx.id ? (
                                <input className="form-control form-control-sm" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                              ) : tx.description}
                            </td>
                            <td>
                              {editingId === tx.id ? (
                                <input className="form-control form-control-sm" value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} />
                              ) : <span className="badge bg-secondary">{tx.category}</span>}
                            </td>
                            <td className={tx.type === 'income' ? 'text-success' : 'text-danger'}>
                              {editingId === tx.id ? (
                                <input type="number" step="0.01" className="form-control form-control-sm" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} />
                              ) : formatCurrency(tx.amount)}
                            </td>
                            <td className="text-end">
                              {editingId === tx.id ? (
                                <div className="btn-group">
                                  <button className="btn btn-sm btn-primary" onClick={async () => {
                                    try {
                                      await api.put(`/api/revenue/transactions/${tx.id}`, {
                                        description: editForm.description,
                                        category: editForm.category,
                                        amount: parseFloat(editForm.amount)
                                      });
                                      setEditingId(null);
                                      fetchAll();
                                    } catch {}
                                  }}>Save</button>
                                  <button className="btn btn-sm btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
                                </div>
                              ) : (
                                <div className="btn-group">
                                  <button className="btn btn-sm btn-outline-secondary" onClick={() => { setEditingId(tx.id); setEditForm({ description: tx.description, category: tx.category, amount: tx.amount }); }}>Edit</button>
                                  <button className="btn btn-sm btn-outline-danger" onClick={() => deleteTransaction(tx.id)}>Delete</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <small className="text-muted">Page {pagination.page} of {pagination.pages}</small>
                  </div>
                  <div className="btn-group">
                    <button className="btn btn-outline-secondary btn-sm" disabled={pagination.page <= 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>Prev</button>
                    <button className="btn btn-outline-secondary btn-sm" disabled={pagination.page >= pagination.pages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>Next</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Revenue;


