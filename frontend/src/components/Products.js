import React, { useEffect, useState } from 'react';
import useApi from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Products = () => {
  const { user } = useAuth();
  const api = useApi();
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', description: '', price: '' });
  const isEditor = user?.role === 'admin' || user?.role === 'operator';

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/products');
      setProducts(res.data);
    } finally { setLoading(false); }
  };

  const createProduct = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/products', { ...form, price: parseFloat(form.price) });
      toast.show('Product created', 'success');
      setForm({ name: '', description: '', price: '' });
      fetchProducts();
    } catch { toast.show('Failed to create product', 'danger'); }
  };

  const updateProduct = async (id, updates) => {
    await api.put(`/api/products/${id}`, updates);
    toast.show('Product updated', 'success');
    fetchProducts();
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    await api.delete(`/api/products/${id}`);
    toast.show('Product deleted', 'success');
    fetchProducts();
  };

  return (
    <div className="container-fluid py-3">
      <h2>Products</h2>
      {isEditor && (
        <div className="card mb-3">
          <div className="card-header">Create Product</div>
          <div className="card-body">
            <form className="row g-3" onSubmit={createProduct}>
              <div className="col-md-4"><input className="form-control" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="col-md-4"><input className="form-control" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="col-md-2"><input type="number" step="0.01" className="form-control" placeholder="Price" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required /></div>
              <div className="col-md-2 d-flex justify-content-end"><button className="btn btn-primary" type="submit">Create</button></div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">All Products</div>
        <div className="card-body">
          {loading ? (
            <div className="spinner-border" role="status"></div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead><tr><th>Name</th><th>Description</th><th>Price</th><th>Updated</th>{isEditor && <th>Actions</th>}</tr></thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{p.description}</td>
                      <td>${p.price.toFixed(2)}</td>
                      <td>{new Date(p.updatedAt).toLocaleString()}</td>
                      {isEditor && (
                        <td className="d-flex gap-2">
                          <button className="btn btn-sm btn-outline-secondary" onClick={() => updateProduct(p.id, { price: p.price + 1 })}>+ $1</button>
                          {user?.role === 'admin' && <button className="btn btn-sm btn-outline-danger" onClick={() => deleteProduct(p.id)}>Delete</button>}
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

export default Products;




