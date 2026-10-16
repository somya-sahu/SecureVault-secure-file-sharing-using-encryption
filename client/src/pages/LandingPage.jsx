import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Shield, Lock, Share2, Zap, Eye, Key, ArrowRight, Check, ChevronDown, Globe, Users, Database } from 'lucide-react'
import { useEffect, useRef } from 'react'

const features = [
  {
    icon: <Lock size={24} />,
    title: 'AES-256-GCM Encryption',
    desc: 'Military-grade encryption happens entirely in your browser. Your files are encrypted before they ever leave your device.',
    color: 'cyan',
    gradient: 'from-cyan-500/20 to-cyan-500/5',
    border: 'border-cyan-500/30',
  },
  {
    icon: <Eye size={24} />,
    title: 'Zero-Knowledge Architecture',
    desc: 'We never see your files or encryption keys. Even if our servers were compromised, your data remains protected.',
    color: 'purple',
    gradient: 'from-purple-brand/20 to-purple-brand/5',
    border: 'border-purple-brand/30',
  },
  {
    icon: <Share2 size={24} />,
    title: 'Secure Share Links',
    desc: 'Generate time-limited, password-protected share links. Set download limits and auto-expiry for maximum control.',
    color: 'green',
    gradient: 'from-green-brand/20 to-green-brand/5',
    border: 'border-green-brand/30',
  },
  {
    icon: <Key size={24} />,
    title: 'Client-Side Key Management',
    desc: 'Encryption keys are embedded in share URLs and never stored on our servers. True end-to-end security.',
    color: 'cyan',
    gradient: 'from-cyan-500/20 to-cyan-500/5',
    border: 'border-cyan-500/30',
  },
  {
    icon: <Zap size={24} />,
    title: 'Blazing Fast Transfers',
    desc: 'Optimized streaming encryption/decryption with chunked processing handles files up to 500MB effortlessly.',
    color: 'purple',
    gradient: 'from-purple-brand/20 to-purple-brand/5',
    border: 'border-purple-brand/30',
  },
  {
    icon: <Shield size={24} />,
    title: 'Audit & Activity Logs',
    desc: 'Track every download with IP addresses, timestamps, and user agents. Full visibility into who accessed your files.',
    color: 'green',
    gradient: 'from-green-brand/20 to-green-brand/5',
    border: 'border-green-brand/30',
  },
]

const stats = [
  { value: '256-bit', label: 'AES Key Length', icon: <Key size={20} /> },
  { value: '100%', label: 'Client-Side Encryption', icon: <Lock size={20} /> },
  { value: '500MB', label: 'Max File Size', icon: <Database size={20} /> },
  { value: '∞', label: 'Share Recipients', icon: <Users size={20} /> },
]

const steps = [
  { num: '01', title: 'Upload & Encrypt', desc: 'Select your file. It\'s encrypted in-browser with AES-256-GCM before upload.' },
  { num: '02', title: 'Generate Link', desc: 'Get a secure share link with optional password protection and expiry settings.' },
  { num: '03', title: 'Share Securely', desc: 'Recipients download and decrypt the file entirely client-side. Zero server exposure.' },
]

// Particle system component
function ParticleCanvas() {
  const canvasRef = useRef(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    
    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)
    
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.4 + 0.1,
      color: Math.random() > 0.5 ? '0, 217, 255' : '124, 58, 237',
    }))
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw connections
      particles.forEach((p, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dx = p.x - p2.x, dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(0, 217, 255, ${(1 - dist / 120) * 0.08})`
            ctx.lineWidth = 0.5
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        })
      })
      
      particles.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`
        ctx.fill()
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
      })
      
      animId = requestAnimationFrame(draw)
    }
    draw()
    
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])
  
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-navy-950/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-gradient rounded-lg flex items-center justify-center shadow-glow-cyan">
              <Lock size={16} className="text-navy-950" />
            </div>
            <span className="text-lg font-bold text-gradient-cyan">SecureVault</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="btn-ghost text-sm py-2 px-4 hidden sm:flex">Sign In</Link>
            <Link to="/auth" className="btn-primary text-sm py-2 px-5">
              Get Started <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <ParticleCanvas />
        
        {/* Background glows */}
        <div className="glow-orb w-96 h-96 bg-cyan-500 top-1/4 left-1/4 transform -translate-x-1/2" />
        <div className="glow-orb w-80 h-80 bg-purple-brand top-1/3 right-1/4 transform translate-x-1/2" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-2 mb-8"
          >
            <span className="badge-cyan">
              <Shield size={12} /> Military-Grade Security
            </span>
            <span className="badge-purple">
              <Globe size={12} /> Zero-Knowledge
            </span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 leading-tight"
          >
            Share Files With{' '}
            <span className="text-gradient-multi block sm:inline">
              Unbreakable Encryption
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            SecureVault encrypts your files client-side using AES-256-GCM before they ever leave your browser.
            Your data, your keys, your control.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/auth" className="btn-primary text-base px-8 py-4 shadow-glow-cyan">
              <Lock size={18} />
              Start Encrypting Free
              <ArrowRight size={18} />
            </Link>
            <a href="#how-it-works" className="btn-secondary text-base px-8 py-4">
              See How It Works
            </a>
          </motion.div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 relative"
          >
            <div className="glass-card p-8 max-w-2xl mx-auto relative overflow-hidden">
              {/* Scan animation overlay */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent animate-scan" />
              </div>
              
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 h-6 bg-navy-800 rounded-md flex items-center px-3">
                  <span className="text-white/30 text-xs font-mono">securevault.app/download/e7f9a2b...</span>
                </div>
                <Shield size={16} className="text-green-neon" />
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-left">
                {[
                  { label: 'Algorithm', value: 'AES-256-GCM', color: 'cyan' },
                  { label: 'Status', value: 'ENCRYPTED', color: 'green' },
                  { label: 'Key Length', value: '256-bit', color: 'purple' },
                ].map((item) => (
                  <div key={item.label} className="bg-navy-800 rounded-xl p-4">
                    <p className="text-white/40 text-xs mb-1">{item.label}</p>
                    <p className={`font-mono text-sm font-semibold text-${item.color}-400`}>{item.value}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 bg-navy-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/40 text-xs">Encryption Progress</span>
                  <span className="text-cyan-400 text-xs font-mono">100%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill w-full" />
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-12 flex justify-center"
          >
            <a href="#features" className="text-white/30 hover:text-white/60 transition-colors flex flex-col items-center gap-2 text-sm">
              Explore Features
              <ChevronDown size={20} className="animate-bounce" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-white/5 bg-navy-900/50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center gap-2 text-cyan-400 mb-2">
                  {stat.icon}
                </div>
                <div className="text-3xl font-black text-gradient-cyan mb-1">{stat.value}</div>
                <div className="text-white/40 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="badge-cyan mb-4">Features</span>
            <h2 className="text-4xl font-black mb-4">Enterprise-Grade Security Features</h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              Built with security researchers and enterprises in mind. Every feature prioritizes your privacy.
            </p>
          </motion.div>
          
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={itemVariants}
                whileHover={{ y: -4, scale: 1.01 }}
                className={`glass-card p-6 border ${f.border} hover:shadow-glow-${f.color} transition-all duration-300 cursor-default`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-4 text-${f.color}-400`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-navy-900/30">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="badge-purple mb-4">How It Works</span>
            <h2 className="text-4xl font-black mb-4">Three Steps to Total Security</h2>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-cyan-500/30 to-transparent -translate-x-8 z-0" />
                )}
                <div className="relative z-10">
                  <div className="text-6xl font-black text-gradient-cyan opacity-30 mb-4 font-mono">{step.num}</div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-white/50 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="glow-orb w-96 h-96 bg-cyan-500 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card p-12 border-cyan-500/20"
          >
            <Shield size={48} className="text-cyan-400 mx-auto mb-6" />
            <h2 className="text-4xl font-black mb-4">Ready to Secure Your Files?</h2>
            <p className="text-white/50 mb-8 text-lg">
              Join thousands of users who trust SecureVault with their most sensitive files.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth" className="btn-primary text-base px-8 py-4 shadow-glow-cyan">
                <Lock size={18} />
                Create Free Account
                <ArrowRight size={18} />
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {['No credit card required', 'Free forever', 'Open source ready'].map(item => (
                <div key={item} className="flex items-center gap-2 text-white/50 text-sm">
                  <Check size={14} className="text-green-neon" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-cyan-gradient rounded-md flex items-center justify-center">
              <Lock size={12} className="text-navy-950" />
            </div>
            <span className="text-white/50 text-sm">SecureVault © 2024. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            {['Privacy', 'Security', 'Docs', 'GitHub'].map(link => (
              <a key={link} href="#" className="text-white/30 hover:text-white/60 text-sm transition-colors">{link}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
