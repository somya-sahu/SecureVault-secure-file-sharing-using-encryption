import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { getData, saveData } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, uuidv4() + '.enc'),
});

const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

// GET /api/files
router.get('/', authenticateToken, (req, res) => {
  try {
    const data = getData();
    const userFiles = data.files.filter(f => f.user_id === req.user.id);
    const filesWithShares = userFiles.map(f => ({
      ...f,
      active_shares: data.shareLinks.filter(sl => sl.file_id === f.id && sl.is_active).length,
    }));
    res.json({ success: true, files: filesWithShares.reverse() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to list files' });
  }
});

// POST /api/files/upload
router.post('/upload', authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const { originalName, mimeType, originalSize, iv, salt, checksum } = req.body;
    if (!originalName || !iv) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Missing encryption metadata' });
    }

    const data = getData();
    const fileId = uuidv4();
    const encryptedSize = req.file.size;

    const newFile = {
      id: fileId,
      user_id: req.user.id,
      original_name: originalName,
      encrypted_name: req.file.filename,
      mime_type: mimeType || 'application/octet-stream',
      size: parseInt(originalSize) || encryptedSize,
      encrypted_size: encryptedSize,
      iv,
      salt: salt || null,
      checksum: checksum || null,
      created_at: new Date().toISOString(),
    };

    data.files.push(newFile);

    // Update storage
    const userIdx = data.users.findIndex(u => u.id === req.user.id);
    if (userIdx >= 0) data.users[userIdx].storage_used = (data.users[userIdx].storage_used || 0) + encryptedSize;
    saveData();

    res.status(201).json({ success: true, message: 'File uploaded successfully', file: newFile });
  } catch (error) {
    console.error('Upload error:', error);
    if (req.file) { try { fs.unlinkSync(req.file.path); } catch {} }
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

// GET /api/files/:id
router.get('/:id', authenticateToken, (req, res) => {
  const data = getData();
  const file = data.files.find(f => f.id === req.params.id && f.user_id === req.user.id);
  if (!file) return res.status(404).json({ success: false, message: 'File not found' });
  res.json({ success: true, file });
});

// DELETE /api/files/:id
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const data = getData();
    const fileIdx = data.files.findIndex(f => f.id === req.params.id && f.user_id === req.user.id);
    if (fileIdx < 0) return res.status(404).json({ success: false, message: 'File not found' });

    const file = data.files[fileIdx];
    const filePath = path.join(uploadsDir, file.encrypted_name);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    data.files.splice(fileIdx, 1);
    data.shareLinks = data.shareLinks.filter(sl => sl.file_id !== file.id);

    const userIdx = data.users.findIndex(u => u.id === req.user.id);
    if (userIdx >= 0) data.users[userIdx].storage_used = Math.max(0, (data.users[userIdx].storage_used || 0) - file.encrypted_size);
    saveData();

    res.json({ success: true, message: 'File deleted' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

// GET /api/files/:id/download
router.get('/:id/download', authenticateToken, (req, res) => {
  const data = getData();
  const file = data.files.find(f => f.id === req.params.id && f.user_id === req.user.id);
  if (!file) return res.status(404).json({ success: false, message: 'File not found' });

  const filePath = path.join(uploadsDir, file.encrypted_name);
  if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'File not found on disk' });

  res.setHeader('Content-Disposition', `attachment; filename="${file.encrypted_name}"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('X-IV', file.iv);
  if (file.salt) res.setHeader('X-Salt', file.salt);
  res.sendFile(filePath);
});

export default router;
