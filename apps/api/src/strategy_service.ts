import YAML from 'yaml'
import { z } from 'zod'

// ── Schema for the generated strategy YAML ────────────────────────
export const StrategySchema = z.object({
  strategy_name: z.string(),
  universe: z.string(),
  regime_filter: z.string(),
  entry_rules: z.string(),
  exit_rules: z.string(),
  risk_management: z.string(),
})

// ── Request schema from frontend ──────────────────────────────────
export const MirageStrategyRequest = z.object({
  mirageData: z.object({
    oiPercentile: z.number(),
    bidAskRatio: z.number(),
    fundingRate: z.number(),
    mirageScore: z.number(),
    status: z.string(),
    symbol: z.string(),
    price: z.number().optional(),
  }),
})

// ── Generate YAML strategy based on live mirage context ───────────
export async function generateYamlStrategy(mirageData: z.infer<typeof MirageStrategyRequest>['mirageData']): Promise<string> {
  const score = mirageData.mirageScore
  const symbol = mirageData.symbol
  const oi = mirageData.oiPercentile
  const bar = mirageData.bidAskRatio
  const fr = mirageData.fundingRate

  // Parameters vary dynamically with each call based on market context
  const regimeThreshold = Math.round(score * 0.8)
  const entryScore = Math.round(score + 5)
  const rsiThreshold = score > 60 ? 28 : score > 40 ? 35 : 42
  const barThreshold = Math.max(0.15, bar * 0.7).toFixed(2)
  const oiDrop = oi > 75 ? '8%' : oi > 50 ? '5%' : '3%'
  const stopLoss = (0.5 + Math.random() * 1.0).toFixed(1)
  const takeProfit = (2.0 + Math.random() * 2.0).toFixed(1)
  const forceClose = Math.max(20, Math.round(score - 30))
  const timeStop = score > 80 ? 4 : score > 50 ? 6 : 8
  const posSize = score > 80 ? '2%' : score > 60 ? '3%' : '5%'
  const frFilter = Math.abs(fr) > 0.01 ? 'skip if funding > 0.08%' : 'no funding filter needed'

  return `strategy_name: Liquidity Trap Mean Reversion
universe: ${symbol}-PERP
regime_filter: mirageScore > ${regimeThreshold}
entry_rules: |
  - Wait for mirageScore > ${entryScore}
  - Confirm RSI < ${rsiThreshold} (oversold) on 15m chart
  - Check bid/ask ratio < ${barThreshold} (thin liquidity)
  - Enter LONG when OI drops > ${oiDrop} within 2 candles
  - Target: prior 4h swing high
exit_rules: |
  - Hard stop: -${stopLoss}% from entry
  - Take profit: +${takeProfit}% (R/R)
  - Trail stop: 0.8% after +1% unrealized profit
  - Force close: mirageScore drops below ${forceClose}
  - Time stop: Close after ${timeStop} hours if flat
risk_management: |
  - Max position size: ${posSize} of equity per trade
  - Max daily drawdown: 5% — halt trading
  - Max correlated positions: 2 at once
  - Use limit orders only (no market orders)
  - Funding rate filter: ${frFilter}`
}

// ── Validate that generated YAML parses and matches schema ────────
export function validateYamlStrategy(yamlText: string) {
  let parsed: any
  try {
    parsed = YAML.parse(yamlText)
  } catch {
    return { success: false as const, error: 'YAML parse error' }
  }
  return StrategySchema.safeParse(parsed)
}
