import React, { useState } from 'react';
import { Home, CreditCard, TrendingDown, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { formatCurrency } from '../../utils/formatting';
import { HousingLevel } from '../../types';
import { getHousingCost } from '../../engine/playerEngine';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const HOUSING_LEVELS: { level: HousingLevel; name: string; icon: string; description: string; netWorthReq: number }[] = [
  { level: 'homeless', name: 'Homeless', icon: '🏚️', description: 'No fixed address. No monthly cost. Stress penalty.', netWorthReq: 0 },
  { level: 'shelter', name: 'Emergency Shelter', icon: '🏠', description: 'Temporary housing. Very basic.', netWorthReq: 0 },
  { level: 'cheap_room', name: 'Cheap Room', icon: '🛏️', description: 'Rented room in a shared house. Cramped but stable.', netWorthReq: 0 },
  { level: 'studio', name: 'Studio Apartment', icon: '🏢', description: 'Small but private. A starting point.', netWorthReq: 5000 },
  { level: 'apartment', name: '1BR Apartment', icon: '🏙️', description: 'Comfortable city apartment.', netWorthReq: 20000 },
  { level: 'nice_apartment', name: 'Nice Apartment', icon: '🌆', description: 'Modern, well-located. Good for networking.', netWorthReq: 75000 },
  { level: 'condo', name: 'Condo', icon: '🏗️', description: 'Owned property. Building equity.', netWorthReq: 200000 },
  { level: 'house', name: 'House', icon: '🏡', description: 'Suburban home. Family-friendly.', netWorthReq: 500000 },
  { level: 'luxury_condo', name: 'Luxury Condo', icon: '🌃', description: 'High-floor city views. Premium lifestyle.', netWorthReq: 2000000 },
  { level: 'mansion', name: 'Mansion', icon: '🏰', description: 'Multiple rooms, staff, and prestige.', netWorthReq: 10000000 },
  { level: 'compound', name: 'Private Compound', icon: '🏯', description: 'Security, helipad, the full billionaire package.', netWorthReq: 100000000 },
];

type LifestyleTab = 'housing' | 'debt' | 'finances';

export default function LifestyleScreen() {
  const { player, upgradeHousing, payDebt, takePersonalLoan } = useGameStore();
  const [tab, setTab] = useState<LifestyleTab>('housing');
  const [confirmHousing, setConfirmHousing] = useState<HousingLevel | null>(null);
  const [payDebtModal, setPayDebtModal] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [loanModal, setLoanModal] = useState(false);
  const [loanAmount, setLoanAmount] = useState('10000');

  if (!player) return null;

  const netWorth = player.finances.totalNetWorth;
  const totalDebt = player.finances.totalDebt;
  const monthlyIncome = player.currentJob ? player.currentJob.dailyWage * 30 : 0;
  const currentHousingCost = getHousingCost(player.housingLevel);
  const debtToIncome = monthlyIncome > 0 ? (player.finances.monthlyDebtPayments / monthlyIncome) : 0;

  const targetDebt = player.debtItems.find(d => d.id === payDebtModal);

  function handlePayDebt() {
    if (!targetDebt) return;
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) return;
    payDebt(targetDebt.id, Math.min(amt, targetDebt.currentBalance));
    setPayDebtModal(null);
    setPayAmount('');
  }

  function handleTakeLoan() {
    const amt = parseFloat(loanAmount);
    if (isNaN(amt) || amt < 1000) return;
    takePersonalLoan(amt);
    setLoanModal(false);
  }

  const currentHousingData = HOUSING_LEVELS.find(h => h.level === player.housingLevel);

  return (
    <div className="screen-content h-full overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Home size={20} className="text-accent-purple" />
        <div>
          <h1 className="text-lg font-bold text-white">Lifestyle & Finances</h1>
          <p className="text-xs text-gray-500">Manage your housing, debt, and personal finances.</p>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-4 gap-3">
        <Card padding="md">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Housing</div>
          <div className="text-sm font-bold text-white">{currentHousingData?.name || player.housingLevel}</div>
          <div className="text-xs text-accent-red num mt-1">-{formatCurrency(currentHousingCost, true)}/mo</div>
        </Card>
        <Card padding="md">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Total Debt</div>
          <div className={`text-lg font-bold num ${totalDebt > 0 ? 'text-accent-red' : 'text-accent-green'}`}>
            {formatCurrency(totalDebt, true)}
          </div>
        </Card>
        <Card padding="md">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Monthly Payments</div>
          <div className="text-lg font-bold text-accent-red num">{formatCurrency(player.finances.monthlyDebtPayments, true)}</div>
          <div className="text-[10px] text-gray-500 mt-1">Debt/Income: {(debtToIncome * 100).toFixed(0)}%</div>
        </Card>
        <Card padding="md">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Credit Score</div>
          <div className={`text-lg font-bold num ${player.finances.creditScore >= 700 ? 'text-accent-green' : player.finances.creditScore >= 600 ? 'text-accent-yellow' : 'text-accent-red'}`}>
            {player.finances.creditScore}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">
            {player.finances.creditScore >= 750 ? 'Excellent' : player.finances.creditScore >= 700 ? 'Good' : player.finances.creditScore >= 650 ? 'Fair' : 'Poor'}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5">
        {[
          { id: 'housing', label: '🏠 Housing' },
          { id: 'debt', label: `💳 Debt (${player.debtItems.length})` },
          { id: 'finances', label: '📊 Cash Flow' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as LifestyleTab)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
              tab === t.id ? 'bg-accent-purple text-white' : 'bg-dark-400 text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* HOUSING TAB */}
      {tab === 'housing' && (
        <div className="space-y-3">
          <div className="text-xs text-gray-500">
            Current: <strong className="text-white">{currentHousingData?.name}</strong> — {formatCurrency(currentHousingCost)}/mo
          </div>
          <div className="grid grid-cols-3 gap-3">
            {HOUSING_LEVELS.map(h => {
              const isCurrent = h.level === player.housingLevel;
              const canAfford = netWorth >= h.netWorthReq;
              const isUpgrade = HOUSING_LEVELS.findIndex(x => x.level === player.housingLevel) < HOUSING_LEVELS.findIndex(x => x.level === h.level);
              const monthlyCost = getHousingCost(h.level);

              return (
                <div
                  key={h.level}
                  className={`card p-4 transition-all ${
                    isCurrent
                      ? 'border-accent-purple/40 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                      : canAfford
                      ? 'card-hover cursor-pointer'
                      : 'opacity-40 cursor-not-allowed'
                  }`}
                  onClick={() => canAfford && !isCurrent && setConfirmHousing(h.level)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-2xl">{h.icon}</span>
                    {isCurrent && <Badge variant="purple" size="xs">CURRENT</Badge>}
                    {!canAfford && <Badge variant="red" size="xs">Locked</Badge>}
                    {canAfford && !isCurrent && isUpgrade && <Badge variant="green" size="xs">Upgrade</Badge>}
                  </div>
                  <div className="text-sm font-bold text-white mb-1">{h.name}</div>
                  <div className="text-[10px] text-gray-500 mb-2 leading-relaxed">{h.description}</div>
                  <div className="flex justify-between items-center">
                    <div className={`text-xs font-semibold num ${monthlyCost === 0 ? 'text-gray-500' : 'text-accent-red'}`}>
                      {monthlyCost === 0 ? 'Free' : `-${formatCurrency(monthlyCost, true)}/mo`}
                    </div>
                    {h.netWorthReq > 0 && (
                      <div className={`text-[9px] ${canAfford ? 'text-gray-500' : 'text-accent-red'}`}>
                        NW: {formatCurrency(h.netWorthReq, true)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DEBT TAB */}
      {tab === 'debt' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {player.debtItems.length} active debt{player.debtItems.length !== 1 ? 's' : ''} | Total: {formatCurrency(totalDebt, true)}
            </div>
            <Button variant="secondary" size="sm" onClick={() => setLoanModal(true)}>
              Take Personal Loan
            </Button>
          </div>

          {player.debtItems.length === 0 ? (
            <Card padding="md">
              <div className="flex items-center gap-3">
                <CheckCircle size={24} className="text-accent-green" />
                <div>
                  <div className="text-sm font-semibold text-accent-green">Debt Free!</div>
                  <div className="text-xs text-gray-500">You have no outstanding debt. Excellent financial position.</div>
                </div>
              </div>
            </Card>
          ) : (
            player.debtItems.map(debt => {
              const payoffMonths = debt.monthlyPayment > 0 ? Math.ceil(debt.currentBalance / debt.monthlyPayment) : 999;
              const progressPct = (1 - debt.currentBalance / debt.principal) * 100;

              return (
                <Card key={debt.id} padding="md">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-bold text-white">{debt.name}</div>
                      <div className="text-[10px] text-gray-500 capitalize">{debt.type.replace(/_/g, ' ')}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-accent-red num">{formatCurrency(debt.currentBalance)}</div>
                      <div className="text-[10px] text-gray-500">{(debt.interestRate * 100).toFixed(1)}% APR</div>
                    </div>
                  </div>

                  <div className="w-full h-1.5 bg-dark-400 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-accent-green rounded-full transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="text-[9px] text-gray-600 mb-3">
                    {progressPct.toFixed(0)}% paid off | {payoffMonths < 999 ? `~${payoffMonths} months remaining` : 'Long-term debt'}
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                    <div className="bg-dark-600 rounded p-1.5">
                      <div className="text-[9px] text-gray-600">Monthly Payment</div>
                      <div className="text-[10px] font-bold text-accent-red num">{formatCurrency(debt.monthlyPayment, true)}</div>
                    </div>
                    <div className="bg-dark-600 rounded p-1.5">
                      <div className="text-[9px] text-gray-600">Daily Interest</div>
                      <div className="text-[10px] font-bold text-accent-red num">
                        {formatCurrency(debt.currentBalance * debt.interestRate / 365, true)}
                      </div>
                    </div>
                    <div className="bg-dark-600 rounded p-1.5">
                      <div className="text-[9px] text-gray-600">Original Principal</div>
                      <div className="text-[10px] font-bold text-gray-300 num">{formatCurrency(debt.principal, true)}</div>
                    </div>
                  </div>

                  <Button variant="primary" size="sm" fullWidth onClick={() => { setPayDebtModal(debt.id); setPayAmount(debt.monthlyPayment.toFixed(0)); }}>
                    Make Payment
                  </Button>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* FINANCES TAB */}
      {tab === 'finances' && (
        <div className="space-y-4">
          <Card title="Monthly Cash Flow" padding="md">
            <div className="space-y-2">
              {/* Income */}
              <div className="text-[10px] text-gray-500 uppercase mb-1">Income</div>
              {player.currentJob && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">{player.currentJob.title} salary</span>
                  <span className="text-accent-green num">+{formatCurrency(player.currentJob.dailyWage * 30, true)}</span>
                </div>
              )}
              {!player.currentJob && (
                <div className="text-xs text-gray-500 italic">No job income</div>
              )}

              {/* Expenses */}
              <div className="text-[10px] text-gray-500 uppercase mt-3 mb-1">Expenses</div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">Housing ({currentHousingData?.name})</span>
                <span className="text-accent-red num">-{formatCurrency(currentHousingCost, true)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">Living expenses</span>
                <span className="text-accent-red num">-{formatCurrency(player.finances.monthlyExpenses * 0.4, true)}</span>
              </div>
              {player.finances.monthlyDebtPayments > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Debt payments</span>
                  <span className="text-accent-red num">-{formatCurrency(player.finances.monthlyDebtPayments, true)}</span>
                </div>
              )}

              <div className="border-t border-dark-400 pt-2 mt-2">
                {(() => {
                  const income = player.currentJob ? player.currentJob.dailyWage * 30 : 0;
                  const expenses = currentHousingCost + player.finances.monthlyExpenses * 0.4 + player.finances.monthlyDebtPayments;
                  const net = income - expenses;
                  return (
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-white">Net Monthly Cash Flow</span>
                      <span className={`num ${net >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                        {net >= 0 ? '+' : ''}{formatCurrency(net, true)}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
          </Card>

          <Card title="Lifetime Stats" padding="md">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Lifetime Earnings', value: formatCurrency(player.finances.lifetimeEarnings, true), color: 'text-accent-green' },
                { label: 'Lifetime Losses', value: formatCurrency(player.finances.lifetimeLosses, true), color: 'text-accent-red' },
                { label: 'Credit Score', value: player.finances.creditScore, color: player.finances.creditScore >= 700 ? 'text-accent-green' : 'text-accent-yellow' },
                { label: 'Net Worth', value: formatCurrency(netWorth, true), color: netWorth >= 0 ? 'text-accent-blue' : 'text-accent-red' },
              ].map(item => (
                <div key={item.label} className="bg-dark-600 rounded-lg p-3">
                  <div className="text-[10px] text-gray-500 mb-1">{item.label}</div>
                  <div className={`text-base font-bold num ${item.color}`}>{item.value}</div>
                </div>
              ))}
            </div>
          </Card>

          {debtToIncome > 0.4 && (
            <div className="flex items-start gap-3 p-3 bg-accent-yellow/10 border border-accent-yellow/20 rounded-lg">
              <AlertTriangle size={18} className="text-accent-yellow flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-accent-yellow">High Debt-to-Income Ratio</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Your monthly debt payments are {(debtToIncome * 100).toFixed(0)}% of income. This limits borrowing capacity and hurts credit score growth.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Housing upgrade confirmation */}
      <Modal isOpen={!!confirmHousing} onClose={() => setConfirmHousing(null)} title="Change Housing" size="sm">
        {confirmHousing && (() => {
          const h = HOUSING_LEVELS.find(x => x.level === confirmHousing)!;
          const newCost = getHousingCost(confirmHousing);
          const diff = newCost - currentHousingCost;
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{h.icon}</span>
                <div>
                  <div className="text-sm font-bold text-white">{h.name}</div>
                  <div className="text-xs text-gray-400">{h.description}</div>
                </div>
              </div>
              <div className="p-3 bg-dark-600 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">New Monthly Cost</span>
                  <span className={`num ${newCost > 0 ? 'text-accent-red' : 'text-gray-300'}`}>{formatCurrency(newCost)}/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Change</span>
                  <span className={`num ${diff > 0 ? 'text-accent-red' : 'text-accent-green'}`}>
                    {diff > 0 ? '+' : ''}{formatCurrency(diff)}/mo
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" fullWidth onClick={() => setConfirmHousing(null)}>Cancel</Button>
                <Button variant="primary" fullWidth onClick={() => { upgradeHousing(confirmHousing); setConfirmHousing(null); }}>
                  Move In
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Pay debt modal */}
      <Modal isOpen={!!payDebtModal} onClose={() => setPayDebtModal(null)} title="Make Debt Payment" size="sm">
        {targetDebt && (
          <div className="space-y-4">
            <div className="text-sm text-gray-300">
              <strong className="text-white">{targetDebt.name}</strong>
              <div className="text-xs text-gray-500 mt-0.5">Balance: {formatCurrency(targetDebt.currentBalance)} at {(targetDebt.interestRate * 100).toFixed(1)}% APR</div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Payment Amount</label>
              <input
                type="number"
                min="1"
                max={targetDebt.currentBalance}
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                className="w-full bg-dark-600 border border-dark-400 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue num"
              />
              <div className="flex gap-2 mt-2">
                {[targetDebt.monthlyPayment, targetDebt.currentBalance * 0.1, targetDebt.currentBalance].map((amt, i) => (
                  <button
                    key={i}
                    onClick={() => setPayAmount(amt.toFixed(0))}
                    className="text-[10px] px-2 py-1 bg-dark-400 rounded text-gray-400 hover:text-white transition-colors"
                  >
                    {i === 0 ? 'Min' : i === 1 ? '10%' : 'Full'}: {formatCurrency(amt, true)}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Available cash: <span className="text-accent-green num">{formatCurrency(player.finances.cash)}</span>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setPayDebtModal(null)}>Cancel</Button>
              <Button
                variant="primary"
                fullWidth
                disabled={parseFloat(payAmount) > player.finances.cash}
                onClick={handlePayDebt}
              >
                Pay {payAmount ? formatCurrency(parseFloat(payAmount), true) : '$0'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Take loan modal */}
      <Modal isOpen={loanModal} onClose={() => setLoanModal(false)} title="Take Personal Loan" size="sm">
        <div className="space-y-4">
          <div className="text-xs text-gray-400 leading-relaxed">
            Take on personal debt to fund investments or cover expenses. Rate depends on your credit score.
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Loan Amount</label>
            <input
              type="number"
              min="1000"
              value={loanAmount}
              onChange={e => setLoanAmount(e.target.value)}
              className="w-full bg-dark-600 border border-dark-400 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue num"
            />
          </div>
          <div className="p-3 bg-dark-600 rounded-lg text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">Estimated Rate</span>
              <span className="text-accent-yellow">
                {(12 + (1 - player.finances.creditScore / 850) * 10).toFixed(1)}% APR
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Monthly Payment</span>
              <span className="text-accent-red num">~{formatCurrency(parseFloat(loanAmount || '0') * 0.03, true)}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setLoanModal(false)}>Cancel</Button>
            <Button variant="primary" fullWidth onClick={handleTakeLoan}>
              Take Loan for {formatCurrency(parseFloat(loanAmount || '0'), true)}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
