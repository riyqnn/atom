// ATOM frontend types

export type MirageStatus = 'Safe' | 'Caution' | 'Mirage'

export interface MirageData {
  id: number
  symbol_id: number
  symbol?: string
  price?: number
  timestamp: string
  oi_percentile: number
  bid_ask_ratio: number
  funding_rate: number
  mirage_score: number
  status: MirageStatus
  created_at: string
}

export interface StrategyYaml {
  strategy_name: string
  universe: string
  regime_filter: string
  entry_rules: string
  exit_rules: string
  risk_management: string
}

export interface BacktestMetrics {
  sharpe: number
  sortino?: number
  maxDrawdown?: number
  winRate: number
  totalTrades: number
  profitFactor?: number
  avgWin?: number
  avgLoss?: number
  totalReturn?: number
  alphaVsBuyHold?: number
}

export interface TradeEntry {
  date: string
  type: 'LONG' | 'SHORT'
  entryPrice: number
  exitPrice: number
  pnl: number
  pnlPct: number
}

export interface EquityPoint {
  date: string
  value: number
  drawdown: number
}

export interface BacktestResult {
  job_id: string
  status: 'pending' | 'running' | 'done' | 'error'
  symbol?: string
  metrics?: BacktestMetrics
  trades?: TradeEntry[]
  equityCurve?: EquityPoint[]
  monthlyReturns?: Record<string, number>
  error?: string
}

export interface MirageEvent {
  date: string
  score: number
  status: MirageStatus
  outcome?: string
}

// Mock data generators for demo
export function generateMockMirages(): MirageData[] {
  const symbols = ['BTC', 'ETH', 'SOL', 'BNB', 'MATIC', 'AVAX']
  const prices = [67432, 3521, 142, 398, 0.72, 36.8]
  const statuses: MirageStatus[] = ['Safe', 'Caution', 'Mirage', 'Caution', 'Mirage', 'Safe']
  const scores = [22, 58, 84, 61, 77, 18]

  return symbols.map((sym, i) => ({
    id: i + 1,
    symbol_id: i + 1,
    symbol: sym,
    price: prices[i],
    timestamp: new Date().toISOString(),
    oi_percentile: 40 + Math.random() * 50,
    bid_ask_ratio: 0.3 + Math.random() * 0.6,
    funding_rate: (Math.random() - 0.3) * 0.02,
    mirage_score: scores[i],
    status: statuses[i],
    created_at: new Date().toISOString(),
  }))
}

export function generateMockEquityCurve(days: number = 90): EquityPoint[] {
  const points: EquityPoint[] = []
  let value = 100000
  let peak = value

  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (days - i))
    const change = (Math.random() - 0.45) * 0.03
    value = value * (1 + change)
    if (value > peak) peak = value
    const drawdown = ((peak - value) / peak) * 100

    points.push({
      date: date.toISOString().slice(0, 10),
      value: Math.round(value * 100) / 100,
      drawdown: Math.round(drawdown * 100) / 100,
    })
  }
  return points
}

export function generateMockTrades(): TradeEntry[] {
  const trades: TradeEntry[] = []
  for (let i = 0; i < 20; i++) {
    const date = new Date()
    date.setDate(date.getDate() - Math.floor(Math.random() * 90))
    const entryPrice = 60000 + Math.random() * 10000
    const pnlPct = (Math.random() - 0.4) * 6
    const exitPrice = entryPrice * (1 + pnlPct / 100)

    trades.push({
      date: date.toISOString().slice(0, 10),
      type: Math.random() > 0.5 ? 'LONG' : 'SHORT',
      entryPrice: Math.round(entryPrice * 100) / 100,
      exitPrice: Math.round(exitPrice * 100) / 100,
      pnl: Math.round((exitPrice - entryPrice) * 100) / 100,
      pnlPct: Math.round(pnlPct * 100) / 100,
    })
  }
  return trades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function calcMirageScore(oiPercentile: number, bidAskRatio: number, fundingRate: number): number {
  return Math.max(
    0,
    Math.min(
      100,
      oiPercentile * 0.4 + (1 - bidAskRatio) * 100 * 0.4 + fundingRate * 1000 * 0.2
    )
  )
}

export function classifyScore(score: number): MirageStatus {
  if (score < 30) return 'Safe'
  if (score < 70) return 'Caution'
  return 'Mirage'
}

export function fmtUSD(val: number): string {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`
  if (val >= 1000) return `$${(val / 1000).toFixed(2)}K`
  return `$${val.toFixed(2)}`
}

export function fmtPct(val: number, decimals = 2): string {
  return `${val >= 0 ? '+' : ''}${val.toFixed(decimals)}%`
}
