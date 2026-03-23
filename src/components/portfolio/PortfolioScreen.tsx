import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Percent, Activity } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { formatCurrency, formatPercent } from '../../utils/formatting';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="card p-2 border border-dark-300 shadow-xl text-xs">
      <div className="text-gray-400 mb-1">Day {label}</div>
      <div className="text-white font-semibold">{formatCurrency(payload[0].value)}</div>
    </div>
  );
};

export default function PortfolioScreen() {
  const { player, stocks, selectStock, setScreen } = useGameStore();
  if (!player) return null;

  const { portfolio } = player;
  const holdings = Object.values(portfolio.holdings);
  const historyData = portfolio.portfolioHistory.map((h, i) => ({ day: h.date, value: h.netWorth, portfolio: h.totalValue }));

  const totalReturn = portfolio.allTimeReturn;
  const isPositiveReturn = totalReturn >= 0;

  return (
    <div className="screen-content h-full overflow-y-auto p-4 space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        <Card padding="md" glowColor="green">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Portfolio Value</div>
          <div className="text-xl font-bold text-white num">{formatCurrency(portfolio.totalValue, true)}</div>
          <div className={`text-xs mt-1 num font-medium ${portfolio.dayChange >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
            {portfolio.dayChange >= 0 ? '+' : ''}{formatCurrency(portfolio.dayChange, true)} today
          </div>
        </Card>
        <Card padding="md">
          <div className="text-[10px] text-gray-500 uppercase mb-1">All-Time P&L</div>
          <div className={`text-xl font-bold num ${isPositiveReturn ? 'text-accent-green' : 'text-accent-red'}`}>
            {isPositiveReturn ? '+' : ''}{formatCurrency(totalReturn, true)}
          </div>
          <div className={`text-xs mt-1 num ${isPositiveReturn ? 'text-accent-green/70' : 'text-accent-red/70'}`}>
            {formatPercent(portfolio.allTimeReturnPercent)}
          </div>
        </Card>
        <Card padding="md">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Win Rate</div>
          <div className={`text-xl font-bold num ${portfolio.winRate >= 50 ? 'text-accent-green' : 'text-accent-red'}`}>
            {portfolio.winRate.toFixed(1)}%
          </div>
          <div className="text-xs mt-1 text-gray-500">{portfolio.tradeHistory.filter(t => (t.pnl || 0) > 0).length}/{portfolio.tradeHistory.filter(t => t.pnl !== undefined).length} winners</div>
        </Card>
        <Card padding="md">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Sharpe Ratio</div>
          <div className={`text-xl font-bold num ${portfolio.sharpeScore >= 1 ? 'text-accent-green' : portfolio.sharpeScore >= 0 ? 'text-accent-yellow' : 'text-accent-red'}`}>
            {portfolio.sharpeScore.toFixed(2)}
          </div>
          <div className="text-xs mt-1 text-gray-500">Max DD: {portfolio.maxDrawdown.toFixed(1)}%</div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Chart */}
        <Card title="Net Worth History" padding="md">
          {historyData.length < 2 ? (
            <div className="h-40 flex items-center justify-center text-xs text-gray-500">
              Start trading to see your history grow...
            </div>
          ) : (
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <defs>
                    <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" hide />
                  <YAxis tickFormatter={v => formatCurrency(v, true)} tick={{ fill: '#64748b', fontSize: 10 }} width={60} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="url(#netWorthGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Allocation */}
        <Card title="Holdings Allocation" padding="md">
          {holdings.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center gap-3 text-xs text-gray-500">
              <TrendingUp size={32} className="text-gray-600" />
              <p>No holdings yet. Go to the Market tab to invest.</p>
              <Button variant="primary" size="sm" onClick={() => setScreen('market')}>
                Open Market
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {holdings.sort((a, b) => b.marketValue - a.marketValue).slice(0, 8).map(h => {
                const pct = portfolio.totalValue > 0 ? (h.marketValue / portfolio.totalValue) * 100 : 0;
                return (
                  <div key={h.ticker} className="flex items-center gap-2">
                    <button
                      onClick={() => selectStock(h.ticker)}
                      className="text-xs font-bold text-accent-blue hover:text-blue-400 w-12 text-left"
                    >
                      {h.ticker}
                    </button>
                    <div className="flex-1 h-3 bg-dark-400 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: h.unrealizedPnL >= 0 ? '#10b981' : '#ef4444',
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 num w-8 text-right">{pct.toFixed(0)}%</span>
                    <span className={`text-[10px] font-semibold num w-16 text-right ${h.unrealizedPnL >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                      {formatPercent(h.unrealizedPnLPercent, 1)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Holdings table */}
      {holdings.length > 0 && (
        <Card title="Holdings" padding="none">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-400">
                {['Ticker', 'Shares', 'Avg Cost', 'Current', 'Value', 'Unreal P&L', '% Return', ''].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] text-gray-500 uppercase font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {holdings.sort((a, b) => b.marketValue - a.marketValue).map(h => (
                <tr key={h.ticker} className="border-b border-dark-600 hover:bg-dark-600 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-xs font-bold text-white">{h.ticker}</div>
                    <div className="text-[10px] text-gray-500 capitalize">{h.assetType}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-300 num">{h.shares}</td>
                  <td className="px-4 py-3 text-xs text-gray-300 num">${h.averageCost.toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-white num">${h.currentPrice.toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-white num">{formatCurrency(h.marketValue, true)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold num ${h.unrealizedPnL >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                      {h.unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(h.unrealizedPnL, true)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={h.unrealizedPnLPercent >= 0 ? 'green' : 'red'} size="xs">
                      {formatPercent(h.unrealizedPnLPercent, 1)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => selectStock(h.ticker)}
                      className="px-2 py-1 text-[10px] text-accent-blue hover:text-white bg-dark-400 hover:bg-accent-blue rounded transition-all"
                    >
                      Trade
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Trade history */}
      {portfolio.tradeHistory.length > 0 && (
        <Card title="Recent Trades" padding="none">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-400">
                {['Date', 'Action', 'Ticker', 'Shares', 'Price', 'Total', 'P&L'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] text-gray-500 uppercase font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {portfolio.tradeHistory.slice(0, 20).map(t => (
                <tr key={t.id} className="border-b border-dark-600 hover:bg-dark-600">
                  <td className="px-4 py-2.5 text-[10px] text-gray-500 num">Day {t.date}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={t.action === 'buy' ? 'blue' : 'red'} size="xs">
                      {t.action.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-xs font-bold text-white">{t.ticker}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-300 num">{t.shares}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-300 num">${t.price.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-300 num">{formatCurrency(t.total, true)}</td>
                  <td className="px-4 py-2.5">
                    {t.pnl !== undefined ? (
                      <span className={`text-xs font-semibold num ${t.pnl >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                        {t.pnl >= 0 ? '+' : ''}{formatCurrency(t.pnl, true)}
                      </span>
                    ) : <span className="text-xs text-gray-600">-</span>}
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
