import React, { useState } from 'react';
import { Building, Lock, TrendingUp, TrendingDown, Users, DollarSign, Award, AlertTriangle } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { formatCurrency, formatPercent } from '../../utils/formatting';
import { LimitedPartner } from '../../types';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import MiniChart from '../ui/MiniChart';

const STRATEGIES = [
  { id: 'long_only', name: 'Long Only', desc: 'Simple equity strategy. Best for beginners. Lower fees but simpler to manage.' },
  { id: 'long_short', name: 'Long/Short Equity', desc: 'Buy winners, short losers. Better risk-adjusted returns.' },
  { id: 'global_macro', name: 'Global Macro', desc: 'Trade macro themes across currencies, rates, and equities.' },
  { id: 'quant', name: 'Quantitative', desc: 'Systematic, model-driven. Requires quant skills.' },
  { id: 'event_driven', name: 'Event Driven', desc: 'Trade catalysts — earnings, M&A, restructuring.' },
  { id: 'multi_strategy', name: 'Multi-Strategy', desc: 'Diversified approach. High complexity, high potential.' },
];

const LP_TYPES: { id: LimitedPartner['type']; label: string; minInvest: number; desc: string }[] = [
  { id: 'individual', label: 'Individual Investor', minInvest: 25000, desc: 'High-net-worth individual. Lower minimums, more flexibility.' },
  { id: 'family_office', label: 'Family Office', minInvest: 100000, desc: 'Manages wealth for wealthy family. Longer lockup, larger check.' },
  { id: 'institution', label: 'Institution', minInvest: 500000, desc: 'Pension, endowment, or sovereign fund. Large AUM, strict requirements.' },
  { id: 'pension', label: 'Pension Fund', minInvest: 1000000, desc: 'Conservative, needs consistent performance.' },
  { id: 'endowment', label: 'Endowment', minInvest: 250000, desc: 'University/nonprofit. Long-term oriented, cares about Sharpe.' },
];

type FundTab = 'overview' | 'lps' | 'performance' | 'settings';

export default function FundScreen() {
  const { player, hedgeFund, employees, launchHedgeFund, addLimitedPartner, redeemLP, updateFundStrategy, addNotification } = useGameStore();
  const [tab, setTab] = useState<FundTab>('overview');
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [showAddLPModal, setShowAddLPModal] = useState(false);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [fundName, setFundName] = useState('');
  const [strategy, setStrategy] = useState('long_only');
  const [capital, setCapital] = useState('50000');

  // LP form
  const [lpName, setLpName] = useState('');
  const [lpType, setLpType] = useState<LimitedPartner['type']>('individual');
  const [lpAmount, setLpAmount] = useState('50000');

  if (!player) return null;

  const canLaunch = player.stats.reputation >= 30 && player.finances.totalNetWorth >= 50000;

  if (!hedgeFund && !canLaunch) {
    return (
      <div className="screen-content h-full flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <Lock size={48} className="text-gray-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-400 mb-2">Hedge Fund Locked</h2>
          <p className="text-sm text-gray-500 mb-4">Build your reputation and wealth to launch a fund.</p>
          <div className="space-y-2">
            <div className={`text-xs ${player.stats.reputation >= 30 ? 'text-accent-green' : 'text-accent-red'}`}>
              {player.stats.reputation >= 30 ? '✓' : '✗'} Reputation ≥ 30 (current: {Math.round(player.stats.reputation)})
            </div>
            <div className={`text-xs ${player.finances.totalNetWorth >= 50000 ? 'text-accent-green' : 'text-accent-red'}`}>
              {player.finances.totalNetWorth >= 50000 ? '✓' : '✗'} Net Worth ≥ $50K (current: {formatCurrency(player.finances.totalNetWorth, true)})
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

  const handleAddLP = () => {
    const amt = parseInt(lpAmount);
    const minInvest = LP_TYPES.find(t => t.id === lpType)?.minInvest || 25000;
    if (isNaN(amt) || amt < minInvest) {
      addNotification({ type: 'error', title: 'Invalid Amount', message: `Minimum for ${lpType} is $${minInvest.toLocaleString()}.` });
      return;
    }
    if (!lpName.trim()) {
      addNotification({ type: 'error', title: 'Missing Name', message: 'Enter the investor name.' });
      return;
    }
    addLimitedPartner(lpName.trim(), lpType, amt);
    setShowAddLPModal(false);
    setLpName('');
    setLpAmount('50000');
  };

  if (!hedgeFund) {
    return (
      <div className="screen-content h-full overflow-y-auto p-4">
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
              <div className="space-y-2 max-h-64 overflow-y-auto">
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
              <label className="block text-xs text-gray-400 mb-1.5">Initial Capital</label>
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

  // Fund exists — show management UI
  const navReturn = ((hedgeFund.nav - hedgeFund.inceptionNAV) / hedgeFund.inceptionNAV) * 100;
  const recentReturn = hedgeFund.monthlyReturns.slice(-1)[0] || 0;
  const satisfiedLPs = hedgeFund.limitedPartners.filter(lp => lp.satisfactionLevel >= 60).length;
  const atRiskLPs = hedgeFund.limitedPartners.filter(lp => lp.isRedemptionPending).length;
  const teamEmployees = Object.values(employees);

  return (
    <div className="screen-content h-full overflow-y-auto p-4 space-y-4">
      {/* Fund header */}
      <Card padding="md" glowColor="gold">
        <div className="flex items-center gap-4">
          <div className="text-4xl">🏛️</div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gold">{hedgeFund.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="purple" size="xs">{hedgeFund.strategy.replace(/_/g, ' ')}</Badge>
              <Badge variant="green" size="xs">Active</Badge>
              {atRiskLPs > 0 && <Badge variant="red" size="xs">{atRiskLPs} LP at risk</Badge>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-gray-500 uppercase">AUM</div>
            <div className="text-2xl font-bold text-white num">{formatCurrency(hedgeFund.aum, true)}</div>
            <div className={`text-xs font-semibold num ${recentReturn >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
              {recentReturn >= 0 ? '+' : ''}{(recentReturn * 100).toFixed(2)}% last month
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1.5">
        {([
          { id: 'overview', label: 'Overview' },
          { id: 'lps', label: `LPs (${hedgeFund.limitedPartners.length})` },
          { id: 'performance', label: 'Performance' },
          { id: 'settings', label: 'Settings' },
        ] as { id: FundTab; label: string }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
              tab === t.id ? 'bg-accent-blue text-white' : 'bg-dark-400 text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'NAV/Share', value: `$${hedgeFund.nav.toFixed(2)}`, sub: `vs $${hedgeFund.inceptionNAV} inception`, color: 'text-white' },
              { label: 'Total Return', value: `${navReturn >= 0 ? '+' : ''}${navReturn.toFixed(2)}%`, sub: 'since inception', color: navReturn >= 0 ? 'text-accent-green' : 'text-accent-red' },
              { label: 'Mgmt Fees Earned', value: formatCurrency(hedgeFund.totalManagementFeesEarned, true), sub: '2% annual', color: 'text-accent-yellow' },
              { label: 'Perf Fees Earned', value: formatCurrency(hedgeFund.totalPerformanceFeesEarned, true), sub: '20% of profits', color: 'text-gold' },
            ].map(item => (
              <Card key={item.label} padding="md">
                <div className="text-[10px] text-gray-500 uppercase mb-1">{item.label}</div>
                <div className={`text-lg font-bold num ${item.color}`}>{item.value}</div>
                <div className="text-[10px] text-gray-600 mt-1">{item.sub}</div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Card padding="md">
              <div className="text-xs font-semibold text-gray-300 mb-2">Capital Breakdown</div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Your Capital</span>
                  <span className="text-accent-blue num">{formatCurrency(hedgeFund.playerCapital, true)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">LP Capital</span>
                  <span className="text-accent-green num">{formatCurrency(hedgeFund.totalLPCapital, true)}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-dark-400 pt-2">
                  <span className="text-white font-semibold">Total AUM</span>
                  <span className="text-white num font-bold">{formatCurrency(hedgeFund.aum, true)}</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="text-[9px] text-gray-600 mb-1">LP Leverage Ratio</div>
                <div className="w-full h-2 bg-dark-400 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-green rounded-full"
                    style={{ width: `${(hedgeFund.totalLPCapital / Math.max(1, hedgeFund.aum)) * 100}%` }}
                  />
                </div>
                <div className="text-[9px] text-gray-500 mt-1">
                  {((hedgeFund.totalLPCapital / Math.max(1, hedgeFund.aum)) * 100).toFixed(0)}% LP capital
                </div>
              </div>
            </Card>

            <Card padding="md">
              <div className="text-xs font-semibold text-gray-300 mb-2">Fund Health</div>
              <div className="space-y-2">
                {[
                  { label: 'Reputation', value: hedgeFund.reputation, color: 'bg-accent-blue' },
                  { label: 'LP Satisfaction', value: hedgeFund.limitedPartners.length > 0 ? Math.round(hedgeFund.limitedPartners.reduce((s, lp) => s + lp.satisfactionLevel, 0) / hedgeFund.limitedPartners.length) : 0, color: 'bg-accent-green' },
                  { label: 'Regulatory Risk', value: hedgeFund.regulatoryPressure, color: 'bg-accent-red', invert: true },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className="text-gray-400">{item.label}</span>
                      <span className="text-gray-200">{item.value}</span>
                    </div>
                    <div className="w-full h-1.5 bg-dark-400 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all`}
                        style={{ width: `${item.invert ? 100 - item.value : item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card padding="md">
              <div className="text-xs font-semibold text-gray-300 mb-2">Fee Structure</div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Management Fee</span>
                  <span className="text-accent-yellow">{(hedgeFund.managementFee * 100).toFixed(1)}% annual</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Performance Fee</span>
                  <span className="text-accent-green">{(hedgeFund.performanceFee * 100).toFixed(0)}% of profits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Hurdle Rate</span>
                  <span className="text-gray-300">{(hedgeFund.hurdleRate * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">High Water Mark</span>
                  <span className="text-gray-300 num">${hedgeFund.highWaterMark.toFixed(2)}</span>
                </div>
                <div className="border-t border-dark-400 pt-2 flex justify-between">
                  <span className="text-gray-400">Monthly mgmt income</span>
                  <span className="text-accent-yellow num">~{formatCurrency(hedgeFund.aum * hedgeFund.managementFee / 12, true)}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Team */}
          {teamEmployees.length > 0 && (
            <Card padding="md">
              <div className="text-xs font-semibold text-gray-300 mb-2">Fund Team</div>
              <div className="flex flex-wrap gap-2">
                {teamEmployees.map(emp => (
                  <div key={emp.id} className="px-2 py-1 bg-dark-600 rounded-lg text-[10px]">
                    <span className="text-white">{emp.name}</span>
                    <span className="text-gray-500 ml-1">· {emp.role.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* LPs TAB */}
      {tab === 'lps' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {hedgeFund.limitedPartners.length} LP investors | {satisfiedLPs} satisfied | {atRiskLPs} at risk of redemption
            </div>
            <Button variant="gold" size="sm" onClick={() => setShowAddLPModal(true)}>
              + Add LP Investor
            </Button>
          </div>

          {hedgeFund.limitedPartners.length === 0 ? (
            <Card padding="md">
              <div className="text-center py-8">
                <Users size={40} className="text-gray-600 mx-auto mb-3" />
                <div className="text-sm font-semibold text-gray-400 mb-1">No LP Investors Yet</div>
                <p className="text-xs text-gray-500 mb-4">Add limited partners to grow your AUM and earn management fees on their capital.</p>
                <Button variant="primary" size="sm" onClick={() => setShowAddLPModal(true)}>Add First LP →</Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {hedgeFund.limitedPartners.map(lp => (
                <Card key={lp.id} padding="md" glowColor={lp.isRedemptionPending ? 'red' : 'none'}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{lp.name}</span>
                        <Badge variant={
                          lp.type === 'institution' ? 'purple' :
                          lp.type === 'pension' ? 'blue' :
                          lp.type === 'family_office' ? 'gold' :
                          lp.type === 'endowment' ? 'cyan' : 'gray'
                        } size="xs">
                          {lp.type.replace(/_/g, ' ')}
                        </Badge>
                        {lp.isRedemptionPending && (
                          <Badge variant="red" size="xs">WANTS OUT</Badge>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        Invested: {formatCurrency(lp.investedAmount, true)} | Lockup: {lp.lockupPeriod}mo
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-bold ${lp.satisfactionLevel >= 60 ? 'text-accent-green' : lp.satisfactionLevel >= 30 ? 'text-accent-yellow' : 'text-accent-red'}`}>
                        {lp.satisfactionLevel}% satisfied
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 w-full h-1 bg-dark-400 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${lp.satisfactionLevel >= 60 ? 'bg-accent-green' : lp.satisfactionLevel >= 30 ? 'bg-accent-yellow' : 'bg-accent-red'}`}
                      style={{ width: `${lp.satisfactionLevel}%` }}
                    />
                  </div>

                  {lp.isRedemptionPending && (
                    <div className="mt-2 flex items-center gap-2">
                      <AlertTriangle size={12} className="text-accent-red" />
                      <span className="text-[10px] text-accent-red">Requesting redemption. Satisfy or process withdrawal.</span>
                      <Button variant="danger" size="sm" onClick={() => redeemLP(lp.id)}>
                        Process Redemption
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PERFORMANCE TAB */}
      {tab === 'performance' && (
        <div className="space-y-4">
          {hedgeFund.monthlyReturns.length > 0 && (
            <Card padding="md">
              <div className="text-xs font-semibold text-gray-300 mb-3">Monthly Returns History</div>
              <div className="flex gap-1 flex-wrap">
                {hedgeFund.monthlyReturns.map((r, i) => (
                  <div
                    key={i}
                    className={`px-2 py-1 rounded text-[10px] font-mono ${r >= 0 ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-red/20 text-accent-red'}`}
                  >
                    {r >= 0 ? '+' : ''}{(r * 100).toFixed(2)}%
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <MiniChart
                  data={hedgeFund.monthlyReturns.map((_, i) => hedgeFund.inceptionNAV * hedgeFund.monthlyReturns.slice(0, i + 1).reduce((nav, r) => nav * (1 + r), 1))}
                  height={60}
                  width={400}
                />
              </div>
            </Card>
          )}

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Best Month', value: `+${(Math.max(...hedgeFund.monthlyReturns, 0) * 100).toFixed(2)}%`, color: 'text-accent-green' },
              { label: 'Worst Month', value: `${(Math.min(...hedgeFund.monthlyReturns, 0) * 100).toFixed(2)}%`, color: 'text-accent-red' },
              { label: 'Max Drawdown', value: `${(hedgeFund.maxDrawdown * 100).toFixed(2)}%`, color: 'text-accent-red' },
              { label: 'Win Rate', value: `${hedgeFund.monthlyReturns.length > 0 ? ((hedgeFund.monthlyReturns.filter(r => r > 0).length / hedgeFund.monthlyReturns.length) * 100).toFixed(0) : 0}%`, color: 'text-accent-blue' },
              { label: 'Avg Monthly Return', value: `${hedgeFund.monthlyReturns.length > 0 ? ((hedgeFund.monthlyReturns.reduce((s, r) => s + r, 0) / hedgeFund.monthlyReturns.length) * 100).toFixed(2) : 0}%`, color: 'text-gray-200' },
              { label: 'Total Fees Earned', value: formatCurrency(hedgeFund.totalManagementFeesEarned + hedgeFund.totalPerformanceFeesEarned, true), color: 'text-gold' },
            ].map(item => (
              <Card key={item.label} padding="md">
                <div className="text-[10px] text-gray-500 mb-1">{item.label}</div>
                <div className={`text-lg font-bold num ${item.color}`}>{item.value}</div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {tab === 'settings' && (
        <div className="space-y-4">
          <Card padding="md">
            <div className="text-xs font-semibold text-gray-300 mb-3">Current Strategy</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white capitalize">{hedgeFund.strategy.replace(/_/g, ' ')}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  {STRATEGIES.find(s => s.id === hedgeFund.strategy)?.desc}
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setShowStrategyModal(true)}>
                Change Strategy
              </Button>
            </div>
          </Card>

          <Card padding="md">
            <div className="text-xs font-semibold text-gray-300 mb-3">Fund Info</div>
            <div className="space-y-2 text-xs">
              {[
                { label: 'Fund Name', value: hedgeFund.name },
                { label: 'Registration Date', value: `Day ${hedgeFund.registrationDate}` },
                { label: 'Fund ID', value: hedgeFund.id },
              ].map(item => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-gray-400">{item.label}</span>
                  <span className="text-gray-300">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Add LP Modal */}
      <Modal isOpen={showAddLPModal} onClose={() => setShowAddLPModal(false)} title="Add LP Investor" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Investor Name</label>
            <input
              type="text"
              placeholder="e.g., Summit Capital Partners"
              value={lpName}
              onChange={e => setLpName(e.target.value)}
              className="w-full bg-dark-600 border border-dark-400 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Investor Type</label>
            <div className="space-y-1.5">
              {LP_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setLpType(t.id)}
                  className={`w-full text-left p-2.5 rounded-lg border text-sm transition-all ${
                    lpType === t.id ? 'border-accent-blue bg-accent-blue/10 text-white' : 'border-dark-400 text-gray-400 hover:border-dark-300'
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{t.label}</span>
                    <span className="text-[10px] text-gray-500">Min: {formatCurrency(t.minInvest, true)}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Investment Amount</label>
            <input
              type="number"
              value={lpAmount}
              onChange={e => setLpAmount(e.target.value)}
              className="w-full bg-dark-600 border border-dark-400 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue num"
            />
          </div>
          <Button variant="gold" fullWidth onClick={handleAddLP}>
            Add LP Investor
          </Button>
        </div>
      </Modal>

      {/* Strategy change modal */}
      <Modal isOpen={showStrategyModal} onClose={() => setShowStrategyModal(false)} title="Change Fund Strategy" size="md">
        <div className="space-y-3">
          {STRATEGIES.map(s => (
            <button
              key={s.id}
              onClick={() => { updateFundStrategy(s.id); setShowStrategyModal(false); }}
              className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                hedgeFund.strategy === s.id
                  ? 'border-gold bg-gold/10 text-white'
                  : 'border-dark-400 text-gray-400 hover:border-dark-300 hover:text-white'
              }`}
            >
              <div className="font-semibold">{s.name}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">{s.desc}</div>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
