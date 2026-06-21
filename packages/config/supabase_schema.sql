// Postgres schema for Supabase (create in dashboard or SQL)
-- Symbol: Tradable asset
drop table if exists symbols cascade;
create table symbols (
  id serial primary key,
  symbol text unique not null,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Mirage: Real-time mirage scores
drop table if exists mirages cascade;
create table mirages (
  id serial primary key,
  symbol_id integer references symbols(id),
  timestamp timestamptz not null,
  oi_percentile float not null,
  bid_ask_ratio float not null,
  funding_rate float not null,
  mirage_score float not null,
  status text not null,
  created_at timestamptz default now()
);
create index idx_mirages_symbol_ts on mirages(symbol_id, timestamp);

-- Strategy: generated YAML specs
drop table if exists strategies cascade;
create table strategies (
  id serial primary key,
  symbol_id int references symbols(id),
  name text not null,
  yaml_spec text not null,
  generated_at timestamptz default now()
);

-- Backtest: analytic job results
drop table if exists backtests cascade;
create table backtests (
  id serial primary key,
  strategy_id int references strategies(id),
  symbol_id int references symbols(id),
  metrics jsonb not null,
  job_id text unique not null,
  created_at timestamptz default now()
);
