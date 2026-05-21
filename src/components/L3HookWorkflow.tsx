import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Settings, Play, RefreshCw, Cpu } from 'lucide-react';
import type { TdkState } from '../types';

interface L3HookWorkflowProps {
  state: TdkState;
  onChange: (updates: Partial<TdkState>) => void;
}

export const L3HookWorkflow: React.FC<L3HookWorkflowProps> = ({ state, onChange }) => {
  const [selectedHookTab, setSelectedHookTab] = useState<'PreMarket.sh' | 'PostTrade.sh' | 'EndOfDay.sh'>('PreMarket.sh');
  
  // Script settings
  const [preMarketFlags, setPreMarketFlags] = useState({
    fetchLevels: true,
    checkCalendar: true,
    backupDatabase: false,
    clearOldLogs: true,
  });

  const [postTradeFlags, setPostTradeFlags] = useState({
    slackWebhook: true,
    appendDbLog: true,
    saveSlippage: true,
  });

  const [endOfDayFlags, setEndOfDayFlags] = useState({
    calcDailyPnl: true,
    emailReport: false,
    pushGitState: true,
    compressLogs: true,
  });

  // Simulator state
  const [simRunning, setSimRunning] = useState(false);
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [simStep, setSimStep] = useState<number>(-1);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [simLogs]);

  // Generate Shell Scripts
  const generateScript = (filename: string) => {
    const header = `#!/bin/bash\n# TDK Shell Hook - ${filename}\n# Generated on ${new Date().toLocaleDateString()}\n\n`;
    
    if (filename === 'PreMarket.sh') {
      let script = header + `echo "==> Running PRE-MARKET Initializer..."\n`;
      if (preMarketFlags.clearOldLogs) {
        script += `echo "Cleaning stale session cache..."\nrm -rf ./tmp/cache/*\n`;
      }
      if (preMarketFlags.fetchLevels) {
        script += `echo "Fetching pivot levels & support/resistance metrics..."\ncurl -s https://api.tdk.local/market/levels -o ./data/levels.json\n`;
      }
      if (preMarketFlags.checkCalendar) {
        script += `echo "Scanning macroeconomic calendar for red folders..."\nnode ./scripts/calendar-checker.js --threshold=high\n`;
      }
      if (preMarketFlags.backupDatabase) {
        script += `echo "Archiving historical setups database..."\ncp ./data/db.sqlite ./backups/db_\$(date +%F).sqlite\n`;
      }
      script += `echo "Pre-market check completed. Risk limits set: Account Capital=\$${state.accountCapital} USD."\n`;
      return script;
    }

    if (filename === 'PostTrade.sh') {
      let script = header + `echo "==> Running POST-TRADE Logger..."\n`;
      if (postTradeFlags.appendDbLog) {
        script += `echo "Recording trade entry details in SQLite database..."\nsqlite3 ./data/db.sqlite "INSERT INTO executions (timestamp) VALUES (datetime('now'));"\n`;
      }
      if (postTradeFlags.slackWebhook) {
        script += `echo "Pushing execution notification to webhook..."\ncurl -X POST -H 'Content-type: application/json' --data '{"text":"[TDK Execution Alert] Trade logged successfully."}' https://hooks.slack.com/services/tdk-alerts\n`;
      }
      if (postTradeFlags.saveSlippage) {
        script += `echo "Calculating transaction slippage metrics..."\npython3 ./scripts/slippage_calc.py --last\n`;
      }
      script += `echo "Post-trade metrics queued successfully."\n`;
      return script;
    }

    if (filename === 'EndOfDay.sh') {
      let script = header + `echo "==> Running END-OF-DAY Archiver..."\n`;
      if (endOfDayFlags.calcDailyPnl) {
        script += `echo "Computing final session P&L metrics..."\nnode ./scripts/pnl_calculator.js --capital=${state.accountCapital}\n`;
      }
      if (endOfDayFlags.compressLogs) {
        script += `echo "Compressing log file artifacts..."\ntar -czf ./logs/log_\$(date +%F).tar.gz ./logs/*.log\n`;
      }
      if (endOfDayFlags.emailReport) {
        script += `echo "Emailing daily session diagnostic report to manager..."\nsendmail -t < ./reports/daily_summary.txt\n`;
      }
      if (endOfDayFlags.pushGitState) {
        script += `echo "Pushing local database state snapshots to Github..."\ngit add ./data/db.sqlite\ngit commit -m "Auto-backup: EOD database snapshot [\$(date +%Y-%m-%d)]"\ngit push origin main\n`;
      }
      script += `echo "End-of-day pipeline executed successfully. System state secured."\n`;
      return script;
    }

    return '';
  };

  // Sync script configurations back to state for Layer 5 compilation
  useEffect(() => {
    onChange({
      hooks: {
        preMarketScript: generateScript('PreMarket.sh'),
        postTradeScript: generateScript('PostTrade.sh'),
        endOfDayScript: generateScript('EndOfDay.sh'),
        simulateLogs: simLogs.join('\n')
      }
    });
  }, [preMarketFlags, postTradeFlags, endOfDayFlags, state.accountCapital]);

  // Hook Pipeline simulator execution
  const runSimulation = () => {
    if (simRunning) return;
    setSimRunning(true);
    setSimLogs([]);
    setSimStep(0);
  };

  useEffect(() => {
    if (!simRunning || simStep === -1) return;

    const timeline = [
      { delay: 100, log: 'TDK-TERMINAL: Initializing Hook Simulation Pipeline...' },
      { delay: 400, log: 'TDK-TERMINAL: Calling hook script [PreMarket.sh]' },
      { delay: 300, log: '==> Running PRE-MARKET Initializer...' },
      preMarketFlags.clearOldLogs ? { delay: 200, log: 'Cleaning stale session cache...' } : null,
      preMarketFlags.fetchLevels ? { delay: 400, log: 'Fetching pivot levels & support/resistance metrics...' } : null,
      preMarketFlags.checkCalendar ? { delay: 400, log: 'Scanning macroeconomic calendar for red folders... [NO IMPACT EVENTS PENDING]' } : null,
      preMarketFlags.backupDatabase ? { delay: 300, log: 'Archiving historical setups database...' } : null,
      { delay: 200, log: `Pre-market check completed. Risk limits set: Account Capital=$${state.accountCapital} USD.` },
      { delay: 500, log: 'TDK-TERMINAL: [EVENT Trigger: Order Execution Filled]' },
      { delay: 300, log: 'TDK-TERMINAL: Calling hook script [PostTrade.sh]' },
      { delay: 250, log: '==> Running POST-TRADE Logger...' },
      postTradeFlags.appendDbLog ? { delay: 200, log: 'Recording trade entry details in SQLite database...' } : null,
      postTradeFlags.slackWebhook ? { delay: 300, log: 'Pushing execution notification to webhook...' } : null,
      postTradeFlags.saveSlippage ? { delay: 200, log: 'Calculating transaction slippage metrics... [Slippage: +0.2 bps]' } : null,
      { delay: 200, log: 'Post-trade metrics queued successfully.' },
      { delay: 600, log: 'TDK-TERMINAL: [EVENT Trigger: Market Session Closed]' },
      { delay: 300, log: 'TDK-TERMINAL: Calling hook script [EndOfDay.sh]' },
      { delay: 300, log: '==> Running END-OF-DAY Archiver...' },
      endOfDayFlags.calcDailyPnl ? { delay: 400, log: 'Computing final session P&L metrics...' } : null,
      endOfDayFlags.compressLogs ? { delay: 350, log: 'Compressing log file artifacts...' } : null,
      endOfDayFlags.emailReport ? { delay: 250, log: 'Emailing daily session diagnostic report to manager...' } : null,
      endOfDayFlags.pushGitState ? { delay: 500, log: 'Pushing local database state snapshots to Github...' } : null,
      { delay: 200, log: 'End-of-day pipeline executed successfully. System state secured.' },
      { delay: 100, log: 'TDK-TERMINAL: Hook Simulation Completed. [SUCCESS]' }
    ].filter(Boolean) as { delay: number; log: string }[];

    if (simStep < timeline.length) {
      const step = timeline[simStep];
      const timer = setTimeout(() => {
        setSimLogs(prev => [...prev, step.log]);
        setSimStep(prev => prev + 1);
      }, step.delay);
      return () => clearTimeout(timer);
    } else {
      setSimRunning(false);
      setSimStep(-1);
    }
  }, [simRunning, simStep]);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cpu className="text-purple" style={{ color: 'var(--accent-purple)' }} />
            L3 Hook Workflow
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Configure automatic scripts that run before the market opens, when a trade triggers, and after the close.
          </p>
        </div>
        <div className="status-indicator status-active">
          <Settings size={14} /> Workflow Scheduler Armed
        </div>
      </div>

      {/* Visual Timeline Pipeline */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', left: '10%', right: '10%', height: '2px', background: 'var(--border-color)', zIndex: 1 }}></div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, background: 'var(--bg-sidebar)', padding: '4px 12px', borderRadius: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', border: '2px solid var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)', fontWeight: 600, fontSize: '0.85rem' }}>1</div>
          <span style={{ fontSize: '0.8rem', marginTop: '6px', fontWeight: 500 }}>PreMarket.sh</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, background: 'var(--bg-sidebar)', padding: '4px 12px', borderRadius: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', border: '2px solid var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-emerald)', fontWeight: 600, fontSize: '0.85rem' }}>2</div>
          <span style={{ fontSize: '0.8rem', marginTop: '6px', fontWeight: 500, color: 'var(--text-muted)' }}>Executions</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, background: 'var(--bg-sidebar)', padding: '4px 12px', borderRadius: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', border: '2px solid var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-purple)', fontWeight: 600, fontSize: '0.85rem' }}>3</div>
          <span style={{ fontSize: '0.8rem', marginTop: '6px', fontWeight: 500 }}>PostTrade.sh</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, background: 'var(--bg-sidebar)', padding: '4px 12px', borderRadius: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', border: '2px solid var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-amber)', fontWeight: 600, fontSize: '0.85rem' }}>4</div>
          <span style={{ fontSize: '0.8rem', marginTop: '6px', fontWeight: 500 }}>EndOfDay.sh</span>
        </div>
      </div>

      <div className="grid-2">
        {/* Hook Configurator Card */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Script Configurator</h3>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['PreMarket.sh', 'PostTrade.sh', 'EndOfDay.sh'] as const).map(tab => (
                <button
                  key={tab}
                  className={`btn ${selectedHookTab === tab ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  onClick={() => setSelectedHookTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {selectedHookTab === 'PreMarket.sh' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pre-market hook executes daily at 09:00 AM EST to build context databases.</p>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={preMarketFlags.fetchLevels} onChange={(e) => setPreMarketFlags(p => ({ ...p, fetchLevels: e.target.checked }))} />
                  Fetch Daily Support/Resistance (Pivot points API)
                </label>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={preMarketFlags.checkCalendar} onChange={(e) => setPreMarketFlags(p => ({ ...p, checkCalendar: e.target.checked }))} />
                  Run Macroeconomic News Calendar Filter
                </label>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={preMarketFlags.backupDatabase} onChange={(e) => setPreMarketFlags(p => ({ ...p, backupDatabase: e.target.checked }))} />
                  Backup Local Trades Database
                </label>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={preMarketFlags.clearOldLogs} onChange={(e) => setPreMarketFlags(p => ({ ...p, clearOldLogs: e.target.checked }))} />
                  Flush Session Logs and Temporary Cache
                </label>
              </div>
            )}

            {selectedHookTab === 'PostTrade.sh' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Executes automatically immediately after a trade order fill is confirmed.</p>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={postTradeFlags.slackWebhook} onChange={(e) => setPostTradeFlags(p => ({ ...p, slackWebhook: e.target.checked }))} />
                  Send Execution Webhook Notification to Slack
                </label>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={postTradeFlags.appendDbLog} onChange={(e) => setPostTradeFlags(p => ({ ...p, appendDbLog: e.target.checked }))} />
                  Insert Executed Ticket into local SQLite logs
                </label>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={postTradeFlags.saveSlippage} onChange={(e) => setPostTradeFlags(p => ({ ...p, saveSlippage: e.target.checked }))} />
                  Calculate Slippage relative to broker feed
                </label>
              </div>
            )}

            {selectedHookTab === 'EndOfDay.sh' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Executes daily at 16:30 PM EST to secure session data and report logs.</p>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={endOfDayFlags.calcDailyPnl} onChange={(e) => setEndOfDayFlags(p => ({ ...p, calcDailyPnl: e.target.checked }))} />
                  Calculate Net Profit/Loss and Update Balance State
                </label>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={endOfDayFlags.compressLogs} onChange={(e) => setEndOfDayFlags(p => ({ ...p, compressLogs: e.target.checked }))} />
                  Tar/Gzip Active Session Log Files
                </label>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={endOfDayFlags.emailReport} onChange={(e) => setEndOfDayFlags(p => ({ ...p, emailReport: e.target.checked }))} />
                  Email Diagnostic Session Summary to Manager
                </label>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={endOfDayFlags.pushGitState} onChange={(e) => setEndOfDayFlags(p => ({ ...p, pushGitState: e.target.checked }))} />
                  Commit & Push database snapshot to Github Repository
                </label>
              </div>
            )}

            <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>File Code Output Preview</h4>
              <pre className="terminal-code" style={{ maxHeight: '140px', color: '#60a5fa', fontSize: '0.8rem' }}>
                {generateScript(selectedHookTab)}
              </pre>
            </div>
          </div>
        </div>

        {/* Terminal Simulator Card */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={18} style={{ color: 'var(--accent-emerald)' }} />
              TDK Terminal Emulator
            </h3>
            <button
              className="btn btn-accent"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              onClick={runSimulation}
              disabled={simRunning}
            >
              {simRunning ? (
                <>
                  <RefreshCw className="fade-spin" size={14} style={{ animation: 'spin 1.5s linear infinite' }} />
                  Simulating...
                </>
              ) : (
                <>
                  <Play size={14} />
                  Test Hook Pipeline
                </>
              )}
            </button>
          </div>

          <div
            style={{
              flexGrow: 1,
              background: '#040508',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              padding: '16px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              overflowY: 'auto',
              minHeight: '300px',
              maxHeight: '360px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            {simLogs.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', margin: 'auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Terminal size={32} style={{ opacity: 0.3 }} />
                <span>Terminal Idle. Run a test simulation pipeline to check hooks execution logs.</span>
              </div>
            ) : (
              simLogs.map((log, index) => {
                let color = '#a7f3d0'; // Emerald light
                if (log.includes('TDK-TERMINAL:')) {
                  color = 'var(--accent-blue)';
                } else if (log.includes('[EVENT Trigger')) {
                  color = 'var(--accent-purple)';
                } else if (log.includes('completed') || log.includes('SUCCESS')) {
                  color = 'var(--accent-emerald)';
                } else if (log.includes('Cleaning') || log.includes('Scanning')) {
                  color = 'var(--text-secondary)';
                }
                return (
                  <div key={index} style={{ color, display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--text-muted)', userSelect: 'none' }}>$</span>
                    <span style={{ wordBreak: 'break-all' }}>{log}</span>
                  </div>
                );
              })
            )}
            <div ref={terminalEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};
