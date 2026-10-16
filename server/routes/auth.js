import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getData, saveData } from '../db/database.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'securevault-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'securevault-refresh-secret-change-in-production';

function generateTokens(userId, email, username) {
  const accessToken = jwt.sign(
    { id: userId, email, username },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { id: userId },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password)
      return res.status(400).json({ success: false, message: 'All fields are required' });
    if (password.length < 8)
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });

    const data = getData();
    const existing = data.users.find(u => u.email === email || u.username === username);
    if (existing)
      return res.status(409).json({ success: false, message: 'Email or username already exists' });

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();
    const newUser = {
      id: userId, email, username, password_hash: passwordHash,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      storage_used: 0, storage_limit: 5368709120,
    };
    data.users.push(newUser);
    saveData();

    const { accessToken, refreshToken } = generateTokens(userId, email, username);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    data.refreshTokens.push({ id: uuidv4(), user_id: userId, token: refreshToken, expires_at: expiresAt, created_at: new Date().toISOString() });
    saveData();

    res.status(201).json({
      success: true, message: 'Account created successfully',
      user: { id: userId, email, username, storageUsed: 0, storageLimit: 5368709120 },
      accessToken, refreshToken,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    const data = getData();
    const user = data.users.find(u => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.username);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    data.refreshTokens.push({ id: uuidv4(), user_id: user.id, token: refreshToken, expires_at: expiresAt, created_at: new Date().toISOString() });
    saveData();

    res.json({
      success: true,
      user: { id: user.id, email: user.email, username: user.username, storageUsed: user.storage_used, storageLimit: user.storage_limit },
      accessToken, refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const data = getData();
    const stored = data.refreshTokens.find(t => t.token === refreshToken && t.user_id === decoded.id);
    if (!stored || new Date(stored.expires_at) < new Date())
      return res.status(403).json({ success: false, message: 'Invalid or expired refresh token' });

    const user = data.users.find(u => u.id === decoded.id);
    if (!user) return res.status(403).json({ success: false, message: 'User not found' });

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id, user.email, user.username);

    // Rotate refresh token
    data.refreshTokens = data.refreshTokens.filter(t => t.token !== refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    data.refreshTokens.push({ id: uuidv4(), user_id: user.id, token: newRefreshToken, expires_at: expiresAt, created_at: new Date().toISOString() });
    saveData();

    res.json({ success: true, accessToken, refreshToken: newRefreshToken });
  } catch {
    res.status(403).json({ success: false, message: 'Invalid refresh token' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    const data = getData();
    data.refreshTokens = data.refreshTokens.filter(t => t.token !== refreshToken);
    saveData();
  }
  res.json({ success: true, message: 'Logged out' });
});

export default router;
