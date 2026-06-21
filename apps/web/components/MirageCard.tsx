'use client'

import { motion } from 'framer-motion'
import { MirageData, MirageStatus } from '@/lib/types'
import { TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react'

const STATUS_CONFIG: Record<
  MirageStatus,
  { gradient: string; glow: string; label: string; dot: string; textColor: string }
> = {
  Safe: {
    gradient: 'linear-gradient(135deg, #10B981, #06B6D4)',
    glow: 'rgba(16,185,129,0.2)',
    label: 'Safe',
    dot: '#34D399',
    textColor: '#34D399',
  },
  Caution: {
    gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)',
    glow: 'rgba(245,158,11,0.2)',
    label: 'Caution',
    dot: '#FCD34D',
    textColor: '#FCD34D',
  },
  Mirage: {
    gradient: 'linear-gradient(135deg, #F43F5E, #8B5CF6)',
    glow: 'rgba(244,63,94,0.25)',
    label: '⚠ Mirage',
    dot: '#FB7185',
    textColor: '#FB7185',
  },
}

interface MirageCardProps {
  data: MirageData
  onClick?: () => void
  selected?: boolean
  index?: number
}

export function MirageCard({ data, onClick, selected, index = 0 }: MirageCardProps) {
  const cfg = STATUS_CONFIG[data.status]
  const score = data.mirage_score

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="cursor-pointer relative overflow-hidden"
      style={{
        background: 'var(--bg-surface)',
        borderRadius: 20,
        border: selected
          ? '1px solid rgba(59,130,246,0.4)'
          : '1px solid rgba(255,255,255,0.07)',
        boxShadow: selected
          ? `0 0 0 1px rgba(59,130,246,0.2), 0 8px 32px rgba(59,130,246,0.15), var(--shadow-clay)`
          : `0 4px 20px ${cfg.glow}, var(--shadow-clay)`,
        transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
      }}
    >
      {/* Top accent stripe */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-[20px]"
        style={{ background: cfg.gradient }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div
              className="text-xl font-bold"
              style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--text-1)' }}
            >
              {data.symbol || `SYM-${data.symbol_id}`}
            </div>
            {data.price ? (
              <div
                className="text-sm mt-0.5 font-mono-num"
                style={{ color: 'var(--text-2)' }}
              >
                ${data.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            ) : null}
          </div>

          <div
            className={`badge ${data.status === 'Safe' ? 'badge-safe' : data.status === 'Caution' ? 'badge-caution' : 'badge-mirage'}`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: cfg.dot,
                animation: data.status === 'Mirage' ? 'pulse 1.5s infinite' : undefined,
              }}
            />
            {cfg.label}
          </div>
        </div>

        {/* Score arc */}
        <div className="flex flex-col items-center mb-5">
          <ScoreArc score={score} status={data.status} gradient={cfg.gradient} />
        </div>

        {/* Metrics */}
        <div className="space-y-2.5">
          <MetricRow
            label="OI Percentile"
            value={`${data.oi_percentile.toFixed(1)}%`}
            warn={data.oi_percentile > 75}
          />
          <MetricRow
            label="Bid / Ask Ratio"
            value={data.bid_ask_ratio.toFixed(3)}
            warn={data.bid_ask_ratio < 0.4}
          />
          <MetricRow
            label="Funding Rate"
            value={`${(data.funding_rate * 100).toFixed(4)}%`}
            positive={data.funding_rate >= 0}
            showTrend
          />
        </div>
      </div>
    </motion.div>
  )
}

/* ── Score Arc ─────────────────────────────────────── */
function ScoreArc({
  score,
  status,
  gradient,
}: {
  score: number
  status: MirageStatus
  gradient: string
}) {
  const size = 116
  const strokeWidth = 9
  const r = (size - strokeWidth * 2) / 2
  const cx = size / 2
  const cy = size / 2 + 8

  // Semicircle path (bottom half flipped = top arc)
  const sweep = Math.PI * r
  const progress = (score / 100) * sweep

  const trackPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`

  const color =
    status === 'Safe' ? '#10B981' : status === 'Caution' ? '#F59E0B' : '#F43F5E'

  // Needle angle: -180° (0) → 0° (100)
  const angleDeg = (score / 100) * 180 - 180
  const angleRad = (angleDeg * Math.PI) / 180
  const needleX = cx + r * Math.cos(angleRad)
  const needleY = cy + r * Math.sin(angleRad)

  return (
    <div className="relative flex flex-col items-center" style={{ width: size, height: 70 }}>
      <svg width={size} height={size / 2 + 20} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={`arc-grad-${status}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop
              offset="0%"
              stopColor={
                status === 'Safe' ? '#10B981' : status === 'Caution' ? '#F59E0B' : '#F43F5E'
              }
            />
            <stop
              offset="100%"
              stopColor={
                status === 'Safe' ? '#06B6D4' : status === 'Caution' ? '#EF4444' : '#8B5CF6'
              }
            />
          </linearGradient>
          <filter id={`blur-${status}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
          </filter>
        </defs>

        {/* Track */}
        <path
          d={trackPath}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Glow behind progress */}
        <path
          d={trackPath}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth + 6}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${sweep}`}
          opacity={0.15}
          filter={`url(#blur-${status})`}
        />

        {/* Progress arc */}
        <motion.path
          d={trackPath}
          fill="none"
          stroke={`url(#arc-grad-${status})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${sweep}`}
          initial={{ strokeDasharray: `0 ${sweep}` }}
          animate={{ strokeDasharray: `${progress} ${sweep}` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        />

        {/* Needle dot */}
        <motion.circle
          cx={needleX}
          cy={needleY}
          r={5}
          fill={color}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 0.8 }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>

      {/* Score number */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
        <motion.span
          className="font-mono-num font-bold"
          style={{ fontSize: 26, color, filter: `drop-shadow(0 0 10px ${color}60)` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {Math.round(score)}
        </motion.span>
        <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
          score
        </span>
      </div>
    </div>
  )
}

/* ── Metric row ────────────────────────────────────── */
function MetricRow({
  label,
  value,
  warn,
  positive,
  showTrend,
}: {
  label: string
  value: string
  warn?: boolean
  positive?: boolean
  showTrend?: boolean
}) {
  const color = warn
    ? '#FCD34D'
    : showTrend
    ? positive
      ? '#34D399'
      : '#FB7185'
    : 'var(--text-1)'

  return (
    <div
      className="flex items-center justify-between px-3 py-2 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}
    >
      <span className="text-[12px]" style={{ color: 'var(--text-3)' }}>{label}</span>
      <div className="flex items-center gap-1.5">
        {showTrend &&
          (positive ? (
            <TrendingUp className="w-3 h-3" style={{ color: '#34D399' }} />
          ) : (
            <TrendingDown className="w-3 h-3" style={{ color: '#FB7185' }} />
          ))}
        <span
          className="text-[12px] font-semibold font-mono-num"
          style={{ color }}
        >
          {value}
        </span>
      </div>
    </div>
  )
}
