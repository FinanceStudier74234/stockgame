import React, { useState } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Plus, Minus, Eye, EyeOff, Star } from 'lucide-react';
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

export default function StockDetail({ ticker, onClose }: Props) {
  const { stocks, etfs, crypto, player, buyStock, sellStock, addToWatchlist, removeFromWatchlist, addNotification } = useGameStore();
  const [buyShares, setBuyShares] = useState('1');
  const [sellShares, setSellShares] = useState('1');
  const [tradeTab, setTradeTab] = useState<'buy' | 'sell'>('buy');

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
  const canSell = holding && holding.shares >= sellAmt && sellAmt > 0;

  const handleBuy = () => {
    if (!canBuy) return;
    buyStock(ticker, stock.assetType || 'stock', buyAmt, stock.currentPrice);
  };

  const handleSell = () => {
    if (!canSell) return;
    sellStock(ticker, sellAmt, stock.currentPrice);
  };

  const handleMaxBuy = () => {
    const maxShares = Math.floor(player.finances.cash / stock.currentPrice);
    setBuyShares(String(maxShares));
  };

  const handleMaxSell = () => {
    if (holding) setSellShares(String(holding.shares));
  };

  const isPositive = stock.changePercent >= 0;

  return (
    <div className="screen-content h-full overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-400 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white">{ticker}</h1>
            <span className="text-sm text-gray-400">{stock.name}</span>
            <Badge variant="gray" size="xs">{(stock as any).sector || 'crypto'}</Badge>
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
        {/* Main chart area */}
        <div className="col-span-2 space-y-4">
          {/* Price header */}
          <Card padding="md">
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="text-3xl font-bold text-white num">
                  ${stock.currentPrice < 10 ? stock.currentPrice.toFixed(4) : stock.currentPrice < 1000 ? stock.currentPrice.toFixed(2) : stock.currentPrice.toLocaleString()}
                </div>
                <div className={`flex items-center gap-2 mt-1 ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
                  {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  <span className="font-semibold num">{isPositive ? '+' : ''}{stock.changeDollar?.toFixed ? stock.changeDollar.toFixed(2) : '0.00'}</span>
                  <span className="font-semibold num">{formatPercent(stock.changePercent || 0)}</span>
                  <span className="text-xs text-gray-500">Today</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-right">
                <div>
                  <div className="text-[10px] text-gray-500">52W High</div>
                  <div className="text-xs font-semibold text-accent-green num">${(stock as any).fiftyTwoWeekHigh?.toFixed(2) || '-'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">52W Low</div>
                  <div className="text-xs font-semibold text-accent-red num">${(stock as any).fiftyTwoWeekLow?.toFixed(2) || '-'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">Volume</div>
                  <div className="text-xs font-semibold text-gray-300 num">{((stock as any).volume / 1e6)?.toFixed(1) || '-'}M</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">Mkt Cap</div>
                  <div className="text-xs font-semibold text-gray-300 num">{formatCurrency((stock as any).marketCap || 0, true)}</div>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <XAxis dataKey="day" hide />
                  <YAxis
                    domain={['auto', 'auto']}
                    tickFormatter={v => `$${v < 1 ? v.toFixed(3) : v.toFixed(0)}`}
                    width={55}
                    tick={{ fill: '#64748b', fontSize: 10 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={isPositive ? '#10b981' : '#ef4444'}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: isPositive ? '#10b981' : '#ef4444' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Stock details */}
          {(stock as any).intrinsicQuality && (
            <Card title="Analysis Metrics" padding="md">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <StatBar label="Intrinsic Quality" value={(stock as any).intrinsicQuality} />
                  <StatBar label="Earnings Strength" value={(stock as any).earningsStrength} />
                  <StatBar label="Growth Score" value={(stock as any).growthScore} />
                  <StatBar label="Profitability" value={(stock as any).profitability} />
                </div>
                <div className="space-y-2">
                  <StatBar label="Sentiment" value={(stock as any).sentiment} />
                  <StatBar label="Momentum" value={(stock as any).momentum} />
                  <StatBar label="Valuation" value={(stock as any).valuation} />
                  <StatBar label="Management" value={(stock as any).managementQuality} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-dark-400">
                <div>
                  <div className="text-[10px] text-gray-500">P/E Ratio</div>
                  <div className="text-sm font-semibold text-white num">{(stock as any).peRatio > 0 ? (stock as any).peRatio.toFixed(1) : 'N/A'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">EPS</div>
                  <div className="text-sm font-semibold text-white num">${(stock as any).eps?.toFixed(2) || '-'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">Dividend Yield</div>
                  <div className={`text-sm font-semibold num ${(stock as any).dividendYield > 0 ? 'text-accent-yellow' : 'text-gray-400'}`}>
                    {((stock as any).dividendYield || 0).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">Volatility</div>
                  <div className={`text-sm font-semibold num ${(stock as any).volatility > 60 ? 'text-accent-red' : (stock as any).volatility > 30 ? 'text-accent-yellow' : 'text-accent-green'}`}>
                    {(stock as any).volatility}%
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">Founded</div>
                  <div className="text-sm font-semibold text-gray-300">{(stock as any).founded || '-'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">Employees</div>
                  <div className="text-sm font-semibold text-gray-300 num">{(stock as any).employees ? ((stock as any).employees / 1000).toFixed(0) + 'K' : '-'}</div>
                </div>
              </div>
            </Card>
          )}

          {/* Company description */}
          {(stock as any).description && (
            <Card padding="md">
              <p className="text-xs text-gray-400 leading-relaxed">{(stock as any).description}</p>
            </Card>
          )}
        </div>

        {/* Trading panel */}
        <div className="space-y-4">
          {/* Current position */}
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
            {/* Buy/Sell tabs */}
            <div className="flex gap-1 mb-4">
              <button
                onClick={() => setTradeTab('buy')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                  tradeTab === 'buy' ? 'bg-accent-green text-white' : 'bg-dark-400 text-gray-400 hover:text-white'
                }`}
              >
                BUY
              </button>
              <button
                onClick={() => setTradeTab('sell')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                  tradeTab === 'sell' ? 'bg-accent-red text-white' : 'bg-dark-400 text-gray-400 hover:text-white'
                }`}
              >
                SELL
              </button>
            </div>

            {tradeTab === 'buy' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1.5">Shares to Buy</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      value={buyShares}
                      onChange={e => setBuyShares(e.target.value)}
                      className="flex-1 bg-dark-600 border border-dark-400 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-green num"
                    />
                    <button onClick={handleMaxBuy} className="px-2 py-1 bg-dark-400 text-gray-400 hover:text-white rounded text-[10px] transition-colors">
                      MAX
                    </button>
                  </div>
                </div>
                <div className="bg-dark-600 rounded-lg p-3 space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-500">Price per share</span>
                    <span className="text-white num">${stock.currentPrice < 10 ? stock.currentPrice.toFixed(4) : stock.currentPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-500">Total Cost</span>
                    <span className="text-white font-semibold num">{formatCurrency(buyCost)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] pt-1 border-t border-dark-400">
                    <span className="text-gray-500">Cash Available</span>
                    <span className={`font-semibold num ${player.finances.cash >= buyCost ? 'text-accent-green' : 'text-accent-red'}`}>
                      {formatCurrency(player.finances.cash)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="success"
                  fullWidth
                  disabled={!canBuy}
                  onClick={handleBuy}
                  size="md"
                >
                  {canBuy ? `Buy ${buyAmt} shares` : 'Insufficient Funds'}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1.5">Shares to Sell</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      max={holding?.shares || 0}
                      value={sellShares}
                      onChange={e => setSellShares(e.target.value)}
                      className="flex-1 bg-dark-600 border border-dark-400 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-red num"
                    />
                    <button onClick={handleMaxSell} className="px-2 py-1 bg-dark-400 text-gray-400 hover:text-white rounded text-[10px] transition-colors">
                      ALL
                    </button>
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
                  {holding && (
                    <div className="flex justify-between text-[10px] pt-1 border-t border-dark-400">
                      <span className="text-gray-500">Est. P&L</span>
                      <span className={`font-semibold num ${sellProceeds - holding.averageCost * sellAmt >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                        {formatCurrency(sellProceeds - holding.averageCost * sellAmt)}
                      </span>
                    </div>
                  )}
                </div>
                <Button
                  variant="danger"
                  fullWidth
                  disabled={!canSell}
                  onClick={handleSell}
                  size="md"
                >
                  {canSell ? `Sell ${sellAmt} shares` : !holding ? 'No Position' : 'Invalid Amount'}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
