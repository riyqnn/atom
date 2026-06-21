import { z } from 'zod'

export const MirageCalcInput = z.object({
  oiPercentile: z.number(),
  bidAskRatio: z.number(),
  fundingRate: z.number(),
})

export function calcMirageScore(input: z.infer<typeof MirageCalcInput>) {
  // mirageScore = (oiPercentile*0.4) + ((1-bidAskRatio)*100*0.4) + (fundingRate*1000*0.2)
  const { oiPercentile, bidAskRatio, fundingRate } = input
  const score =
    oiPercentile * 0.4 + (1 - bidAskRatio) * 100 * 0.4 + fundingRate * 1000 * 0.2
  return Math.max(0, Math.min(score, 100))
}

export function classifyMirage(score: number) {
  if (score < 30) return 'Safe'
  if (score < 70) return 'Caution'
  return 'Mirage'
}
