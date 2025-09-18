const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { swarmState } = require('../utils/storage');
const { db } = require('../utils/db');
const { authenticate, authorize } = require('../utils/auth');
const router = express.Router();

router.use(authenticate);

// List products
router.get('/', (req, res) => {
  if (db) {
    const rows = db.prepare('SELECT * FROM products').all();
    return res.json(rows);
  }
  res.json(Array.from(swarmState.products.values()));
});

// Create product (admin/operator)
router.post('/', authorize(['admin', 'operator']), (req, res) => {
  const { name, description, price } = req.body;
  if (!name || price == null) {
    return res.status(400).json({ error: 'Name and price are required' });
  }
  const id = uuidv4();
  const product = { id, name, description: description || '', price: parseFloat(price), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  if (db) {
    db.prepare('INSERT INTO products (id,name,description,price,createdAt,updatedAt) VALUES (@id,@name,@description,@price,@createdAt,@updatedAt)').run(product);
    return res.status(201).json(product);
  }
  swarmState.products.set(id, product);
  res.status(201).json(product);
});

// Update product (admin/operator)
router.put('/:id', authorize(['admin', 'operator']), (req, res) => {
  const { id } = req.params;
  const existing = swarmState.products.get(id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  const updated = { ...existing, ...req.body, price: req.body.price != null ? parseFloat(req.body.price) : existing.price, updatedAt: new Date().toISOString() };
  if (db) {
    db.prepare('UPDATE products SET name=@name, description=@description, price=@price, updatedAt=@updatedAt WHERE id=@id').run(updated);
    return res.json(updated);
  }
  swarmState.products.set(id, updated);
  res.json(updated);
});

// Delete product (admin)
router.delete('/:id', authorize(['admin']), (req, res) => {
  const { id } = req.params;
  if (db) {
    const info = db.prepare('DELETE FROM products WHERE id=?').run(id);
    if (info.changes === 0) return res.status(404).json({ error: 'Product not found' });
    return res.json({ message: 'Product deleted' });
  }
  if (!swarmState.products.has(id)) return res.status(404).json({ error: 'Product not found' });
  swarmState.products.delete(id);
  res.json({ message: 'Product deleted' });
});

module.exports = router;


