import 'dotenv/config'
import { Pool } from 'pg'

let connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres'
// Supabase pooler on port 6543 hangs on Vercel's IPv6 network. Fallback to direct port 5432.
if (connectionString.includes('pooler.supabase.com') && connectionString.includes(':6543')) {
  connectionString = connectionString.replace(':6543', ':5432').replace('?pgbouncer=true', '')
}

export const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' || connectionString.includes('supabase') ? { rejectUnauthorized: false } : undefined
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

    // Migration for existing tables
    await client.query(`ALTER TABLE mirages ADD COLUMN IF NOT EXISTS price FLOAT;`)

    console.log('[db] Schema ensured.')
  } finally {
    client.release()
  }
}
