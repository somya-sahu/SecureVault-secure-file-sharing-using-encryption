import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, User, Mail, Eye, EyeOff, Shield, ArrowRight, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function AuthPage() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ email: '', username: '', password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.password) e.password = 'Password required'
    else if (form.password.length < 8) e.password = 'Min 8 characters'
    if (mode === 'register') {
      if (!form.username) e.username = 'Username required'
      if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
        toast.success('Welcome back!')
      } else {
        await register(form.email, form.username, form.password)
        toast.success('Account created!')
      }
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const f = (field) => ({
    value: form[field],
    onChange: (e) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }))
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
    }
  })

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Background */}
      <div className="fixed inset-0 bg-hero-gradient" />
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-purple-brand/5 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 mb-8"
        >
          <div className="w-10 h-10 bg-cyan-gradient rounded-xl flex items-center justify-center shadow-glow-cyan">
            <Lock size={20} className="text-navy-950" />
          </div>
          <span className="text-2xl font-black text-gradient-cyan">SecureVault</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-8 border-white/10"
        >
          {/* Tab switcher */}
          <div className="flex p-1 bg-navy-800 rounded-xl mb-6">
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setErrors({}) }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200
                  ${mode === m ? 'bg-cyan-500 text-navy-950 shadow-glow-cyan' : 'text-white/50 hover:text-white'}`}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Email */}
              <div>
                <label className="text-sm text-white/60 mb-1.5 flex items-center gap-1.5">
                  <Mail size={12} /> Email Address
                </label>
                <input
                  type="email"
                  {...f('email')}
                  className={`input-field ${errors.email ? 'border-red-500/60' : ''}`}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Username (register only) */}
              <AnimatePresence>
                {mode === 'register' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="text-sm text-white/60 mb-1.5 flex items-center gap-1.5">
                      <User size={12} /> Username
                    </label>
                    <input
                      type="text"
                      {...f('username')}
                      className={`input-field ${errors.username ? 'border-red-500/60' : ''}`}
                      placeholder="johndoe"
                      autoComplete="username"
                    />
                    {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username}</p>}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Password */}
              <div>
                <label className="text-sm text-white/60 mb-1.5 flex items-center gap-1.5">
                  <Lock size={12} /> Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    {...f('password')}
                    className={`input-field pr-10 ${errors.password ? 'border-red-500/60' : ''}`}
                    placeholder={mode === 'login' ? '••••••••' : 'Min 8 characters'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
              </div>

              {/* Confirm password (register only) */}
              <AnimatePresence>
                {mode === 'register' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="text-sm text-white/60 mb-1.5 flex items-center gap-1.5">
                      <Check size={12} /> Confirm Password
                    </label>
                    <input
                      type={showPw ? 'text' : 'password'}
                      {...f('confirm')}
                      className={`input-field ${errors.confirm ? 'border-red-500/60' : ''}`}
                      placeholder="Repeat password"
                    />
                    {errors.confirm && <p className="text-red-400 text-xs mt-1">{errors.confirm}</p>}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-4 mt-2 shadow-glow-cyan"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-navy-950/40 border-t-navy-950 rounded-full animate-spin" />
                ) : (
                  <>
                    <Shield size={18} />
                    {mode === 'login' ? 'Sign In Securely' : 'Create Account'}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </motion.form>
          </AnimatePresence>

          {/* Security notice */}
          <div className="mt-6 pt-4 border-t border-white/5">
            <div className="flex items-center justify-center gap-4">
              {['AES-256-GCM', 'Zero-Knowledge', 'Secure JWT'].map(item => (
                <div key={item} className="flex items-center gap-1.5 text-white/20 text-xs">
                  <Lock size={10} className="text-cyan-500/60" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
