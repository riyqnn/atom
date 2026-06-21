import 'dotenv/config'
import { Pool } from 'pg'

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres',
})

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const client = await pool.connect()
  try {
    const res = await client.query(text, params)
    return res.rows
  } finally {
    client.release()
  }
}

/** Run once on startup to ensure tables exist */
export async function ensureSchema() {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS symbols (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(20) UNIQUE NOT NULL
      );
      CREATE TABLE IF NOT EXISTS mirages (
        id SERIAL PRIMARY KEY,
        symbol_id INTEGER REFERENCES symbols(id),
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        oi_percentile FLOAT,
        bid_ask_ratio FLOAT,
        funding_rate FLOAT,
        mirage_score FLOAT,
        status VARCHAR(20),
        price FLOAT
      );
      CREATE TABLE IF NOT EXISTS backtests (
        id SERIAL PRIMARY KEY,
        job_id VARCHAR(100) UNIQUE NOT NULL,
        symbol VARCHAR(20),
        strategy_yaml TEXT,
        metrics JSONB,
        trades JSONB,
        equity_curve JSONB,
        status VARCHAR(20) DEFAULT 'running',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        finished_at TIMESTAMPTZ
      );
      INSERT INTO symbols (symbol) VALUES ('BTC'), ('ETH'), ('SOL'), ('BNB'), ('MATIC'), ('AVAX')
      ON CONFLICT DO NOTHING;
    `)
    console.log('[db] Schema ensured.')
  } finally {
    client.release()
  }
}
