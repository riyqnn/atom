import { pool } from './db'
import { BacktestPayload } from './backtest_worker'

export async function saveBacktestResult(job_id: string, symbol: string, strategy_id: number | null, metrics: any) {
  // Find symbol_id from db
  const symbolRow = await pool.query('SELECT id FROM symbols WHERE symbol = $1', [symbol])
  if (!symbolRow.rows.length) throw new Error('symbol not found')
  const symbol_id = symbolRow.rows[0].id

  await pool.query(
    `INSERT INTO backtests (strategy_id, symbol_id, metrics, job_id) VALUES ($1, $2, $3, $4) ON CONFLICT (job_id) DO NOTHING`,
    [strategy_id, symbol_id, JSON.stringify(metrics), job_id],
  )
}

export async function fetchBacktestResult(job_id: string) {
  const result = await pool.query('SELECT * FROM backtests WHERE job_id = $1', [job_id])
  if (!result.rows.length) return null
  return result.rows[0]
}
