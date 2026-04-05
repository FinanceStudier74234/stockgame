import React, { useState } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Star, Calendar, DollarSign, Target, BarChart2, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useGameStore } from '../../store/gameStore';
import { formatCurrency, formatPercent } from '../../utils/formatting';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import StatBar from '../ui/StatBar';

interface Props { ticker: string; onClose: () => void; }

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="card p-2 border border-dark-300 shadow-xl">
      <div className="text-xs font-semibold text-white num">${parseFloat(payload[0].value).toFixed(2)}</div>
    </div>
  );
};

const RATING_CONFIG = {
  strong_buy:  { label: 'Strong Buy',  color: 'text-accent-green',  bg: 'bg-accent-green/15 border-accent-green/40' },
  buy:         { label: 'Buy',         color: 'text-accent-green',  bg: 'bg-accent-green/10 border-accent-green/30' },
  hold:        { label: 'Hold',        color: 'text-accent-yellow', bg: 'bg-accent-yellow/10 border-accent-yellow/30' },
  sell:        { label: 'Sell',        color: 'text-accent-red',    bg: 'bg-accent-red/10 border-accent-red/30' },
  strong_sell: { label: 'Strong Sell', color: 'text-accent-red',    bg: 'bg-accent-red/15 border-accent-red/40' },
};

const EARNINGS_ICON = { beat: '✅', miss: '❌', inline: '➖' } as const;

export default function StockDetail({ ticker, onClose }: Props) {
  const { stocks, etfs, crypto, player, time, buyStock, sellStock, addToWatchlist, removeFromWatchlist } = useGameStore();
  const [buyShares, setBuyShares] = useState('1');
  const [sellShares, setSellShares] = useState('1');
  const [tradeTab, setTradeTab] = useState<'buy' | 'sell'>('buy');
  const [analysisTab, setAnalysisTab] = useState<'fundamentals' | 'earnings' | 'dividends'>('fundamentals');

  const stock = stocks[ticker] || etfs[ticker] || (crypto[ticker] as any);
  if (!stock || !player) return null;

  const priceHistory = stock.priceHistory || [];
  const chartData = priceHistory.slice(-60).map((p: number, i: number) => ({ day: i, price: p }));
  const holding = player.portfolio.holdings[ticker];
  const inWatchlist = player.portfolio.watchlist.includes(ticker);
  const buyAmt = parseFloat(buyShares) || 0;
  const sellAmt = parseFloat(sellShares) || 0;
  const buyCost = buyAmt * stock.currentPrice;
  const sellProceeds = sellAmt * stock.currentPrice;
  const canBuy = player.finances.cash >= buyCost && buyAmt > 0;
  const canSell = !!(holding && holding.shares >= sellAmt && sellAmt > 0);
  const isPositive = stock.changePercent >= 0;

  // Derived analytics
  const s = stock as any;
  const hasAnalytics = !!s.intrinsicQuality;
  const fairValue = s.analystPriceTarget || 0;
  const premiumDiscount = fairValue > 0 ? ((stock.currentPrice - fairValue) / fairValue) * 100 : 0;
  const ratingCfg = s.analystRating ? RATING_CONFIG[s.analystRating as keyof typeof RATING_CONFIG] : null;

  const daysToEarnings = s.nextEarningsDay ? Math.max(0, s.nextEarningsDay - time.totalDays) : null;
  const daysToDividend = s.nextDividendDay && s.dividendPerShare > 0
    ? Math.max(0, s.nextDividendDay - time.totalDays) : null;

  const annualDividend = s.dividendPerShare ? s.dividendPerShare * 4 : 0;
  const dividendYield = annualDividend > 0 ? ((annualDividend / stock.currentPrice) * 100) : 0;

  const debtLoad = s.debtLoad || 0;
  const debtLabel = debtLoad < 20 ? 'Low' : debtLoad < 45 ? 'Moderate' : debtLoad < 70 ? 'High' : 'Very High';
  const debtColor = debtLoad < 20 ? 'text-accent-green' : debtLoad < 45 ? 'text-accent-yellow' : 'text-accent-red';

  return (
    <div className="screen-content h-full overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-400 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-white">{ticker}</h1>
            <span className="text-sm text-gray-400">{stock.name}</span>
            <Badge variant="gray" size="xs">{s.sector || 'crypto'}</Badge>
            {ratingCfg && (
              <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase tracking-wide ${ratingCfg.bg} ${ratingCfg.color}`}>
                {ratingCfg.label}
              </span>
            )}
            {s.lastEarningsResult && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-dark-500 text-gray-300">
                Last Q: {EARNINGS_ICON[s.lastEarningsResult as keyof typeof EARNINGS_ICON]} {s.lastEarningsResult}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => inWatchlist ? removeFromWatchlist(ticker) : addToWatchlist(ticker)}
          className={`p-2 rounded-lg transition-colors ${inWatchlist ? 'text-accent-yellow bg-accent-yellow/10' : 'text-gray-500 hover:text-gray-300 hover:bg-dark-400'}`}
        >
          <Star size={16} fill={inWatchlist ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Left: chart + analysis */}
        <div className="col-span-2 space-y-4">
          {/* Price card */}
          <Card padding="md">
            <div className="flex items-start justify-between mb-4 gap-4">
              <div>
                <div className="text-3xl font-bold text-white num">
                  {stock.currentPrice < 10 ? `$${stock.currentPrice.toFixed(4)}` :
                    stock.currentPrice >= 1000 ? `$${stock.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}` :
                    `$${stock.currentPrice.toFixed(2)}`}
                </div>
                <div className={`flex items-center gap-2 mt-1 ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
                  {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <span className="font-semibold text-sm num">{isPositive ? '+' : ''}{(s.changeDollar || 0).toFixed(2)}</span>
                  <span className="font-semibold text-sm num">{formatPercent(stock.changePercent || 0)}</span>
                  <span className="text-xs text-gray-500">Today</span>
                </div>
                {/* Analyst target vs price */}
                {fairValue > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <Target size={12} className="text-gray-500" />
                    <span className="text-[11px] text-gray-500">Target: </span>
                    <span className="text-[11px] font-semibold text-gray-300 num">${fairValue.toFixed(2)}</span>
                    <span className={`text-[11px] font-bold num ${premiumDiscount <= -10 ? 'text-accent-green' : premiumDiscount >= 10 ? 'text-accent-red' : 'text-accent-yellow'}`}>
                      ({premiumDiscount > 0 ? '+' : ''}{premiumDiscount.toFixed(1)}% {premiumDiscount < 0 ? 'upside' : 'premium'})
                    </span>
                  </div>
                )}
              </div>
              {/* Key stats grid */}
              <div className="grid grid-cols-3 gap-x-5 gap-y-1.5 text-right shrink-0">
                <div>
                  <div className="text-[10px] text-gray-500">52W High</div>
                  <div className="text-xs font-semibold text-accent-green num">${s.fiftyTwoWeekHigh?.toFixed(2) || '-'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">52W Low</div>
                  <div className="text-xs font-semibold text-accent-red num">${s.fiftyTwoWeekLow?.toFixed(2) || '-'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">Volume</div>
                  <div className="text-xs font-semibold text-gray-300 num">{((s.volume || 0) / 1e6).toFixed(1)}M</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">Mkt Cap</div>
                  <div className="text-xs font-semibold text-gray-300 num">{formatCurrency(s.marketCap || 0, true)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">P/E</div>
                  <div className="text-xs font-semibold text-gray-300 num">{s.peRatio > 0 ? s.peRatio.toFixed(1) : 'N/A'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">EPS</div>
                  <div className={`text-xs font-semibold num ${s.eps > 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                    ${(s.eps || 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
            {/* Chart */}
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                  <XAxis dataKey="day" hide />
                  <YAxis domain={['auto', 'auto']} tickFormatter={v => `$${v < 1 ? v.toFixed(3) : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v.toFixed(0)}`} width={52} tick={{ fill: '#64748b', fontSize: 9 }} />
                  <Tooltip content={<CustomTooltip />} />
                  {fairValue > 0 && (
                    <ReferenceLine y={fairValue} stroke="#f59e0b" strokeDasharray="4 2" strokeOpacity={0.5} label={{ value: 'Target', fill: '#f59e0b', fontSize: 9 }} />
                  )}
                  <Line type="monotone" dataKey="price" stroke={isPositive ? '#10b981' : '#ef4444'} strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* Upcoming calendar events */}
            <div className="flex gap-4 mt-3 pt-3 border-t border-dark-400">
              {daysToEarnings !== null && (
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} className="text-accent-blue" />
                  <span className="text-[11px] text-gray-400">Earnings in </span>
                  <span className={`text-[11px] font-bold num ${daysToEarnings <= 7 ? 'text-accent-yellow' : 'text-gray-200'}`}>
                    {daysToEarnings === 0 ? 'TODAY' : `${daysToEarnings}d`}
                  </span>
                </div>
              )}
              {daysToDividend !== null && s.dividendPerShare > 0 && (
                <div className="flex items-center gap-1.5">
                  <DollarSign size={12} className="text-accent-yellow" />
                  <span className="text-[11px] text-gray-400">Dividend </span>
                  <span className="text-[11px] font-bold text-accent-yellow num">${s.dividendPerShare.toFixed(2)}/sh</span>
                  <span className="text-[11px] text-gray-500">in {daysToDividend}d</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Users size={12} className="text-gray-500" />
                <span className="text-[11px] text-gray-400">{((s.employees || 0) / 1000).toFixed(0)}K employees · est. {s.founded}</span>
              </div>
            </div>
          </Card>

          {/* Analysis tabs */}
          {hasAnalytics && (
            <Card padding="md">
              <div className="flex gap-1 mb-4 bg-dark-600 rounded-lg p-1">
                {(['fundamentals', 'earnings', 'dividends'] as const).map(tab => (
                  <button key={tab} onClick={() => setAnalysisTab(tab)}
                    className={`flex-1 py-1.5 rounded text-[11px] font-semibold capitalize transition-all ${analysisTab === tab ? 'bg-dark-300 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                    {tab === 'dividends' ? '💰 Dividends' : tab === 'earnings' ? '📊 Earnings' : '📈 Fundamentals'}
                  </button>
                ))}
              </div>

              {analysisTab === 'fundamentals' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <StatBar label="Intrinsic Quality" value={s.intrinsicQuality} />
                      <StatBar label="Earnings Strength" value={s.earningsStrength} />
                      <StatBar label="Growth Score" value={s.growthScore} />
                      <StatBar label="Profitability" value={s.profitability} />
                    </div>
                    <div className="space-y-2">
                      <StatBar label="Sentiment" value={s.sentiment} />
                      <StatBar label="Momentum" value={s.momentum} />
                      <StatBar label="Valuation" value={s.valuation} />
                      <StatBar label="Management" value={s.managementQuality} />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3 pt-3 border-t border-dark-400">
                    <div className="text-center">
                      <div className="text-[10px] text-gray-500 mb-1">Volatility</div>
                      <div className={`text-sm font-bold num ${s.volatility > 60 ? 'text-accent-red' : s.volatility > 30 ? 'text-accent-yellow' : 'text-accent-green'}`}>
                        {s.volatility}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-gray-500 mb-1">Debt Load</div>
                      <div className={`text-sm font-bold ${debtColor}`}>{debtLabel}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-gray-500 mb-1">Div. Yield</div>
                      <div className={`text-sm font-bold num ${dividendYield > 0 ? 'text-accent-yellow' : 'text-gray-500'}`}>
                        {dividendYield > 0 ? `${dividendYield.toFixed(1)}%` : '—'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-gray-500 mb-1">Hype</div>
                      <div className={`text-sm font-bold num ${s.hype > 75 ? 'text-accent-purple' : s.hype > 50 ? 'text-accent-blue' : 'text-gray-400'}`}>
                        {s.hype > 75 ? '🔥' : s.hype > 50 ? '↑' : '→'} {s.hype.toFixed(0)}
                      </div>
                    </div>
                  </div>
                  {s.description && (
                    <p className="text-[11px] text-gray-400 leading-relaxed pt-2 border-t border-dark-400">{s.description}</p>
                  )}
                </div>
              )}

              {analysisTab === 'earnings' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-dark-600 rounded-lg">
                    <div>
                      <div className="text-[10px] text-gray-500 mb-0.5">Next Earnings</div>
                      <div className={`text-sm font-bold ${daysToEarnings !== null && daysToEarnings <= 7 ? 'text-accent-yellow' : 'text-gray-200'}`}>
                        {daysToEarnings === null ? '—' : daysToEarnings === 0 ? 'TODAY' : `In ${daysToEarnings} days`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-gray-500 mb-0.5">EPS Estimate</div>
                      <div className="text-sm font-bold num text-gray-200">
                        ${s.eps > 0 ? (s.eps * (0.95 + Math.random() * 0.1)).toFixed(2) : 'N/A'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-gray-500 mb-0.5">Beat Rate</div>
                      <div className={`text-sm font-bold num ${s.earningsStrength > 60 ? 'text-accent-green' : s.earningsStrength > 40 ? 'text-accent-yellow' : 'text-accent-red'}`}>
                        {s.earningsStrength}%
                      </div>
                    </div>
                  </div>
                  {/* Earnings history */}
                  <div>
                    <div className="text-[10px] text-gray-500 mb-2 uppercase tracking-wider">Earnings History</div>
                    {(!s.earningsHistory || s.earningsHistory.length === 0) ? (
                      <div className="text-xs text-gray-600 italic py-4 text-center">No earnings history yet. First report coming in {daysToEarnings}d.</div>
                    ) : (
                      <div className="space-y-1.5">
                        {(s.earningsHistory as Array<{day: number; result: string; impact: number}>).map((e, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-dark-600 rounded">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{EARNINGS_ICON[e.result as keyof typeof EARNINGS_ICON] || '➖'}</span>
                              <span className="text-xs text-gray-300 capitalize">{e.result}</span>
                              <span className="text-[10px] text-gray-600">Day {e.day}</span>
                            </div>
                            <span className={`text-xs font-bold num ${e.impact > 0 ? 'text-accent-green' : e.impact < 0 ? 'text-accent-red' : 'text-gray-400'}`}>
                              {e.impact > 0 ? '+' : ''}{e.impact.toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {analysisTab === 'dividends' && (
                <div className="space-y-3">
                  {s.dividendPerShare > 0 ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-dark-600 rounded-lg p-3 text-center">
                          <div className="text-[10px] text-gray-500 mb-1">Quarterly Payment</div>
                          <div className="text-xl font-bold text-accent-yellow num">${s.dividendPerShare.toFixed(2)}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">per share</div>
                        </div>
                        <div className="bg-dark-600 rounded-lg p-3 text-center">
                          <div className="text-[10px] text-gray-500 mb-1">Annual Yield</div>
                          <div className="text-xl font-bold text-accent-yellow num">{dividendYield.toFixed(2)}%</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">${(s.dividendPerShare * 4).toFixed(2)}/yr per share</div>
                        </div>
                        <div className="bg-dark-600 rounded-lg p-3 text-center">
                          <div className="text-[10px] text-gray-500 mb-1">Next Ex-Date</div>
                          <div className={`text-sm font-bold ${daysToDividend !== null && daysToDividend <= 7 ? 'text-accent-yellow' : 'text-gray-200'}`}>
                            {daysToDividend === null ? '—' : daysToDividend === 0 ? 'TODAY' : `In ${daysToDividend}d`}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">quarterly cadence</div>
                        </div>
                        <div className="bg-dark-600 rounded-lg p-3 text-center">
                          <div className="text-[10px] text-gray-500 mb-1">Your Next Payment</div>
                          {holding && holding.shares > 0 ? (
                            <>
                              <div className="text-sm font-bold text-accent-green num">
                                +${(holding.shares * s.dividendPerShare).toFixed(2)}
                              </div>
                              <div className="text-[10px] text-gray-500 mt-0.5">{holding.shares} shares × ${s.dividendPerShare.toFixed(2)}</div>
                            </>
                          ) : (
                            <div className="text-sm text-gray-600">No position</div>
                          )}
                        </div>
                      </div>
                      {holding && (
                        <div className="p-2 bg-accent-yellow/5 border border-accent-yellow/20 rounded text-[11px] text-gray-300">
                          💰 You've earned <span className="text-accent-yellow font-semibold num">${(holding.dividendsEarned || 0).toFixed(2)}</span> in total dividends from {ticker}.
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <DollarSign size={24} className="text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">{stock.name} does not pay dividends.</p>
                      <p className="text-[11px] text-gray-600 mt-1">Growth-focused companies typically reinvest profits rather than distributing them.</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right: trading panel */}
        <div className="space-y-4">
          {/* Position summary */}
          {holding && (
            <Card title="Your Position" padding="md" glowColor={holding.unrealizedPnL >= 0 ? 'green' : 'red'}>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Shares</span>
                  <span className="text-xs font-semibold text-white num">{holding.shares}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Avg Cost</span>
                  <span className="text-xs font-semibold text-white num">${holding.averageCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Market Value</span>
                  <span className="text-xs font-semibold text-white num">{formatCurrency(holding.marketValue, true)}</span>
                </div>
                {s.dividendPerShare > 0 && (
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Divs Earned</span>
                    <span className="text-xs font-semibold text-accent-yellow num">{formatCurrency(holding.dividendsEarned || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-dark-400">
                  <span className="text-xs text-gray-500">Unrealized P&L</span>
                  <div className="text-right">
                    <div className={`text-xs font-bold num ${holding.unrealizedPnL >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                      {holding.unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(holding.unrealizedPnL, true)}
                    </div>
                    <div className={`text-[10px] num ${holding.unrealizedPnLPercent >= 0 ? 'text-accent-green/70' : 'text-accent-red/70'}`}>
                      {holding.unrealizedPnLPercent >= 0 ? '+' : ''}{holding.unrealizedPnLPercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Trade form */}
          <Card padding="md">
            <div className="flex gap-1 mb-4">
              {(['buy', 'sell'] as const).map(tab => (
                <button key={tab} onClick={() => setTradeTab(tab)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase transition-all ${
                    tab === 'buy'
                      ? tradeTab === 'buy' ? 'bg-accent-green text-white' : 'bg-dark-400 text-gray-400 hover:text-white'
                      : tradeTab === 'sell' ? 'bg-accent-red text-white' : 'bg-dark-400 text-gray-400 hover:text-white'
                  }`}>
                  {tab}
                </button>
              ))}
            </div>

            {tradeTab === 'buy' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1.5">Shares to Buy</label>
                  <div className="flex gap-2">
                    <input type="number" min="0" value={buyShares} onChange={e => setBuyShares(e.target.value)}
                      className="flex-1 bg-dark-600 border border-dark-400 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-green num" />
                    <button onClick={() => setBuyShares(String(Math.floor(player.finances.cash / stock.currentPrice)))}
                      className="px-2 py-1 bg-dark-400 text-gray-400 hover:text-white rounded text-[10px] transition-colors">MAX</button>
                  </div>
                </div>
                <div className="bg-dark-600 rounded-lg p-3 space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-500">Price / share</span>
                    <span className="text-white num">${stock.currentPrice < 10 ? stock.currentPrice.toFixed(4) : stock.currentPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-500">Total Cost</span>
                    <span className="text-white font-semibold num">{formatCurrency(buyCost)}</span>
                  </div>
                  {s.dividendPerShare > 0 && buyAmt > 0 && (
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-500">Quarterly dividend</span>
                      <span className="text-accent-yellow num">+${(buyAmt * s.dividendPerShare).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[10px] pt-1 border-t border-dark-400">
                    <span className="text-gray-500">Cash Available</span>
                    <span className={`font-semibold num ${player.finances.cash >= buyCost ? 'text-accent-green' : 'text-accent-red'}`}>
                      {formatCurrency(player.finances.cash)}
                    </span>
                  </div>
                </div>
                <Button variant="success" fullWidth disabled={!canBuy} onClick={() => buyStock(ticker, s.assetType || 'stock', buyAmt, stock.currentPrice)} size="md">
                  {canBuy ? `Buy ${buyAmt} share${buyAmt !== 1 ? 's' : ''}` : 'Insufficient Funds'}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1.5">Shares to Sell</label>
                  <div className="flex gap-2">
                    <input type="number" min="0" max={holding?.shares || 0} value={sellShares} onChange={e => setSellShares(e.target.value)}
                      className="flex-1 bg-dark-600 border border-dark-400 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-red num" />
                    <button onClick={() => holding && setSellShares(String(holding.shares))}
                      className="px-2 py-1 bg-dark-400 text-gray-400 hover:text-white rounded text-[10px] transition-colors">ALL</button>
                  </div>
                </div>
                <div className="bg-dark-600 rounded-lg p-3 space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-500">Shares Owned</span>
                    <span className="text-white num">{holding?.shares || 0}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-500">Proceeds</span>
                    <span className="text-white font-semibold num">{formatCurrency(sellProceeds)}</span>
                  </div>
                  {holding && sellAmt > 0 && (
                    <div className="flex justify-between text-[10px] pt-1 border-t border-dark-400">
                      <span className="text-gray-500">Est. P&L</span>
                      <span className={`font-semibold num ${sellProceeds - holding.averageCost * sellAmt >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                        {formatCurrency(sellProceeds - holding.averageCost * sellAmt)}
                      </span>
                    </div>
                  )}
                </div>
                <Button variant="danger" fullWidth disabled={!canSell} onClick={() => sellStock(ticker, sellAmt, stock.currentPrice)} size="md">
                  {canSell ? `Sell ${sellAmt} share${sellAmt !== 1 ? 's' : ''}` : !holding ? 'No Position' : 'Invalid Amount'}
                </Button>
              </div>
            )}
          </Card>

          {/* Quick analyst summary */}
          {ratingCfg && fairValue > 0 && (
            <div className={`rounded-lg border p-3 ${ratingCfg.bg}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <BarChart2 size={12} className={ratingCfg.color} />
                <span className={`text-xs font-bold ${ratingCfg.color}`}>Analyst Consensus</span>
              </div>
              <div className={`text-lg font-bold ${ratingCfg.color}`}>{ratingCfg.label}</div>
              <div className="text-[10px] text-gray-400 mt-1">
                Price Target: <span className="text-gray-200 font-semibold">${fairValue.toFixed(2)}</span>
                {' · '}{premiumDiscount < 0 ? `${Math.abs(premiumDiscount).toFixed(0)}% potential upside` : `${premiumDiscount.toFixed(0)}% above target`}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
