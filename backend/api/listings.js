const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { swarmState } = require('../utils/storage');
const { db } = require('../utils/db');
const { authenticate, authorize } = require('../utils/auth');
const router = express.Router();

router.use(authenticate);

// List listings
router.get('/', (req, res) => {
  if (db) {
    const rows = db.prepare('SELECT * FROM listings').all();
    return res.json(rows);
  }
  res.json(Array.from(swarmState.listings.values()));
});

// Create listing (admin/operator)
router.post('/', authorize(['admin', 'operator']), (req, res) => {
  const { productId, agentId, status = 'active' } = req.body;
  if (!productId || !agentId) {
    return res.status(400).json({ error: 'productId and agentId are required' });
  }
  if (!swarmState.products.has(productId)) return res.status(404).json({ error: 'Product not found' });
  if (!swarmState.agents.has(agentId)) return res.status(404).json({ error: 'Agent not found' });
  const id = uuidv4();
  const listing = { id, productId, agentId, status, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  if (db) {
    db.prepare('INSERT INTO listings (id,productId,agentId,status,createdAt,updatedAt) VALUES (@id,@productId,@agentId,@status,@createdAt,@updatedAt)').run(listing);
    return res.status(201).json(listing);
  }
  swarmState.listings.set(id, listing);
  res.status(201).json(listing);
});

// Update listing
router.put('/:id', authorize(['admin', 'operator']), (req, res) => {
  const { id } = req.params;
  const existing = swarmState.listings.get(id);
  if (!existing) return res.status(404).json({ error: 'Listing not found' });
  const updated = { ...existing, ...req.body, updatedAt: new Date().toISOString() };
  if (db) {
    db.prepare('UPDATE listings SET productId=@productId, agentId=@agentId, status=@status, updatedAt=@updatedAt WHERE id=@id').run(updated);
    return res.json(updated);
  }
  swarmState.listings.set(id, updated);
  res.json(updated);
});

// Delete listing (admin)
router.delete('/:id', authorize(['admin']), (req, res) => {
  const { id } = req.params;
  if (db) {
    const info = db.prepare('DELETE FROM listings WHERE id=?').run(id);
    if (info.changes === 0) return res.status(404).json({ error: 'Listing not found' });
    return res.json({ message: 'Listing deleted' });
  }
  if (!swarmState.listings.has(id)) return res.status(404).json({ error: 'Listing not found' });
  swarmState.listings.delete(id);
  res.json({ message: 'Listing deleted' });
});

module.exports = router;


