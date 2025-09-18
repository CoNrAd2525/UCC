import React, { useEffect, useState } from 'react';
import useApi from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Listings = () => {
  const { user } = useAuth();
  const api = useApi();
  const toast = useToast();
  const [listings, setListings] = useState([]);
  const [products, setProducts] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ productId: '', agentId: '', status: 'active' });
  const isEditor = user?.role === 'admin' || user?.role === 'operator';

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [l, p, a] = await Promise.all([
        api.get('/api/listings'),
        api.get('/api/products'),
        api.get('/api/agents')
      ]);
      setListings(l.data);
      setProducts(p.data);
      setAgents(a.data);
    } finally { setLoading(false); }
  };

  const createListing = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/listings', form);
      toast.show('Listing created', 'success');
      setForm({ productId: '', agentId: '', status: 'active' });
      fetchAll();
    } catch { toast.show('Failed to create listing', 'danger'); }
  };

  const updateListing = async (id, updates) => {
    await api.put(`/api/listings/${id}`, updates);
    toast.show('Listing updated', 'success');
    fetchAll();
  };

  const deleteListing = async (id) => {
    if (!window.confirm('Delete this listing?')) return;
    await api.delete(`/api/listings/${id}`);
    toast.show('Listing deleted', 'success');
    fetchAll();
  };

  const productName = (id) => products.find(p => p.id === id)?.name || id;
  const agentName = (id) => agents.find(a => a.id === id)?.name || id;

  return (
    <div className="container-fluid py-3">
      <h2>Listings</h2>
      {isEditor && (
        <div className="card mb-3">
          <div className="card-header">Create Listing</div>
          <div className="card-body">
            <form className="row g-3" onSubmit={createListing}>
              <div className="col-md-4">
                <select className="form-select" value={form.productId} onChange={e => setForm({ ...form, productId: e.target.value })} required>
                  <option value="">Select product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="col-md-4">
                <select className="form-select" value={form.agentId} onChange={e => setForm({ ...form, agentId: e.target.value })} required>
                  <option value="">Select agent</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="col-md-2">
                <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {['active','inactive'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-md-2 d-flex justify-content-end"><button className="btn btn-primary" type="submit">Create</button></div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">All Listings</div>
        <div className="card-body">
          {loading ? (
            <div className="spinner-border" role="status"></div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead><tr><th>Product</th><th>Agent</th><th>Status</th><th>Updated</th>{isEditor && <th>Actions</th>}</tr></thead>
                <tbody>
                  {listings.map(l => (
                    <tr key={l.id}>
                      <td>{productName(l.productId)}</td>
                      <td>{agentName(l.agentId)}</td>
                      <td>
                        {isEditor ? (
                          <select className="form-select form-select-sm" value={l.status} onChange={e => updateListing(l.id, { status: e.target.value })}>
                            {['active','inactive'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        ) : l.status}
                      </td>
                      <td>{new Date(l.updatedAt).toLocaleString()}</td>
                      {isEditor && (
                        <td>
                          {user?.role === 'admin' && <button className="btn btn-sm btn-outline-danger" onClick={() => deleteListing(l.id)}>Delete</button>}
                        </td>
                      )}
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

export default Listings;


