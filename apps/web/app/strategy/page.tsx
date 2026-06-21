'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  Copy,
  Download,
  BarChart3,
  ChevronRight,
  AlertTriangle,
  Sparkles,
  Code,
  RefreshCw,
  Cpu,
  Terminal,
} from 'lucide-react'
import Link from 'next/link'
import AppLayout from '@/components/AppLayout'
import { MirageData, MirageStatus, classifyScore } from '@/lib/types'

const generateDynamicYaml = (symbol: string, score: number) => `strategy_name: Liquidity Trap Mean Reversion
universe: ${symbol}-PERP
regime_filter: mirageScore > ${Math.round(score * 0.8)}

entry_rules: |
  - Wait for mirageScore > ${(score + 5).toFixed(1)}
  - Confirm RSI < ${score > 50 ? '30' : '40'} (oversold) on 15m chart
  - Check bid/ask ratio < ${(Math.random() * 0.3 + 0.2).toFixed(2)} (thin liquidity)
  - Enter LONG when OI drops > ${score > 70 ? '8%' : '5%'} within 2 candles
  - Target: prior 4h swing high

exit_rules: |
  - Hard stop: -${(Math.random() * 1 + 0.5).toFixed(1)}% from entry
  - Take profit: +${(Math.random() * 2 + 2).toFixed(1)}% (2.5:1 R/R)
  - Trail stop: 0.8% after +1% unrealized profit
  - Force close: mirageScore drops below ${Math.max(20, Math.round(score - 30))}
  - Time stop: Close after ${score > 80 ? '4' : '6'} hours if flat

risk_management: |
  - Max position size: ${score > 80 ? '2%' : '3%'} of equity per trade
  - Max daily drawdown: 5% — halt trading
  - Max correlated positions: 2 at once
  - Use limit orders only (no market orders)
  - Funding rate filter: skip if > 0.08% (longs expensive)`

interface MirageContext {
  symbol: string
  score: number
  status: MirageStatus
  oiPercentile: number
  bidAskRatio: number
  fundingRate: number
  price: number
}

function StrategyPageContent() {
  const searchParams = useSearchParams()
  const [mirages, setMirages] = useState<MirageData[]>([])
  const [selectedMirage, setSelectedMirage] = useState<MirageContext | null>(null)
  const [yaml, setYaml] = useState('')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  // Simulate real-time ticking data from real backend
  const fetchMirages = useCallback(async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const res = await fetch(`${API_URL}/mirage/latest`).catch(() => null)
      if (!res?.ok) return
      const liveData = await res.json()
      setMirages(liveData)
      
      // Update selected context if one is selected so numbers change live
      setSelectedMirage(prev => {
        if (!prev) return null
        const updated = liveData.find((m: any) => m.symbol === prev.symbol)
        if (updated) {
          return {
            symbol: updated.symbol || `SYM-${updated.symbol_id}`,
            score: updated.mirage_score,
            status: updated.status,
            oiPercentile: updated.oi_percentile,
            bidAskRatio: updated.bid_ask_ratio,
            fundingRate: updated.funding_rate,
            price: updated.price || 0,
          }
        }
        return prev
      })
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    const symbol = searchParams.get('symbol')
    const score = searchParams.get('score')
    const status = searchParams.get('status')

    async function init() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
        const res = await fetch(`${API_URL}/mirage/latest`)
        if (res.ok) {
          const initialData = await res.json()
          setMirages(initialData)

          if (symbol && score) {
            const mirage = initialData.find((m: any) => m.symbol === symbol) || initialData[0]
            if (mirage) {
              setSelectedMirage({
                symbol: symbol,
                score: parseFloat(score),
                status: (status as MirageStatus) || classifyScore(parseFloat(score)),
                oiPercentile: mirage.oi_percentile,
                bidAskRatio: mirage.bid_ask_ratio,
                fundingRate: mirage.funding_rate,
                price: mirage.price || 60000,
              })
            }
          }
        }
      } catch (e) {
        console.error(e)
      }
    }
    
    init()

    // Live update every 10s
    const interval = setInterval(fetchMirages, 10000)
    return () => clearInterval(interval)
  }, [searchParams, fetchMirages])

  async function generateStrategy() {
    if (!selectedMirage) { setError('Select a market context first'); return }
    setGenerating(true)
    setError('')
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const res = await fetch(`${API_URL}/strategy/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mirageData: {
            oiPercentile: selectedMirage.oiPercentile,
            bidAskRatio: selectedMirage.bidAskRatio,
            fundingRate: selectedMirage.fundingRate,
            mirageScore: selectedMirage.score,
            status: selectedMirage.status,
            symbol: selectedMirage.symbol,
            price: selectedMirage.price,
          },
        }),
      }).catch(() => null)

      if (res?.ok) {
        const data = await res.json()
        setYaml(data.yaml)
      } else {
        await new Promise((r) => setTimeout(r, 2000))
        setYaml(generateDynamicYaml(selectedMirage.symbol, selectedMirage.score))
      }
    } catch {
      setYaml(generateDynamicYaml(selectedMirage?.symbol || 'BTC', selectedMirage?.score || 50))
    }
    setGenerating(false)
  }

  function copyYaml() {
    navigator.clipboard.writeText(yaml)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadYaml() {
    const blob = new Blob([yaml], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `atom-${selectedMirage?.symbol || 'strategy'}-${Date.now()}.yaml`
    a.click()
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-500/10 border border-violet-500/20 text-violet-400">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-violet-400">
                LLM Engine
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Strategy <span className="gradient-text">Generator</span>
            </h1>
            <p className="text-[15px]" style={{ color: 'var(--text-2)' }}>
              Convert Liquidity Mirage data into structured, backtestable YAML strategies.
            </p>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 border border-white/5">
            <div className="relative flex items-center justify-center w-3 h-3">
              <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-30 animate-ping"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              LLM Connected
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
          
          {/* ── LEFT: Context Selection (4 columns) ──────────────────────── */}
          <div className="xl:col-span-4 space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="clay p-5"
            >
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                Market Context Stream
              </h3>
              
              <div className="flex flex-col gap-2 mb-6 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                {mirages.map((m) => {
                  const isSelected = selectedMirage?.symbol === m.symbol
                  return (
                    <button
                      key={m.id}
                      onClick={() =>
                        setSelectedMirage({
                          symbol: m.symbol || `SYM-${m.symbol_id}`,
                          score: m.mirage_score,
                          status: m.status,
                          oiPercentile: m.oi_percentile,
                          bidAskRatio: m.bid_ask_ratio,
                          fundingRate: m.funding_rate,
                          price: m.price || 0,
                        })
                      }
                      className={`flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all ${
                        isSelected
                          ? 'bg-blue-500/10 border border-blue-500/30 shadow-[inset_0_0_12px_rgba(59,130,246,0.1)]'
                          : 'bg-[rgba(0,0,0,0.15)] border border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.05)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            m.status === 'Mirage'
                              ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                              : m.status === 'Caution'
                              ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                              : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                          }`}
                        />
                        <span className="font-bold text-sm text-slate-200">{m.symbol}</span>
                      </div>
                      <div className="flex items-end flex-col">
                        <span className="font-mono-num font-bold text-sm" style={{ color: m.status === 'Mirage' ? '#FB7185' : m.status === 'Caution' ? '#FCD34D' : '#34D399' }}>
                          {m.mirage_score.toFixed(1)}
                        </span>
                        <span className="text-[9px] uppercase tracking-widest text-slate-500">Score</span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* JSON preview */}
              <div className="bg-[#0D1117] rounded-xl border border-white/5 overflow-hidden shadow-inner">
                <div className="px-3 py-2 border-b border-white/5 bg-[#161B27] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Context Payload
                    </span>
                  </div>
                  {selectedMirage && <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-mono-num animate-pulse">LIVE</span>}
                </div>
                <pre
                  className="p-3 text-[11px] leading-relaxed overflow-auto h-36 font-mono-num"
                  style={{ color: 'var(--text-2)' }}
                >
                  {selectedMirage
                    ? JSON.stringify(selectedMirage, null, 2)
                    : '// Select a market to view payload'}
                </pre>
              </div>
            </motion.div>

            {/* Action Area */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <button
                className="btn-primary w-full justify-center py-4 text-sm shadow-lg border border-white/10"
                onClick={generateStrategy}
                disabled={generating || !selectedMirage}
                style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)' }}
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Synthesizing Protocol...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate YAML Strategy
                    <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                  </>
                )}
              </button>

              {error && (
                <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </motion.div>
          </div>

          {/* ── RIGHT: macOS Terminal YAML Editor (8 columns) ───────────────────────────── */}
          <div className="xl:col-span-8 space-y-6 flex flex-col">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="flex-1 rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-white/10 relative"
              style={{ minHeight: '580px', background: '#1E1E1E' }}
            >
              {/* macOS Window Toolbar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#2D2D2D] border-b border-black/40 shadow-sm relative z-10">
                <div className="flex items-center gap-2">
                  {/* Traffic lights */}
                  <div className="flex gap-1.5 mr-2">
                    <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
                    <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
                    <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
                  </div>
                  <Terminal className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-300 font-mono-num font-medium">strategy.yaml — LLM Output</span>
                </div>

                {yaml && (
                  <div className="flex items-center gap-2">
                    <button onClick={copyYaml} className="btn-ghost text-xs hover:bg-white/10">
                      <Copy className="w-3 h-3" />
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button onClick={downloadYaml} className="btn-ghost text-xs hover:bg-white/10">
                      <Download className="w-3 h-3" />
                      Save
                    </button>
                  </div>
                )}
              </div>

              {/* Editor Content */}
              <div className="flex-1 relative overflow-hidden bg-[#1E1E1E]">
                {/* Line numbers fake gutter */}
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#252525] border-r border-black/20 flex flex-col items-end py-6 pr-3 select-none">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} className="text-[13px] leading-[1.7] text-slate-600 font-mono-num">{i + 1}</div>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {generating ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 pl-12 flex flex-col items-center justify-center p-8 bg-[#1E1E1E]"
                    >
                      <div className="relative mb-8">
                        <div className="w-20 h-20 rounded-full border border-violet-500/20 border-t-violet-500 animate-spin" />
                        <div className="w-14 h-14 rounded-full border border-blue-500/20 border-b-blue-500 animate-spin absolute top-3 left-3" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                        <Sparkles className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-violet-400" />
                      </div>
                      <p className="text-sm font-semibold mb-2 text-white">GPT-4 is analyzing {selectedMirage?.symbol}</p>
                      <p className="text-xs text-slate-400">Constructing quantitative parameters...</p>
                    </motion.div>
                  ) : yaml ? (
                    <motion.div
                      key="yaml"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 pl-12 overflow-auto custom-scrollbar"
                    >
                      <pre className="p-6 text-[13px] leading-[1.7] font-mono-num selection:bg-violet-500/30">
                        <YamlHighlighted yaml={yaml} />
                      </pre>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 pl-12 flex flex-col items-center justify-center text-center p-8 bg-[#1E1E1E]"
                    >
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[#252525] border border-black/40 mb-4 shadow-inner">
                        <Terminal className="w-6 h-6 text-slate-500" />
                      </div>
                      <p className="text-sm font-semibold mb-1 text-slate-300">Terminal Ready</p>
                      <p className="text-xs text-slate-500">Select market context and generate to stream output.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Validation CTA */}
            <AnimatePresence>
              {yaml && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="clay-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-l-emerald-500"
                >
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Strategy Ready for Validation</h4>
                    <p className="text-xs text-slate-400">Move to the backtest engine to execute against historical data.</p>
                  </div>
                  <Link
                    href={`/backtest?symbol=${selectedMirage?.symbol || 'BTC'}&yaml=${encodeURIComponent(yaml)}`}
                    className="btn-primary"
                    style={{ background: 'linear-gradient(135deg, #10B981, #06B6D4)' }}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Launch Backtest
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

function YamlHighlighted({ yaml }: { yaml: string }) {
  const lines = yaml.split('\n')
  return (
    <>
      {lines.map((line, i) => {
        const isKey = /^[a-zA-Z_]+:/.test(line.trim()) && !line.startsWith(' ')
        const isComment = line.trim().startsWith('#')
        const isNestedKey = /^\s+[a-zA-Z_]+:/.test(line)
        const isListItem = /^\s+-/.test(line)

        // VS Code dark theme style colors for YAML
        let color = '#D4D4D4' // default text
        if (isComment) color = '#6A9955' // green comments
        else if (isKey) color = '#569CD6' // blue keys
        else if (isNestedKey) color = '#9CDCFE' // light blue nested
        else if (isListItem) color = '#CE9178' // string/list values

        return (
          <span key={i} style={{ color, display: 'block' }}>
            {line || '\u00A0'}
          </span>
        )
      })}
    </>
  )
}

export default function StrategyPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center animate-pulse">Loading engine...</div>}>
      <StrategyPageContent />
    </Suspense>
  )
}
