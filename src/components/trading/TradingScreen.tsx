import React, { useState, useMemo } from 'react';
import { BarChart2, TrendingUp, TrendingDown, Search } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useGameStore } from '../../store/gameStore';
import { formatCurrency, formatPercent } from '../../utils/formatting';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import MiniChart from '../ui/MiniChart';

export default function TradingScreen() {
  const { stocks, player, selectStock, setScreen } = useGameStore();
  const [search, setSearch] = useState('');

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

  return (
    <div className="screen-content h-full overflow-y-auto p-4 space-y-4">
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

      {/* Quick search + trade */}
      <Card title="Quick Trade" padding="md">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search ticker to trade..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-dark-600 border border-dark-400 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent-blue"
            />
          </div>
          <Button variant="primary" size="md" onClick={() => setScreen('market')}>
            Open Full Market
          </Button>
        </div>

        {search && (
          <div className="mt-3 space-y-1 max-h-64 overflow-y-auto">
            {allStocks.slice(0, 8).map(s => (
              <button
                key={s.ticker}
                onClick={() => { selectStock(s.ticker); setSearch(''); }}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-dark-400 transition-colors text-left"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{s.ticker}</span>
                    <span className="text-[10px] text-gray-500 truncate">{s.name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-white num">${s.currentPrice.toFixed(2)}</div>
                  <div className={`text-[10px] num ${s.changePercent >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                    {formatPercent(s.changePercent, 2)}
                  </div>
                </div>
              </button>
            ))}
            {allStocks.length === 0 && (
              <div className="text-xs text-gray-500 text-center py-4">No results found</div>
            )}
          </div>
        )}
      </Card>

      {/* Open positions */}
      {player && Object.keys(player.portfolio.holdings).length > 0 && (
        <Card title="Open Positions" padding="none">
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
              {Object.values(player.portfolio.holdings).map(h => (
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
                    <button
                      onClick={() => selectStock(h.ticker)}
                      className="text-[10px] text-accent-blue hover:text-white transition-colors"
                    >
                      Trade →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
