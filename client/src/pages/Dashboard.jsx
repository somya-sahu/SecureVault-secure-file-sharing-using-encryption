import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { formatFileSize, getFileIcon } from '../utils/encryption'
import {
  FolderOpen, Upload, Share2, Shield, HardDrive, TrendingUp,
  Clock, Download, Trash2, MoreVertical, Plus, ChevronRight, Lock, Eye, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

function StatCard({ icon, label, value, sub, color = 'cyan' }) {
  const colorMap = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    purple: 'text-purple-light bg-purple-brand/10 border-purple-brand/20',
    green: 'text-green-neon bg-green-neon/10 border-green-neon/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  }
  return (
    <motion.div variants={itemVariants} className="stat-card">
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colorMap[color]}`}>
        {icon}
      </div>
      <div className="text-2xl font-black">{value}</div>
      <div className="text-white/60 text-sm">{label}</div>
      {sub && <div className="text-white/30 text-xs">{sub}</div>}
    </motion.div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeMenu, setActiveMenu] = useState(null)

  const fetchFiles = async () => {
    try {
      const res = await api.get('/files')
      setFiles(res.data.files || [])
    } catch (err) {
      toast.error('Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFiles() }, [])

  const handleDelete = async (fileId, fileName) => {
    if (!confirm(`Delete "${fileName}"? This action cannot be undone.`)) return
    try {
      await api.delete(`/files/${fileId}`)
      setFiles(prev => prev.filter(f => f.id !== fileId))
      toast.success('File deleted')
    } catch {
      toast.error('Failed to delete file')
    }
    setActiveMenu(null)
  }

  const totalSize = files.reduce((s, f) => s + (f.size || 0), 0)
  const storageLimit = user?.storageLimit || 5368709120
  const storagePercent = Math.min((user?.storageUsed || 0) / storageLimit * 100, 100)

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-black">
              Welcome back, <span className="text-gradient-cyan">{user?.username}</span>
            </h1>
            <p className="text-white/40 mt-1">Manage your encrypted vault</p>
          </div>
          <Link to="/upload" className="btn-primary">
            <Upload size={18} /> Upload File
          </Link>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <StatCard
            icon={<FolderOpen size={20} />}
            label="Total Files"
            value={files.length}
            color="cyan"
          />
          <StatCard
            icon={<HardDrive size={20} />}
            label="Storage Used"
            value={formatFileSize(user?.storageUsed || 0)}
            sub={`of ${formatFileSize(storageLimit)}`}
            color="purple"
          />
          <StatCard
            icon={<Share2 size={20} />}
            label="Active Shares"
            value={files.reduce((s, f) => s + (f.active_shares || 0), 0)}
            color="green"
          />
          <StatCard
            icon={<Shield size={20} />}
            label="Encryption"
            value="AES-256"
            sub="All files encrypted"
            color="orange"
          />
        </motion.div>

        {/* Storage bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-4 mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm flex items-center gap-2">
              <HardDrive size={14} /> Storage
            </span>
            <span className="text-white/40 text-xs font-mono">
              {formatFileSize(user?.storageUsed || 0)} / {formatFileSize(storageLimit)}
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${storagePercent}%` }} />
          </div>
        </motion.div>

        {/* Files list */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Lock size={18} className="text-cyan-400" /> Encrypted Vault
          </h2>
          <button onClick={fetchFiles} className="btn-ghost text-sm py-1.5 px-3">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : files.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-16 text-center"
          >
            <FolderOpen size={48} className="text-white/20 mx-auto mb-4" />
            <p className="text-white/40 text-lg mb-2">Your vault is empty</p>
            <p className="text-white/20 text-sm mb-6">Upload your first file to get started</p>
            <Link to="/upload" className="btn-primary inline-flex">
              <Upload size={16} /> Upload Now
            </Link>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-2"
          >
            {files.map((file) => (
              <motion.div
                key={file.id}
                variants={itemVariants}
                className="glass-card-hover p-4 flex items-center gap-4"
              >
                <div className="text-2xl w-10 flex-shrink-0 text-center">
                  {getFileIcon(file.mime_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium truncate">{file.original_name}</p>
                    <span className="badge-cyan flex-shrink-0">
                      <Lock size={10} /> Encrypted
                    </span>
                    {file.active_shares > 0 && (
                      <span className="badge-green flex-shrink-0">
                        <Share2 size={10} /> {file.active_shares} shared
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/30">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(file.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    to="/shares"
                    state={{ fileId: file.id, fileName: file.original_name }}
                    className="btn-ghost text-xs py-1.5 px-3 hidden sm:flex"
                  >
                    <Share2 size={13} /> Share
                  </Link>
                  <button
                    onClick={() => setActiveMenu(activeMenu === file.id ? null : file.id)}
                    className="btn-ghost p-2"
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>

                {activeMenu === file.id && (
                  <div className="absolute right-6 top-full mt-1 z-20 glass-card border-white/20 shadow-glass overflow-hidden w-40">
                    <Link
                      to="/shares"
                      state={{ fileId: file.id, fileName: file.original_name }}
                      className="flex items-center gap-2 px-4 py-2.5 hover:bg-white/5 text-sm"
                      onClick={() => setActiveMenu(null)}
                    >
                      <Share2 size={14} /> Share
                    </Link>
                    <button
                      onClick={() => handleDelete(file.id, file.original_name)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-red-500/10 text-red-400 text-sm"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
