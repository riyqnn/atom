'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Zap, BarChart3, Clock, Menu, X, Waves } from 'lucide-react'

const NAV = [
  { label: 'Dashboard', href: '/', icon: Activity },
  { label: 'Strategy',  href: '/strategy', icon: Zap },
  { label: 'Backtest',  href: '/backtest', icon: BarChart3 },
  { label: 'History',   href: '/history', icon: Clock },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>

      {/* ── Topbar ─────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 px-4 md:px-6 py-3"
        style={{
          background: 'rgba(13,17,23,0.85)',
          backdropFilter: 'blur(24px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div className="max-w-[1400px] mx-auto flex items-center gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                boxShadow: '0 4px 12px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              <Waves className="w-4 h-4 text-white" />
            </motion.div>
            <div>
              <div
                className="text-base font-bold gradient-text leading-none"
                style={{ fontFamily: 'var(--font-space-grotesk)' }}
              >
                ATOM
              </div>
              <div className="text-[10px] leading-none mt-0.5" style={{ color: 'var(--text-3)' }}>
                Trading Matrix
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {NAV.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                      active
                        ? 'text-blue-400'
                        : 'hover:text-white'
                    }`}
                    style={{
                      color: active ? '#60A5FA' : 'var(--text-2)',
                      background: active ? 'rgba(59,130,246,0.1)' : undefined,
                      border: active ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
                      boxShadow: active ? '0 0 12px rgba(59,130,246,0.12)' : undefined,
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </motion.div>
                </Link>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-3">
            {/* Live pill */}
            <motion.div
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold"
              style={{
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.2)',
                color: '#34D399',
                boxShadow: '0 0 10px rgba(16,185,129,0.1)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              LIVE
            </motion.div>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden btn-ghost p-2 rounded-xl"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile nav ─────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-x-0 top-[57px] z-40 p-4"
            style={{
              background: 'rgba(13,17,23,0.97)',
              backdropFilter: 'blur(24px)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <nav className="space-y-1.5 max-w-sm mx-auto">
              {NAV.map((item, i) => {
                const Icon = item.icon
                const active = pathname === item.href
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                        active ? 'text-blue-400' : 'text-slate-400'
                      }`}
                      style={{
                        background: active ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)',
                        border: active ? '1px solid rgba(59,130,246,0.2)' : '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  </motion.div>
                )
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page content ───────────────────────────────── */}
      <main className="flex-1 bg-grid">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8">
          {children}
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer
        className="text-center text-xs py-5"
        style={{
          color: 'var(--text-3)',
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        ATOM © 2026 · Built with CoinMarketCap
      </footer>
    </div>
  )
}
