import React, { useState, useMemo } from 'react';
import { Brain, TrendingUp, TrendingDown, BarChart2, Zap, Lock, Play, RefreshCw } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { formatCurrency, formatPercent } from '../../utils/formatting';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

interface Signal {
  id: string;
  name: string;
  type: 'momentum' | 'mean_reversion' | 'trend' | 'volatility' | 'fundamental';
  description: string;
  minQuantSkill: number;
  weight: number;
}

const SIGNALS: Signal[] = [
  { id: 'sma_cross', name: 'SMA Crossover', type: 'trend', description: 'Buy when 5-day crosses above 20-day moving average. Classic momentum signal.', minQuantSkill: 0, weight: 1 },
  { id: 'rsi_oversold', name: 'RSI Reversal', type: 'mean_reversion', description: 'Enter when RSI < 30 (oversold). Exit at RSI > 70.', minQuantSkill: 10, weight: 1 },
  { id: 'momentum_3m', name: '3-Month Momentum', type: 'momentum', description: 'Buy stocks with top 20% 3-month returns. Trend persistence strategy.', minQuantSkill: 20, weight: 1.2 },
  { id: 'vol_breakout', name: 'Volatility Breakout', type: 'volatility', description: 'Enter on volume spikes + price breakout. Captures large moves early.', minQuantSkill: 30, weight: 1.5 },
  { id: 'pe_value', name: 'Value Screen', type: 'fundamental', description: 'Buy low P/E stocks in sectors with strong earnings. Classic value play.', minQuantSkill: 40, weight: 1.3 },
  { id: 'earnings_drift', name: 'Post-Earnings Drift', type: 'momentum', description: 'Buy after strong earnings beats. PEAD anomaly, well-documented alpha.', minQuantSkill: 50, weight: 1.8 },
  { id: 'pairs_trading', name: 'Statistical Arbitrage', type: 'mean_reversion', description: 'Long/short correlated pairs. Exploits temporary divergence.', minQuantSkill: 60, weight: 2 },
  { id: 'macro_factor', name: 'Macro Factor Model', type: 'fundamental', description: 'Multi-factor model using GDP, rates, and sector rotation.', minQuantSkill: 75, weight: 2.5 },
];

interface BacktestResult {
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  trades: number;
  bestMonth: number;
  worstMonth: number;
}

function runBacktest(signals: string[], quantSkill: number, stocks: any): BacktestResult {
  // Simulated backtest based on skill level and signal quality
  const skillBonus = quantSkill / 100;
  const signalCount = signals.length;
  const activeSignals = SIGNALS.filter(s => signals.includes(s.id));
  const avgWeight = activeSignals.reduce((s, sig) => s + sig.weight, 0) / Math.max(1, signalCount);

  const baseReturn = 0.08 + (avgWeight - 1) * 0.12 + skillBonus * 0.10;
  const noise = (Math.random() - 0.5) * 0.04;
  const annReturn = Math.max(-0.05, baseReturn + noise);

  return {
    totalReturn: annReturn * 2, // 2 year backtest
    annualizedReturn: annReturn,
    sharpeRatio: parseFloat((0.6 + skillBonus * 1.4 + (avgWeight - 1) * 0.4 + noise).toFixed(2)),
    maxDrawdown: -Math.abs(0.08 + (1 - skillBonus) * 0.12 + noise),
    winRate: 45 + skillBonus * 30 + (avgWeight - 1) * 5,
    trades: 80 + Math.floor(Math.random() * 40) * signalCount,
    bestMonth: annReturn * 0.4 + Math.random() * 0.05,
    worstMonth: -Math.abs(annReturn * 0.3) - Math.random() * 0.03,
  };
}

export default function QuantScreen() {
  const { player, stocks } = useGameStore();
  const [selectedSignals, setSelectedSignals] = useState<string[]>(['sma_cross']);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [tab, setTab] = useState<'builder' | 'backtest' | 'live'>('builder');

  if (!player) return null;

  const quantSkill = player.skills.quantResearch;
  const hasQuantTrading = player.unlockedMechanics.includes('quant_trading');

  if (!hasQuantTrading) {
    return (
      <div className="screen-content h-full flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <Lock size={48} className="text-gray-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-400 mb-2">Quant Lab Locked</h2>
          <p className="text-sm text-gray-500 mb-4">
            Hire a Quant Engineer or reach Quant Research skill 60 to unlock systematic trading.
          </p>
          <div className={`text-xs ${quantSkill >= 60 ? 'text-accent-green' : 'text-gray-500'}`}>
            Quant Research: {Math.round(quantSkill)}/60
          </div>
        </div>
      </div>
    );
  }

  const availableSignals = SIGNALS.filter(s => quantSkill >= s.minQuantSkill);
  const lockedSignals = SIGNALS.filter(s => quantSkill < s.minQuantSkill);

  const toggleSignal = (id: string) => {
    setSelectedSignals(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
    setBacktestResult(null);
  };

  const handleRunBacktest = () => {
    if (selectedSignals.length === 0) return;
    setIsRunning(true);
    setBacktestResult(null);
    setTimeout(() => {
      setBacktestResult(runBacktest(selectedSignals, quantSkill, stocks));
      setIsRunning(false);
    }, 1200);
  };

  const SIGNAL_COLORS: Record<string, string> = {
    momentum: 'text-accent-green',
    mean_reversion: 'text-accent-blue',
    trend: 'text-accent-yellow',
    volatility: 'text-accent-red',
    fundamental: 'text-accent-purple',
  };

  return (
    <div className="screen-content h-full overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Brain size={20} className="text-accent-purple" />
        <div>
          <h1 className="text-lg font-bold text-white">Quant Lab</h1>
          <p className="text-xs text-gray-500">Build, backtest, and deploy systematic trading strategies.</p>
        </div>
        <div className="ml-auto text-right">
          <div className="text-[10px] text-gray-500">Quant Research</div>
          <div className="text-xl font-bold text-accent-purple">{Math.round(quantSkill)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5">
        {[
          { id: 'builder', label: '🔧 Signal Builder' },
          { id: 'backtest', label: '📊 Backtest' },
          { id: 'live', label: '⚡ Live Signals' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
              tab === t.id ? 'bg-accent-purple text-white' : 'bg-dark-400 text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* SIGNAL BUILDER */}
      {tab === 'builder' && (
        <div className="space-y-3">
          <div className="text-xs text-gray-500">
            Select signals for your strategy. {selectedSignals.length} selected.
          </div>
          <div className="grid grid-cols-2 gap-3">
            {availableSignals.map(signal => {
              const isSelected = selectedSignals.includes(signal.id);
              return (
                <Card
                  key={signal.id}
                  padding="md"
                  hover
                  onClick={() => toggleSignal(signal.id)}
                  glowColor={isSelected ? 'blue' : 'none'}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-bold text-white">{signal.name}</div>
                      <div className={`text-[10px] capitalize ${SIGNAL_COLORS[signal.type]}`}>{signal.type.replace(/_/g, ' ')}</div>
                    </div>
                    <div className={`w-4 h-4 rounded border-2 flex-shrink-0 transition-all ${
                      isSelected ? 'bg-accent-purple border-accent-purple' : 'border-gray-600'
                    }`}>
                      {isSelected && <div className="w-full h-full flex items-center justify-center text-white text-[8px]">✓</div>}
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed mb-2">{signal.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-gray-600">Alpha Weight: {signal.weight}x</span>
                    <Badge variant="purple" size="xs">Min Quant: {signal.minQuantSkill}</Badge>
                  </div>
                </Card>
              );
            })}

            {lockedSignals.map(signal => (
              <Card key={signal.id} padding="md" glowColor="none">
                <div className="flex items-start justify-between mb-2 opacity-40">
                  <div>
                    <div className="text-sm font-bold text-gray-500">{signal.name}</div>
                    <div className="text-[10px] text-gray-600 capitalize">{signal.type.replace(/_/g, ' ')}</div>
                  </div>
                  <Lock size={14} className="text-gray-600" />
                </div>
                <p className="text-[10px] text-gray-600 leading-relaxed mb-2 opacity-40">{signal.description}</p>
                <div className="text-[9px] text-accent-red">Requires Quant Research {signal.minQuantSkill}</div>
              </Card>
            ))}
          </div>

          <Button
            variant="primary"
            size="sm"
            disabled={selectedSignals.length === 0}
            onClick={() => setTab('backtest')}
          >
            <BarChart2 size={12} />
            Run Backtest ({selectedSignals.length} signals)
          </Button>
        </div>
      )}

      {/* BACKTEST */}
      {tab === 'backtest' && (
        <div className="space-y-4">
          <Card padding="md">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-bold text-white">2-Year Backtest</div>
                <div className="text-[10px] text-gray-500">{selectedSignals.length} signals · Quant skill: {Math.round(quantSkill)}</div>
              </div>
              <Button variant="primary" size="sm" onClick={handleRunBacktest} disabled={isRunning || selectedSignals.length === 0}>
                {isRunning ? <><RefreshCw size={12} className="animate-spin" /> Running...</> : <><Play size={12} /> Run</>}
              </Button>
            </div>

            {/* Selected signals */}
            <div className="flex flex-wrap gap-1 mb-3">
              {selectedSignals.map(id => {
                const s = SIGNALS.find(sig => sig.id === id);
                return s ? (
                  <span key={id} className={`text-[9px] px-1.5 py-0.5 rounded ${SIGNAL_COLORS[s.type]} bg-dark-500`}>{s.name}</span>
                ) : null;
              })}
              {selectedSignals.length === 0 && (
                <span className="text-[9px] text-gray-600 italic">No signals selected. Go to Signal Builder.</span>
              )}
            </div>

            {isRunning && (
              <div className="flex items-center gap-2 text-xs text-accent-purple animate-pulse">
                <RefreshCw size={12} className="animate-spin" />
                Simulating {selectedSignals.length} signal strategies...
              </div>
            )}

            {backtestResult && (
              <div className="space-y-3 mt-3 border-t border-dark-400 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Return (2Y)', value: `${(backtestResult.totalReturn * 100).toFixed(1)}%`, color: backtestResult.totalReturn >= 0 ? 'text-accent-green' : 'text-accent-red' },
                    { label: 'Annualized Return', value: `${(backtestResult.annualizedReturn * 100).toFixed(1)}%`, color: backtestResult.annualizedReturn >= 0 ? 'text-accent-green' : 'text-accent-red' },
                    { label: 'Sharpe Ratio', value: backtestResult.sharpeRatio.toFixed(2), color: backtestResult.sharpeRatio >= 1 ? 'text-accent-green' : backtestResult.sharpeRatio >= 0.5 ? 'text-accent-yellow' : 'text-accent-red' },
                    { label: 'Max Drawdown', value: `${(backtestResult.maxDrawdown * 100).toFixed(1)}%`, color: 'text-accent-red' },
                    { label: 'Win Rate', value: `${backtestResult.winRate.toFixed(1)}%`, color: backtestResult.winRate >= 55 ? 'text-accent-green' : 'text-accent-yellow' },
                    { label: 'Total Trades', value: backtestResult.trades, color: 'text-gray-200' },
                  ].map(m => (
                    <div key={m.label} className="bg-dark-600 rounded-lg p-2">
                      <div className="text-[9px] text-gray-500 mb-0.5">{m.label}</div>
                      <div className={`text-sm font-bold num ${m.color}`}>{m.value}</div>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-lg bg-dark-600">
                  <div className="text-[9px] text-gray-500 mb-1">Monthly Returns</div>
                  <div className="flex items-end gap-0.5 h-12">
                    {Array.from({ length: 24 }, (_, i) => {
                      const base = backtestResult.annualizedReturn / 12;
                      const r = base + (Math.random() - 0.45) * 0.04;
                      const pct = Math.max(-1, Math.min(1, r / 0.08));
                      return (
                        <div
                          key={i}
                          className={`flex-1 rounded-sm ${r >= 0 ? 'bg-accent-green' : 'bg-accent-red'}`}
                          style={{ height: `${Math.abs(pct) * 100}%`, minHeight: '2px' }}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className={`p-3 rounded-lg border ${
                  backtestResult.sharpeRatio >= 1 ? 'bg-accent-green/5 border-accent-green/20' : 'bg-accent-yellow/5 border-accent-yellow/20'
                }`}>
                  <div className="text-[10px] font-semibold text-white mb-1">Strategy Assessment</div>
                  <div className="text-[10px] text-gray-400">
                    {backtestResult.sharpeRatio >= 1.5 ? '✅ Exceptional strategy. Institutional-grade alpha.' :
                     backtestResult.sharpeRatio >= 1.0 ? '✅ Strong Sharpe. Worth deploying live.' :
                     backtestResult.sharpeRatio >= 0.5 ? '⚠️ Acceptable but room for improvement.' :
                     '❌ Poor risk-adjusted returns. Refine your signals.'}
                  </div>
                </div>

                <Button variant="success" size="sm" fullWidth onClick={() => setTab('live')}>
                  <Zap size={12} /> Deploy Strategy Live
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* LIVE SIGNALS */}
      {tab === 'live' && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Active Signals', value: selectedSignals.length, color: 'text-accent-purple' },
              { label: 'Quant Edge', value: `+${(quantSkill * 0.002 * 100).toFixed(2)}%/mo`, color: 'text-accent-green' },
              { label: 'Model Confidence', value: `${Math.min(95, 40 + quantSkill * 0.5).toFixed(0)}%`, color: 'text-accent-blue' },
            ].map(stat => (
              <Card key={stat.label} padding="md">
                <div className="text-[10px] text-gray-500 mb-1">{stat.label}</div>
                <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
              </Card>
            ))}
          </div>

          <Card padding="md">
            <div className="text-sm font-bold text-white mb-3">Live Signal Feed</div>
            <div className="space-y-2">
              {Object.values(stocks).slice(0, 8).map(stock => {
                const signal = selectedSignals.length > 0 ? (
                  stock.momentum > 60 && stock.sentiment > 60 ? 'BUY' :
                  stock.momentum < 30 && stock.sentiment < 40 ? 'SELL' : 'HOLD'
                ) : 'NO SIGNAL';
                const confidence = Math.floor(40 + Math.random() * 50);
                return (
                  <div key={stock.ticker} className="flex items-center gap-3 py-1.5 border-b border-dark-500 last:border-0">
                    <div className="w-12 font-bold text-xs text-white">{stock.ticker}</div>
                    <div className="flex-1 text-[10px] text-gray-500">${stock.currentPrice.toFixed(2)}</div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-gray-600">{confidence}% conf</span>
                      <Badge
                        variant={signal === 'BUY' ? 'green' : signal === 'SELL' ? 'red' : 'gray'}
                        size="xs"
                      >
                        {signal}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card padding="md" glowColor="blue">
            <div className="text-[10px] text-accent-purple uppercase mb-1">Quant Edge Bonus</div>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Your active signals provide a passive monthly alpha bonus to your hedge fund returns.
              Currently: <span className="text-accent-green font-bold">+{(quantSkill * 0.002 * 100).toFixed(2)}%/month</span>
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
