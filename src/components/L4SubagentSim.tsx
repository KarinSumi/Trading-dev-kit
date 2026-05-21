import React, { useState } from 'react';
import { Bot, LineChart as ChartIcon, Plus, ShieldAlert, Sparkles, Check } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import type { TdkState, TradeLog } from '../types';

interface L4SubagentSimProps {
  state: TdkState;
  onChange: (updates: Partial<TdkState>) => void;
}

export const L4SubagentSim: React.FC<L4SubagentSimProps> = ({ state, onChange }) => {
  const [activeTab, setActiveTab] = useState<'agents' | 'journal'>('journal');
  const [selectedAgentId, setSelectedAgentId] = useState<string>(state.subagentPrompts[0]?.id || '');
  const [agentInput, setAgentInput] = useState('');
  const [agentOutput, setAgentOutput] = useState('');
  const [agentLoading, setAgentLoading] = useState(false);

  // Trade journal inputs
  const [ticker, setTicker] = useState('');
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG');
  const [entryPrice, setEntryPrice] = useState(0);
  const [exitPrice, setExitPrice] = useState(0);
  const [qty, setQty] = useState(0);
  const [rulesMet, setRulesMet] = useState(true);
  const [notes, setNotes] = useState('');

  const selectedAgent = state.subagentPrompts.find(a => a.id === selectedAgentId) || state.subagentPrompts[0];

  // Mock Agent consultation response generator
  const handleConsultAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentInput.trim() || agentLoading) return;

    setAgentLoading(true);
    setAgentOutput('System initializing subagent core...');

    const responses: Record<string, string> = {
      researcher: `[Market Researcher Subagent Response]
Analyzing catalysts and volume flows for "${agentInput}":
- Trend Assessment: Bullish alignment on 1H/4H intervals, volume expansion above average.
- Macroeconomic Risks: No major calendar releases (CPI/FOMC) scheduled within 3 hours.
- Catalyst Scan: Positive earnings slippage reaction reported last night. Bid/Ask depth displays high institutional limit interest at key liquidity pool levels.
- Verdict: Setup conditions are OPTIMAL. Recommend proceeding to playbook checks.`,
      risk: `[Risk Manager Subagent Response]
Scanning safety thresholds relative to "${agentInput}":
- Balance Evaluation: Capital balance at $${state.accountCapital.toLocaleString()} USD.
- Sizing Guardrail: Maximum per-trade risk target is $${((state.accountCapital * state.riskPerTradePercent) / 100).toLocaleString()} USD.
- Adverse Excursion Stress Test: Standard 2-ATR stop-loss buffer calculated.
- Warning: Multiple correlated tickers detected in active state. AVERAGE DOWN PROHIBITED.
- Verdict: APPROVED, provided stop-loss orders are hardcoded into immediate broker API executions.`,
      journal: `[Journal Analyzer Subagent Response]
Auditing recent performance logs:
- Sample Space: ${state.tradeLogs.length} trades evaluated.
- Rule Compliance Check: compliance rate is at ${Math.round((state.tradeLogs.filter(t => t.rulesMet).length / state.tradeLogs.length) * 100)}%.
- Pattern Recognition: Trades that VIOLATED entry checklists have an average return of -$${Math.abs(Math.round(state.tradeLogs.filter(t => !t.rulesMet).reduce((sum, t) => sum + t.pnl, 0) / Math.max(state.tradeLogs.filter(t => !t.rulesMet).length, 1)))}.
- Feedback: Strict enforcement of stop loss is improving win rate. Stop taking "FOMO Breakouts" outside playbook guidelines.`
    };

    setTimeout(() => {
      setAgentOutput(responses[selectedAgent?.id] || `[Subagent Engine]: Received query "${agentInput}". Analyzing with system prompt... Approved.`);
      setAgentLoading(false);
    }, 1200);
  };

  // Add trade log
  const handleAddTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim() || qty <= 0 || entryPrice <= 0 || exitPrice <= 0) return;

    const pnl = direction === 'LONG' 
      ? (exitPrice - entryPrice) * qty 
      : (entryPrice - exitPrice) * qty;

    const newTrade: TradeLog = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      ticker: ticker.toUpperCase(),
      direction,
      entryPrice,
      exitPrice,
      qty,
      pnl,
      rulesMet,
      notes: notes.trim()
    };

    const updatedLogs = [newTrade, ...state.tradeLogs];
    onChange({ tradeLogs: updatedLogs });

    // Reset Form
    setTicker('');
    setEntryPrice(0);
    setExitPrice(0);
    setQty(0);
    setRulesMet(true);
    setNotes('');
  };

  // Journal Analytics calculations
  const totalTrades = state.tradeLogs.length;
  const winningTrades = state.tradeLogs.filter(t => t.pnl > 0);
  const winRate = totalTrades > 0 ? Math.round((winningTrades.length / totalTrades) * 100) : 0;
  const netPnl = state.tradeLogs.reduce((sum, t) => sum + t.pnl, 0);

  const grossProfit = state.tradeLogs.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = state.tradeLogs.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0);
  const profitFactor = grossLoss !== 0 ? Math.round((grossProfit / Math.abs(grossLoss)) * 100) / 100 : grossProfit > 0 ? 99.9 : 0;

  const compliantTrades = state.tradeLogs.filter(t => t.rulesMet);
  const complianceRate = totalTrades > 0 ? Math.round((compliantTrades.length / totalTrades) * 100) : 0;

  // Cumulative P&L data mapping for chart
  const getChartData = () => {
    let sum = 0;
    // Reverse array to start chronologically
    const sortedLogs = [...state.tradeLogs].reverse();
    const data = sortedLogs.map((t, idx) => {
      sum += t.pnl;
      return {
        trade: `#${idx + 1} (${t.ticker})`,
        PnL: sum
      };
    });
    return [{ trade: 'Start', PnL: 0 }, ...data];
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bot className="text-amber" style={{ color: 'var(--accent-amber)' }} />
            L4 Subagent Center
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Interact with specialized subagents and audit system performance using trade journals.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn ${activeTab === 'journal' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('journal')}
          >
            <ChartIcon size={16} /> Journal & Charts
          </button>
          <button
            className={`btn ${activeTab === 'agents' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('agents')}
          >
            <Bot size={16} /> AI Subagents Playground
          </button>
        </div>
      </div>

      {activeTab === 'journal' ? (
        /* Journal & Recharts Dashboard */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Key Stat Grid */}
          <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
            <div className="glass-panel" style={{ padding: '12px 16px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Trades</span>
              <h4 style={{ fontSize: '1.5rem', marginTop: '4px' }}>{totalTrades}</h4>
            </div>
            <div className="glass-panel" style={{ padding: '12px 16px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Win Rate</span>
              <h4 style={{ fontSize: '1.5rem', marginTop: '4px', color: 'var(--accent-emerald)' }}>{winRate}%</h4>
            </div>
            <div className="glass-panel" style={{ padding: '12px 16px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net P&L</span>
              <h4 style={{ fontSize: '1.5rem', marginTop: '4px', color: netPnl >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                {netPnl >= 0 ? '+' : ''}${netPnl.toLocaleString()}
              </h4>
            </div>
            <div className="glass-panel" style={{ padding: '12px 16px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Profit Factor</span>
              <h4 style={{ fontSize: '1.5rem', marginTop: '4px', color: 'var(--accent-blue)' }}>{profitFactor}</h4>
            </div>
            <div className="glass-panel" style={{ padding: '12px 16px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Compliance Rate</span>
              <h4 style={{ fontSize: '1.5rem', marginTop: '4px', color: complianceRate >= 80 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>{complianceRate}%</h4>
            </div>
          </div>

          <div className="grid-2">
            {/* Chart Panel */}
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                Cumulative Profit & Loss ($)
              </h3>
              
              <div style={{ width: '100%', height: '240px', flexGrow: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getChartData()} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="trade" stroke="var(--text-muted)" fontSize={10} />
                    <YAxis stroke="var(--text-muted)" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ background: '#0f111a', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                      labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="PnL" 
                      stroke={netPnl >= 0 ? '#10b981' : '#ef4444'} 
                      strokeWidth={2}
                      dot={{ r: 4, strokeWidth: 1 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Log Input Panel */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                Record Session Execution
              </h3>
              
              <form onSubmit={handleAddTrade} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="grid-2" style={{ gap: '10px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Ticker</label>
                    <input type="text" required placeholder="e.g. SPY" className="form-control" value={ticker} onChange={(e) => setTicker(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Direction</label>
                    <select className="form-control" value={direction} onChange={(e) => setDirection(e.target.value as 'LONG' | 'SHORT')}>
                      <option value="LONG">Long</option>
                      <option value="SHORT">Short</option>
                    </select>
                  </div>
                </div>

                <div className="grid-3" style={{ gap: '8px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Entry ($)</label>
                    <input type="number" required step="0.01" className="form-control" value={entryPrice || ''} onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Exit ($)</label>
                    <input type="number" required step="0.01" className="form-control" value={exitPrice || ''} onChange={(e) => setExitPrice(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Qty</label>
                    <input type="number" required className="form-control" value={qty || ''} onChange={(e) => setQty(parseInt(e.target.value) || 0)} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={rulesMet} onChange={(e) => setRulesMet(e.target.checked)} />
                    Playbook Rules Met?
                  </label>
                </div>

                <button type="submit" className="btn btn-accent" style={{ width: '100%' }}>
                  <Plus size={16} /> Log Entry to Journal
                </button>
              </form>
            </div>
          </div>

          {/* Trade History table */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              Execution History & Audit Log
            </h3>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px' }}>Date</th>
                    <th style={{ padding: '10px' }}>Ticker</th>
                    <th style={{ padding: '10px' }}>Type</th>
                    <th style={{ padding: '10px' }}>Size</th>
                    <th style={{ padding: '10px' }}>Entry/Exit</th>
                    <th style={{ padding: '10px' }}>P&L ($)</th>
                    <th style={{ padding: '10px' }}>Compliance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {state.tradeLogs.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: t.rulesMet ? 'transparent' : 'rgba(239, 68, 68, 0.02)' }}>
                      <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{t.date}</td>
                      <td style={{ padding: '10px', fontWeight: 600 }}>{t.ticker}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{
                          color: t.direction === 'LONG' ? 'var(--accent-blue)' : 'var(--accent-purple)',
                          background: t.direction === 'LONG' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}>
                          {t.direction}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>{t.qty}</td>
                      <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>${t.entryPrice} / ${t.exitPrice}</td>
                      <td style={{ padding: '10px', fontWeight: 600, color: t.pnl >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                        {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}
                      </td>
                      <td style={{ padding: '10px' }}>
                        {t.rulesMet ? (
                          <span style={{ color: 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                            <Check size={14} /> Compliant
                          </span>
                        ) : (
                          <span style={{ color: 'var(--accent-rose)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                            <ShieldAlert size={14} /> RULE BREACH
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Subagents Prompts Playground */
        <div className="grid-2">
          {/* Prompts list */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              Specialized Subagents Catalog
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
              {state.subagentPrompts.map(agent => (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  style={{
                    background: selectedAgentId === agent.id ? 'rgba(59, 130, 246, 0.05)' : 'rgba(255,255,255,0.01)',
                    border: '1px solid',
                    borderColor: selectedAgentId === agent.id ? 'var(--accent-blue)' : 'var(--border-color)',
                    padding: '16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontWeight: 600, color: selectedAgentId === agent.id ? 'var(--accent-blue)' : 'var(--text-primary)' }}>
                      {agent.name}
                    </h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                      {agent.role}
                    </span>
                  </div>
                  
                  <div style={{ marginTop: '8px' }}>
                    <h5 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>System Prompt</h5>
                    <pre style={{ 
                      fontSize: '0.75rem', 
                      background: 'rgba(0,0,0,0.2)', 
                      padding: '8px', 
                      borderRadius: '4px', 
                      marginTop: '4px',
                      overflowX: 'auto',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {agent.systemPrompt.substring(0, 100)}...
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prompt Sandbox Simulator */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              Subagent Consultation Sandbox
            </h3>

            {selectedAgent && (
              <form onSubmit={handleConsultAgent} style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Prompt Template:</span>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {selectedAgent.userPromptTemplate}
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Consultation Input Query (e.g. Asset Ticker or Action)</label>
                  <input
                    type="text"
                    required
                    placeholder={selectedAgent.id === 'researcher' ? 'e.g. NVDA or AAPL' : selectedAgent.id === 'risk' ? 'e.g. Log standard breakout trade on SPY' : 'Audit logs'}
                    className="form-control"
                    value={agentInput}
                    onChange={(e) => setAgentInput(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-accent" disabled={agentLoading} style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <Sparkles size={16} />
                  {agentLoading ? 'Consulting Engine...' : `Consult ${selectedAgent.name}`}
                </button>

                <div style={{ marginTop: '16px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <label className="form-label">Subagent Output terminal</label>
                  <pre 
                    className="terminal-code" 
                    style={{ 
                      flexGrow: 1, 
                      minHeight: '180px', 
                      maxHeight: '240px',
                      color: agentLoading ? 'var(--text-muted)' : '#f59e0b',
                      borderColor: 'rgba(245, 158, 11, 0.15)',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {agentOutput || 'Terminal idle. Submit a query above to stream subagent logs.'}
                  </pre>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
