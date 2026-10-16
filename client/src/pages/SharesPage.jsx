import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { Share2, Lock, Clock, Download, Copy, Check, Trash2, Shield, Key, Plus, Eye, EyeOff, AlertCircle } from 'lucide-react'
import api from '../utils/api'
import { formatFileSize, getFileIcon } from '../utils/encryption'
import toast from 'react-hot-toast'

function ShareModal({ file, onClose, onCreated }) {
  const [password, setPassword] = useState('')
  const [expiresIn, setExpiresIn] = useState('')
  const [maxDownloads, setMaxDownloads] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    setLoading(true)
    try {
      const res = await api.post('/share', {
        fileId: file.id,
        password: password || undefined,
        expiresIn: expiresIn || undefined,
        maxDownloads: maxDownloads ? parseInt(maxDownloads) : undefined,
      })
      onCreated(res.data.shareLink)
      toast.success('Share link created!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create share link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(8px)', background: 'rgba(2, 8, 23, 0.8)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="glass-card w-full max-w-md p-6 border-cyan-500/20"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-center">
            <Share2 size={18} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="font-bold">Create Share Link</h3>
            <p className="text-white/40 text-sm truncate max-w-xs">{file.original_name}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Password */}
          <div>
            <label className="text-sm text-white/60 mb-1.5 flex items-center gap-1.5">
              <Lock size={12} /> Password Protection (optional)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="Leave empty for no password"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Expiry */}
          <div>
            <label className="text-sm text-white/60 mb-1.5 flex items-center gap-1.5">
              <Clock size={12} /> Link Expiry
            </label>
            <select
              value={expiresIn}
              onChange={e => setExpiresIn(e.target.value)}
              className="input-field"
            >
              <option value="">Never expires</option>
              <option value="1">1 hour</option>
              <option value="24">24 hours</option>
              <option value="72">3 days</option>
              <option value="168">7 days</option>
              <option value="720">30 days</option>
            </select>
          </div>

          {/* Max downloads */}
          <div>
            <label className="text-sm text-white/60 mb-1.5 flex items-center gap-1.5">
              <Download size={12} /> Max Downloads (optional)
            </label>
            <input
              type="number"
              value={maxDownloads}
              onChange={e => setMaxDownloads(e.target.value)}
              className="input-field"
              placeholder="Unlimited"
              min="1"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={handleCreate} disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? <div className="w-4 h-4 border-2 border-navy-950/50 border-t-navy-950 rounded-full animate-spin" /> : <Plus size={16} />}
            Create Link
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className={`btn-ghost p-2 ${copied ? 'text-green-neon' : ''}`} title="Copy">
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  )
}

export default function SharesPage() {
  const location = useLocation()
  const [files, setFiles] = useState([])
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [newLink, setNewLink] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [filesRes, linksRes] = await Promise.all([
          api.get('/files'),
          api.get('/share/my'),
        ])
        setFiles(filesRes.data.files || [])
        setLinks(linksRes.data.links || [])

        // Pre-select file if navigated with state
        if (location.state?.fileId) {
          const f = filesRes.data.files.find(f => f.id === location.state.fileId)
          if (f) { setSelectedFile(f); setShowModal(true) }
        }
      } catch {
        toast.error('Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleDeactivate = async (linkId) => {
    try {
      await api.delete(`/share/${linkId}`)
      setLinks(prev => prev.map(l => l.id === linkId ? { ...l, is_active: 0 } : l))
      toast.success('Link deactivated')
    } catch {
      toast.error('Failed to deactivate')
    }
  }

  const getShareUrl = (token) => `${window.location.origin}/download/${token}`

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-black">
              <span className="text-gradient-cyan">Share</span> Links
            </h1>
            <p className="text-white/40 mt-1">Manage your encrypted share links</p>
          </div>
        </motion.div>

        {/* New link alert */}
        <AnimatePresence>
          {newLink && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-card p-4 mb-6 border-green-neon/30"
            >
              <div className="flex items-start gap-3">
                <Check size={20} className="text-green-neon flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-green-neon mb-1">Share link created!</p>
                  <div className="flex items-center gap-2 bg-navy-800 rounded-lg p-2">
                    <code className="text-cyan-400 text-xs font-mono truncate flex-1">
                      {getShareUrl(newLink.token)}
                    </code>
                    <CopyButton text={getShareUrl(newLink.token)} />
                  </div>
                </div>
                <button onClick={() => setNewLink(null)} className="text-white/30 hover:text-white/60">
                  <Check size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create share section */}
        <div className="glass-card p-6 mb-8">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <Plus size={18} className="text-cyan-400" /> Create New Share Link
          </h2>
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            </div>
          ) : files.length === 0 ? (
            <p className="text-white/30 text-sm">Upload files first to create share links</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {files.map(file => (
                <motion.button
                  key={file.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => { setSelectedFile(file); setShowModal(true) }}
                  className="flex items-center gap-3 p-3 bg-navy-800 hover:bg-navy-700 rounded-xl text-left transition-colors"
                >
                  <span className="text-xl">{getFileIcon(file.mime_type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.original_name}</p>
                    <p className="text-white/30 text-xs">{formatFileSize(file.size)}</p>
                  </div>
                  <Share2 size={14} className="text-cyan-400 flex-shrink-0" />
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Existing links */}
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Shield size={18} className="text-cyan-400" /> Active Share Links
        </h2>

        {links.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Share2 size={36} className="text-white/20 mx-auto mb-3" />
            <p className="text-white/40">No share links yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {links.map((link, i) => {
              const isExpired = link.expires_at && new Date(link.expires_at) < new Date()
              const isLimitReached = link.max_downloads && link.download_count >= link.max_downloads
              const isActive = link.is_active && !isExpired && !isLimitReached

              return (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`glass-card p-4 ${!isActive ? 'opacity-50' : 'hover:border-cyan-500/20'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-xl">{getFileIcon(link.mime_type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-medium text-sm">{link.original_name}</p>
                        <span className={isActive ? 'badge-green' : 'badge-red'}>
                          {isActive ? 'Active' : isExpired ? 'Expired' : isLimitReached ? 'Limit reached' : 'Deactivated'}
                        </span>
                        {link.has_password ? (
                          <span className="badge-purple"><Lock size={9} /> Password</span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 bg-navy-800 rounded-lg p-1.5 mb-2">
                        <code className="text-cyan-400/70 text-xs font-mono truncate flex-1">
                          {getShareUrl(link.token)}
                        </code>
                        {isActive && <CopyButton text={getShareUrl(link.token)} />}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-white/30">
                        <span className="flex items-center gap-1">
                          <Download size={10} /> {link.download_count}
                          {link.max_downloads ? `/${link.max_downloads}` : ''} downloads
                        </span>
                        {link.expires_at && (
                          <span className="flex items-center gap-1">
                            <Clock size={10} /> Expires {new Date(link.expires_at).toLocaleDateString()}
                          </span>
                        )}
                        <span>{new Date(link.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {isActive && (
                      <button
                        onClick={() => handleDeactivate(link.id)}
                        className="btn-danger text-xs py-1.5 px-2 flex-shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && selectedFile && (
          <ShareModal
            file={selectedFile}
            onClose={() => { setShowModal(false); setSelectedFile(null) }}
            onCreated={(link) => {
              setLinks(prev => [{ ...link, original_name: selectedFile.original_name, mime_type: selectedFile.mime_type, has_password: link.hasPassword }, ...prev])
              setNewLink(link)
              setShowModal(false)
              setSelectedFile(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
