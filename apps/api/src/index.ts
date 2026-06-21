import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { z } from 'zod'
import { pool, ensureSchema } from './db'
import { startMirageScheduler } from './mirage_scheduler'
import { MirageStrategyRequest, generateYamlStrategy, validateYamlStrategy } from './strategy_service'
import { runBacktestJob, fetchBacktestResult } from './backtest_worker'

export const app = Fastify({ logger: false })

let initPromise: Promise<void> | null = null

export async function initApp() {
  if (initPromise) return initPromise

  initPromise = (async () => {
    // ── CORS ────────────────────────────────────────────
    await app.register(cors, { origin: '*' })

    // ── Auto-migrate DB ─────────────────────────────────
    try {
      await ensureSchema()
    } catch (err: any) {
      console.error('[DB] Failed to ensure schema. Check DATABASE_URL:', err.message)
    }

    // ── Health ──────────────────────────────────────────
    app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

    // ── GET /mirage/latest ──────────────────────────────
    app.get('/mirage/latest', async (_req, reply) => {
      try {
        let { rows } = await pool.query(`
          SELECT DISTINCT ON (m.symbol_id)
            m.id, m.symbol_id, m.oi_percentile, m.bid_ask_ratio,
            m.funding_rate, m.mirage_score, m.status, m.price,
            m.timestamp::text as timestamp,
            s.symbol
          FROM mirages m
          JOIN symbols s ON m.symbol_id = s.id
          ORDER BY m.symbol_id, m.timestamp DESC
        `)

        // Serverless Fallback: If DB is empty or data is > 5 mins old, fetch on-demand!
        const isStale = rows.length === 0 || (new Date().getTime() - new Date(rows[0].timestamp).getTime() > 5 * 60 * 1000)
        if (isStale) {
          const { fetchAndStoreMirages } = await import('./mirage_scheduler')
          await fetchAndStoreMirages()
          const freshData = await pool.query(`
            SELECT DISTINCT ON (m.symbol_id)
              m.id, m.symbol_id, m.oi_percentile, m.bid_ask_ratio,
              m.funding_rate, m.mirage_score, m.status, m.price,
              m.timestamp::text as timestamp,
              s.symbol
            FROM mirages m
            JOIN symbols s ON m.symbol_id = s.id
            ORDER BY m.symbol_id, m.timestamp DESC
          `)
          rows = freshData.rows
        }

        return rows
      } catch (err: any) {
        return reply.status(500).send({ error: err.message })
      }
    })

    // ── GET /mirage/history ─────────────────────────────
    app.get('/mirage/history', async (req, reply) => {
      const Schema = z.object({ symbol: z.string(), days: z.coerce.number().optional().default(90) })
      const params = Schema.safeParse(req.query)
      if (!params.success) return reply.status(400).send({ error: 'Invalid params' })

      try {
        const symbolRes = await pool.query('SELECT id FROM symbols WHERE symbol = $1', [params.data.symbol])
        if (symbolRes.rowCount === 0) return []

        const { rows } = await pool.query(
          `SELECT m.*, m.timestamp::text as timestamp, s.symbol
           FROM mirages m
           JOIN symbols s ON m.symbol_id = s.id
           WHERE m.symbol_id = $1 AND m.timestamp >= NOW() - INTERVAL '1 day' * $2
           ORDER BY m.timestamp ASC`,
          [symbolRes.rows[0].id, params.data.days],
        )
        return rows
      } catch (err: any) {
        return reply.status(500).send({ error: err.message })
      }
    })

    // ── POST /strategy/generate ─────────────────────────
    app.post('/strategy/generate', async (req, reply) => {
      const input = MirageStrategyRequest.safeParse(req.body)
      if (!input.success) return reply.status(400).send({ error: 'Invalid mirage input', details: input.error.flatten() })

      try {
        const yaml = await generateYamlStrategy(input.data.mirageData)
        const valid = validateYamlStrategy(yaml)
        if (!valid.success) {
          return reply.status(500).send({ error: 'Generated YAML failed validation', details: valid.error })
        }
        return { yaml, parsed: valid.data }
      } catch (err: any) {
        return reply.status(500).send({ error: err.message })
      }
    })

    // ── POST /backtest/run ──────────────────────────────
    app.post('/backtest/run', async (req, reply) => {
      const Schema = z.object({
        strategy_yaml: z.string(),
        symbol: z.string(),
        days: z.coerce.number().default(90),
      })
      const input = Schema.safeParse(req.body)
      if (!input.success) return reply.status(400).send({ error: 'Invalid request', details: input.error.flatten() })

      try {
        const job_id = await runBacktestJob(input.data.strategy_yaml, input.data.symbol, input.data.days)
        return { job_id }
      } catch (err: any) {
        return reply.status(500).send({ error: err.message })
      }
    })

    // ── GET /backtest/status ────────────────────────────
    app.get('/backtest/status', async (req, reply) => {
      const Schema = z.object({ job_id: z.string() })
      const params = Schema.safeParse(req.query)
      if (!params.success) return reply.status(400).send({ error: 'Missing job_id' })

      try {
        const result = await fetchBacktestResult(params.data.job_id)
        if (!result) return reply.status(404).send({ error: 'Job not found or still running' })
        return result
      } catch (err: any) {
        return reply.status(500).send({ error: err.message })
      }
    })
  })()

  return initPromise
}

// ── Start server if not running in Vercel ──────────────
if (!process.env.VERCEL) {
  initApp().then(async () => {
    const port = parseInt(process.env.PORT || '4000')
    const address = await app.listen({ port, host: '0.0.0.0' })
    console.log(`\n ATOM API listening at ${address}`)
    startMirageScheduler()
  }).catch((err) => {
    console.error('Fatal startup error:', err)
    process.exit(1)
  })
}
