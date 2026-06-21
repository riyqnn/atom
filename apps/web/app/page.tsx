'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  RefreshCw,
  Zap,
  TrendingUp,
  AlertTriangle,
  Shield,
  ChevronRight,
  Filter,
} from 'lucide-react'
import Link from 'next/link'
import AppLayout from '@/components/AppLayout'
import { MirageCard } from '@/components/MirageCard'
import { MirageData, MirageStatus } from '@/lib/types'

const FILTER_TABS: { label: string; value: 'all' | MirageStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Mirage', value: 'Mirage' },
  { label: 'Caution', value: 'Caution' },
  { label: 'Safe', value: 'Safe' },
]

export default function Dashboard() {
  const [mirages, setMirages] = useState<MirageData[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | MirageStatus>('all')
  const [selected, setSelected] = useState<MirageData | null>(null)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const fetchMirages = useCallback(async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const res = await fetch(`${API_URL}/mirage/latest`).catch(() => null)
      if (res?.ok) {
        const data = await res.json()
        setMirages(data)
      } else {
        console.error('Failed to fetch mirages')
      }
    } catch (e) {
      console.error(e)
    }
    setLastUpdate(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMirages()
    const interval = setInterval(fetchMirages, 30000)
    return () => clearInterval(interval)
  }, [fetchMirages])

  const filtered = filter === 'all' ? mirages : mirages.filter((m) => m.status === filter)

  const mirageCount = mirages.filter((m) => m.status === 'Mirage').length
  const cautionCount = mirages.filter((m) => m.status === 'Caution').length
  const safeCount = mirages.filter((m) => m.status === 'Safe').length
  const avgScore = mirages.length
    ? Math.round(mirages.reduce((s, m) => s + m.mirage_score, 0) / mirages.length)
    : 0

  return (
    <AppLayout>
      <div className="space-y-8">
        
        {/* ── Page header ─────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
                Real-Time Detection
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Liquidity <span className="gradient-text">Mirage Detector</span>
            </h1>
            <p className="text-[15px]" style={{ color: 'var(--text-2)' }}>
              Monitoring OI, bid-ask spreads & funding rates across derivatives markets.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col items-end gap-1"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 border border-white/5">
              <div className="relative flex items-center justify-center w-3 h-3">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20 animate-ping"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Live Sync
              </span>
            </div>
            <div className="text-[10px]" style={{ color: 'var(--text-3)' }} suppressHydrationWarning>
              Last update: {lastUpdate.toLocaleTimeString()}
            </div>
          </motion.div>
        </div>

        {/* ── KPI Cards ───────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <KPICard
            index={0}
            label="Market Avg Score"
            value={loading ? '—' : avgScore}
            icon={<Activity className="w-4 h-4" />}
            gradient="linear-gradient(135deg, #3B82F6, #06B6D4)"
            sub="Global mirage risk"
          />
          <KPICard
            index={1}
            label="Active Mirages"
            value={loading ? '—' : mirageCount}
            icon={<AlertTriangle className="w-4 h-4" />}
            gradient="linear-gradient(135deg, #F43F5E, #8B5CF6)"
            sub="High risk symbols"
            pulse={mirageCount > 0}
          />
          <KPICard
            index={2}
            label="Caution Zones"
            value={loading ? '—' : cautionCount}
            icon={<TrendingUp className="w-4 h-4" />}
            gradient="linear-gradient(135deg, #F59E0B, #F43F5E)"
            sub="Moderate risk"
          />
          <KPICard
            index={3}
            label="Safe Markets"
            value={loading ? '—' : safeCount}
            icon={<Shield className="w-4 h-4" />}
            gradient="linear-gradient(135deg, #10B981, #06B6D4)"
            sub="Low risk symbols"
          />
        </div>

        {/* ── Main View ───────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          
          <div className="xl:col-span-2 space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2 rounded-2xl glass-sm">
              <div className="flex items-center gap-1 p-1 bg-[rgba(0,0,0,0.2)] rounded-xl border border-[rgba(255,255,255,0.02)]">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setFilter(tab.value)}
                    className={`tab-pill ${filter === tab.value ? 'tab-pill-active' : ''}`}
                  >
                    {tab.label}
                    {tab.value !== 'all' && (
                      <span className="ml-2 opacity-60 text-[10px] bg-black/20 px-1.5 py-0.5 rounded-md">
                        {mirages.filter((m) => m.status === tab.value).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 px-3 text-xs" style={{ color: 'var(--text-3)' }}>
                <Filter className="w-3.5 h-3.5" />
                Showing {filtered.length} symbols
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="clay p-6 h-[280px] flex flex-col items-center justify-center">
                    <div className="w-24 h-24 rounded-full shimmer mb-6" />
                    <div className="w-32 h-4 rounded-full shimmer mb-3" />
                    <div className="w-48 h-3 rounded-full shimmer" />
                  </div>
                ))
              ) : (
                <AnimatePresence mode="popLayout">
                  {filtered.map((mirage, i) => (
                    <MirageCard
                      key={mirage.id}
                      data={mirage}
                      index={i}
                      selected={selected?.id === mirage.id}
                      onClick={() =>
                        setSelected((prev) => (prev?.id === mirage.id ? null : mirage))
                      }
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* ── Detail Panel ────────────────────────── */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="clay overflow-hidden relative"
                >
                  {/* Top glowing edge */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ 
                      background: selected.status === 'Mirage' ? 'linear-gradient(90deg, #F43F5E, #8B5CF6)' : 
                                  selected.status === 'Caution' ? 'linear-gradient(90deg, #F59E0B, #F43F5E)' : 
                                  'linear-gradient(90deg, #10B981, #06B6D4)' 
                    }}
                  />

                  <div className="p-6 border-b" style={{ borderColor: 'var(--border-2)' }}>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-2xl font-bold">{selected.symbol}</h3>
                      <span className={`badge ${selected.status === 'Safe' ? 'badge-safe' : selected.status === 'Caution' ? 'badge-caution' : 'badge-mirage'}`}>
                        {selected.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm font-mono-num" style={{ color: 'var(--text-2)' }}>
                      Score: {selected.mirage_score.toFixed(1)} / 100
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <DetailCell label="OI Percentile" value={`${selected.oi_percentile.toFixed(2)}%`} />
                    <DetailCell label="Bid/Ask Ratio" value={selected.bid_ask_ratio.toFixed(4)} />
                    <DetailCell
                      label="Funding Rate"
                      value={`${(selected.funding_rate * 100).toFixed(4)}%`}
                      positive={selected.funding_rate >= 0}
                    />
                    <DetailCell
                      label="Mark Price"
                      value={selected.price ? `$${selected.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                    />

                    <div className="pt-4 mt-2 border-t" style={{ borderColor: 'var(--border-2)' }}>
                      <Link
                        href={`/strategy?symbol=${selected.symbol}&score=${selected.mirage_score}&status=${selected.status}`}
                        className="btn-primary w-full justify-center"
                      >
                        <Zap className="w-4 h-4" />
                        Generate AI Strategy
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="clay-inset p-8 flex flex-col items-center justify-center text-center h-[320px] border-dashed"
                >
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-blue-500/10 mb-4 border border-blue-500/20">
                    <Activity className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-base font-semibold mb-1">Market Analysis</h3>
                  <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                    Select a symbol from the grid to view detailed metrics and generate strategies.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Formula Card */}
            <div className="clay-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-violet-500" />
                <h4 className="font-semibold text-sm">Liquidity Mirage Formula</h4>
              </div>
              <div className="code-block p-4 text-[11px] leading-relaxed">
                <span className="text-blue-400">score</span>
                <span className="text-slate-400"> = </span>
                <span className="text-green-400">oiPcnt</span>
                <span className="text-slate-400"> × 0.4 + </span>
                <br/>
                <span className="text-amber-400 ml-4">(1 − bidAsk)</span>
                <span className="text-slate-400"> × 100 × 0.4 + </span>
                <br/>
                <span className="text-purple-400 ml-4">fundingRate</span>
                <span className="text-slate-400"> × 1000 × 0.2</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </AppLayout>
  )
}

/* ── Helpers ──────────────────────────────────────────────── */
function KPICard({
  label,
  value,
  icon,
  gradient,
  sub,
  pulse,
  index = 0,
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  gradient: string
  sub: string
  pulse?: boolean
  index?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
      className="clay relative overflow-hidden group"
    >
      <div 
        className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500"
        style={{ background: gradient }}
      />
      
      <div className="p-5 md:p-6">
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white relative shadow-lg"
            style={{ background: gradient }}
          >
            {icon}
            {pulse && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 border-2 border-[var(--bg-surface)] animate-ping" />
            )}
          </div>
        </div>
        
        <div className="text-2xl md:text-3xl font-bold font-mono-num mb-1">
          {value}
        </div>
        <div className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
          {label}
        </div>
        <div className="text-[11px] mt-1" style={{ color: 'var(--text-3)' }}>
          {sub}
        </div>
      </div>
    </motion.div>
  )
}

function DetailCell({
  label,
  value,
  positive,
}: {
  label: string
  value: string
  positive?: boolean
}) {
  const color =
    positive === true ? '#34D399' : positive === false ? '#FB7185' : 'var(--text-1)'
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,0,0,0.15)] border border-[rgba(255,255,255,0.03)]">
      <span className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>{label}</span>
      <span className="text-sm font-semibold font-mono-num" style={{ color }}>
        {value}
      </span>
    </div>
  )
}
