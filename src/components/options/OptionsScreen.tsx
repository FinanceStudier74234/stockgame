import React, { useState, useMemo, useCallback } from 'react';
import { Zap, Lock, TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useGameStore } from '../../store/gameStore';
import { formatCurrency, formatPercent, getPnLColor } from '../../utils/formatting';
import { generateOptionsChain, EXPIRY_OPTIONS, OptionsChainEntry, blackScholes } from '../../engine/optionsEngine';
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
  stockPrice: number;
  iv: number;
}

const RATING_SHORT: Record<string, string> = {
  strong_buy: 'SB', buy: 'B', hold: 'H', sell: 'S', strong_sell: 'SS',
};

export default function OptionsScreen() {
  const { player, stocks, economy, buyOption, sellOption, exerciseOption, setScreen } = useGameStore();
  const [tab, setTab] = useState<OptionTab>('chain');
  const [selectedTicker, setSelectedTicker] = useState('APX');
  const [expiryIdx, setExpiryIdx] = useState(2);
  const [buyModal, setBuyModal] = useState<BuyModalState | null>(null);
  const [contracts, setContracts] = useState(1);
  const [sliderPct, setSliderPct] = useState(0); // -40 to +40

  if (!player) return null;

  const hasOptions = player.unlockedMechanics.includes('options_trading');

  if (!hasOptions) {
    return (
      <div className="screen-content h-full flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <Lock size={48} className="text-gray-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-400 mb-2">Options Trading Locked</h2>
          <p className="text-sm text-gray-500 mb-4">Build your Options skill to level 15 to access the options market.</p>
          <div className={`text-xs mb-4 ${player.skills.options >= 15 ? 'text-accent-green' : 'text-accent-red'}`}>
            {player.skills.options >= 15 ? '✓' : '✗'} Options Skill ≥ 15 (current: {Math.round(player.skills.options)})
          </div>
          <button onClick={() => setScreen('skills')} className="px-4 py-2 text-xs bg-accent-blue/20 text-accent-blue border border-accent-blue/30 rounded-lg hover:bg-accent-blue/30 transition-all">
            Go to Skills →
          </button>
        </div>
      </div>
    );
  }

  const stockList = Object.values(stocks).filter(s => s.assetType === 'stock').sort((a, b) => a.ticker.localeCompare(b.ticker));
  const stock = stocks[selectedTicker] || stockList[0];

  const chain = useMemo(() => {
    if (!stock) return [];
    return generateOptionsChain(stock.currentPrice, economy.federalFundsRate / 100, (stock.volatility / 100) * 1.2, EXPIRY_OPTIONS[expiryIdx].days);
  }, [stock?.currentPrice, expiryIdx, selectedTicker, economy.federalFundsRate]);

  const openPositions = player.portfolio.options;
  const totalOptionsValue = openPositions.reduce((s, o) => s + o.currentValue, 0);
  const totalOptionsCost = openPositions.reduce((s, o) => s + o.premium * 100 * o.contracts, 0);
  const optionsPnL = totalOptionsValue - totalOptionsCost;

  // What-if: simulated price for the slider
  const simulatedPrice = buyModal ? buyModal.stockPrice * (1 + sliderPct / 100) : 0;

  // What-if option value at simulated price
  const whatIfResult = useMemo(() => {
    if (!buyModal) return null;
    const bs = blackScholes({
      stockPrice: simulatedPrice,
      strikePrice: buyModal.strike,
      timeToExpiry: buyModal.expiryDays / 365,
      riskFreeRate: economy.federalFundsRate / 100,
      impliedVolatility: buyModal.iv,
      optionType: buyModal.type,
    });
    const cost = buyModal.premium * 100 * contracts;
    const newVal = bs.premium * 100 * contracts;
    const pnl = newVal - cost;
    const breakEven = buyModal.type === 'call'
      ? buyModal.strike + buyModal.premium
      : buyModal.strike - buyModal.premium;
    return { premium: bs.premium, value: newVal, pnl, pnlPct: cost > 0 ? (pnl / cost) * 100 : 0, breakEven };
  }, [buyModal, simulatedPrice, contracts, economy.federalFundsRate]);

  // Payoff chart data (P&L at expiry + current BS value across price range)
  const payoffData = useMemo(() => {
    if (!buyModal) return [];
    const base = buyModal.stockPrice;
    const totalCost = buyModal.premium * 100 * contracts;
    return Array.from({ length: 41 }, (_, i) => {
      const mult = 0.6 + (i / 40) * 0.8;
      const px = base * mult;
      const intrinsic = buyModal.type === 'call' ? Math.max(0, px - buyModal.strike) : Math.max(0, buyModal.strike - px);
      const expiryPnL = intrinsic * 100 * contracts - totalCost;
      const bs = blackScholes({ stockPrice: px, strikePrice: buyModal.strike, timeToExpiry: buyModal.expiryDays / 365, riskFreeRate: economy.federalFundsRate / 100, impliedVolatility: buyModal.iv, optionType: buyModal.type });
      const currentPnL = bs.premium * 100 * contracts - totalCost;
      return { price: parseFloat(px.toFixed(2)), expiry: parseFloat(expiryPnL.toFixed(2)), current: parseFloat(currentPnL.toFixed(2)) };
    });
  }, [buyModal, contracts, economy.federalFundsRate]);

  function handleOpenBuy(entry: OptionsChainEntry, type: 'call' | 'put') {
    if (!stock) return;
    const data = type === 'call' ? entry.call : entry.put;
    setBuyModal({ ticker: selectedTicker, type, strike: entry.strike, premium: data.premium, delta: data.delta, theta: data.theta, expiryDays: EXPIRY_OPTIONS[expiryIdx].days, stockPrice: stock.currentPrice, iv: (stock.volatility / 100) * 1.2 });
    setContracts(1);
    setSliderPct(0);
  }

  function handleConfirmBuy() {
    if (!buyModal) return;
    buyOption(buyModal.ticker, buyModal.type, buyModal.strike, buyModal.expiryDays, contracts);
    setBuyModal(null);
  }

  const breakEven = buyModal ? (buyModal.type === 'call' ? buyModal.strike + buyModal.premium : buyModal.strike - buyModal.premium) : 0;
  const totalCost = buyModal ? buyModal.premium * 100 * contracts : 0;

  return (
    <div className="screen-content h-full overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap size={20} className="text-accent-yellow" />
          <div>
            <h1 className="text-lg font-bold text-white">Options Trading</h1>
            <p className="text-xs text-gray-500">Calls, puts, leverage — limited risk.</p>
          </div>
          <Badge variant="yellow" size="xs">Advanced</Badge>
        </div>
        <div className="flex gap-4 text-right">
          <div>
            <div className="text-[10px] text-gray-500">Positions Value</div>
            <div className="text-sm font-bold text-white num">{formatCurrency(totalOptionsValue, true)}</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500">Total P&L</div>
            <div className={`text-sm font-bold num ${getPnLColor(optionsPnL)}`}>
              {optionsPnL >= 0 ? '+' : ''}{formatCurrency(optionsPnL, true)}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5">
        {(['chain', 'positions', 'strategies'] as OptionTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold capitalize transition-all ${tab === t ? 'bg-accent-yellow text-dark-900' : 'bg-dark-400 text-gray-400 hover:text-white'}`}>
            {t === 'chain' ? 'Options Chain' : t === 'positions' ? `Positions (${openPositions.length})` : 'Strategies'}
          </button>
        ))}
      </div>

      {/* OPTIONS CHAIN */}
      {tab === 'chain' && (
        <>
          {/* Controls */}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-[10px] text-gray-500 mb-1">Underlying</label>
              <select value={selectedTicker} onChange={e => setSelectedTicker(e.target.value)}
                className="w-full bg-dark-600 border border-dark-400 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue">
                {stockList.map(s => (
                  <option key={s.ticker} value={s.ticker}>{s.ticker} — ${s.currentPrice.toFixed(2)} {s.analystRating ? `· ${RATING_SHORT[s.analystRating] || ''}` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-1">Expiration</label>
              <select value={expiryIdx} onChange={e => setExpiryIdx(Number(e.target.value))}
                className="bg-dark-600 border border-dark-400 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue">
                {EXPIRY_OPTIONS.map((opt, i) => <option key={opt.label} value={i}>{opt.label}</option>)}
              </select>
            </div>
          </div>

          {/* Stock bar */}
          {stock && (
            <div className="flex items-center gap-4 px-3 py-2 bg-dark-600 rounded-xl">
              <span className="text-sm font-bold text-white">{stock.ticker}</span>
              <span className="text-xs text-gray-500 hidden lg:block truncate max-w-[140px]">{stock.name}</span>
              <span className="text-sm font-bold text-white num">${stock.currentPrice.toFixed(2)}</span>
              <Badge variant={stock.changePercent >= 0 ? 'green' : 'red'} size="xs">{formatPercent(stock.changePercent, 2)}</Badge>
              <span className="text-[10px] text-gray-500">IV: {(stock.volatility * 1.2).toFixed(1)}%</span>
              <span className="text-[10px] text-gray-500">Expiry: {EXPIRY_OPTIONS[expiryIdx].days}d</span>
              <span className="text-[10px] text-gray-400 ml-auto hidden lg:block">← Click ASK to buy</span>
            </div>
          )}

          {/* Chain table */}
          <div className="overflow-x-auto rounded-xl border border-dark-500">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-dark-400 bg-dark-700">
                  <th className="text-left text-gray-500 font-medium py-2 px-3" colSpan={5}>— CALLS —</th>
                  <th className="text-center text-gray-300 font-bold py-2 px-4">STRIKE</th>
                  <th className="text-right text-gray-500 font-medium py-2 px-3" colSpan={5}>— PUTS —</th>
                </tr>
                <tr className="border-b border-dark-600 bg-dark-700/50 text-[9px] text-gray-600">
                  <th className="py-1.5 px-2 text-right">BID</th>
                  <th className="py-1.5 px-2 text-right">ASK</th>
                  <th className="py-1.5 px-2 text-right">Δ</th>
                  <th className="py-1.5 px-2 text-right">θ/d</th>
                  <th className="py-1.5 px-2 text-right">BE</th>
                  <th className="py-1.5 px-4 text-center text-gray-400">STRIKE</th>
                  <th className="py-1.5 px-2 text-left">BID</th>
                  <th className="py-1.5 px-2 text-left">ASK</th>
                  <th className="py-1.5 px-2 text-left">Δ</th>
                  <th className="py-1.5 px-2 text-left">θ/d</th>
                  <th className="py-1.5 px-2 text-left">BE</th>
                </tr>
              </thead>
              <tbody>
                {chain.map(entry => {
                  const callBE = (entry.strike + entry.call.premium).toFixed(1);
                  const putBE = (entry.strike - entry.put.premium).toFixed(1);
                  const isATM = stock && Math.abs(entry.strike - stock.currentPrice) < (chain[1]?.strike - chain[0]?.strike) / 2;
                  const callITM = stock && entry.strike < stock.currentPrice;
                  const putITM = stock && entry.strike > stock.currentPrice;
                  return (
                    <tr key={entry.strike} className={`border-b border-dark-600/40 hover:bg-dark-600/40 transition-colors ${isATM ? 'bg-accent-yellow/5' : ''}`}>
                      {/* Call side */}
                      <td className={`py-1.5 px-2 text-right num font-medium ${callITM ? 'text-accent-green' : 'text-gray-400'}`}>${(entry.call.premium * 0.97).toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right">
                        <button onClick={() => handleOpenBuy(entry, 'call')} className={`num font-bold hover:text-white hover:underline transition-colors ${callITM ? 'text-accent-green' : 'text-gray-200'}`}>${entry.call.premium.toFixed(2)}</button>
                      </td>
                      <td className="py-1.5 px-2 text-right num text-gray-400">{entry.call.delta.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-right num text-accent-red text-[10px]">{entry.call.theta.toFixed(3)}</td>
                      <td className="py-1.5 px-2 text-right num text-gray-600 text-[10px]">${callBE}</td>
                      {/* Strike */}
                      <td className={`py-1.5 px-4 text-center font-bold text-sm ${isATM ? 'text-accent-yellow' : 'text-gray-300'}`}>${entry.strike}</td>
                      {/* Put side */}
                      <td className="py-1.5 px-2 text-left">
                        <button onClick={() => handleOpenBuy(entry, 'put')} className={`num font-bold hover:text-white hover:underline transition-colors ${putITM ? 'text-accent-red' : 'text-gray-200'}`}>${entry.put.premium.toFixed(2)}</button>
                      </td>
                      <td className={`py-1.5 px-2 text-left num font-medium ${putITM ? 'text-accent-red' : 'text-gray-400'}`}>${(entry.put.premium * 1.03).toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-left num text-gray-400">{entry.put.delta.toFixed(2)}</td>
                      <td className="py-1.5 px-2 text-left num text-accent-red text-[10px]">{entry.put.theta.toFixed(3)}</td>
                      <td className="py-1.5 px-2 text-left num text-gray-600 text-[10px]">${putBE}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-gray-600 text-center">Click an ASK price to open a buy order · BE = Breakeven at expiry</p>
        </>
      )}

      {/* POSITIONS */}
      {tab === 'positions' && (
        <div className="space-y-3">
          {openPositions.length === 0 ? (
            <Card padding="md">
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🎯</div>
                <div className="text-sm font-semibold text-gray-400 mb-1">No Open Positions</div>
                <p className="text-xs text-gray-500">Go to the Options Chain tab to buy calls or puts.</p>
              </div>
            </Card>
          ) : openPositions.map(opt => {
            const cost = opt.premium * 100 * opt.contracts;
            const pnl = opt.currentValue - cost;
            const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
            const isExpiring = opt.daysToExpiry <= 7;
            return (
              <Card key={opt.id} padding="md" glowColor={pnl > 0 ? 'green' : pnl < -cost * 0.5 ? 'red' : 'none'}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-white">{opt.ticker}</span>
                      <Badge variant={opt.type === 'call' ? 'green' : 'red'} size="xs">{opt.type.toUpperCase()}</Badge>
                      <span className="text-xs text-gray-400">${opt.strikePrice} strike</span>
                      {isExpiring && <Badge variant="yellow" size="xs">EXPIRING SOON</Badge>}
                    </div>
                    <div className="text-[10px] text-gray-500">{opt.contracts} contract{opt.contracts > 1 ? 's' : ''} × 100 shares · {opt.daysToExpiry}d left</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold num ${getPnLColor(pnl)}`}>{pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}</div>
                    <div className={`text-[10px] num ${getPnLColor(pnlPct)}`}>{pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%</div>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2 mb-3 text-center">
                  {[
                    { label: 'Cost', value: formatCurrency(cost), color: 'text-gray-300' },
                    { label: 'Value', value: formatCurrency(opt.currentValue), color: 'text-white' },
                    { label: 'Delta', value: opt.delta.toFixed(2), color: Math.abs(opt.delta) > 0.5 ? 'text-accent-green' : 'text-gray-300' },
                    { label: 'θ/day', value: opt.theta.toFixed(3), color: 'text-accent-red' },
                    { label: 'IV', value: `${(opt.impliedVolatility * 100).toFixed(0)}%`, color: 'text-accent-yellow' },
                  ].map(item => (
                    <div key={item.label} className="bg-dark-600 rounded-lg p-2">
                      <div className="text-[9px] text-gray-600 mb-0.5">{item.label}</div>
                      <div className={`text-xs font-semibold num ${item.color}`}>{item.value}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => sellOption(opt.id)}>Close Position</Button>
                  {opt.daysToExpiry <= 1 && opt.intrinsicValue > 0 && (
                    <Button variant="success" size="sm" onClick={() => exerciseOption(opt.id)}>Exercise ITM</Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* STRATEGIES */}
      {tab === 'strategies' && (
        <div className="space-y-2">
          {[
            { name: 'Long Call', emoji: '📈', desc: 'Bullish. Buy a call. Max loss = premium. Unlimited upside.', risk: 'Low', level: 'Beginner' },
            { name: 'Long Put', emoji: '📉', desc: 'Bearish or hedge. Buy a put. Limited risk.', risk: 'Low', level: 'Beginner' },
            { name: 'Covered Call', emoji: '🛡️', desc: 'Own 100 shares, sell a call. Earn income, cap upside.', risk: 'Very Low', level: 'Intermediate' },
            { name: 'Cash-Secured Put', emoji: '💵', desc: 'Sell a put with cash reserved. Collect premium or buy cheaper.', risk: 'Low–Med', level: 'Intermediate' },
            { name: 'Bull Call Spread', emoji: '🐂', desc: 'Buy lower call, sell higher. Reduces cost, caps gain.', risk: 'Low', level: 'Advanced' },
            { name: 'Straddle', emoji: '⚡', desc: 'Buy ATM call + put. Profit from big moves either direction.', risk: 'Medium', level: 'Advanced' },
            { name: 'Iron Condor', emoji: '🦅', desc: 'Sell OTM call + put, buy further OTM. Profit if stock stays in range.', risk: 'Medium', level: 'Advanced' },
          ].map(s => (
            <div key={s.name} className="p-3 bg-dark-600 rounded-xl flex items-start gap-3">
              <span className="text-lg">{s.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-white">{s.name}</span>
                  <Badge variant={s.risk === 'Low' || s.risk === 'Very Low' ? 'green' : 'yellow'} size="xs">{s.risk} Risk</Badge>
                  <Badge variant="gray" size="xs">{s.level}</Badge>
                </div>
                <p className="text-xs text-gray-400">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BUY MODAL — Robinhood-style */}
      <Modal isOpen={!!buyModal} onClose={() => setBuyModal(null)} title="" size="lg">
        {buyModal && whatIfResult && (
          <div className="space-y-4">
            {/* Contract header */}
            <div className="flex items-center gap-3 pb-3 border-b border-dark-500">
              <Badge variant={buyModal.type === 'call' ? 'green' : 'red'} size="sm">{buyModal.type.toUpperCase()}</Badge>
              <span className="text-xl font-bold text-white">{buyModal.ticker}</span>
              <span className="text-sm text-gray-400">${buyModal.strike} Strike · {buyModal.expiryDays}d Expiry</span>
              <div className="ml-auto text-right">
                <div className="text-[10px] text-gray-500">Stock price</div>
                <div className="text-sm font-bold text-white num">${buyModal.stockPrice.toFixed(2)}</div>
              </div>
            </div>

            {/* Payoff Chart */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 font-semibold">Payoff at Expiry</span>
                <div className="flex gap-3 text-[10px]">
                  <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-accent-green inline-block rounded" />At expiry</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-accent-blue inline-block rounded" />Today (BS)</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={payoffData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <XAxis dataKey="price" tick={{ fontSize: 9, fill: '#555' }} tickFormatter={v => `$${v}`} interval={7} />
                  <YAxis tick={{ fontSize: 9, fill: '#555' }} tickFormatter={v => `$${v > 0 ? '+' : ''}${v.toFixed(0)}`} width={48} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: 8, fontSize: 11 }}
                    formatter={(val: number, name: string) => [`${val >= 0 ? '+' : ''}$${val.toFixed(2)}`, name === 'expiry' ? 'At Expiry' : 'Today']}
                    labelFormatter={v => `Stock @ $${v}`}
                  />
                  <ReferenceLine y={0} stroke="#444" strokeDasharray="3 3" />
                  <ReferenceLine x={buyModal.stockPrice} stroke="#666" strokeDasharray="3 3" label={{ value: 'Now', fill: '#888', fontSize: 9 }} />
                  <ReferenceLine x={breakEven} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: 'BE', fill: '#f59e0b', fontSize: 9 }} />
                  <Line type="monotone" dataKey="expiry" stroke="#22c55e" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="current" stroke="#3b82f6" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
              <div className="text-[10px] text-gray-600 text-center mt-1">
                Breakeven: <span className="text-accent-yellow font-semibold">${breakEven.toFixed(2)}</span>
                {' '}({buyModal.type === 'call' ? `stock needs to rise ${(((breakEven / buyModal.stockPrice) - 1) * 100).toFixed(1)}%` : `stock needs to fall ${((1 - (breakEven / buyModal.stockPrice)) * 100).toFixed(1)}%`})
              </div>
            </div>

            {/* What-if slider */}
            <div className="bg-dark-700 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-300">What if the stock moves?</span>
                <span className={`text-xs font-bold num ${sliderPct >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                  {sliderPct >= 0 ? '+' : ''}{sliderPct.toFixed(0)}% → ${simulatedPrice.toFixed(2)}
                </span>
              </div>
              <input
                type="range" min={-40} max={40} step={1} value={sliderPct}
                onChange={e => setSliderPct(Number(e.target.value))}
                className="w-full h-2 accent-accent-blue cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-gray-600 mt-1">
                <span>-40%</span><span>0%</span><span>+40%</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="bg-dark-600 rounded-lg p-2 text-center">
                  <div className="text-[9px] text-gray-500 mb-1">Option value</div>
                  <div className="text-xs font-bold text-white num">{formatCurrency(whatIfResult.value)}</div>
                </div>
                <div className="bg-dark-600 rounded-lg p-2 text-center">
                  <div className="text-[9px] text-gray-500 mb-1">P&L</div>
                  <div className={`text-xs font-bold num ${whatIfResult.pnl >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                    {whatIfResult.pnl >= 0 ? '+' : ''}{formatCurrency(whatIfResult.pnl)}
                  </div>
                </div>
                <div className="bg-dark-600 rounded-lg p-2 text-center">
                  <div className="text-[9px] text-gray-500 mb-1">Return</div>
                  <div className={`text-xs font-bold num ${whatIfResult.pnlPct >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                    {whatIfResult.pnlPct >= 0 ? '+' : ''}{whatIfResult.pnlPct.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Contracts + cost */}
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-[10px] text-gray-500 mb-1.5">Contracts (1 = 100 shares)</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setContracts(Math.max(1, contracts - 1))} className="w-8 h-8 rounded-lg bg-dark-400 text-white hover:bg-dark-300 text-lg font-bold transition-colors">-</button>
                  <input type="number" min={1} max={100} value={contracts} onChange={e => setContracts(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-center bg-dark-600 border border-dark-400 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-accent-blue" />
                  <button onClick={() => setContracts(Math.min(100, contracts + 1))} className="w-8 h-8 rounded-lg bg-dark-400 text-white hover:bg-dark-300 text-lg font-bold transition-colors">+</button>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-2 text-center">
                <div className="bg-dark-600 rounded-lg p-2">
                  <div className="text-[9px] text-gray-500 mb-0.5">Δ Delta</div>
                  <div className="text-xs font-bold text-gray-200 num">{buyModal.delta.toFixed(2)}</div>
                </div>
                <div className="bg-dark-600 rounded-lg p-2">
                  <div className="text-[9px] text-gray-500 mb-0.5">θ Theta/d</div>
                  <div className="text-xs font-bold text-accent-red num">{buyModal.theta.toFixed(3)}</div>
                </div>
                <div className="bg-dark-600 rounded-lg p-2">
                  <div className="text-[9px] text-gray-500 mb-0.5">Max Loss</div>
                  <div className="text-xs font-bold text-accent-red num">{formatCurrency(totalCost)}</div>
                </div>
              </div>
            </div>

            {/* Cash check */}
            <div className="flex items-center justify-between p-3 bg-dark-600 rounded-xl text-sm">
              <div>
                <span className="text-gray-400">Total cost: </span>
                <span className="font-bold text-white num">{formatCurrency(totalCost)}</span>
              </div>
              <div>
                <span className="text-gray-400">Cash: </span>
                <span className={`font-bold num ${player.finances.cash >= totalCost ? 'text-accent-green' : 'text-accent-red'}`}>{formatCurrency(player.finances.cash)}</span>
              </div>
            </div>

            {player.finances.cash < totalCost && (
              <div className="flex items-center gap-2 p-3 bg-accent-red/10 border border-accent-red/20 rounded-lg">
                <AlertTriangle size={14} className="text-accent-red flex-shrink-0" />
                <span className="text-xs text-accent-red">Insufficient funds for {contracts} contract{contracts > 1 ? 's' : ''}.</span>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setBuyModal(null)}>Cancel</Button>
              <Button variant={buyModal.type === 'call' ? 'success' : 'danger'} fullWidth disabled={player.finances.cash < totalCost} onClick={handleConfirmBuy}>
                Buy {contracts}× {buyModal.ticker} {buyModal.type.toUpperCase()} · {formatCurrency(totalCost)}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
