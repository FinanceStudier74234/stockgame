import React, { useState, useMemo } from 'react';
import { BarChart2, Search, TrendingDown, Clock, X, ArrowDownUp } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { formatCurrency, formatPercent } from '../../utils/formatting';
import { LimitOrder } from '../../types';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import MiniChart from '../ui/MiniChart';
import Modal from '../ui/Modal';

function LimitOrderModal({
  isOpen,
  onClose,
  ticker,
  currentPrice,
}: {
  isOpen: boolean;
  onClose: () => void;
  ticker: string;
  currentPrice: number;
}) {
  const { player, placeLimitOrder } = useGameStore();
  const [orderType, setOrderType] = useState<'limit' | 'stop_loss' | 'trailing_stop'>('limit');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [shares, setShares] = useState(10);
  const [limitPrice, setLimitPrice] = useState(currentPrice);
  const [stopPrice, setStopPrice] = useState(currentPrice * 0.95);
  const [trailingPct, setTrailingPct] = useState(5);
  const [expiryDays, setExpiryDays] = useState(30);

  if (!player) return null;

  const handlePlace = () => {
    placeLimitOrder({
      ticker,
      assetType: 'stock',
      orderType,
      side,
      shares,
      limitPrice: orderType === 'limit' ? limitPrice : undefined,
      stopPrice: orderType === 'stop_loss' ? stopPrice : undefined,
      trailingPercent: orderType === 'trailing_stop' ? trailingPct : undefined,
      expiryDays,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Place Order: ${ticker}`} size="sm">
      <div className="space-y-4">
        {/* Order type */}
        <div>
          <div className="text-[10px] text-gray-500 uppercase mb-1.5">Order Type</div>
          <div className="grid grid-cols-3 gap-1.5">
            {(['limit', 'stop_loss', 'trailing_stop'] as const).map(t => (
              <button
                key={t}
                onClick={() => setOrderType(t)}
                className={`py-2 rounded-lg text-[10px] font-semibold transition-all ${
                  orderType === t ? 'bg-accent-blue text-white' : 'bg-dark-500 text-gray-400 hover:text-white'
                }`}
              >
                {t === 'trailing_stop' ? 'Trailing Stop' : t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        {/* Side */}
        <div className="flex gap-2">
          <button
            onClick={() => setSide('buy')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${side === 'buy' ? 'bg-accent-green text-white' : 'bg-dark-500 text-gray-400 hover:text-white'}`}
          >
            BUY
          </button>
          <button
            onClick={() => setSide('sell')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${side === 'sell' ? 'bg-accent-red text-white' : 'bg-dark-500 text-gray-400 hover:text-white'}`}
          >
            SELL
          </button>
        </div>

        {/* Current price reference */}
        <div className="text-[10px] text-gray-500 text-center">
          Current price: <span className="text-white font-bold">${currentPrice.toFixed(2)}</span>
        </div>

        {/* Shares */}
        <div>
          <div className="text-[10px] text-gray-500 uppercase mb-1">Shares</div>
          <input
            type="number"
            value={shares}
            min={1}
            onChange={e => setShares(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full bg-dark-600 border border-dark-400 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
          />
        </div>

        {/* Price inputs based on type */}
        {orderType === 'limit' && (
          <div>
            <div className="text-[10px] text-gray-500 uppercase mb-1">
              Limit Price {side === 'buy' ? '(Buy if price ≤)' : '(Sell if price ≥)'}
            </div>
            <input
              type="number"
              value={limitPrice.toFixed(2)}
              step="0.01"
              onChange={e => setLimitPrice(parseFloat(e.target.value) || currentPrice)}
              className="w-full bg-dark-600 border border-dark-400 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
            />
          </div>
        )}

        {orderType === 'stop_loss' && (
          <div>
            <div className="text-[10px] text-gray-500 uppercase mb-1">Stop Price (Trigger at)</div>
            <input
              type="number"
              value={stopPrice.toFixed(2)}
              step="0.01"
              onChange={e => setStopPrice(parseFloat(e.target.value) || currentPrice)}
              className="w-full bg-dark-600 border border-dark-400 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
            />
          </div>
        )}

        {orderType === 'trailing_stop' && (
          <div>
            <div className="text-[10px] text-gray-500 uppercase mb-1">Trailing % (Stop if price drops by)</div>
            <input
              type="number"
              value={trailingPct}
              step="0.5"
              min={0.5}
              max={50}
              onChange={e => setTrailingPct(parseFloat(e.target.value) || 5)}
              className="w-full bg-dark-600 border border-dark-400 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
            />
          </div>
        )}

        {/* Expiry */}
        <div>
          <div className="text-[10px] text-gray-500 uppercase mb-1">Expires After (days)</div>
          <div className="flex gap-1.5">
            {[7, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => setExpiryDays(d)}
                className={`flex-1 py-1.5 rounded text-[10px] font-semibold transition-all ${expiryDays === d ? 'bg-accent-blue text-white' : 'bg-dark-500 text-gray-400 hover:text-white'}`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant={side === 'buy' ? 'success' : 'danger'} fullWidth onClick={handlePlace}>
            Place {side === 'buy' ? 'Buy' : 'Sell'} Order
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ShortModal({
  isOpen,
  onClose,
  ticker,
  currentPrice,
}: {
  isOpen: boolean;
  onClose: () => void;
  ticker: string;
  currentPrice: number;
}) {
  const { player, shortSell } = useGameStore();
  const [shares, setShares] = useState(10);

  if (!player) return null;

  const marginRequired = currentPrice * shares * 0.5;
  const canAfford = player.finances.cash >= marginRequired;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Short Sell: ${ticker}`} size="sm">
      <div className="space-y-4">
        <div className="p-3 bg-accent-red/10 border border-accent-red/20 rounded-lg text-xs text-accent-red">
          ⚠️ Short selling is high risk. You profit when the price falls but face unlimited upside risk.
        </div>

        <div className="text-center">
          <div className="text-[10px] text-gray-500">Current Price</div>
          <div className="text-2xl font-bold text-white">${currentPrice.toFixed(2)}</div>
        </div>

        <div>
          <div className="text-[10px] text-gray-500 uppercase mb-1">Shares to Short</div>
          <input
            type="number"
            value={shares}
            min={1}
            onChange={e => setShares(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full bg-dark-600 border border-dark-400 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-dark-600 rounded-lg p-2 text-center">
            <div className="text-[9px] text-gray-500">Position Value</div>
            <div className="text-xs font-bold text-white num">{formatCurrency(currentPrice * shares, true)}</div>
          </div>
          <div className={`bg-dark-600 rounded-lg p-2 text-center ${!canAfford ? 'border border-accent-red/30' : ''}`}>
            <div className="text-[9px] text-gray-500">Margin Required (50%)</div>
            <div className={`text-xs font-bold num ${canAfford ? 'text-accent-yellow' : 'text-accent-red'}`}>
              {formatCurrency(marginRequired, true)}
            </div>
          </div>
        </div>

        <div className="text-[10px] text-gray-500">
          Margin call triggered if loss exceeds 30% of collateral.
          Interest rate: <span className="text-white">8%/year</span>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="danger" fullWidth disabled={!canAfford} onClick={() => { shortSell(ticker, shares); onClose(); }}>
            {canAfford ? `Short ${shares} Shares` : 'Insufficient Margin'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function TradingScreen() {
  const { stocks, player, selectStock, setScreen, coverShort, cancelLimitOrder } = useGameStore();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'positions' | 'shorts' | 'orders'>('positions');
  const [limitOrderTicker, setLimitOrderTicker] = useState<string | null>(null);
  const [shortTicker, setShortTicker] = useState<string | null>(null);

  const allStocks = useMemo(() => {
    let list = Object.values(stocks);
    if (search) list = list.filter(s =>
      s.ticker.includes(search.toUpperCase()) || s.name.toLowerCase().includes(search.toLowerCase())
    );
    return list;
  }, [stocks, search]);

  const topGainers = [...Object.values(stocks)].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  const topLosers = [...Object.values(stocks)].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);
  const mostActive = [...Object.values(stocks)].sort((a, b) => b.volume - a.volume).slice(0, 5);

  const shortPositions = player ? Object.values(player.portfolio.shortPositions || {}) : [];
  const pendingOrders = player ? (player.portfolio.limitOrders || []).filter(o => o.status === 'pending') : [];
  const openHoldings = player ? Object.values(player.portfolio.holdings) : [];

  return (
    <div className="screen-content h-full overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-lg font-bold text-white">Trading Desk</h1>
        <Badge variant="green" size="xs" pulse>LIVE</Badge>
      </div>

      {/* Market summary row */}
      <div className="grid grid-cols-3 gap-3">
        <Card title="Top Gainers" padding="sm">
          <div className="space-y-1 px-1 pb-1">
            {topGainers.map(s => (
              <button key={s.ticker} onClick={() => selectStock(s.ticker)} className="w-full flex items-center justify-between py-1.5 hover:bg-dark-400 rounded px-1 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white w-12">{s.ticker}</span>
                  <MiniChart data={s.priceHistory.slice(-15)} height={18} width={40} />
                </div>
                <Badge variant="green" size="xs">{formatPercent(s.changePercent, 1)}</Badge>
              </button>
            ))}
          </div>
        </Card>
        <Card title="Top Losers" padding="sm">
          <div className="space-y-1 px-1 pb-1">
            {topLosers.map(s => (
              <button key={s.ticker} onClick={() => selectStock(s.ticker)} className="w-full flex items-center justify-between py-1.5 hover:bg-dark-400 rounded px-1 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white w-12">{s.ticker}</span>
                  <MiniChart data={s.priceHistory.slice(-15)} height={18} width={40} />
                </div>
                <Badge variant="red" size="xs">{formatPercent(s.changePercent, 1)}</Badge>
              </button>
            ))}
          </div>
        </Card>
        <Card title="Most Active" padding="sm">
          <div className="space-y-1 px-1 pb-1">
            {mostActive.map(s => (
              <button key={s.ticker} onClick={() => selectStock(s.ticker)} className="w-full flex items-center justify-between py-1.5 hover:bg-dark-400 rounded px-1 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white w-12">{s.ticker}</span>
                  <span className="text-[10px] text-gray-500 num">{(s.volume / 1e6).toFixed(1)}M</span>
                </div>
                <span className={`text-[10px] font-semibold num ${s.changePercent >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                  {formatPercent(s.changePercent, 1)}
                </span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick search */}
      <Card title="Quick Trade" padding="md">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search ticker..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-dark-600 border border-dark-400 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent-blue"
            />
          </div>
          <Button variant="primary" size="md" onClick={() => setScreen('market')}>Full Market</Button>
        </div>

        {search && (
          <div className="mt-3 space-y-1 max-h-52 overflow-y-auto">
            {allStocks.slice(0, 8).map(s => (
              <div key={s.ticker} className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-400 transition-colors">
                <button onClick={() => { selectStock(s.ticker); setSearch(''); }} className="flex-1 text-left flex items-center gap-2">
                  <span className="text-xs font-bold text-white w-12">{s.ticker}</span>
                  <span className="text-[10px] text-gray-500 truncate flex-1">{s.name}</span>
                  <span className="text-xs text-white num">${s.currentPrice.toFixed(2)}</span>
                  <span className={`text-[10px] num ${s.changePercent >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                    {formatPercent(s.changePercent, 2)}
                  </span>
                </button>
                <div className="flex gap-1">
                  <button
                    onClick={() => setLimitOrderTicker(s.ticker)}
                    className="text-[9px] bg-dark-500 hover:bg-accent-blue/20 text-gray-400 hover:text-accent-blue px-2 py-1 rounded transition-colors"
                    title="Place limit order"
                  >
                    <Clock size={10} />
                  </button>
                  <button
                    onClick={() => setShortTicker(s.ticker)}
                    className="text-[9px] bg-dark-500 hover:bg-accent-red/20 text-gray-400 hover:text-accent-red px-2 py-1 rounded transition-colors"
                    title="Short sell"
                  >
                    <TrendingDown size={10} />
                  </button>
                </div>
              </div>
            ))}
            {allStocks.length === 0 && <div className="text-xs text-gray-500 text-center py-4">No results</div>}
          </div>
        )}
      </Card>

      {/* Positions tabs */}
      <div className="flex gap-1.5">
        <button
          onClick={() => setTab('positions')}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${tab === 'positions' ? 'bg-accent-blue text-white' : 'bg-dark-400 text-gray-400 hover:text-white'}`}
        >
          Positions ({openHoldings.length})
        </button>
        <button
          onClick={() => setTab('shorts')}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${tab === 'shorts' ? 'bg-accent-red text-white' : 'bg-dark-400 text-gray-400 hover:text-white'}`}
        >
          <TrendingDown size={10} className="inline mr-1" />
          Shorts ({shortPositions.length})
        </button>
        <button
          onClick={() => setTab('orders')}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${tab === 'orders' ? 'bg-accent-yellow text-dark-900' : 'bg-dark-400 text-gray-400 hover:text-white'}`}
        >
          <Clock size={10} className="inline mr-1" />
          Orders ({pendingOrders.length})
        </button>
      </div>

      {/* POSITIONS */}
      {tab === 'positions' && (
        <Card title="Open Positions" padding="none">
          {openHoldings.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">No open positions. Start trading!</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-400">
                  <th className="text-left px-4 py-2.5 text-[10px] text-gray-500 uppercase">Ticker</th>
                  <th className="text-right px-3 py-2.5 text-[10px] text-gray-500 uppercase">Shares</th>
                  <th className="text-right px-3 py-2.5 text-[10px] text-gray-500 uppercase">Price</th>
                  <th className="text-right px-3 py-2.5 text-[10px] text-gray-500 uppercase">Value</th>
                  <th className="text-right px-3 py-2.5 text-[10px] text-gray-500 uppercase">P&L</th>
                  <th className="px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {openHoldings.map(h => (
                  <tr key={h.ticker} className="border-b border-dark-600 hover:bg-dark-600 transition-colors">
                    <td className="px-4 py-3 text-xs font-bold text-white">{h.ticker}</td>
                    <td className="px-3 py-3 text-right text-xs text-gray-300 num">{h.shares}</td>
                    <td className="px-3 py-3 text-right text-xs text-white num">${h.currentPrice.toFixed(2)}</td>
                    <td className="px-3 py-3 text-right text-xs text-white num">{formatCurrency(h.marketValue, true)}</td>
                    <td className="px-3 py-3 text-right">
                      <span className={`text-xs font-semibold num ${h.unrealizedPnL >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                        {h.unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(h.unrealizedPnL, true)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1.5 justify-end">
                        <button onClick={() => selectStock(h.ticker)} className="text-[10px] text-accent-blue hover:text-white transition-colors">Trade</button>
                        <button onClick={() => setLimitOrderTicker(h.ticker)} className="text-[10px] text-accent-yellow hover:text-white transition-colors">Order</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {/* SHORT POSITIONS */}
      {tab === 'shorts' && (
        <Card title="Short Positions" padding="none">
          {shortPositions.length === 0 ? (
            <div className="text-center py-8">
              <TrendingDown size={32} className="text-gray-600 mx-auto mb-2" />
              <div className="text-sm text-gray-500">No short positions.</div>
              <div className="text-[10px] text-gray-600 mt-1">Use the search bar to short a stock.</div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-400">
                  <th className="text-left px-4 py-2.5 text-[10px] text-gray-500 uppercase">Ticker</th>
                  <th className="text-right px-3 py-2.5 text-[10px] text-gray-500 uppercase">Shares</th>
                  <th className="text-right px-3 py-2.5 text-[10px] text-gray-500 uppercase">Entry</th>
                  <th className="text-right px-3 py-2.5 text-[10px] text-gray-500 uppercase">Current</th>
                  <th className="text-right px-3 py-2.5 text-[10px] text-gray-500 uppercase">P&L</th>
                  <th className="px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {shortPositions.map(s => (
                  <tr key={s.ticker} className="border-b border-dark-600 hover:bg-dark-600 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-xs font-bold text-white">{s.ticker}</div>
                      <div className="text-[9px] text-gray-600 num">Int: ${s.interestAccrued.toFixed(2)}</div>
                    </td>
                    <td className="px-3 py-3 text-right text-xs text-gray-300 num">{s.shares}</td>
                    <td className="px-3 py-3 text-right text-xs text-gray-400 num">${s.entryPrice.toFixed(2)}</td>
                    <td className="px-3 py-3 text-right text-xs text-white num">${s.currentPrice.toFixed(2)}</td>
                    <td className="px-3 py-3 text-right">
                      <span className={`text-xs font-semibold num ${s.unrealizedPnL >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                        {s.unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(s.unrealizedPnL, true)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => coverShort(s.ticker, s.shares)}
                        className="text-[10px] text-accent-red hover:text-white transition-colors font-semibold"
                      >
                        Cover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {/* LIMIT ORDERS */}
      {tab === 'orders' && (
        <Card title="Pending Orders" padding="none">
          {pendingOrders.length === 0 ? (
            <div className="text-center py-8">
              <Clock size={32} className="text-gray-600 mx-auto mb-2" />
              <div className="text-sm text-gray-500">No pending orders.</div>
              <div className="text-[10px] text-gray-600 mt-1">Use the search bar to place a limit or stop order.</div>
            </div>
          ) : (
            <div>
              {pendingOrders.map(order => (
                <div key={order.id} className="flex items-center gap-3 px-4 py-3 border-b border-dark-600 hover:bg-dark-600 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-white">{order.ticker}</span>
                      <Badge variant={order.side === 'buy' ? 'green' : 'red'} size="xs">{order.side.toUpperCase()}</Badge>
                      <Badge variant="gray" size="xs">{order.orderType.replace(/_/g, ' ')}</Badge>
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {order.shares} shares ·{' '}
                      {order.orderType === 'limit' && order.limitPrice ? `Limit: $${order.limitPrice.toFixed(2)}` : ''}
                      {order.orderType === 'stop_loss' && order.stopPrice ? `Stop: $${order.stopPrice.toFixed(2)}` : ''}
                      {order.orderType === 'trailing_stop' ? `Trail: ${order.trailingPercent}%` : ''}
                      {order.expiryDays ? ` · Exp: ${order.expiryDays}d` : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => cancelLimitOrder(order.id)}
                    className="text-gray-500 hover:text-accent-red transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 border-t border-dark-500">
            <div className="text-[10px] text-gray-600">
              Orders auto-fill when price conditions are met. Use stop-loss orders to protect positions.
            </div>
          </div>
        </Card>
      )}

      {/* Modals */}
      {limitOrderTicker && (
        <LimitOrderModal
          isOpen={!!limitOrderTicker}
          onClose={() => setLimitOrderTicker(null)}
          ticker={limitOrderTicker}
          currentPrice={stocks[limitOrderTicker]?.currentPrice || 0}
        />
      )}
      {shortTicker && (
        <ShortModal
          isOpen={!!shortTicker}
          onClose={() => setShortTicker(null)}
          ticker={shortTicker}
          currentPrice={stocks[shortTicker]?.currentPrice || 0}
        />
      )}
    </div>
  );
}
