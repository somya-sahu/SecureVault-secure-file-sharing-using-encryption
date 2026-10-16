import express from 'express';
import bcrypt from 'bcryptjs';
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

// POST /api/share — create a share link
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { fileId, password, expiresIn, maxDownloads } = req.body;
    const data = getData();
    const file = data.files.find(f => f.id === fileId && f.user_id === req.user.id);
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });

    const token = uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '');
    let passwordHash = null;
    if (password) passwordHash = await bcrypt.hash(password, 12);

    let expiresAt = null;
    if (expiresIn) expiresAt = new Date(Date.now() + parseInt(expiresIn) * 60 * 60 * 1000).toISOString();

    const shareId = uuidv4();
    const shareLink = {
      id: shareId,
      file_id: fileId,
      token,
      password_hash: passwordHash,
      expires_at: expiresAt,
      max_downloads: maxDownloads ? parseInt(maxDownloads) : null,
      download_count: 0,
      created_at: new Date().toISOString(),
      is_active: true,
    };

    data.shareLinks.push(shareLink);
    saveData();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.status(201).json({
      success: true,
      shareLink: {
        ...shareLink,
        url: `${clientUrl}/download/${token}`,
        hasPassword: !!passwordHash,
        password_hash: undefined,
      }
    });
  } catch (error) {
    console.error('Create share error:', error);
    res.status(500).json({ success: false, message: 'Failed to create share link' });
  }
});

// GET /api/share/my
router.get('/my', authenticateToken, (req, res) => {
  try {
    const data = getData();
    const userFileIds = data.files.filter(f => f.user_id === req.user.id).map(f => f.id);
    const links = data.shareLinks
      .filter(sl => userFileIds.includes(sl.file_id))
      .map(sl => {
        const file = data.files.find(f => f.id === sl.file_id);
        return {
          ...sl,
          password_hash: undefined,
          has_password: !!sl.password_hash,
          original_name: file?.original_name,
          size: file?.size,
          mime_type: file?.mime_type,
        };
      })
      .reverse();

    res.json({ success: true, links });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to list share links' });
  }
});

// GET /api/share/:token/info
router.get('/:token/info', (req, res) => {
  try {
    const data = getData();
    const link = data.shareLinks.find(sl => sl.token === req.params.token);
    if (!link) return res.status(404).json({ success: false, message: 'Share link not found' });
    if (!link.is_active) return res.status(410).json({ success: false, message: 'Link has been deactivated' });
    if (link.expires_at && new Date(link.expires_at) < new Date())
      return res.status(410).json({ success: false, message: 'Link has expired' });
    if (link.max_downloads && link.download_count >= link.max_downloads)
      return res.status(410).json({ success: false, message: 'Download limit reached' });

    const file = data.files.find(f => f.id === link.file_id);
    res.json({
      success: true, link: {
        ...link,
        password_hash: undefined,
        has_password: !!link.password_hash,
        original_name: file?.original_name,
        size: file?.size,
        mime_type: file?.mime_type,
        iv: file?.iv,
        salt: file?.salt,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get share link info' });
  }
});

// POST /api/share/:token/download
router.post('/:token/download', async (req, res) => {
  try {
    const { password } = req.body;
    const data = getData();
    const link = data.shareLinks.find(sl => sl.token === req.params.token);
    if (!link) return res.status(404).json({ success: false, message: 'Share link not found' });
    if (!link.is_active) return res.status(410).json({ success: false, message: 'Link deactivated' });
    if (link.expires_at && new Date(link.expires_at) < new Date())
      return res.status(410).json({ success: false, message: 'Link expired' });
    if (link.max_downloads && link.download_count >= link.max_downloads)
      return res.status(410).json({ success: false, message: 'Download limit reached' });

    if (link.password_hash) {
      if (!password) return res.status(401).json({ success: false, message: 'Password required' });
      const valid = await bcrypt.compare(password, link.password_hash);
      if (!valid) return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    // Log and increment
    data.downloadLogs.push({
      id: uuidv4(),
      share_link_id: link.id,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      downloaded_at: new Date().toISOString(),
    });

    const linkIdx = data.shareLinks.findIndex(sl => sl.id === link.id);
    if (linkIdx >= 0) data.shareLinks[linkIdx].download_count++;
    saveData();

    const file = data.files.find(f => f.id === link.file_id);
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });

    const filePath = path.join(uploadsDir, file.encrypted_name);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'File not found on disk' });

    res.setHeader('Content-Disposition', `attachment; filename="${file.encrypted_name}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('X-IV', file.iv);
    if (file.salt) res.setHeader('X-Salt', file.salt);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Share download error:', error);
    res.status(500).json({ success: false, message: 'Download failed' });
  }
});

// DELETE /api/share/:id
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const data = getData();
    const userFileIds = data.files.filter(f => f.user_id === req.user.id).map(f => f.id);
    const linkIdx = data.shareLinks.findIndex(sl => sl.id === req.params.id && userFileIds.includes(sl.file_id));
    if (linkIdx < 0) return res.status(404).json({ success: false, message: 'Share link not found' });

    data.shareLinks[linkIdx].is_active = false;
    saveData();
    res.json({ success: true, message: 'Share link deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to deactivate link' });
  }
});

export default router;
