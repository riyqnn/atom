CREATE TABLE IF NOT EXISTS symbols (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) UNIQUE NOT NULL
);
CREATE TABLE IF NOT EXISTS mirages (
  id SERIAL PRIMARY KEY,
  symbol_id INTEGER REFERENCES symbols(id),
  timestamp TIMESTAMP DEFAULT NOW(),
  oi_percentile FLOAT,
  bid_ask_ratio FLOAT,
  funding_rate FLOAT,
  mirage_score FLOAT,
  status VARCHAR(20),
  price FLOAT
);
INSERT INTO symbols (symbol) VALUES ('BTC'), ('ETH'), ('SOL'), ('BNB'), ('MATIC'), ('AVAX') ON CONFLICT DO NOTHING;
