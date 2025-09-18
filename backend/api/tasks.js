const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { swarmState } = require('../utils/storage');
const { authenticate, authorize } = require('../utils/auth');
const router = express.Router();

router.use(authenticate);

// Get all tasks
router.get('/', (req, res) => {
  const tasks = Array.from(swarmState.tasks.values());
  res.json(tasks);
});

// Get task by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const task = swarmState.tasks.get(id);
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  res.json(task);
});

// Create new task
router.post('/', authorize(['admin', 'operator']), (req, res) => {
  const { title, description, type, priority, assignedTo } = req.body;

  if (!title || !type) {
    return res.status(400).json({ error: 'Title and type are required' });
  }

  const taskId = uuidv4();
  const task = {
    id: taskId,
    title,
    description: description || '',
    type,
    priority: priority || 'medium',
    status: 'pending',
    assignedTo: assignedTo || null,
    createdBy: req.user.username,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedCompletion: null,
    progress: 0
  };

  swarmState.tasks.set(taskId, task);
  swarmState.metrics.totalTasks = swarmState.tasks.size;

  res.status(201).json(task);
});

// Update task
router.put('/:id', authorize(['admin', 'operator']), (req, res) => {
  const { id } = req.params;
  const task = swarmState.tasks.get(id);
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const updates = req.body;
  const updatedTask = { ...task, ...updates, updatedAt: new Date().toISOString() };
  
  swarmState.tasks.set(id, updatedTask);
  res.json(updatedTask);
});

// Delete task
router.delete('/:id', authorize(['admin']), (req, res) => {
  const { id } = req.params;
  
  if (!swarmState.tasks.has(id)) {
    return res.status(404).json({ error: 'Task not found' });
  }

  swarmState.tasks.delete(id);
  swarmState.metrics.totalTasks = swarmState.tasks.size;
  res.json({ message: 'Task deleted successfully' });
});

module.exports = router;