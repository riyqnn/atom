'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3,
  Play,
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  Activity,
  Zap,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import AppLayout from '@/components/AppLayout'
import {
  BacktestResult,
  fmtUSD,
  fmtPct,
} from '@/lib/types'

const MOCK_STRATEGY = `strategy_name: Liquidity Trap Mean Reversion
universe: BTC-PERP
regime_filter: mirageScore > 70
entry_rules: If OI spike and low liquidity, enter LONG
exit_rules: Close on score < 40 or stop hit
risk_management: Stop 1%, Position 3% equity`

function BacktestContent() {
  const searchParams = useSearchParams()
  const [symbol, setSymbol] = useState('BTC')
  const [days, setDays] = useState(90)
  const [strategyYaml, setStrategyYaml] = useState(MOCK_STRATEGY)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<BacktestResult | null>(null)

  useEffect(() => {
    const s = searchParams.get('symbol')
    const y = searchParams.get('yaml')
    if (s) setSymbol(s)
    if (y) {
      try {
        setStrategyYaml(decodeURIComponent(y))
      } catch {
        setStrategyYaml(y)
      }
    }
  }, [searchParams])

  async function runBacktest() {
    setRunning(true)
    setResult(null)
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const runRes = await fetch(`${API_URL}/backtest/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy_yaml: strategyYaml, symbol, days })
      })
      if (!runRes.ok) throw new Error('Failed to start backtest')
      
      const { job_id } = await runRes.json()
      
      // Poll until done
      while (true) {
        await new Promise((r) => setTimeout(r, 1000))
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
        const statusRes = await fetch(`${API_URL}/backtest/status?job_id=${job_id}`)
        if (!statusRes.ok) continue
        
        const data = await statusRes.json()
        if (data.status === 'done' || data.status === 'error') {
          setResult({
            job_id: data.job_id,
            status: data.status,
            symbol: data.symbol,
            metrics: data.metrics,
            trades: data.trades,
            equityCurve: data.equityCurve,
            monthlyReturns: data.metrics.monthlyReturns,
          } as any)
          break
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setRunning(false)
    }
  }

  const metrics = result?.metrics

  return (
    <AppLayout>
      <div className="space-y-8">
        
        {/* ── Header ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Execution Environment
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Strategy <span className="gradient-text-green">Backtest Engine</span>
          </h1>
          <p className="text-[15px]" style={{ color: 'var(--text-2)' }}>
            Evaluate generated strategies against historical OHLCV data and high-resolution order books.
          </p>
        </motion.div>

        {/* ── Configuration Panel ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="clay p-6 lg:p-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>
                  Target Universe
                </label>
                <div className="relative">
                  <select
                    className="input-dark appearance-none pr-10 font-bold bg-[#161B27]"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                  >
                    {['BTC', 'ETH', 'SOL', 'BNB', 'MATIC', 'AVAX'].map((s) => (
                      <option key={s} value={s}>{s}-PERP</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>
                  Historical Window
                </label>
                <div className="relative">
                  <select
                    className="input-dark appearance-none pr-10 font-bold bg-[#161B27]"
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                  >
                    <option value={30}>Last 30 Days (1h resolution)</option>
                    <option value={60}>Last 60 Days (1h resolution)</option>
                    <option value={90}>Last 90 Days (4h resolution)</option>
                    <option value={180}>Last 180 Days (1d resolution)</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  className="btn-primary w-full justify-center py-3.5 shadow-lg"
                  onClick={runBacktest}
                  disabled={running}
                  style={{ background: 'linear-gradient(135deg, #10B981, #06B6D4)' }}
                >
                  {running ? (
                    <>
                      <Activity className="w-5 h-5 animate-spin" />
                      Executing Simulation...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Run Backtest Simulation
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col">
              <label className="block text-[11px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2" style={{ color: 'var(--text-3)' }}>
                <Zap className="w-3.5 h-3.5" /> Strategy Payload (YAML)
              </label>
              <textarea
                className="input-dark font-mono-num text-[12px] flex-1 leading-[1.6] resize-none custom-scrollbar border-white/5 bg-[#0D1117]/80"
                style={{ minHeight: '200px' }}
                value={strategyYaml}
                onChange={(e) => setStrategyYaml(e.target.value)}
              />
            </div>
          </div>
        </motion.div>

        {/* ── Running State ───────────────────────────── */}
        <AnimatePresence>
          {running && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="clay-inset p-10 flex flex-col items-center justify-center text-center overflow-hidden"
            >
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 border-r-cyan-500 animate-spin" />
                <BarChart3 className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-400" />
              </div>
              <p className="text-base font-bold mb-1 text-white">Crunching Market Data...</p>
              <p className="text-xs text-slate-400">Processing {days} days of high-frequency historical data for {symbol}</p>
              
              <div className="w-64 h-1 bg-black/40 rounded-full mt-6 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #10B981, #06B6D4)' }}
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2.5, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Results Dashboard ───────────────────────── */}
        <AnimatePresence>
          {result?.status === 'done' && metrics && !running && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <MetricCard label="Sharpe Ratio" value={metrics.sharpe?.toFixed(2) || '—'} good={(metrics.sharpe || 0) > 1} icon={<Award />} />
                <MetricCard label="Sortino Ratio" value={metrics.sortino?.toFixed(2) || '—'} good={(metrics.sortino || 0) > 1} icon={<Target />} />
                <MetricCard label="Max Drawdown" value={`-${metrics.maxDrawdown?.toFixed(1)}%`} bad={(metrics.maxDrawdown || 0) > 15} icon={<TrendingDown />} />
                <MetricCard label="Profit Factor" value={metrics.profitFactor?.toFixed(2) || '—'} good={(metrics.profitFactor || 0) > 1.5} icon={<Zap />} />
                <MetricCard label="Total Return" value={fmtPct(metrics.totalReturn || 0)} good={(metrics.totalReturn || 0) > 0} icon={<TrendingUp />} />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Main Charts */}
                <div className="xl:col-span-2 space-y-6">
                  <div className="clay p-6">
                    <h4 className="text-base font-bold mb-6">Equity Curve Simulation</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={result.equityCurve} margin={{ left: -20, right: 0, bottom: 0, top: 0 }}>
                        <defs>
                          <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={30} />
                        <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={3} fill="url(#eqGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="clay p-6">
                    <h4 className="text-base font-bold mb-6">Drawdown Profile</h4>
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={result.equityCurve} margin={{ left: -20, right: 0, bottom: 0, top: 0 }}>
                        <defs>
                          <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#FB7185" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#FB7185" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis dataKey="date" hide />
                        <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} reversed />
                        <Tooltip content={<CustomTooltip isDD />} />
                        <Area type="monotone" dataKey="drawdown" stroke="#FB7185" strokeWidth={2} fill="url(#ddGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Sidebar Metrics */}
                <div className="space-y-6">
                  {/* Heatmap */}
                  <div className="clay p-6">
                    <h4 className="text-base font-bold mb-5 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-400" />
                      Monthly Returns
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(result.monthlyReturns || {}).map(([month, ret]) => {
                        const isPos = ret > 0
                        return (
                          <div
                            key={month}
                            className="rounded-xl p-3 text-center border transition-all hover:scale-105 cursor-default"
                            style={{
                              background: isPos ? `rgba(16,185,129,${Math.min(0.2, Math.abs(ret)/30)})` : `rgba(244,63,94,${Math.min(0.2, Math.abs(ret)/30)})`,
                              borderColor: isPos ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
                            }}
                          >
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{month}</div>
                            <div className={`text-[13px] font-bold font-mono-num ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isPos ? '+' : ''}{ret.toFixed(1)}%
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Trade Log Summary */}
                  <div className="clay flex flex-col overflow-hidden max-h-[460px]">
                    <div className="p-5 border-b border-white/5 flex items-center justify-between bg-[rgba(255,255,255,0.02)]">
                      <h4 className="text-base font-bold">Execution Log</h4>
                      <span className="text-xs bg-white/10 px-2 py-1 rounded-md text-slate-300 font-mono-num font-bold">Latest</span>
                    </div>
                    <div className="overflow-y-auto custom-scrollbar flex-1 p-3 space-y-2">
                      {result.trades?.map((trade, i) => (
                        <div key={i} className="flex flex-col p-3 rounded-xl bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.03)] hover:border-white/10 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold text-slate-500 font-mono-num tracking-widest">{trade.date}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${trade.type === 'LONG' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                              {trade.type}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono-num font-bold text-slate-200">{fmtUSD(trade.entryPrice)}</span>
                              <span className="text-xs text-slate-600">→</span>
                              <span className="text-xs font-mono-num font-bold text-slate-200">{fmtUSD(trade.exitPrice)}</span>
                            </div>
                            <span className={`text-[13px] font-bold font-mono-num ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {trade.pnl >= 0 ? '+' : ''}{fmtPct(trade.pnlPct)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </AppLayout>
  )
}

/* ── UI Helpers ───────────────────────────────────── */
function MetricCard({ label, value, good, bad, icon }: any) {
  const color = bad ? 'text-rose-400' : good ? 'text-emerald-400' : 'text-slate-200'
  const glow = bad ? 'drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]' : good ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : ''
  
  return (
    <div className="clay-sm p-4 md:p-5 flex flex-col justify-between h-[120px] relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-center gap-2 text-slate-400 relative z-10">
        <div className="w-6 h-6 rounded-md bg-black/20 flex items-center justify-center border border-white/5">
          {React.cloneElement(icon, { className: 'w-3.5 h-3.5' })}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <div className={`text-2xl md:text-[28px] font-bold font-mono-num relative z-10 ${color} ${glow}`}>
        {value}
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload, label, isDD }: any) {
  if (active && payload && payload.length) {
    const val = payload[0].value
    return (
      <div className="bg-[#1C2333] border border-white/10 rounded-xl p-3 shadow-xl">
        <p className="text-[10px] font-bold text-slate-400 mb-1 font-mono-num">{label}</p>
        <p className={`text-sm font-bold font-mono-num ${isDD ? 'text-rose-400' : 'text-emerald-400'}`}>
          {isDD ? `${val.toFixed(2)}% Drawdown` : fmtUSD(val)}
        </p>
      </div>
    )
  }
  return null
}



function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}



import React from 'react'

export default function BacktestPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 animate-pulse">Loading engine...</div>}>
      <BacktestContent />
    </Suspense>
  )
}
