import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams } from 'react-router-dom'
import { Shield, Lock, Download, Eye, EyeOff, AlertCircle, Check, Clock, FileDown, Unlock } from 'lucide-react'
import axios from 'axios'
import { decryptFile, downloadDecryptedFile, formatFileSize, getFileIcon } from '../utils/encryption'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function DownloadPage() {
  const { token } = useParams()
  const [linkInfo, setLinkInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [decrypting, setDecrypting] = useState(false)
  const [done, setDone] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [decryptProgress, setDecryptProgress] = useState(0)

  // Extract encryption key from URL hash (never sent to server)
  const keyFromHash = window.location.hash.replace('#key=', '')

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API_URL}/share/${token}/info`)
        setLinkInfo(res.data.link)
      } catch (err) {
        setError(err.response?.data?.message || 'Share link not found or expired')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [token])

  const handleDownload = async () => {
    setDownloading(true)
    setDownloadProgress(0)

    try {
      const res = await axios.post(
        `${API_URL}/share/${token}/download`,
        { password: linkInfo?.has_password ? password : undefined },
        {
          responseType: 'blob',
          onDownloadProgress: (evt) => {
            const pct = Math.round((evt.loaded / (evt.total || evt.loaded)) * 100)
            setDownloadProgress(pct)
          },
        }
      )

      const encryptedBlob = res.data
      const iv = res.headers['x-iv']

      if (!iv) {
        toast.error('Missing encryption metadata')
        setDownloading(false)
        return
      }

      // Decrypt using key from URL hash or session storage fallback
      const key = keyFromHash || sessionStorage.getItem(`key_${iv}`)
      if (!key) {
        toast.error('Encryption key not found. Use the full share URL.')
        setDownloading(false)
        return
      }

      setDownloading(false)
      setDecrypting(true)

      // Simulate decrypt progress
      const fakeProgress = setInterval(() => {
        setDecryptProgress(p => Math.min(p + 15, 90))
      }, 100)

      const decryptedBuffer = await decryptFile(encryptedBlob, key, iv)
      
      clearInterval(fakeProgress)
      setDecryptProgress(100)
      await new Promise(r => setTimeout(r, 300))

      downloadDecryptedFile(decryptedBuffer, linkInfo.original_name, linkInfo.mime_type)
      setDone(true)
      toast.success('File decrypted and downloaded!')
    } catch (err) {
      const msg = err.response?.data?.message || 'Download failed'
      setError(msg)
      toast.error(msg)
      setDownloading(false)
      setDecrypting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-white/50">Verifying share link...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background */}
      <div className="fixed inset-0 bg-hero-gradient" />
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-purple-brand/5 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-cyan-gradient rounded-lg flex items-center justify-center">
            <Lock size={16} className="text-navy-950" />
          </div>
          <span className="text-lg font-bold text-gradient-cyan">SecureVault</span>
        </div>

        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-8 text-center border-red-500/20"
            >
              <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Link Unavailable</h2>
              <p className="text-white/50">{error}</p>
            </motion.div>
          ) : done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-8 text-center border-green-neon/20"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="w-20 h-20 bg-green-neon/10 border border-green-neon/30 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Check size={36} className="text-green-neon" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2 text-gradient-cyan">Download Complete!</h2>
              <p className="text-white/50">
                Your file has been decrypted and saved to your device. Decryption happened entirely in your browser.
              </p>
              <div className="mt-4 badge-green mx-auto w-fit">
                <Shield size={12} /> Decrypted client-side
              </div>
            </motion.div>
          ) : decrypting ? (
            <motion.div
              key="decrypt"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-8 text-center"
            >
              <div className="relative w-24 h-24 mx-auto mb-6">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="44" fill="none" stroke="#00FF88" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 44 * decryptProgress / 100} ${2 * Math.PI * 44}`}
                    className="transition-all duration-200"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Unlock size={28} className="text-green-neon" />
                </div>
              </div>
              <h2 className="text-xl font-bold mb-2">Decrypting File</h2>
              <p className="text-white/40 text-sm">AES-256-GCM decryption in your browser...</p>
              <p className="text-green-neon font-mono text-xl mt-3">{decryptProgress}%</p>
            </motion.div>
          ) : downloading ? (
            <motion.div
              key="download"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-8 text-center"
            >
              <div className="relative w-24 h-24 mx-auto mb-6">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="44" fill="none" stroke="#00D9FF" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 44 * downloadProgress / 100} ${2 * Math.PI * 44}`}
                    className="transition-all duration-200"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileDown size={28} className="text-cyan-400" />
                </div>
              </div>
              <h2 className="text-xl font-bold mb-2">Downloading</h2>
              <p className="text-white/40 text-sm">Fetching encrypted file from vault...</p>
              <p className="text-cyan-400 font-mono text-xl mt-3">{downloadProgress}%</p>
            </motion.div>
          ) : linkInfo && (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 border-cyan-500/20"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center text-2xl">
                  {getFileIcon(linkInfo.mime_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{linkInfo.original_name}</p>
                  <p className="text-white/40 text-sm">{formatFileSize(linkInfo.size)}</p>
                </div>
                <span className="badge-cyan flex-shrink-0">
                  <Lock size={10} /> Encrypted
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-navy-800 rounded-xl p-3">
                  <p className="text-white/30 text-xs mb-1">Encryption</p>
                  <p className="font-mono text-sm text-cyan-400">AES-256-GCM</p>
                </div>
                <div className="bg-navy-800 rounded-xl p-3">
                  <p className="text-white/30 text-xs mb-1">Downloads</p>
                  <p className="font-mono text-sm">
                    {linkInfo.download_count}
                    {linkInfo.max_downloads ? `/${linkInfo.max_downloads}` : ''}
                  </p>
                </div>
                {linkInfo.expires_at && (
                  <div className="bg-navy-800 rounded-xl p-3 col-span-2">
                    <p className="text-white/30 text-xs mb-1 flex items-center gap-1">
                      <Clock size={10} /> Expires
                    </p>
                    <p className="text-sm">{new Date(linkInfo.expires_at).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {linkInfo.has_password && (
                <div className="mb-4">
                  <label className="text-sm text-white/60 mb-1.5 flex items-center gap-1.5">
                    <Lock size={12} /> Enter Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleDownload()}
                      className="input-field pr-10"
                      placeholder="Password required"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleDownload}
                disabled={linkInfo.has_password && !password}
                className="btn-primary w-full justify-center py-4"
              >
                <Download size={18} />
                Decrypt & Download
              </button>

              <div className="mt-4 flex items-center gap-2 text-white/30 text-xs justify-center">
                <Shield size={12} className="text-cyan-400" />
                Decryption happens in your browser — never on our servers
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
