import React, { useState, useMemo } from 'react';
import { Zap, Lock, TrendingUp, TrendingDown, AlertTriangle, ChevronDown } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { formatCurrency, formatPercent, getPnLColor } from '../../utils/formatting';
import { generateOptionsChain, EXPIRY_OPTIONS, OptionsChainEntry } from '../../engine/optionsEngine';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

type OptionTab = 'chain' | 'positions' | 'strategies';

interface BuyModalState {
  ticker: string;
  type: 'call' | 'put';
  strike: number;
  premium: number;
  delta: number;
  theta: number;
  expiryDays: number;
}

export default function OptionsScreen() {
  const { player, stocks, economy, buyOption, sellOption, exerciseOption, setScreen } = useGameStore();
  const [tab, setTab] = useState<OptionTab>('chain');
  const [selectedTicker, setSelectedTicker] = useState('AAPL');
  const [expiryIdx, setExpiryIdx] = useState(2); // 1 month default
  const [buyModal, setBuyModal] = useState<BuyModalState | null>(null);
  const [contracts, setContracts] = useState(1);

  if (!player) return null;

  const hasOptions = player.unlockedMechanics.includes('options_trading');

  if (!hasOptions) {
    return (
      <div className="screen-content h-full flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <Lock size={48} className="text-gray-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-400 mb-2">Options Trading Locked</h2>
          <p className="text-sm text-gray-500 mb-4">
            Build your Options skill to level 15 and unlock advanced trading to access the options market.
          </p>
          <div className="space-y-2">
            <div className={`text-xs ${player.skills.options >= 15 ? 'text-accent-green' : 'text-accent-red'}`}>
              {player.skills.options >= 15 ? '✓' : '✗'} Options Skill ≥ 15 (current: {Math.round(player.skills.options)})
            </div>
          </div>
          <button
            onClick={() => setScreen('skills')}
            className="mt-4 px-4 py-2 text-xs bg-accent-blue/20 text-accent-blue border border-accent-blue/30 rounded-lg hover:bg-accent-blue/30 transition-all"
          >
            Go to Skills →
          </button>
        </div>
      </div>
    );
  }

  const stock = stocks[selectedTicker];
  const stockList = Object.values(stocks).sort((a, b) => a.ticker.localeCompare(b.ticker));

  const chain = useMemo(() => {
    if (!stock) return [];
    const expiryDays = EXPIRY_OPTIONS[expiryIdx].days;
    return generateOptionsChain(
      stock.currentPrice,
      economy.federalFundsRate / 100,
      (stock.volatility / 100) * 1.2,
      expiryDays
    );
  }, [stock?.currentPrice, expiryIdx, selectedTicker]);

  const openPositions = player.portfolio.options;
  const totalOptionsValue = openPositions.reduce((sum, o) => sum + o.currentValue, 0);
  const totalOptionsCost = openPositions.reduce((sum, o) => sum + o.premium * 100 * o.contracts, 0);
  const optionsPnL = totalOptionsValue - totalOptionsCost;

  function handleOpenBuy(entry: OptionsChainEntry, type: 'call' | 'put') {
    const data = type === 'call' ? entry.call : entry.put;
    setBuyModal({
      ticker: selectedTicker,
      type,
      strike: entry.strike,
      premium: data.premium,
      delta: data.delta,
      theta: data.theta,
      expiryDays: EXPIRY_OPTIONS[expiryIdx].days,
    });
    setContracts(1);
  }

  function handleConfirmBuy() {
    if (!buyModal) return;
    buyOption(buyModal.ticker, buyModal.type, buyModal.strike, buyModal.expiryDays, contracts);
    setBuyModal(null);
  }

  return (
    <div className="screen-content h-full overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap size={20} className="text-accent-yellow" />
          <div>
            <h1 className="text-lg font-bold text-white">Options Trading</h1>
            <p className="text-xs text-gray-500">Calls, puts, leverage, and limited risk.</p>
          </div>
          <Badge variant="yellow" size="xs">Advanced</Badge>
        </div>
        <div className="flex gap-3 text-right">
          <div>
            <div className="text-[10px] text-gray-500">Positions Value</div>
            <div className="text-sm font-bold text-white num">{formatCurrency(totalOptionsValue, true)}</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500">Unrealized P&L</div>
            <div className={`text-sm font-bold num ${getPnLColor(optionsPnL)}`}>
              {optionsPnL >= 0 ? '+' : ''}{formatCurrency(optionsPnL, true)}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5">
        {(['chain', 'positions', 'strategies'] as OptionTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold capitalize transition-all ${
              tab === t ? 'bg-accent-yellow text-dark-900' : 'bg-dark-400 text-gray-400 hover:text-white'
            }`}
          >
            {t === 'chain' ? 'Options Chain' : t === 'positions' ? `Positions (${openPositions.length})` : 'Strategies'}
          </button>
        ))}
      </div>

      {/* OPTIONS CHAIN TAB */}
      {tab === 'chain' && (
        <>
          {/* Controls */}
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <label className="block text-[10px] text-gray-500 mb-1">Underlying</label>
              <select
                value={selectedTicker}
                onChange={e => setSelectedTicker(e.target.value)}
                className="w-full bg-dark-600 border border-dark-400 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
              >
                {stockList.map(s => (
                  <option key={s.ticker} value={s.ticker}>{s.ticker} — ${s.currentPrice.toFixed(2)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-1">Expiration</label>
              <select
                value={expiryIdx}
                onChange={e => setExpiryIdx(Number(e.target.value))}
                className="bg-dark-600 border border-dark-400 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
              >
                {EXPIRY_OPTIONS.map((opt, i) => (
                  <option key={opt.label} value={i}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stock info */}
          {stock && (
            <div className="flex items-center gap-4 px-3 py-2 bg-dark-600 rounded-lg">
              <div>
                <span className="text-sm font-bold text-white">{stock.ticker}</span>
                <span className="text-xs text-gray-500 ml-2">{stock.name}</span>
              </div>
              <div className="text-sm font-bold text-white num">${stock.currentPrice.toFixed(2)}</div>
              <Badge variant={stock.changePercent >= 0 ? 'green' : 'red'} size="xs">
                {formatPercent(stock.changePercent, 2)}
              </Badge>
              <div className="text-[10px] text-gray-500">IV: {(stock.volatility * 1.2).toFixed(1)}%</div>
              <div className="text-[10px] text-gray-500">Expiry: {EXPIRY_OPTIONS[expiryIdx].days}d</div>
            </div>
          )}

          {/* Chain table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-dark-400">
                  <th className="text-left text-gray-500 font-medium py-2 px-2" colSpan={5}>— CALLS —</th>
                  <th className="text-center text-gray-300 font-bold py-2 px-4">STRIKE</th>
                  <th className="text-right text-gray-500 font-medium py-2 px-2" colSpan={5}>— PUTS —</th>
                </tr>
                <tr className="border-b border-dark-600">
                  <th className="text-right text-[9px] text-gray-600 py-1 px-1">BID</th>
                  <th className="text-right text-[9px] text-gray-600 py-1 px-1">ASK</th>
                  <th className="text-right text-[9px] text-gray-600 py-1 px-1">Δ</th>
                  <th className="text-right text-[9px] text-gray-600 py-1 px-1">θ</th>
                  <th className="text-right text-[9px] text-gray-600 py-1 px-1">OI</th>
                  <th className="text-center text-[9px] text-gray-400 font-bold py-1 px-4">STRIKE</th>
                  <th className="text-left text-[9px] text-gray-600 py-1 px-1">BID</th>
                  <th className="text-left text-[9px] text-gray-600 py-1 px-1">ASK</th>
                  <th className="text-left text-[9px] text-gray-600 py-1 px-1">Δ</th>
                  <th className="text-left text-[9px] text-gray-600 py-1 px-1">θ</th>
                  <th className="text-left text-[9px] text-gray-600 py-1 px-1">OI</th>
                </tr>
              </thead>
              <tbody>
                {chain.map((entry) => {
                  const isATM = Math.abs(entry.strike - (stock?.currentPrice || 0)) < (chain[1]?.strike - chain[0]?.strike) / 2;
                  const callITM = stock && entry.strike < stock.currentPrice;
                  const putITM = stock && entry.strike > stock.currentPrice;

                  return (
                    <tr
                      key={entry.strike}
                      className={`border-b border-dark-600/50 ${isATM ? 'bg-accent-yellow/5' : ''}`}
                    >
                      {/* Call side */}
                      <td className={`py-1 px-1 text-right num font-medium ${callITM ? 'text-accent-green' : 'text-gray-300'}`}>
                        ${(entry.call.premium * 0.97).toFixed(2)}
                      </td>
                      <td className={`py-1 px-1 text-right num font-medium ${callITM ? 'text-accent-green' : 'text-gray-300'}`}>
                        <button
                          onClick={() => handleOpenBuy(entry, 'call')}
                          className="hover:text-white hover:underline transition-colors"
                        >
                          ${entry.call.premium.toFixed(2)}
                        </button>
                      </td>
                      <td className="py-1 px-1 text-right num text-gray-400">{entry.call.delta.toFixed(2)}</td>
                      <td className="py-1 px-1 text-right num text-accent-red text-[10px]">{entry.call.theta.toFixed(3)}</td>
                      <td className="py-1 px-1 text-right text-gray-600">{(entry.call.openInterest / 1000).toFixed(1)}K</td>

                      {/* Strike */}
                      <td className={`py-1 px-4 text-center font-bold ${isATM ? 'text-accent-yellow' : 'text-gray-300'}`}>
                        ${entry.strike}
                      </td>

                      {/* Put side */}
                      <td className={`py-1 px-1 text-left num font-medium ${putITM ? 'text-accent-red' : 'text-gray-300'}`}>
                        <button
                          onClick={() => handleOpenBuy(entry, 'put')}
                          className="hover:text-white hover:underline transition-colors"
                        >
                          ${entry.put.premium.toFixed(2)}
                        </button>
                      </td>
                      <td className={`py-1 px-1 text-left num font-medium ${putITM ? 'text-accent-red' : 'text-gray-300'}`}>
                        ${(entry.put.premium * 1.03).toFixed(2)}
                      </td>
                      <td className="py-1 px-1 text-left num text-gray-400">{entry.put.delta.toFixed(2)}</td>
                      <td className="py-1 px-1 text-left num text-accent-red text-[10px]">{entry.put.theta.toFixed(3)}</td>
                      <td className="py-1 px-1 text-left text-gray-600">{(entry.put.openInterest / 1000).toFixed(1)}K</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="text-[10px] text-gray-600 text-center">
            Click an ASK price to open a buy order. Calls = green when ITM, Puts = red when ITM.
          </div>
        </>
      )}

      {/* POSITIONS TAB */}
      {tab === 'positions' && (
        <div className="space-y-3">
          {openPositions.length === 0 ? (
            <Card padding="md">
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🎯</div>
                <div className="text-sm font-semibold text-gray-400 mb-1">No Open Options Positions</div>
                <p className="text-xs text-gray-500">Go to the Options Chain tab to buy calls or puts.</p>
              </div>
            </Card>
          ) : (
            openPositions.map(opt => {
              const cost = opt.premium * 100 * opt.contracts;
              const pnl = opt.currentValue - cost;
              const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
              const isExpiring = opt.daysToExpiry <= 7;

              return (
                <Card key={opt.id} padding="md" glowColor={pnl > 0 ? 'green' : pnl < -cost * 0.5 ? 'red' : 'none'}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-white">{opt.ticker}</span>
                        <Badge variant={opt.type === 'call' ? 'green' : 'red'} size="xs">
                          {opt.type.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-400">${opt.strikePrice} strike</span>
                        {isExpiring && <Badge variant="yellow" size="xs">EXPIRING SOON</Badge>}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {opt.contracts} contract{opt.contracts > 1 ? 's' : ''} × 100 shares | {opt.daysToExpiry}d remaining
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold num ${getPnLColor(pnl)}`}>
                        {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                      </div>
                      <div className={`text-[10px] num ${getPnLColor(pnlPct)}`}>
                        {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-2 my-3 text-center">
                    {[
                      { label: 'Cost', value: formatCurrency(cost), color: 'text-gray-300' },
                      { label: 'Value', value: formatCurrency(opt.currentValue), color: 'text-white' },
                      { label: 'Delta', value: opt.delta.toFixed(2), color: Math.abs(opt.delta) > 0.5 ? 'text-accent-green' : 'text-gray-300' },
                      { label: 'Theta/d', value: opt.theta.toFixed(3), color: 'text-accent-red' },
                      { label: 'IV', value: `${(opt.impliedVolatility * 100).toFixed(0)}%`, color: 'text-accent-yellow' },
                    ].map(item => (
                      <div key={item.label} className="bg-dark-600 rounded-lg p-2">
                        <div className="text-[9px] text-gray-600 mb-0.5">{item.label}</div>
                        <div className={`text-xs font-semibold num ${item.color}`}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => sellOption(opt.id)}>
                      Close Position
                    </Button>
                    {opt.daysToExpiry <= 1 && opt.intrinsicValue > 0 && (
                      <Button variant="success" size="sm" onClick={() => exerciseOption(opt.id)}>
                        Exercise ITM
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* STRATEGIES TAB */}
      {tab === 'strategies' && (
        <div className="space-y-3">
          <Card padding="md">
            <h2 className="text-sm font-bold text-white mb-3">Options Strategies Guide</h2>
            <div className="space-y-3">
              {[
                {
                  name: 'Long Call',
                  emoji: '📈',
                  description: 'Buy a call option. Bullish bet. Max loss = premium paid. Unlimited upside.',
                  risk: 'Low',
                  complexity: 'Beginner',
                },
                {
                  name: 'Long Put',
                  emoji: '📉',
                  description: 'Buy a put option. Bearish bet or portfolio hedge. Limited risk.',
                  risk: 'Low',
                  complexity: 'Beginner',
                },
                {
                  name: 'Covered Call',
                  emoji: '🛡️',
                  description: 'Own 100 shares, sell a call. Generate income. Cap your upside.',
                  risk: 'Very Low',
                  complexity: 'Intermediate',
                },
                {
                  name: 'Cash-Secured Put',
                  emoji: '💵',
                  description: 'Sell a put with cash set aside. Collect premium or buy stock cheaper.',
                  risk: 'Low-Medium',
                  complexity: 'Intermediate',
                },
                {
                  name: 'Bull Call Spread',
                  emoji: '🐂',
                  description: 'Buy lower strike call, sell higher. Reduces cost, caps upside.',
                  risk: 'Low',
                  complexity: 'Advanced',
                },
                {
                  name: 'Iron Condor',
                  emoji: '🦅',
                  description: 'Sell OTM call + put, buy further OTM. Profit if stock stays in range.',
                  risk: 'Medium',
                  complexity: 'Advanced',
                },
                {
                  name: 'Straddle',
                  emoji: '⚡',
                  description: 'Buy ATM call + put. Profit from big moves in either direction.',
                  risk: 'Medium',
                  complexity: 'Advanced',
                },
              ].map(strategy => (
                <div key={strategy.name} className="p-3 bg-dark-600 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{strategy.emoji}</span>
                    <span className="text-sm font-semibold text-white">{strategy.name}</span>
                    <Badge variant={strategy.risk === 'Low' ? 'green' : strategy.risk === 'Very Low' ? 'cyan' : 'yellow'} size="xs">
                      {strategy.risk} Risk
                    </Badge>
                    <Badge variant="gray" size="xs">{strategy.complexity}</Badge>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{strategy.description}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Buy Modal */}
      <Modal isOpen={!!buyModal} onClose={() => setBuyModal(null)} title="Buy Option" size="md">
        {buyModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant={buyModal.type === 'call' ? 'green' : 'red'} size="sm">
                {buyModal.type.toUpperCase()}
              </Badge>
              <span className="text-lg font-bold text-white">{buyModal.ticker}</span>
              <span className="text-sm text-gray-400">${buyModal.strike} Strike</span>
              <span className="text-sm text-gray-400">{buyModal.expiryDays}d Expiry</span>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Premium/share', value: `$${buyModal.premium.toFixed(2)}`, color: 'text-white' },
                { label: 'Delta', value: buyModal.delta.toFixed(2), color: 'text-gray-300' },
                { label: 'Theta/day', value: buyModal.theta.toFixed(3), color: 'text-accent-red' },
                { label: 'Max Loss', value: `$${(buyModal.premium * 100).toFixed(2)}/contract`, color: 'text-accent-red' },
              ].map(item => (
                <div key={item.label} className="bg-dark-600 rounded-lg p-3 text-center">
                  <div className="text-[9px] text-gray-500 mb-1">{item.label}</div>
                  <div className={`text-xs font-bold num ${item.color}`}>{item.value}</div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-2">Number of Contracts (1 contract = 100 shares)</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setContracts(Math.max(1, contracts - 1))}
                  className="w-8 h-8 rounded-lg bg-dark-400 text-white hover:bg-dark-300 text-lg font-bold transition-colors"
                >-</button>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={contracts}
                  onChange={e => setContracts(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center bg-dark-600 border border-dark-400 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
                />
                <button
                  onClick={() => setContracts(Math.min(100, contracts + 1))}
                  className="w-8 h-8 rounded-lg bg-dark-400 text-white hover:bg-dark-300 text-lg font-bold transition-colors"
                >+</button>
              </div>
            </div>

            <div className="p-4 bg-dark-600 rounded-xl space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Premium</span>
                <span className="text-white num font-semibold">{formatCurrency(buyModal.premium * 100 * contracts)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Shares Controlled</span>
                <span className="text-accent-blue num">{contracts * 100}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Available Cash</span>
                <span className={`num ${player.finances.cash >= buyModal.premium * 100 * contracts ? 'text-accent-green' : 'text-accent-red'}`}>
                  {formatCurrency(player.finances.cash)}
                </span>
              </div>
            </div>

            {player.finances.cash < buyModal.premium * 100 * contracts && (
              <div className="flex items-center gap-2 p-3 bg-accent-red/10 border border-accent-red/20 rounded-lg">
                <AlertTriangle size={14} className="text-accent-red flex-shrink-0" />
                <span className="text-xs text-accent-red">Insufficient funds to buy {contracts} contract{contracts > 1 ? 's' : ''}.</span>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setBuyModal(null)}>Cancel</Button>
              <Button
                variant={buyModal.type === 'call' ? 'success' : 'danger'}
                fullWidth
                disabled={player.finances.cash < buyModal.premium * 100 * contracts}
                onClick={handleConfirmBuy}
              >
                Buy {contracts}x {buyModal.ticker} {buyModal.type.toUpperCase()} for {formatCurrency(buyModal.premium * 100 * contracts)}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
