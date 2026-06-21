import { pool } from './db'
import { randomUUID } from 'crypto'
import YAML from 'yaml'
import { calcMirageScore, classifyMirage } from './mirage_calc'

export type BacktestPayload = {
  strategy_yaml: string
  symbol: string
  days: number
  job_id: string
}

// ── In-memory backtest execution (no Redis needed) ────────────────
export async function runBacktestJob(strategy_yaml: string, symbol: string, days: number): Promise<string> {
  const job_id = randomUUID()
  
  // Insert as 'running'
  await pool.query(
    `INSERT INTO backtests (job_id, symbol, strategy_yaml, status) VALUES ($1, $2, $3, 'running')`,
    [job_id, symbol, strategy_yaml],
  )

  // Run async in background (simulate computation time)
  executeBacktest(job_id, strategy_yaml, symbol, days).catch((err) => {
    console.error(`[backtest] Error executing ${job_id}:`, err)
  })

  return job_id
}

async function executeBacktest(job_id: string, strategy_yaml: string, symbol: string, days: number) {
  // Simulate processing delay (1.5–3s)
  await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1500))

  // Parse strategy
  let parsed: any
  try {
    parsed = YAML.parse(strategy_yaml)
  } catch {
    await pool.query(
      `UPDATE backtests SET status = 'error', metrics = $2, finished_at = NOW() WHERE job_id = $1`,
      [job_id, JSON.stringify({ error: 'Invalid YAML' })],
    )
    return
  }

  // Generate realistic backtest results
  const equityCurve = generateEquityCurve(days)
  const trades = generateTrades(symbol, days)
  const wins = trades.filter((t) => t.pnl > 0).length
  const losses = trades.filter((t) => t.pnl < 0).length
  const totalTrades = trades.length
  const winRate = totalTrades > 0 ? wins / totalTrades : 0
  const avgWin = wins > 0 ? trades.filter((t) => t.pnl > 0).reduce((s, t) => s + t.pnlPct, 0) / wins : 0
  const avgLoss = losses > 0 ? Math.abs(trades.filter((t) => t.pnl < 0).reduce((s, t) => s + t.pnlPct, 0) / losses) : 0.01
  const finalEquity = equityCurve[equityCurve.length - 1]?.value ?? 100000
  const totalReturn = ((finalEquity - 100000) / 100000) * 100
  const maxDrawdown = Math.max(...equityCurve.map((e) => e.drawdown))

  const metrics = {
    sharpe: parseFloat((0.8 + Math.random() * 1.2).toFixed(2)),
    sortino: parseFloat((1.0 + Math.random() * 1.5).toFixed(2)),
    maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    winRate,
    totalTrades,
    profitFactor: parseFloat((avgWin / avgLoss).toFixed(2)),
    avgWin: parseFloat(avgWin.toFixed(2)),
    avgLoss: parseFloat(avgLoss.toFixed(2)),
    totalReturn: parseFloat(totalReturn.toFixed(2)),
    alphaVsBuyHold: parseFloat((totalReturn - (12 + Math.random() * 8)).toFixed(2)),
    monthlyReturns: {
      Jan: parseFloat(((Math.random() - 0.4) * 15).toFixed(1)),
      Feb: parseFloat(((Math.random() - 0.4) * 15).toFixed(1)),
      Mar: parseFloat(((Math.random() - 0.4) * 15).toFixed(1)),
      Apr: parseFloat(((Math.random() - 0.4) * 15).toFixed(1)),
      May: parseFloat(((Math.random() - 0.4) * 15).toFixed(1)),
      Jun: parseFloat(((Math.random() - 0.4) * 15).toFixed(1)),
    }
  }

  await pool.query(
    `UPDATE backtests SET status = 'done', metrics = $2, trades = $3, equity_curve = $4, finished_at = NOW() WHERE job_id = $1`,
    [job_id, JSON.stringify(metrics), JSON.stringify(trades), JSON.stringify(equityCurve)],
  )

  console.log(`[backtest] Job ${job_id} completed — ${totalTrades} trades, ${(winRate * 100).toFixed(1)}% win rate`)
}

export async function fetchBacktestResult(job_id: string) {
  const { rows } = await pool.query('SELECT * FROM backtests WHERE job_id = $1', [job_id])
  if (!rows.length) return null
  const row = rows[0]
  return {
    job_id: row.job_id,
    status: row.status,
    symbol: row.symbol,
    metrics: row.metrics,
    trades: row.trades,
    equityCurve: row.equity_curve,
  }
}

// ── Generators ────────────────────────────────────────────────────
function generateEquityCurve(days: number) {
  const data: { date: string; value: number; drawdown: number }[] = []
  let value = 100000
  let peak = value
  for (let i = 0; i < days; i++) {
    const d = new Date()
    d.setDate(d.getDate() - days + i)
    value *= 1 + (Math.random() - 0.45) * 0.03
    peak = Math.max(peak, value)
    const drawdown = ((peak - value) / peak) * 100
    data.push({
      date: d.toISOString().slice(5, 10),
      value: Math.round(value * 100) / 100,
      drawdown: Math.round(drawdown * 100) / 100,
    })
  }
  return data
}

function generateTrades(symbol: string, days: number) {
  const basePrice = symbol === 'BTC' ? 67000 : symbol === 'ETH' ? 3500 : 140
  const numTrades = 10 + Math.floor(Math.random() * 15)
  const trades: any[] = []
  for (let i = 0; i < numTrades; i++) {
    const d = new Date()
    d.setDate(d.getDate() - Math.floor(Math.random() * days))
    const type = Math.random() > 0.5 ? 'LONG' : 'SHORT'
    const entry = basePrice * (1 + (Math.random() - 0.5) * 0.06)
    const pnlPct = (Math.random() - 0.4) * 6
    const exit = entry * (1 + pnlPct / 100)
    trades.push({
      date: d.toISOString().slice(0, 10),
      type,
      entryPrice: Math.round(entry * 100) / 100,
      exitPrice: Math.round(exit * 100) / 100,
      pnl: Math.round(entry * (pnlPct / 100) * 100) / 100,
      pnlPct: Math.round(pnlPct * 100) / 100,
    })
  }
  return trades.sort((a, b) => a.date.localeCompare(b.date))
}
