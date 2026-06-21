import { fetchBacktestResult } from '../backtest_results'
import { z } from 'zod'

export default async function backtestStatusRoute(fastify: any) {
  fastify.get('/backtest/status', async (req: any, reply: any) => {
    const Schema = z.object({ job_id: z.string() })
    const params = Schema.safeParse(req.query)
    if (!params.success) return reply.status(400).send({ error: 'Missing job_id param' })

    const result = await fetchBacktestResult(params.data.job_id)
    if (!result) return reply.status(404).send({ error: 'job_id not found (not finished?)' })

    return result
  })
}
