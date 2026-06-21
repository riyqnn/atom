import { MirageRow, MirageStatus } from './mirage'

export interface SymbolRow {
  id: number
  symbol: string
  name: string
  created_at: string
  updated_at: string
}

export interface StrategyRow {
  id: number
  symbol_id: number
  name: string
  yaml_spec: string
  generated_at: string
}

export interface BacktestRow {
  id: number
  strategy_id: number
  symbol_id: number
  metrics: unknown
  job_id: string
  created_at: string
}
