import React, { useState, useMemo } from 'react';
import { Search, TrendingUp, TrendingDown, Eye, EyeOff, Activity } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { formatCurrency, formatPercent } from '../../utils/formatting';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import MiniChart from '../ui/MiniChart';
import StockDetail from './StockDetail';
import { Sector } from '../../types';

const RATING_SHORT: Record<string, { label: string; color: string }> = {
  strong_buy: { label: 'SB', color: 'text-accent-green' },
  buy:        { label: 'B',  color: 'text-accent-green/70' },
  hold:       { label: 'H',  color: 'text-accent-yellow' },
  sell:       { label: 'S',  color: 'text-accent-red/70' },
  strong_sell:{ label: 'SS', color: 'text-accent-red' },
};

const SECTORS: { id: string; label: string }[] = [
  { id: 'all', label: 'All Sectors' },
  { id: 'technology', label: 'Technology' },
  { id: 'ai', label: 'AI' },
  { id: 'semiconductors', label: 'Semis' },
  { id: 'banking', label: 'Banking' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'biotech', label: 'Biotech' },
  { id: 'energy', label: 'Energy' },
  { id: 'defense', label: 'Defense' },
  { id: 'consumer', label: 'Consumer' },
  { id: 'communications', label: 'Comms' },
  { id: 'industrials', label: 'Industrials' },
  { id: 'utilities', label: 'Utilities' },
  { id: 'realestate', label: 'Real Estate' },
];

export default function MarketScreen() {
  const { stocks, etfs, crypto, player, selectStock, ui, addToWatchlist, removeFromWatchlist, setScreen, time, economy } = useGameStore();
  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [sortBy, setSortBy] = useState<'ticker' | 'price' | 'change' | 'volume'>('change');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [tab, setTab] = useState<'stocks' | 'etfs' | 'crypto'>('stocks');

  // Market pulse stats
  const marketPulse = useMemo(() => {
    const all = Object.values(stocks);
    const gainers = all.filter(s => s.changePercent > 0).length;
    const losers = all.filter(s => s.changePercent < 0).length;
    const avgChange = all.reduce((sum, s) => sum + s.changePercent, 0) / all.length;

    // Sector performance
    const sectorMap: Record<string, { sum: number; count: number }> = {};
    for (const s of all) {
      if (!sectorMap[s.sector]) sectorMap[s.sector] = { sum: 0, count: 0 };
      sectorMap[s.sector].sum += s.changePercent;
      sectorMap[s.sector].count++;
    }
    const sectors = Object.entries(sectorMap)
      .map(([sec, v]) => ({ sector: sec, avg: v.sum / v.count }))
      .sort((a, b) => b.avg - a.avg);
    const hotSector = sectors[0];
    const coldSector = sectors[sectors.length - 1];

    // Upcoming earnings in next 7 days across all stocks
    const earningsThisWeek = all.filter(s => s.nextEarningsDay && s.nextEarningsDay - time.totalDays >= 0 && s.nextEarningsDay - time.totalDays <= 7).length;

    return { gainers, losers, total: all.length, avgChange, hotSector, coldSector, earningsThisWeek };
  }, [stocks, time.totalDays]);

  const allStocks = useMemo(() => {
    let list = Object.values(stocks);
    if (search) list = list.filter(s => s.ticker.includes(search.toUpperCase()) || s.name.toLowerCase().includes(search.toLowerCase()));
    if (selectedSector !== 'all') list = list.filter(s => s.sector === selectedSector);
    list.sort((a, b) => {
      const mult = sortDir === 'desc' ? -1 : 1;
      if (sortBy === 'ticker') return mult * a.ticker.localeCompare(b.ticker);
      if (sortBy === 'price') return mult * (a.currentPrice - b.currentPrice);
      if (sortBy === 'change') return mult * (a.changePercent - b.changePercent);
      if (sortBy === 'volume') return mult * (a.volume - b.volume);
      return 0;
    });
    return list;
  }, [stocks, search, selectedSector, sortBy, sortDir]);

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const watchlist = player?.portfolio.watchlist || [];

  if (ui.selectedStock) {
    return <StockDetail ticker={ui.selectedStock} onClose={() => selectStock(null)} />;
  }

  return (
    <div className="screen-content h-full flex flex-col overflow-hidden">
      {/* Market Pulse Banner */}
      <div className="flex-shrink-0 px-4 pt-3 pb-0">
        <div className="bg-dark-700 border border-dark-500 rounded-xl px-4 py-2.5 flex items-center gap-6 overflow-x-auto">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Activity size={13} className={marketPulse.avgChange >= 0 ? 'text-accent-green' : 'text-accent-red'} />
            <span className="text-[10px] text-gray-500 uppercase">Market</span>
            <span className={`text-xs font-bold num ${marketPulse.avgChange >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
              {marketPulse.avgChange >= 0 ? '+' : ''}{marketPulse.avgChange.toFixed(2)}% avg
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-bold text-accent-green num">{marketPulse.gainers}↑</span>
            <div className="w-20 h-2 bg-dark-400 rounded-full overflow-hidden flex-shrink-0">
              <div
                className="h-full bg-accent-green/70 rounded-full"
                style={{ width: `${(marketPulse.gainers / marketPulse.total) * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-accent-red num">{marketPulse.losers}↓</span>
          </div>
          {marketPulse.hotSector && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[10px] text-gray-500">Hot:</span>
              <span className="text-[10px] font-semibold text-accent-green capitalize">{marketPulse.hotSector.sector}</span>
              <span className="text-[10px] text-accent-green num">+{marketPulse.hotSector.avg.toFixed(1)}%</span>
            </div>
          )}
          {marketPulse.coldSector && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[10px] text-gray-500">Weak:</span>
              <span className="text-[10px] font-semibold text-accent-red capitalize">{marketPulse.coldSector.sector}</span>
              <span className="text-[10px] text-accent-red num">{marketPulse.coldSector.avg.toFixed(1)}%</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] text-gray-500">VIX:</span>
            <span className={`text-[10px] font-semibold num ${economy.vixLevel > 30 ? 'text-accent-red' : economy.vixLevel > 20 ? 'text-accent-yellow' : 'text-accent-green'}`}>
              {economy.vixLevel.toFixed(1)}
            </span>
          </div>
          {marketPulse.earningsThisWeek > 0 && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[10px] text-gray-500">📊 Earnings this week:</span>
              <span className="text-[10px] font-bold text-accent-blue">{marketPulse.earningsThisWeek} stocks</span>
            </div>
          )}
        </div>
      </div>

      {/* Header controls */}
      <div className="flex-shrink-0 p-4 pb-2 space-y-3">
        {/* Tabs */}
        <div className="flex gap-1">
          {(['stocks', 'etfs', 'crypto'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                tab === t ? 'bg-accent-blue text-white' : 'bg-dark-400 text-gray-400 hover:text-white'
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Search and filter row */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search ticker or name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-dark-600 border border-dark-400 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-accent-blue"
            />
          </div>
          {tab === 'stocks' && (
            <div className="flex gap-1 overflow-x-auto">
              {SECTORS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSector(s.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                    selectedSector === s.id ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30' : 'bg-dark-400 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {tab === 'stocks' && (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-400">
                  <th className="text-left px-4 py-2.5 text-[10px] text-gray-500 uppercase font-semibold">
                    <button onClick={() => handleSort('ticker')} className="hover:text-gray-300">
                      Ticker {sortBy === 'ticker' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                    </button>
                  </th>
                  <th className="text-left px-3 py-2.5 text-[10px] text-gray-500 uppercase font-semibold">Sector</th>
                  <th className="text-right px-3 py-2.5 text-[10px] text-gray-500 uppercase font-semibold">
                    <button onClick={() => handleSort('price')} className="hover:text-gray-300">
                      Price {sortBy === 'price' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                    </button>
                  </th>
                  <th className="text-right px-3 py-2.5 text-[10px] text-gray-500 uppercase font-semibold">
                    <button onClick={() => handleSort('change')} className="hover:text-gray-300">
                      Change {sortBy === 'change' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                    </button>
                  </th>
                  <th className="text-right px-3 py-2.5 text-[10px] text-gray-500 uppercase font-semibold hidden lg:table-cell">Chart</th>
                  <th className="text-right px-3 py-2.5 text-[10px] text-gray-500 uppercase font-semibold hidden xl:table-cell">Mkt Cap</th>
                  <th className="text-right px-3 py-2.5 text-[10px] text-gray-500 uppercase font-semibold hidden xl:table-cell">P/E</th>
                  <th className="text-center px-3 py-2.5 text-[10px] text-gray-500 uppercase font-semibold hidden lg:table-cell">Rating</th>
                  <th className="px-3 py-2.5 text-[10px] text-gray-500 uppercase font-semibold text-center">Watch</th>
                  <th className="px-3 py-2.5 text-[10px] text-gray-500 uppercase font-semibold">Trade</th>
                </tr>
              </thead>
              <tbody>
                {allStocks.map(stock => {
                  const inWatchlist = watchlist.includes(stock.ticker);
                  const holding = player?.portfolio.holdings[stock.ticker];
                  return (
                    <tr
                      key={stock.ticker}
                      className="border-b border-dark-600 hover:bg-dark-600 cursor-pointer transition-colors"
                      onClick={() => selectStock(stock.ticker)}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="text-xs font-bold text-white">{stock.ticker}</div>
                            <div className="text-[10px] text-gray-500 max-w-[120px] truncate">{stock.name}</div>
                          </div>
                          {holding && (
                            <Badge variant="blue" size="xs">{holding.shares} shares</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge variant="gray" size="xs">{stock.sector}</Badge>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="text-xs font-semibold text-white num">
                          ${stock.currentPrice < 100 ? stock.currentPrice.toFixed(2) : stock.currentPrice.toFixed(0)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className={`text-xs font-semibold num ${stock.changePercent >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                          {formatPercent(stock.changePercent, 2)}
                        </div>
                        <div className={`text-[10px] num ${stock.changeDollar >= 0 ? 'text-accent-green/70' : 'text-accent-red/70'}`}>
                          {stock.changeDollar >= 0 ? '+' : ''}${Math.abs(stock.changeDollar) < 1 ? stock.changeDollar.toFixed(4) : stock.changeDollar.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right hidden lg:table-cell" onClick={e => e.stopPropagation()}>
                        <MiniChart data={stock.priceHistory.slice(-20)} height={28} width={80} />
                      </td>
                      <td className="px-3 py-2.5 text-right hidden xl:table-cell">
                        <span className="text-xs text-gray-400 num">{formatCurrency(stock.marketCap, true)}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right hidden xl:table-cell">
                        <span className="text-xs text-gray-400 num">{stock.peRatio > 0 ? stock.peRatio.toFixed(1) : 'N/A'}</span>
                      </td>
                      <td className="px-3 py-2.5 text-center hidden lg:table-cell">
                        {stock.analystRating ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={`text-[10px] font-bold ${RATING_SHORT[stock.analystRating]?.color ?? 'text-gray-500'}`}>
                              {RATING_SHORT[stock.analystRating]?.label ?? '–'}
                            </span>
                            {stock.nextEarningsDay && stock.nextEarningsDay - time.totalDays >= 0 && stock.nextEarningsDay - time.totalDays <= 7 && (
                              <span className="text-[9px] text-accent-blue">📊 {stock.nextEarningsDay - time.totalDays}d</span>
                            )}
                          </div>
                        ) : <span className="text-[10px] text-gray-600">–</span>}
                      </td>
                      <td className="px-3 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => inWatchlist ? removeFromWatchlist(stock.ticker) : addToWatchlist(stock.ticker)}
                          className={`p-1.5 rounded ${inWatchlist ? 'text-accent-yellow' : 'text-gray-600 hover:text-gray-400'}`}
                        >
                          {inWatchlist ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                      </td>
                      <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => selectStock(stock.ticker)}
                          className="px-2.5 py-1 bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/30 rounded text-[10px] font-medium border border-accent-blue/20 transition-all"
                        >
                          Trade
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'etfs' && (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-400">
                  <th className="text-left px-4 py-2.5 text-[10px] text-gray-500 uppercase font-semibold">ETF</th>
                  <th className="text-right px-3 py-2.5 text-[10px] text-gray-500 uppercase font-semibold">Price</th>
                  <th className="text-right px-3 py-2.5 text-[10px] text-gray-500 uppercase font-semibold">Change</th>
                  <th className="text-right px-3 py-2.5 text-[10px] text-gray-500 uppercase font-semibold">Yield</th>
                  <th className="text-right px-3 py-2.5 text-[10px] text-gray-500 uppercase font-semibold">Exp Ratio</th>
                  <th className="px-3 py-2.5">Trade</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(etfs).map(etf => (
                  <tr key={etf.ticker} className="border-b border-dark-600 hover:bg-dark-600 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-xs font-bold text-white">{etf.ticker}</div>
                      <div className="text-[10px] text-gray-500">{etf.name}</div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-xs font-semibold text-white num">${etf.currentPrice.toFixed(2)}</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className={`text-xs font-semibold num ${etf.changePercent >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                        {formatPercent(etf.changePercent)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-xs text-accent-yellow num">{(etf.dividendYield * 100).toFixed(1)}%</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-xs text-gray-400 num">{(etf.expenseRatio * 100).toFixed(2)}%</span>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => selectStock(etf.ticker)}
                        className="px-2.5 py-1 bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/30 rounded text-[10px] font-medium border border-accent-blue/20"
                      >
                        Trade
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'crypto' && (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-400">
                  <th className="text-left px-4 py-2.5 text-[10px] text-gray-500 uppercase font-semibold">Asset</th>
                  <th className="text-right px-3 py-2.5 text-[10px] text-gray-500 uppercase font-semibold">Price</th>
                  <th className="text-right px-3 py-2.5 text-[10px] text-gray-500 uppercase font-semibold">24h Change</th>
                  <th className="text-right px-3 py-2.5 text-[10px] text-gray-500 uppercase font-semibold">Mkt Cap</th>
                  <th className="text-right px-3 py-2.5 text-[10px] text-gray-500 uppercase font-semibold">Volatility</th>
                  <th className="px-3 py-2.5">Trade</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(useGameStore.getState().crypto).map(c => (
                  <tr key={c.ticker} className="border-b border-dark-600 hover:bg-dark-600 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-xs font-bold text-white">{c.ticker}</div>
                      <div className="text-[10px] text-gray-500">{c.name}</div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-xs font-semibold text-white num">
                        ${c.currentPrice < 1 ? c.currentPrice.toFixed(4) : c.currentPrice < 100 ? c.currentPrice.toFixed(2) : c.currentPrice.toFixed(0)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className={`text-xs font-semibold num ${c.changePercent >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                        {formatPercent(c.changePercent)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-xs text-gray-400 num">{formatCurrency(c.marketCap, true)}</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Badge variant={c.volatility > 70 ? 'red' : c.volatility > 40 ? 'yellow' : 'green'} size="xs">
                        {c.volatility}%
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => selectStock(c.ticker)}
                        className="px-2.5 py-1 bg-accent-purple/20 text-accent-purple hover:bg-accent-purple/30 rounded text-[10px] font-medium border border-accent-purple/20"
                      >
                        Trade
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
