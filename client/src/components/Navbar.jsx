import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, LayoutDashboard, Upload, Share2, LogOut, Menu, X, Shield, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/upload', icon: <Upload size={18} />, label: 'Upload' },
  { to: '/shares', icon: <Share2 size={18} />, label: 'Shares' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/')
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-navy-950/90 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-gradient rounded-lg flex items-center justify-center shadow-glow-cyan">
              <Lock size={16} className="text-navy-950" />
            </div>
            <span className="text-lg font-bold text-gradient-cyan hidden sm:block">SecureVault</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const active = location.pathname === item.to
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${active
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Security badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-green-neon/5 border border-green-neon/20 rounded-full">
              <Shield size={12} className="text-green-neon" />
              <span className="text-green-neon text-xs font-medium">E2E Encrypted</span>
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
              >
                <div className="w-7 h-7 bg-cyan-gradient rounded-lg flex items-center justify-center text-navy-950 font-bold text-sm">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-medium hidden sm:block max-w-[100px] truncate">{user?.username}</span>
                <ChevronDown size={14} className={`text-white/40 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-48 glass-card border-white/20 shadow-glass overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-sm font-semibold">{user?.username}</p>
                      <p className="text-white/30 text-xs truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => { handleLogout(); setUserMenuOpen(false) }}
                      className="w-full flex items-center gap-2 px-4 py-3 hover:bg-red-500/10 text-red-400 text-sm transition-colors"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden btn-ghost p-2"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/5 bg-navy-950/95"
            >
              <div className="px-4 py-3 space-y-1">
                {navItems.map(item => {
                  const active = location.pathname === item.to
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                        ${active ? 'bg-cyan-500/10 text-cyan-400' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                    >
                      {item.icon} {item.label}
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Click outside to close user menu */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
      )}
    </>
  )
}
