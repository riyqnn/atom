import { z } from 'zod'

export const MirageStrategyRequest = z.object({
  mirageData: z.object({
    oiPercentile: z.number(),
    bidAskRatio: z.number(),
    fundingRate: z.number(),
    mirageScore: z.number(),
    status: z.string(),
    symbol: z.string(),
    price: z.number().optional(),
    timestamp: z.string().optional(),
  }),
})

export const YamlStrategyResult = z.object({
  strategy_name: z.string(),
  universe: z.string(),
  regime_filter: z.string(),
  entry_rules: z.string(),
  exit_rules: z.string(),
  risk_management: z.string(),
})

export const YamlOutputSchema = z.object({
  strategy: YamlStrategyResult,
})
