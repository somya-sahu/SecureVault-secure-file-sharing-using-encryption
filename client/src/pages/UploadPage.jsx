import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'
import { Upload, Lock, FileUp, Check, X, Shield, Zap, AlertCircle } from 'lucide-react'
import { encryptFile, formatFileSize, getFileIcon } from '../utils/encryption'
import api from '../utils/api'
import toast from 'react-hot-toast'

const STEPS = ['Select', 'Encrypt', 'Upload', 'Done']

export default function UploadPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [step, setStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [encProgress, setEncProgress] = useState(0)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [error, setError] = useState(null)

  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) {
      setFile(accepted[0])
      setError(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 500 * 1024 * 1024,
    onDropRejected: (files) => {
      if (files[0]?.errors[0]?.code === 'file-too-large') {
        setError('File too large. Maximum size is 500MB.')
      }
    }
  })

  const handleUpload = async () => {
    if (!file) return
    setError(null)

    try {
      // Step 1: Encrypt
      setStep(1)
      setEncProgress(0)
      
      const fakeProgress = setInterval(() => {
        setEncProgress(p => Math.min(p + Math.random() * 15, 90))
      }, 100)
      
      const { encryptedBlob, iv, keyBase64, checksum, originalSize } = await encryptFile(file)
      
      clearInterval(fakeProgress)
      setEncProgress(100)
      await new Promise(r => setTimeout(r, 400))

      // Step 2: Upload
      setStep(2)
      setProgress(0)

      const formData = new FormData()
      formData.append('file', encryptedBlob, file.name + '.enc')
      formData.append('originalName', file.name)
      formData.append('mimeType', file.type || 'application/octet-stream')
      formData.append('originalSize', String(originalSize))
      formData.append('iv', iv)
      formData.append('checksum', checksum)

      // Store key client-side in sessionStorage (never sent to server)
      sessionStorage.setItem(`key_${iv}`, keyBase64)

      const res = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          const pct = Math.round((evt.loaded / evt.total) * 100)
          setProgress(pct)
        },
      })

      setUploadedFile({ ...res.data.file, keyBase64 })
      setStep(3)
      toast.success('File encrypted and uploaded!')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Upload failed')
      setStep(0)
      toast.error('Upload failed')
    }
  }

  const reset = () => {
    setFile(null)
    setStep(0)
    setProgress(0)
    setEncProgress(0)
    setUploadedFile(null)
    setError(null)
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-2xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-black mb-2">
            <span className="text-gradient-cyan">Encrypt</span> & Upload
          </h1>
          <p className="text-white/40">Files are encrypted in your browser before upload. We never see your data.</p>
        </motion.div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 flex-shrink-0
                ${i < step ? 'bg-green-neon text-navy-950' : i === step ? 'bg-cyan-500 text-navy-950 shadow-glow-cyan' : 'bg-white/10 text-white/30'}`}>
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <span className={`text-xs font-medium ${i <= step ? 'text-white' : 'text-white/30'}`}>{s}</span>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px transition-all duration-500 ${i < step ? 'bg-green-neon/40' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300
                  ${isDragActive
                    ? 'border-cyan-500 bg-cyan-500/10 shadow-glow-cyan'
                    : 'border-white/10 bg-white/2 hover:border-cyan-500/50 hover:bg-cyan-500/5'
                  }`}
              >
                <input {...getInputProps()} />
                <motion.div
                  animate={isDragActive ? { scale: 1.05 } : { scale: 1 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300
                    ${isDragActive ? 'bg-cyan-500/20 shadow-glow-cyan' : 'bg-white/5'}`}
                  >
                    {isDragActive ? (
                      <FileUp size={36} className="text-cyan-400" />
                    ) : (
                      <Upload size={36} className="text-white/30" />
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-semibold mb-1">
                      {isDragActive ? 'Drop to encrypt & upload' : 'Drag & drop your file here'}
                    </p>
                    <p className="text-white/40 text-sm">or click to browse · Max 500MB</p>
                  </div>
                </motion.div>
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
                >
                  <AlertCircle size={16} /> {error}
                </motion.div>
              )}

              {/* Selected file preview */}
              {file && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 glass-card p-4 flex items-center gap-4"
                >
                  <div className="text-3xl">{getFileIcon(file.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-white/40 text-sm">{formatFileSize(file.size)}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null) }} className="btn-ghost p-2">
                    <X size={16} />
                  </button>
                </motion.div>
              )}

              {/* Security info */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  { icon: <Lock size={16} />, text: 'AES-256-GCM', sub: 'Encryption' },
                  { icon: <Shield size={16} />, text: 'Client-Side', sub: 'In your browser' },
                  { icon: <Zap size={16} />, text: 'Zero-Knowledge', sub: 'We never see it' },
                ].map(item => (
                  <div key={item.text} className="flex flex-col items-center gap-1 p-3 bg-navy-800/50 rounded-xl text-center">
                    <span className="text-cyan-400">{item.icon}</span>
                    <span className="text-xs font-semibold">{item.text}</span>
                    <span className="text-white/30 text-xs">{item.sub}</span>
                  </div>
                ))}
              </div>

              {file && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={handleUpload}
                  className="btn-primary w-full mt-6 justify-center py-4"
                >
                  <Lock size={18} /> Encrypt & Upload Securely
                </motion.button>
              )}
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="encrypt"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-card p-8 text-center"
            >
              <div className="relative w-24 h-24 mx-auto mb-6">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="44" fill="none" stroke="#00D9FF" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 44 * encProgress / 100} ${2 * Math.PI * 44}`}
                    className="transition-all duration-200"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock size={28} className="text-cyan-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">Encrypting File</h2>
              <p className="text-white/40 mb-4">AES-256-GCM encryption in progress...</p>
              <p className="text-cyan-400 font-mono text-xl">{Math.round(encProgress)}%</p>
              <p className="text-white/20 text-xs mt-4">Your file never leaves the browser unencrypted</p>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-card p-8 text-center"
            >
              <div className="relative w-24 h-24 mx-auto mb-6">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="44" fill="none" stroke="#A855F7" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 44 * progress / 100} ${2 * Math.PI * 44}`}
                    className="transition-all duration-200"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Upload size={28} className="text-purple-light" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">Uploading Encrypted File</h2>
              <p className="text-white/40 mb-4">Sending encrypted data to vault...</p>
              <p className="text-purple-light font-mono text-xl">{progress}%</p>
            </motion.div>
          )}

          {step === 3 && uploadedFile && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-8 text-center border-green-neon/20"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-20 h-20 bg-green-neon/10 border border-green-neon/30 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Check size={36} className="text-green-neon" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">
                <span className="text-gradient-cyan">Encrypted & Secured!</span>
              </h2>
              <p className="text-white/40 mb-6">Your file has been encrypted and stored securely.</p>
              
              <div className="bg-navy-800 rounded-xl p-4 mb-6 text-left">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{getFileIcon(uploadedFile.mime_type)}</div>
                  <div>
                    <p className="font-medium">{uploadedFile.original_name}</p>
                    <p className="text-white/40 text-sm">{formatFileSize(uploadedFile.size)} · AES-256-GCM encrypted</p>
                  </div>
                  <span className="ml-auto badge-green"><Check size={10} /> Secured</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={reset} className="btn-secondary flex-1 justify-center">
                  <Upload size={16} /> Upload Another
                </button>
                <button
                  onClick={() => navigate('/shares', { state: { fileId: uploadedFile.id, fileName: uploadedFile.original_name } })}
                  className="btn-primary flex-1 justify-center"
                >
                  <Shield size={16} /> Create Share Link
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
