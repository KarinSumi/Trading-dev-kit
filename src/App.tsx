import { useState } from 'react';
import { Shield, BookOpen, Cpu, Bot, Package, Terminal, Activity, TrendingUp } from 'lucide-react';
import { L1MemoryEditor } from './components/L1MemoryEditor';
import { L2PlaybookLibrary } from './components/L2PlaybookLibrary';
import { L3HookWorkflow } from './components/L3HookWorkflow';
import { L4SubagentSim } from './components/L4SubagentSim';
import { L5PluginPackager } from './components/L5PluginPackager';
import type { TdkState } from './types';
import './App.css';

// Initial state values for TDK application
const INITIAL_STATE: TdkState = {
  accountCapital: 100000,
  riskPerTradePercent: 1.0,
  maxDailyDrawdownPercent: 3.0,
  tradingRules: [
    { id: 'r1', category: 'entry', ruleText: 'Confirm higher-timeframe trend alignment on 1H charts', enabled: true },
    { id: 'r2', category: 'entry', ruleText: 'Validate volume expansion (>1.5x) on breakout candle', enabled: true },
    { id: 'r3', category: 'confirmation', ruleText: 'Wait for candle close before trigger execution', enabled: true },
    { id: 'r4', category: 'session', ruleText: 'Do not hold positions over major news events (e.g. CPI, FOMC)', enabled: true },
    { id: 'r5', category: 'risk', ruleText: 'Stop Loss must be placed immediately upon entry', enabled: true },
    { id: 'r6', category: 'risk', ruleText: 'Never average down or add size to a losing position', enabled: true }
  ],
  playbooks: [
    {
      id: 'pb1',
      name: 'Range Breakout Setup',
      description: 'Trading breakout out of a well-defined consolidation range. Prefers assets with high volume squeeze.',
      timeframe: '15m / 1h',
      setupConditions: [
        'Consolidation pattern (flat top/bottom) for 20+ candles',
        'Relative volume expansion > 1.5x on breakout bar',
        'Candle body closes outside the support/resistance range boundary'
      ],
      riskRewardRatio: 2.5
    },
    {
      id: 'pb2',
      name: 'Trend Pullback Setup',
      description: 'Entering on minor pullbacks of strong trending assets back towards key support moving averages.',
      timeframe: '5m / 15m',
      setupConditions: [
        'Asset is in clean uptrend (EMA 20 > EMA 50 > EMA 200)',
        'Price retraces back to key EMA (e.g. 20 EMA or 50% Fibonacci level)',
        'Bullish engulfing or hammer candle forms at support'
      ],
      riskRewardRatio: 3.0
    },
    {
      id: 'pb3',
      name: 'Mean Reversion Setup',
      description: 'Trading exhaustion deviations back to the mean. High success rate in sideways macro markets.',
      timeframe: '1h / Daily',
      setupConditions: [
        'RSI indicator is extremely overbought (>80) or oversold (<20)',
        'Price exceeds Bollinger Band outer envelope limit',
        'Divergence pattern forms on MACD histogram'
      ],
      riskRewardRatio: 2.0
    }
  ],
  scorecard: [
    { id: 's1', label: 'Higher-timeframe trend is aligned with trade direction', checked: true, weight: 2 },
    { id: 's2', label: 'Volume confirms breakout (above 1.5x relative average)', checked: true, weight: 2 },
    { id: 's3', label: 'Calculated Risk-to-Reward ratio is at least 1:2', checked: true, weight: 3 },
    { id: 's4', label: 'No high-impact news event within the next 60 minutes', checked: false, weight: 1 },
    { id: 's5', label: 'Total daily loss is currently below drawdown limits', checked: true, weight: 3 }
  ],
  hooks: {
    preMarketScript: '',
    postTradeScript: '',
    endOfDayScript: '',
    simulateLogs: ''
  },
  subagentPrompts: [
    {
      id: 'researcher',
      name: 'Market Researcher',
      role: 'catalyst_scanner',
      systemPrompt: 'You are a market catalyst research bot. Extract macroeconomic indicators and volume pool breakouts.',
      userPromptTemplate: 'Scan news catalysts and key support/resistance levels for: {{input}}'
    },
    {
      id: 'risk',
      name: 'Risk Manager',
      role: 'guardrail_auditor',
      systemPrompt: 'You are a risk management bot. Audits entry setups against active Risk.md policy.',
      userPromptTemplate: 'Run risk clearance check for size: {{input}}'
    },
    {
      id: 'journal',
      name: 'Journal Analyzer',
      role: 'performance_auditor',
      systemPrompt: 'You are a trade history audit bot. Identify pattern compliance leaks in past trade logs.',
      userPromptTemplate: 'Audit recent logs: {{input}}'
    }
  ],
  tradeLogs: [
    { id: 't1', date: '2026-05-18', ticker: 'SPY', direction: 'LONG', entryPrice: 510.00, exitPrice: 512.50, qty: 100, pnl: 250, rulesMet: true, notes: 'Playbook breakout worked perfectly.' },
    { id: 't2', date: '2026-05-19', ticker: 'NVDA', direction: 'LONG', entryPrice: 920.00, exitPrice: 915.00, qty: 50, pnl: -250, rulesMet: true, notes: 'Hit stop loss cleanly.' },
    { id: 't3', date: '2026-05-20', ticker: 'QQQ', direction: 'SHORT', entryPrice: 440.00, exitPrice: 437.00, qty: 200, pnl: 600, rulesMet: true, notes: 'Macro pullback confirmation entry.' },
    { id: 't4', date: '2026-05-21', ticker: 'AAPL', direction: 'LONG', entryPrice: 185.00, exitPrice: 184.20, qty: 150, pnl: -120, rulesMet: false, notes: 'Took trade too early before confirmation.' }
  ]
};

function App() {
  const [state, setState] = useState<TdkState>(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState<'L1' | 'L2' | 'L3' | 'L4' | 'L5'>('L1');

  // Unified state change handler passed down to layers
  const handleStateChange = (updates: Partial<TdkState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)', fontFamily: 'var(--font-sans)' }}>
      {/* Sidebar Navigation */}
      <aside style={{ width: 'var(--sidebar-width)', background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Title Brand Banner */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity className="text-emerald" style={{ color: 'var(--accent-emerald)', animation: 'pulse 2s infinite' }} size={24} />
          <div>
            <h1 style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-primary)' }}>TDK COCKPIT</h1>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>DEV KIT CTRL PANEL</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ flexGrow: 1, padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            className={`btn ${activeTab === 'L1' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', fontSize: '0.9rem' }}
            onClick={() => setActiveTab('L1')}
          >
            <Shield size={18} /> L1 Memory Editor
          </button>
          <button
            className={`btn ${activeTab === 'L2' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', fontSize: '0.9rem' }}
            onClick={() => setActiveTab('L2')}
          >
            <BookOpen size={18} /> L2 Playbook Scorecard
          </button>
          <button
            className={`btn ${activeTab === 'L3' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', fontSize: '0.9rem' }}
            onClick={() => setActiveTab('L3')}
          >
            <Cpu size={18} /> L3 Hook Workflow
          </button>
          <button
            className={`btn ${activeTab === 'L4' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', fontSize: '0.9rem' }}
            onClick={() => setActiveTab('L4')}
          >
            <Bot size={18} /> L4 Subagent Center
          </button>
          <button
            className={`btn ${activeTab === 'L5' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px', fontSize: '0.9rem' }}
            onClick={() => setActiveTab('L5')}
          >
            <Package size={18} /> L5 Plugin Packager
          </button>
        </nav>

        {/* Console Footprint */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.1)' }}>
          <Terminal size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>TDK Core: online</span>
        </div>
      </aside>

      {/* Viewport content area */}
      <main style={{ flexGrow: 1, padding: '36px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Render Active Layer panel */}
        {activeTab === 'L1' && <L1MemoryEditor state={state} onChange={handleStateChange} />}
        {activeTab === 'L2' && <L2PlaybookLibrary state={state} onChange={handleStateChange} />}
        {activeTab === 'L3' && <L3HookWorkflow state={state} onChange={handleStateChange} />}
        {activeTab === 'L4' && <L4SubagentSim state={state} onChange={handleStateChange} />}
        {activeTab === 'L5' && <L5PluginPackager state={state} />}

        {/* Global Footer info */}
        <footer style={{ marginTop: 'auto', paddingTop: '36px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={12} />
            <span>Trading Development Kit (TDK) Dashboard Client v1.0</span>
          </div>
          <span>Secure Sandbox Environment</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
