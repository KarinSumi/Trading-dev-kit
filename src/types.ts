export interface TradingRule {
  id: string;
  category: 'entry' | 'confirmation' | 'session' | 'risk';
  ruleText: string;
  enabled: boolean;
}

export interface Playbook {
  id: string;
  name: string;
  description: string;
  timeframe: string;
  setupConditions: string[];
  riskRewardRatio: number;
}

export interface ScorecardItem {
  id: string;
  label: string;
  checked: boolean;
  weight: number; // weight in calculation (e.g. 1 to 3)
}

export interface HookConfig {
  preMarketScript: string;
  postTradeScript: string;
  endOfDayScript: string;
  simulateLogs: string;
}

export interface SubagentPrompt {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  userPromptTemplate: string;
}

export interface TradeLog {
  id: string;
  date: string;
  ticker: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  qty: number;
  pnl: number;
  rulesMet: boolean;
  notes?: string;
}

export interface TdkState {
  // Layer 1: Memory
  accountCapital: number;
  riskPerTradePercent: number;
  maxDailyDrawdownPercent: number;
  tradingRules: TradingRule[];
  
  // Layer 2: Playbook
  playbooks: Playbook[];
  scorecard: ScorecardItem[];
  
  // Layer 3: Hooks
  hooks: HookConfig;
  
  // Layer 4: Subagents
  subagentPrompts: SubagentPrompt[];
  tradeLogs: TradeLog[];
}
