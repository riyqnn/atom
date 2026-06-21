'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Shield,
  Calendar,
  Filter,
  BarChart2,
  Minus,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Bar,
} from 'recharts'
import AppLayout from '@/components/AppLayout'
import { MirageStatus, classifyScore } from '@/lib/types'

interface HistoricalPoint {
  date: string
  price: number
  score: number
  status: MirageStatus
  oi_percentile: number
  bid_ask_ratio: number
  funding_rate: number
}

interface MirageEvent {
  date: string
  score: number
  status: MirageStatus
  outcome: string
  priceChangePct: number
}

function extractEvents(data: HistoricalPoint[]): MirageEvent[] {
  const events: MirageEvent[] = []
  for (let i = 0; i < data.length; i++) {
    const point = data[i]
    if (point.status === 'Mirage' || (point.status === 'Caution' && point.score > 60)) {
      const futurePrice = data[i + 3]?.price || data[i + 1]?.price || point.price
      const priceChangePct = ((futurePrice - point.price) / point.price) * 100

      events.push({
        date: point.date,
        score: point.score,
        status: point.status,
        outcome: priceChangePct < -2 ? 'Reversed ↓' : priceChangePct > 2 ? 'Continued ↑' : 'Consolidated',
        priceChangePct: Math.round(priceChangePct * 100) / 100,
      })

      i += 5
    }
  }
  return events.slice(0, 15)
}

function HistoryContent() {
  const searchParams = useSearchParams()
  const [symbol, setSymbol] = useState('BTC')
  const [days, setDays] = useState(90)
  const [data, setData] = useState<HistoricalPoint[]>([])
  const [events, setEvents] = useState<MirageEvent[]>([])
  const [selected, setSelected] = useState<HistoricalPoint | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const s = searchParams.get('symbol')
    if (s) setSymbol(s)
  }, [searchParams])

  useEffect(() => {
    setLoading(true)
    const load = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
        const res = await fetch(`${API_URL}/mirage/history?symbol=${symbol}&days=${days}`).catch(() => null)
        let histData: HistoricalPoint[] = []
        if (res?.ok) {
          const apiData = await res.json()
          // map apiData to HistoricalPoint
          histData = apiData.map((d: any) => ({
            date: d.timestamp,
            price: d.price || 0,
            score: d.mirage_score,
            status: d.status,
            oi_percentile: d.oi_percentile,
            bid_ask_ratio: d.bid_ask_ratio,
            funding_rate: d.funding_rate,
          }))
        }
        setData(histData)
        setEvents(extractEvents(histData))
      } catch (err) {
        console.error(err)
      }
      setLoading(false)
    }
    load()
  }, [symbol, days])

  const miragePoints = data.filter((d) => d.status === 'Mirage').length
  const cautionPoints = data.filter((d) => d.status === 'Caution').length
  const avgScore = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.score, 0) / data.length) : 0
  const maxScore = data.length > 0 ? Math.round(Math.max(...data.map((d) => d.score))) : 0

  const chartData = data.map((d) => ({
    date: d.date.slice(5),
    price: d.price,
    score: d.score,
    isMirage: d.status === 'Mirage' ? d.score : null,
    isCaution: d.status === 'Caution' ? d.score : null,
  }))

  return (
    <AppLayout>
      <div className="space-y-8">
        
        {/* ── Header ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Pattern Recognition
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Historical <span className="gradient-text">Mirage Analysis</span>
          </h1>
          <p className="text-[15px]" style={{ color: 'var(--text-2)' }}>
            Track historical mirage events and analyze their predictive correlation with subsequent price action.
          </p>
        </motion.div>

        {/* ── Controls ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="clay p-4 lg:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto custom-scrollbar pb-2 md:pb-0">
            <div className="flex items-center gap-2 flex-shrink-0">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Assets:</span>
            </div>
            <div className="flex gap-2 bg-black/20 p-1 rounded-xl border border-white/5">
              {['BTC', 'ETH', 'SOL', 'BNB', 'MATIC', 'AVAX'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSymbol(s)}
                  className={`tab-pill flex-shrink-0 ${symbol === s ? 'tab-pill-active' : ''}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4 flex-shrink-0">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 hidden sm:block">Timeframe:</span>
            <div className="flex gap-2 bg-black/20 p-1 rounded-xl border border-white/5">
              {[30, 60, 90, 180].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`tab-pill px-4 ${days === d ? 'tab-pill-active' : ''}`}
                >
                  {d}D
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── KPI Row ───────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <MiniKPI icon={<AlertTriangle />} label="Mirage Signals" value={miragePoints} color="#F43F5E" />
          <MiniKPI icon={<TrendingUp />} label="Caution Signals" value={cautionPoints} color="#F59E0B" />
          <MiniKPI icon={<BarChart2 />} label="Average Score" value={avgScore} color="#3B82F6" />
          <MiniKPI icon={<Shield />} label="Peak Score" value={maxScore} color="#8B5CF6" />
        </div>

        {/* ── Charts & Sidebar ───────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Main Charts */}
          <div className="xl:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="clay p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-bold">{symbol} Price Action</h3>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Price</span>
                </div>
              </div>
              
              {loading ? <ChartSkeleton /> : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={chartData} margin={{ left: -20, right: 0, bottom: 0, top: 0 }}>
                    <defs>
                      <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={30} />
                    <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip label="Price" format={(v: number) => `$${v.toLocaleString()}`} color="#60A5FA" />} />
                    <Area type="monotone" dataKey="price" stroke="#3B82F6" strokeWidth={2.5} fill="url(#priceGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="clay p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className="text-base font-bold">Mirage Score Heatmap</h3>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mirage</span></div>
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Caution</span></div>
                </div>
              </div>

              {loading ? <ChartSkeleton height={180} /> : (
                <ResponsiveContainer width="100%" height={180}>
                  <ComposedChart data={chartData} margin={{ left: -20, right: 0, bottom: 0, top: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={30} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip label="Score" format={(v: number) => v.toFixed(1)} color="#C084FC" />} />
                    
                    <ReferenceLine y={70} stroke="rgba(244,63,94,0.3)" strokeDasharray="4 4" label={{ value: 'MIRAGE', position: 'insideTopLeft', fill: '#FB7185', fontSize: 10, fontWeight: 'bold' }} />
                    <ReferenceLine y={30} stroke="rgba(16,185,129,0.3)" strokeDasharray="4 4" label={{ value: 'SAFE', position: 'insideTopLeft', fill: '#34D399', fontSize: 10, fontWeight: 'bold' }} />
                    
                    <Bar dataKey="isMirage" fill="#F43F5E" opacity={0.8} radius={[4, 4, 0, 0]} barSize={6} />
                    <Bar dataKey="isCaution" fill="#F59E0B" opacity={0.6} radius={[4, 4, 0, 0]} barSize={6} />
                    <Area type="monotone" dataKey="score" stroke="#8B5CF6" strokeWidth={2} fill="rgba(139,92,246,0.05)" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </motion.div>
          </div>

          {/* Events Sidebar */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="clay flex flex-col h-[650px]">
            <div className="p-6 border-b border-white/5 bg-[rgba(255,255,255,0.02)] rounded-t-[20px]">
              <h3 className="text-base font-bold mb-1">Detected Events</h3>
              <p className="text-xs text-slate-400">High-risk mirage signals and subsequent 4h price action outcomes.</p>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar flex-1">
              {loading ? (
                <div className="p-8 flex items-center justify-center h-full">
                  <div className="w-10 h-10 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                </div>
              ) : events.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                  <Shield className="w-10 h-10 text-emerald-500/30 mb-3" />
                  <p className="text-sm font-bold text-slate-300">No events found</p>
                  <p className="text-xs text-slate-500 mt-1">Market conditions remained safe.</p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  <AnimatePresence>
                    {events.map((event, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-4 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-bold text-slate-500 font-mono-num uppercase tracking-widest">{event.date}</span>
                          <span className={`badge ${event.status === 'Mirage' ? 'badge-mirage' : 'badge-caution'}`}>
                            {event.status.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-end gap-1.5">
                            <span className="text-xl font-bold font-mono-num leading-none">{event.score.toFixed(1)}</span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Score</span>
                          </div>
                          
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${event.priceChangePct < -2 ? 'bg-rose-500/10 text-rose-400' : event.priceChangePct > 2 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-300'}`}>
                            {event.priceChangePct < -2 ? <TrendingDown className="w-3.5 h-3.5" /> : event.priceChangePct > 2 ? <TrendingUp className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                            <span className="text-xs font-bold font-mono-num">
                              {event.priceChangePct > 0 ? '+' : ''}{event.priceChangePct.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-[11px] text-slate-400">
                          Outcome: <span className="text-white">{event.outcome}</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </AppLayout>
  )
}

function MiniKPI({ icon, label, value, color }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="clay-sm p-4 md:p-5 flex items-center gap-4 group hover:bg-[rgba(255,255,255,0.03)] transition-colors">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner" style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
        {React.cloneElement(icon, { className: 'w-5 h-5' })}
      </div>
      <div>
        <div className="text-2xl md:text-3xl font-bold font-mono-num leading-none mb-1.5" style={{ color, filter: `drop-shadow(0 0 12px ${color}40)` }}>
          {value}
        </div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          {label}
        </div>
      </div>
    </motion.div>
  )
}

function CustomTooltip({ active, payload, label: xLabel, format, color }: any) {
  if (active && payload && payload.length) {
    const val = payload[0].value
    return (
      <div className="bg-[#1C2333] border border-white/10 rounded-xl p-3 shadow-xl">
        <p className="text-[10px] font-bold text-slate-400 mb-1 font-mono-num">{xLabel}</p>
        <p className="text-sm font-bold font-mono-num" style={{ color }}>
          {format ? format(val) : val}
        </p>
      </div>
    )
  }
  return null
}

function ChartSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div className="w-full flex flex-col items-center justify-center gap-4" style={{ height }}>
      <div className="w-full h-full bg-black/10 rounded-xl border border-white/5 shimmer opacity-50" />
    </div>
  )
}

import React from 'react'

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 animate-pulse">Loading analysis...</div>}>
      <HistoryContent />
    </Suspense>
  )
}
