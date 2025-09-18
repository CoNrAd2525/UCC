const express = require('express');
const { users, swarmState } = require('../utils/storage');
const { generateToken, comparePassword, hashPassword, authenticate } = require('../utils/auth');
const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    // Find user
    const user = users.find(u => u.username === username || u.email === username);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date().toISOString();

    // Generate token
    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authenticate, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin
  });
});

// Logout endpoint (client-side token removal)
router.post('/logout', authenticate, (req, res) => {
  res.json({ message: 'Logout successful' });
});

// Verify token endpoint
router.post('/verify', (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  try {
    const { verifyToken } = require('../utils/auth');
    const decoded = verifyToken(token);
    
    res.json({ 
      valid: true, 
      user: {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role
      }
    });
  } catch (error) {
    res.json({ valid: false });
  }
});

// Request password reset token
router.post('/password/reset-request', async (req, res) => {
  const { usernameOrEmail } = req.body;
  const user = users.find(u => u.username === usernameOrEmail || u.email === usernameOrEmail);
  if (!user) return res.status(200).json({ message: 'If account exists, reset email sent' });
  const token = require('crypto').randomBytes(16).toString('hex');
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
  swarmState.passwordResetTokens.set(token, { userId: user.id, expiresAt });
  // In real app send email; here return token for demo
  res.json({ message: 'Reset token generated', token, expiresAt });
});

// Perform password reset
router.post('/password/reset', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password required' });
  const entry = swarmState.passwordResetTokens.get(token);
  if (!entry || entry.expiresAt < Date.now()) return res.status(400).json({ error: 'Invalid or expired token' });

  if (typeof newPassword !== 'string' || newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    return res.status(400).json({ error: 'Password must be 8+ chars, include a number and uppercase letter' });
  }

  const user = users.find(u => u.id === entry.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.password = await hashPassword(newPassword);
  swarmState.passwordResetTokens.delete(token);
  res.json({ message: 'Password reset successful' });
});

// Register endpoint (admin only in this demo)
router.post('/register', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const { username, email, password, role = 'operator' } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email and password required' });
  }

  const exists = users.find(u => u.username === username || u.email === email);
  if (exists) {
    return res.status(409).json({ error: 'User already exists' });
  }

  hashPassword(password).then(hashed => {
    const id = String(users.length + 1);
    const user = {
      id,
      username,
      email,
      password: hashed,
      role,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };
    users.push(user);
    res.status(201).json({ id: user.id, username, email, role });
  }).catch(() => res.status(500).json({ error: 'Failed to create user' }));
});

// List users (admin)
router.get('/users', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  res.json(users.map(u => ({ id: u.id, username: u.username, email: u.email, role: u.role, createdAt: u.createdAt, lastLogin: u.lastLogin })));
});

// Update user role (admin)
router.patch('/users/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  const { id } = req.params;
  const { role } = req.body;
  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (role) user.role = role;
  res.json({ id: user.id, username: user.username, email: user.email, role: user.role });
});

// Delete user (admin)
router.delete('/users/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  const { id } = req.params;
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  users.splice(idx, 1);
  res.json({ message: 'User deleted' });
});

module.exports = router;