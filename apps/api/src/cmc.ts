import fetch from 'node-fetch'

const CMC_API_KEY = process.env.CMC_API_KEY
const BASE_URL = 'https://pro-api.coinmarketcap.com/v1'

export async function fetchDerivatives() {
  const res = await fetch(BASE_URL + '/derivatives/exchange/map', {
    headers: { 'X-CMC_PRO_API_KEY': CMC_API_KEY },
  })
  if (!res.ok) throw new Error('CMC fetch failed')
  return res.json()
}

export async function fetchOrderBook(symbol: string) {
  // Not all assets available. Placeholder—implement real endpoint as needed.
  const res = await fetch(
    `${BASE_URL}/orderbook?symbol=${encodeURIComponent(symbol)}`,
    { headers: { 'X-CMC_PRO_API_KEY': CMC_API_KEY } },
  )
  if (!res.ok) throw new Error('CMC orderbook failed')
  return res.json()
}

export async function fetchOhlcv(symbol: string, interval = '1d', count = 30) {
  // Placeholder for OHLCV endpoint (for backtest, etc)
  const res = await fetch(
    `${BASE_URL}/cryptocurrency/ohlcv/historical?symbol=${encodeURIComponent(symbol)}&interval=${interval}&count=${count}`,
    { headers: { 'X-CMC_PRO_API_KEY': CMC_API_KEY } },
  )
  if (!res.ok) throw new Error('CMC OHLCV failed')
  return res.json()
}
