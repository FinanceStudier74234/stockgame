import React, { useState } from 'react';
import { Building, Lock, TrendingUp, Users, DollarSign } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { formatCurrency, formatPercent } from '../../utils/formatting';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const STRATEGIES = [
  { id: 'long_only', name: 'Long Only', desc: 'Simple equity strategy. Best for beginners. Lower fees but simpler to manage.' },
  { id: 'long_short', name: 'Long/Short Equity', desc: 'Buy winners, short losers. Better risk-adjusted returns.' },
  { id: 'global_macro', name: 'Global Macro', desc: 'Trade macro themes across currencies, rates, and equities.' },
  { id: 'quant', name: 'Quantitative', desc: 'Systematic, model-driven trading. Requires coding skills.' },
  { id: 'event_driven', name: 'Event Driven', desc: 'Trade catalysts — earnings, M&A, restructuring.' },
  { id: 'multi_strategy', name: 'Multi-Strategy', desc: 'Diversified approach. High complexity, high potential.' },
];

export default function FundScreen() {
  const { player, hedgeFund, launchHedgeFund, addNotification } = useGameStore();
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [fundName, setFundName] = useState('');
  const [strategy, setStrategy] = useState('long_only');
  const [capital, setCapital] = useState('50000');

  if (!player) return null;

  const hasFund = player.unlockedMechanics.includes('hedge_fund_registered');
  const canLaunch = player.stats.reputation >= 30 && player.finances.totalNetWorth >= 50000;

  if (!hasFund && !canLaunch) {
    return (
      <div className="screen-content h-full flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <Lock size={48} className="text-gray-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-400 mb-2">Hedge Fund Locked</h2>
          <p className="text-sm text-gray-500 mb-4">You need to build your reputation and wealth before launching a fund.</p>
          <div className="space-y-2">
            <div className={`text-xs ${player.stats.reputation >= 30 ? 'text-accent-green' : 'text-accent-red'}`}>
              {player.stats.reputation >= 30 ? '✓' : '✗'} Reputation ≥ 30 (current: {Math.round(player.stats.reputation)})
            </div>
            <div className={`text-xs ${player.finances.totalNetWorth >= 50000 ? 'text-accent-green' : 'text-accent-red'}`}>
              {player.finances.totalNetWorth >= 50000 ? '✓' : '✗'} Net Worth ≥ $50,000 (current: {formatCurrency(player.finances.totalNetWorth, true)})
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleLaunch = () => {
    const cap = parseInt(capital);
    if (isNaN(cap) || cap < 10000) {
      addNotification({ type: 'error', title: 'Invalid Amount', message: 'Minimum initial capital is $10,000.' });
      return;
    }
    if (!fundName.trim()) {
      addNotification({ type: 'error', title: 'Missing Name', message: 'Give your fund a name.' });
      return;
    }
    launchHedgeFund(fundName.trim(), strategy, cap);
    setShowLaunchModal(false);
  };

  return (
    <div className="screen-content h-full overflow-y-auto p-4 space-y-4">
      {!hedgeFund ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-6xl mb-4">🏛️</div>
          <h1 className="text-2xl font-bold text-white mb-2">Launch Your Hedge Fund</h1>
          <p className="text-sm text-gray-400 max-w-md mb-6">
            You've built your skills and capital. It's time to launch your fund, attract investors, and manage serious money.
          </p>
          <Button variant="gold" size="lg" onClick={() => setShowLaunchModal(true)}>
            Launch Fund →
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Card padding="md" glowColor="gold">
            <div className="flex items-center gap-4">
              <div className="text-4xl">🏛️</div>
              <div>
                <h1 className="text-xl font-bold text-gold">{hedgeFund.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="purple" size="xs">{hedgeFund.strategy.replace('_', ' ')}</Badge>
                  <Badge variant="green" size="xs">Active</Badge>
                </div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-[10px] text-gray-500">AUM</div>
                <div className="text-2xl font-bold text-white num">{formatCurrency(hedgeFund.aum, true)}</div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'NAV per Share', value: `$${hedgeFund.nav.toFixed(2)}`, color: 'text-white' },
              { label: 'Mgmt Fee', value: `${(hedgeFund.managementFee * 100).toFixed(1)}%`, color: 'text-accent-yellow' },
              { label: 'Perf Fee', value: `${(hedgeFund.performanceFee * 100).toFixed(0)}%`, color: 'text-accent-green' },
              { label: 'LPs', value: hedgeFund.limitedPartners.length, color: 'text-accent-blue' },
            ].map(item => (
              <Card key={item.label} padding="md">
                <div className="text-[10px] text-gray-500 uppercase mb-1">{item.label}</div>
                <div className={`text-xl font-bold ${item.color} num`}>{item.value}</div>
              </Card>
            ))}
          </div>

          <Card padding="md">
            <div className="text-center py-6 text-gray-500">
              <TrendingUp size={32} className="mx-auto mb-2 text-gray-600" />
              <div className="text-sm">Full fund management system coming in next phase</div>
              <div className="text-xs mt-1">LP management, performance tracking, fee calculation, investor reporting</div>
            </div>
          </Card>
        </div>
      )}

      <Modal isOpen={showLaunchModal} onClose={() => setShowLaunchModal(false)} title="Launch Your Hedge Fund" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Fund Name</label>
            <input
              type="text"
              placeholder="e.g., Apex Capital Management"
              value={fundName}
              onChange={e => setFundName(e.target.value)}
              className="w-full bg-dark-600 border border-dark-400 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Strategy</label>
            <div className="space-y-2">
              {STRATEGIES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setStrategy(s.id)}
                  className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                    strategy === s.id ? 'border-accent-blue bg-accent-blue/10 text-white' : 'border-dark-400 text-gray-400 hover:border-dark-300'
                  }`}
                >
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Initial Capital (from your cash)</label>
            <input
              type="number"
              min="10000"
              max={player.finances.cash}
              value={capital}
              onChange={e => setCapital(e.target.value)}
              className="w-full bg-dark-600 border border-dark-400 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue num"
            />
            <div className="text-[10px] text-gray-500 mt-1">Available: {formatCurrency(player.finances.cash)}</div>
          </div>
          <Button variant="gold" fullWidth onClick={handleLaunch}>
            🏛️ Launch Fund
          </Button>
        </div>
      </Modal>
    </div>
  );
}
