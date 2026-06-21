// mirage_calc.ts — Standalone (no @types alias dependency)

export function calcMirageScore(input: { oiPercentile: number; bidAskRatio: number; fundingRate: number }) {
  const { oiPercentile, bidAskRatio, fundingRate } = input
  const score = oiPercentile * 0.4 + (1 - bidAskRatio) * 100 * 0.4 + fundingRate * 1000 * 0.2
  return Math.max(0, Math.min(score, 100))
}

export function classifyMirage(score: number): 'Safe' | 'Caution' | 'Mirage' {
  if (score < 30) return 'Safe'
  if (score < 70) return 'Caution'
  return 'Mirage'
}
