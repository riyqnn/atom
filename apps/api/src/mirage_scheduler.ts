
import { pool } from './db'
import { calcMirageScore, classifyMirage } from './mirage_calc'

const CMC_API_KEY = process.env.CMC_API_KEY || ''
const BASE_URL = 'https://pro-api.coinmarketcap.com/v1'

// Price baselines for realistic simulation
const PRICE_MAP: Record<string, number> = {
  BTC: 67500, ETH: 3550, SOL: 145, BNB: 585, MATIC: 0.72, AVAX: 35,
}

async function fetchCmcQuotes(symbols: string[]): Promise<Record<string, { price: number }> | null> {
  if (!CMC_API_KEY) return null
  try {
    const res = await fetch(
      `${BASE_URL}/cryptocurrency/quotes/latest?symbol=${symbols.join(',')}`,
      { headers: { 'X-CMC_PRO_API_KEY': CMC_API_KEY } as any },
    )
    if (!res.ok) return null
    const body = (await res.json()) as any
    const out: Record<string, { price: number }> = {}
    for (const sym of symbols) {
      const d = body?.data?.[sym]
      if (d) out[sym] = { price: d.quote?.USD?.price ?? PRICE_MAP[sym] ?? 100 }
    }
    return out
  } catch {
    return null
  }
}

async function fetchAndStoreMirages() {
  try {
    const { rows: symbols } = await pool.query('SELECT * FROM symbols')
    const symbolNames = symbols.map((s: any) => s.symbol)
    
    // Try real CMC data first
    const cmcData = await fetchCmcQuotes(symbolNames)

    for (const sym of symbols) {
      // OI / Orderbook / Funding are not available on free CMC tier
      // so we compute realistic synthetic data that CHANGES each cycle
      const oiPercentile = 25 + Math.random() * 65
      const bidAskRatio = 0.15 + Math.random() * 0.75
      const fundingRate = (Math.random() - 0.4) * 0.025

      const mirageScore = calcMirageScore({ oiPercentile, bidAskRatio, fundingRate })
      const status = classifyMirage(mirageScore)

      // Use real price from CMC if available, otherwise simulate
      const base = PRICE_MAP[sym.symbol] ?? 100
      const price = cmcData?.[sym.symbol]?.price ?? base * (1 + (Math.random() - 0.5) * 0.02)

      await pool.query(
        `INSERT INTO mirages (symbol_id, timestamp, oi_percentile, bid_ask_ratio, funding_rate, mirage_score, status, price)
         VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7)`,
        [sym.id, oiPercentile, bidAskRatio, fundingRate, mirageScore, status, price],
      )
    }
    console.log(`[scheduler] Mirage snapshot stored @ ${new Date().toISOString()}`)
  } catch (err: any) {
    console.error('[scheduler] Error:', err.message)
  }
}

export function startMirageScheduler() {
  // Fire immediately then every 30s
  fetchAndStoreMirages()
  setInterval(fetchAndStoreMirages, 30_000)
}
