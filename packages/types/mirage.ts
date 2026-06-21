import { z } from 'zod'

export const MirageStatus = z.enum(['Safe', 'Caution', 'Mirage'])

export const MirageRow = z.object({
  id: z.number(),
  symbol_id: z.number(),
  timestamp: z.string(),
  oi_percentile: z.number(),
  bid_ask_ratio: z.number(),
  funding_rate: z.number(),
  mirage_score: z.number(),
  status: MirageStatus,
  created_at: z.string(),
})

export type Mirage = z.infer<typeof MirageRow>
