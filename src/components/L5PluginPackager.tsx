import React, { useState } from 'react';
import { Package, Download, FileJson, Folder, FileText, FileCode, CheckCircle, Cpu } from 'lucide-react';
import type { TdkState } from '../types';

interface L5PluginPackagerProps {
  state: TdkState;
}

export const L5PluginPackager: React.FC<L5PluginPackagerProps> = ({ state }) => {
  const [selectedFile, setSelectedFile] = useState<string>('plugin.json');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Generate plugin.json manifest content
  const generatePluginJson = () => {
    const activeRules = state.tradingRules.filter(r => r.enabled);
    const manifest = {
      name: "trading-dev-kit-plugin",
      version: "1.0.0",
      description: "Auto-generated Trading Development Kit (TDK) distribution manifest containing account profiles, system guardrails, playbook setups, hook scripts, and subagents settings.",
      author: "TDK Developer Panel",
      timestamp: new Date().toISOString(),
      config: {
        account_profile: {
          capital: state.accountCapital,
          risk_per_trade_percent: state.riskPerTradePercent,
          max_daily_drawdown_percent: state.maxDailyDrawdownPercent,
          max_loss_per_trade_usd: (state.accountCapital * state.riskPerTradePercent) / 100,
          max_drawdown_usd: (state.accountCapital * state.maxDailyDrawdownPercent) / 100,
        },
        memory: {
          rules_count: activeRules.length,
          rules: activeRules.map(r => ({ category: r.category, rule: r.ruleText }))
        },
        playbook: {
          setups_count: state.playbooks.length,
          setups: state.playbooks.map(p => ({
            name: p.name,
            timeframe: p.timeframe,
            target_rr: p.riskRewardRatio,
            conditions: p.setupConditions
          }))
        },
        hooks: {
          pre_market: {
            filename: "PreMarket.sh",
            md5_checksum: "computed_on_init"
          },
          post_trade: {
            filename: "PostTrade.sh",
            md5_checksum: "computed_on_fill"
          },
          end_of_day: {
            filename: "EndOfDay.sh",
            md5_checksum: "computed_on_close"
          }
        },
        subagents: state.subagentPrompts.map(s => ({
          id: s.id,
          name: s.name,
          role: s.role,
          system_prompt_length: s.systemPrompt.length
        }))
      }
    };
    return JSON.stringify(manifest, null, 2);
  };

  // Re-generate markdown contents
  const generateClaudeMd = () => {
    const activeRules = state.tradingRules.filter(r => r.enabled);
    return `# CLAUDE.md - Trading System Context
## System Environment
- **Capital**: $${state.accountCapital.toLocaleString()}
- **Platform**: Trading Dev Kit (TDK) v1.0

## Core Operational Rules
### 1. Market Entry Guidelines
${activeRules.filter(r => r.category === 'entry').map(r => `- [ ] ${r.ruleText}`).join('\n') || '- No rules.'}
### 2. Execution Confirmation
${activeRules.filter(r => r.category === 'confirmation').map(r => `- [ ] ${r.ruleText}`).join('\n') || '- No rules.'}
### 3. Session Boundaries
${activeRules.filter(r => r.category === 'session').map(r => `- [ ] ${r.ruleText}`).join('\n') || '- No rules.'}`;
  };

  const generateRiskMd = () => {
    const activeRules = state.tradingRules.filter(r => r.enabled);
    const maxRisk = (state.accountCapital * state.riskPerTradePercent) / 100;
    const maxDd = (state.accountCapital * state.maxDailyDrawdownPercent) / 100;
    return `# Risk.md - System Guardrails
## Account Risk Metrics
- **Total Portfolio Equity**: $${state.accountCapital.toLocaleString()}
- **Risk Per Trade Limit**: ${state.riskPerTradePercent}% ($${maxRisk.toLocaleString()})
- **Daily Drawdown Limit**: ${state.maxDailyDrawdownPercent}% ($${maxDd.toLocaleString()})

## Active Risk Guardrails
${activeRules.filter(r => r.category === 'risk').map(r => `- [!] ${r.ruleText}`).join('\n') || '- No rules.'}`;
  };

  // Get content depending on file selected in file tree
  const getFileContent = () => {
    switch (selectedFile) {
      case 'plugin.json':
        return generatePluginJson();
      case 'CLAUDE.md':
        return generateClaudeMd();
      case 'Risk.md':
        return generateRiskMd();
      case 'PreMarket.sh':
        return state.hooks.preMarketScript;
      case 'PostTrade.sh':
        return state.hooks.postTradeScript;
      case 'EndOfDay.sh':
        return state.hooks.endOfDayScript;
      default:
        return '';
    }
  };

  // File Download Helper
  const triggerDownload = (fileName: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  // Download all as a single TDK bundle JSON file
  const downloadEntireBundle = () => {
    const bundle = {
      manifest: JSON.parse(generatePluginJson()),
      files: {
        "CLAUDE.md": generateClaudeMd(),
        "Risk.md": generateRiskMd(),
        "PreMarket.sh": state.hooks.preMarketScript,
        "PostTrade.sh": state.hooks.postTradeScript,
        "EndOfDay.sh": state.hooks.endOfDayScript,
      }
    };
    triggerDownload('tdk-setup-bundle.json', JSON.stringify(bundle, null, 2));
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Package className="text-emerald" style={{ color: 'var(--accent-emerald)' }} />
            L5 Plugin Packager
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Verify generated file outputs and bundle configurations into a single distributable package.
          </p>
        </div>
        <div className="status-indicator status-active" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <CheckCircle size={14} /> System Verified
        </div>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '300px 1fr' }}>
        {/* Compiler Workspace File Tree */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            Compiled Assets Workspace
          </h3>

          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Root folder */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', color: 'var(--text-primary)', fontWeight: 600 }}>
              <Folder size={18} style={{ color: 'var(--accent-blue)' }} />
              <span>tdk-plugin/</span>
            </div>

            {/* Sub-files */}
            <div style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button
                className="btn btn-secondary"
                style={{
                  padding: '6px 10px',
                  fontSize: '0.85rem',
                  width: '100%',
                  justifyContent: 'flex-start',
                  background: selectedFile === 'plugin.json' ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                  borderColor: selectedFile === 'plugin.json' ? 'var(--accent-blue)' : 'transparent',
                  color: selectedFile === 'plugin.json' ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}
                onClick={() => setSelectedFile('plugin.json')}
              >
                <FileJson size={14} style={{ color: 'var(--accent-blue)' }} />
                plugin.json
              </button>

              <button
                className="btn btn-secondary"
                style={{
                  padding: '6px 10px',
                  fontSize: '0.85rem',
                  width: '100%',
                  justifyContent: 'flex-start',
                  background: selectedFile === 'CLAUDE.md' ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                  borderColor: selectedFile === 'CLAUDE.md' ? 'var(--accent-blue)' : 'transparent',
                  color: selectedFile === 'CLAUDE.md' ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}
                onClick={() => setSelectedFile('CLAUDE.md')}
              >
                <FileText size={14} style={{ color: 'var(--accent-emerald)' }} />
                CLAUDE.md
              </button>

              <button
                className="btn btn-secondary"
                style={{
                  padding: '6px 10px',
                  fontSize: '0.85rem',
                  width: '100%',
                  justifyContent: 'flex-start',
                  background: selectedFile === 'Risk.md' ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                  borderColor: selectedFile === 'Risk.md' ? 'var(--accent-blue)' : 'transparent',
                  color: selectedFile === 'Risk.md' ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}
                onClick={() => setSelectedFile('Risk.md')}
              >
                <FileText size={14} style={{ color: 'var(--accent-rose)' }} />
                Risk.md
              </button>

              {/* Scripts Sub-folder */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', marginTop: '6px', fontWeight: 600 }}>
                <Folder size={16} style={{ color: 'var(--accent-purple)' }} />
                <span>scripts/</span>
              </div>

              <div style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button
                  className="btn btn-secondary"
                  style={{
                    padding: '6px 10px',
                    fontSize: '0.85rem',
                    width: '100%',
                    justifyContent: 'flex-start',
                    background: selectedFile === 'PreMarket.sh' ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                    borderColor: selectedFile === 'PreMarket.sh' ? 'var(--accent-blue)' : 'transparent',
                    color: selectedFile === 'PreMarket.sh' ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}
                  onClick={() => setSelectedFile('PreMarket.sh')}
                >
                  <FileCode size={14} style={{ color: 'var(--accent-purple)' }} />
                  PreMarket.sh
                </button>

                <button
                  className="btn btn-secondary"
                  style={{
                    padding: '6px 10px',
                    fontSize: '0.85rem',
                    width: '100%',
                    justifyContent: 'flex-start',
                    background: selectedFile === 'PostTrade.sh' ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                    borderColor: selectedFile === 'PostTrade.sh' ? 'var(--accent-blue)' : 'transparent',
                    color: selectedFile === 'PostTrade.sh' ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}
                  onClick={() => setSelectedFile('PostTrade.sh')}
                >
                  <FileCode size={14} style={{ color: 'var(--accent-purple)' }} />
                  PostTrade.sh
                </button>

                <button
                  className="btn btn-secondary"
                  style={{
                    padding: '6px 10px',
                    fontSize: '0.85rem',
                    width: '100%',
                    justifyContent: 'flex-start',
                    background: selectedFile === 'EndOfDay.sh' ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                    borderColor: selectedFile === 'EndOfDay.sh' ? 'var(--accent-blue)' : 'transparent',
                    color: selectedFile === 'EndOfDay.sh' ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}
                  onClick={() => setSelectedFile('EndOfDay.sh')}
                >
                  <FileCode size={14} style={{ color: 'var(--accent-purple)' }} />
                  EndOfDay.sh
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              className="btn btn-primary"
              style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}
              onClick={downloadEntireBundle}
            >
              <Download size={16} /> Export entire Bundle
            </button>
            
            <button
              className="btn btn-secondary"
              style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}
              onClick={() => triggerDownload(selectedFile, getFileContent())}
            >
              <Download size={16} /> Export Selected File
            </button>
          </div>
        </div>

        {/* Compiler Workspace Content Viewer */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={18} style={{ color: 'var(--accent-blue)' }} />
                Code Preview: {selectedFile}
              </h3>
            </div>
            
            {downloadSuccess && (
              <span className="fade-in" style={{ color: 'var(--accent-emerald)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={14} /> Download started successfully!
              </span>
            )}
          </div>

          <pre className="terminal-code" style={{ flexGrow: 1, minHeight: '360px', maxHeight: '420px', whiteSpace: 'pre-wrap' }}>
            {getFileContent()}
          </pre>
        </div>
      </div>
    </div>
  );
};
