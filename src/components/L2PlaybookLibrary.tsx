import React, { useState } from 'react';
import { BookOpen, Award, CheckSquare, AlertTriangle, Scale, ArrowUpRight } from 'lucide-react';
import type { TdkState, Playbook } from '../types';

interface L2PlaybookLibraryProps {
  state: TdkState;
  onChange: (updates: Partial<TdkState>) => void;
}

export const L2PlaybookLibrary: React.FC<L2PlaybookLibraryProps> = ({ state, onChange }) => {
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string>(state.playbooks[0]?.id || '');
  const [showAddPlaybook, setShowAddPlaybook] = useState(false);
  const [newPbName, setNewPbName] = useState('');
  const [newPbDesc, setNewPbDesc] = useState('');
  const [newPbTimeframe, setNewPbTimeframe] = useState('15m');
  const [newPbRr, setNewPbRr] = useState(2);
  const [newPbConditions, setNewPbConditions] = useState('');

  const selectedPlaybook = state.playbooks.find(p => p.id === selectedPlaybookId) || state.playbooks[0];

  // Scorecard item toggling
  const handleToggleScorecard = (id: string) => {
    onChange({
      scorecard: state.scorecard.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    });
  };

  // Add custom playbook
  const handleAddPlaybook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPbName.trim()) return;

    const newPlaybook: Playbook = {
      id: Math.random().toString(36).substr(2, 9),
      name: newPbName.trim(),
      description: newPbDesc.trim(),
      timeframe: newPbTimeframe,
      setupConditions: newPbConditions.split('\n').filter(c => c.trim() !== ''),
      riskRewardRatio: newPbRr
    };

    const updatedPlaybooks = [...state.playbooks, newPlaybook];
    onChange({ playbooks: updatedPlaybooks });
    setSelectedPlaybookId(newPlaybook.id);
    
    // Reset Form
    setNewPbName('');
    setNewPbDesc('');
    setNewPbTimeframe('15m');
    setNewPbRr(2);
    setNewPbConditions('');
    setShowAddPlaybook(false);
  };

  // Calculations for Scorecard Grade
  const totalWeight = state.scorecard.reduce((sum, item) => sum + item.weight, 0);
  const checkedWeight = state.scorecard.filter(item => item.checked).reduce((sum, item) => sum + item.weight, 0);
  const rawScore = totalWeight > 0 ? (checkedWeight / totalWeight) * 10 : 0;
  const score = Math.round(rawScore * 10) / 10; // round to 1 decimal

  // Get score attributes
  const getScoreVerdict = () => {
    if (score >= 8) {
      return {
        label: 'A-GRADE SETUP (Strong Edge)',
        color: 'var(--accent-emerald)',
        bg: 'rgba(16, 185, 129, 0.1)',
        message: 'Setup meets premium criteria. Standard risk size permitted.'
      };
    } else if (score >= 5.5) {
      return {
        label: 'B-GRADE SETUP (Average Edge)',
        color: 'var(--accent-amber)',
        bg: 'rgba(245, 158, 11, 0.1)',
        message: 'Missing standard confirmations. Reduce position size by 50%.'
      };
    } else {
      return {
        label: 'C-GRADE / NO TRADE (Weak/No Edge)',
        color: 'var(--accent-rose)',
        bg: 'rgba(239, 68, 68, 0.1)',
        message: 'Strict rules violated or insufficient criteria. EXECUTION DENIED.'
      };
    }
  };

  const verdict = getScoreVerdict();

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen className="text-blue" style={{ color: 'var(--accent-blue)' }} />
            L2 Playbook Scorecard
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Document strategic setup patterns and audit active trades before clicking buy/sell.
          </p>
        </div>
        <div className="status-indicator" style={{ background: verdict.bg, color: verdict.color, border: `1px solid ${verdict.color}33` }}>
          <Award size={14} /> Score: {score} / 10
        </div>
      </div>

      <div className="grid-2">
        {/* Playbook Library Card */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Playbook Directory</h3>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
              onClick={() => setShowAddPlaybook(!showAddPlaybook)}
            >
              {showAddPlaybook ? 'View List' : 'Add Playbook'}
            </button>
          </div>

          {!showAddPlaybook ? (
            <div style={{ display: 'flex', gap: '16px', flexGrow: 1, minHeight: '320px' }}>
              {/* Sidebar selectors */}
              <div style={{ width: '150px', display: 'flex', flexDirection: 'column', gap: '8px', borderRight: '1px solid var(--border-color)', paddingRight: '12px', flexShrink: 0 }}>
                {state.playbooks.map(pb => (
                  <button
                    key={pb.id}
                    className={`btn ${selectedPlaybook?.id === pb.id ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ 
                      padding: '8px 12px', 
                      fontSize: '0.85rem', 
                      justifyContent: 'flex-start',
                      width: '100%',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden'
                    }}
                    onClick={() => setSelectedPlaybookId(pb.id)}
                  >
                    {pb.name}
                  </button>
                ))}
              </div>

              {/* View details */}
              {selectedPlaybook && (
                <div style={{ flexGrow: 1, overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{selectedPlaybook.name}</h4>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                      Timeframe: {selectedPlaybook.timeframe}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '8px', marginBottom: '16px' }}>
                    {selectedPlaybook.description}
                  </p>
                  
                  <h5 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Setup Criteria</h5>
                  <ul style={{ listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                    {selectedPlaybook.setupConditions.map((cond, idx) => (
                      <li key={idx} style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <ArrowUpRight size={14} style={{ color: 'var(--accent-emerald)', flexShrink: 0, marginTop: '3px' }} />
                        <span>{cond}</span>
                      </li>
                    ))}
                  </ul>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: '8px' }}>
                    <Scale size={16} style={{ color: 'var(--accent-blue)' }} />
                    <span style={{ fontSize: '0.85rem' }}>
                      Recommended Risk-to-Reward Ratio: <strong>1:{selectedPlaybook.riskRewardRatio}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Add Playbook Form */
            <form onSubmit={handleAddPlaybook} style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Setup Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Bullish Pennant"
                    className="form-control"
                    value={newPbName}
                    onChange={(e) => setNewPbName(e.target.value)}
                  />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Timeframe</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 5m / 15m"
                      className="form-control"
                      value={newPbTimeframe}
                      onChange={(e) => setNewPbTimeframe(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Target R:R</label>
                    <input 
                      type="number" 
                      step="0.5"
                      className="form-control"
                      value={newPbRr}
                      onChange={(e) => setNewPbRr(parseFloat(e.target.value) || 2)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <input 
                  type="text" 
                  placeholder="Summary of market condition/context..."
                  className="form-control"
                  value={newPbDesc}
                  onChange={(e) => setNewPbDesc(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Setup Conditions (One per line)</label>
                <textarea 
                  className="form-control"
                  placeholder="Enter checklists for setup verification..."
                  value={newPbConditions}
                  onChange={(e) => setNewPbConditions(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: 'auto' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddPlaybook(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-accent">
                  Create Setup Template
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Setup Scorecard Card */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckSquare size={18} style={{ color: 'var(--accent-emerald)' }} />
            Execution Scorecard Checklist
          </h3>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Run through the audit list before entering a live trade. Your final grade dictates size.
          </p>

          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '240px', paddingRight: '4px', marginBottom: '16px' }}>
            {state.scorecard.map(item => (
              <label
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: item.checked ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                  border: '1px solid',
                  borderColor: item.checked ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => handleToggleScorecard(item.id)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--accent-blue)' }}
                />
                <span style={{ fontSize: '0.9rem', color: item.checked ? 'var(--text-primary)' : 'var(--text-secondary)', flexGrow: 1 }}>
                  {item.label}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                  Weight: {item.weight}
                </span>
              </label>
            ))}
          </div>

          {/* Verdict Box */}
          <div style={{ background: verdict.bg, padding: '16px', borderRadius: '8px', border: `1px solid ${verdict.color}22` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: verdict.color, fontWeight: 700, fontSize: '0.9rem' }}>
              <AlertTriangle size={16} />
              {verdict.label}
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '4px' }}>
              {verdict.message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
