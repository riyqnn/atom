'use client'

import { MirageStatus } from '@/lib/types'

interface MirageGaugeProps {
  score: number
  status: MirageStatus
  size?: number
}

const STATUS_COLOR = {
  Safe: '#10B981',
  Caution: '#F59E0B',
  Mirage: '#EF4444',
}

export function MirageGauge({ score, status, size = 120 }: MirageGaugeProps) {
  const radius = (size - 20) / 2
  const circumference = Math.PI * radius // semicircle
  const strokeWidth = 8
  const cx = size / 2
  const cy = size / 2 + 10

  // Arc from 180° to 0° (left to right, bottom half visible as top)
  const progress = (score / 100) * circumference
  const color = STATUS_COLOR[status]

  // SVG arc for semicircle
  const r = radius
  const startX = cx - r
  const startY = cy
  const endX = cx + r
  const endY = cy

  const d = `M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`
  const progressAngle = ((score / 100) * 180) - 180
  const radians = (progressAngle * Math.PI) / 180
  const dotX = cx + r * Math.cos(radians)
  const dotY = cy + r * Math.sin(radians)

  return (
    <div className="relative flex flex-col items-center" style={{ width: size, height: size / 2 + 30 }}>
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        <defs>
          <filter id={`glow-${score}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track */}
        <path
          d={d}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Progress */}
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          style={{
            transition: 'stroke-dasharray 1s ease',
            filter: `url(#glow-${score})`,
          }}
        />

        {/* Dot indicator */}
        {score > 0 && (
          <circle
            cx={dotX}
            cy={dotY}
            r={5}
            fill={color}
            style={{ filter: `url(#glow-${score})` }}
          />
        )}
      </svg>

      {/* Score text */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
        <span
          className="text-2xl font-bold tabular-nums"
          style={{
            fontFamily: 'JetBrains Mono',
            color,
            textShadow: `0 0 20px ${color}60`,
          }}
        >
          {Math.round(score)}
        </span>
        <span className="text-[10px] text-slate-500 -mt-1">MIRAGE SCORE</span>
      </div>
    </div>
  )
}
