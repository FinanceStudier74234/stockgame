import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Briefcase, BarChart2, AlertCircle, Star, Zap } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { formatCurrency, formatPercent, formatDate, getTierLabel } from '../../utils/formatting';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import StatBar from '../ui/StatBar';
import MiniChart from '../ui/MiniChart';
import Button from '../ui/Button';

export default function Dashboard() {
  const { player, economy, stocks, time, setScreen, events } = useGameStore();
  if (!player) return null;

  const netWorth = player.finances.totalNetWorth;
  const portfolioValue = player.portfolio.totalValue;
  const tier = getTierLabel(netWorth);

  const topMoverUp = useMemo(() => {
    return Object.values(stocks).sort((a, b) => b.changePercent - a.changePercent)[0];
  }, [stocks]);

  const topMoverDown = useMemo(() => {
    return Object.values(stocks).sort((a, b) => a.changePercent - b.changePercent)[0];
  }, [stocks]);

  const watchlistStocks = player.portfolio.watchlist
    .map(t => stocks[t])
    .filter(Boolean)
    .slice(0, 5);

  const recentBio = player.biographyEvents.slice(-4).reverse();

  return (
    <div className="screen-content h-full overflow-y-auto p-4 space-y-4">
      {/* Top row - key metrics */}
      <div className="grid grid-cols-4 gap-3">
        <Card padding="md" glowColor="green">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Net Worth</div>
              <div className={`text-xl font-bold num ${tier.color}`}>{formatCurrency(netWorth, true)}</div>
              <div className={`text-xs mt-1 font-medium ${tier.color}`}>{tier.label}</div>
            </div>
            <div className="p-2 rounded-lg bg-accent-green/10">
              <DollarSign size={18} className="text-accent-green" />
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Cash</div>
              <div className={`text-xl font-bold num ${player.finances.cash >= 0 ? 'text-white' : 'text-accent-red'}`}>
                {formatCurrency(player.finances.cash, true)}
              </div>
              <div className="text-xs mt-1 text-gray-500 num">
                {player.currentJob
                  ? `+$${player.currentJob.dailyWage.toFixed(0)}/day from work`
                  : 'No active income'}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-dark-400">
              <DollarSign size={18} className="text-gray-400" />
            </div>
          </div>
        </Card>

        <Card padding="md" glowColor={portfolioValue > 0 ? (player.portfolio.dayChange >= 0 ? 'green' : 'red') : 'none'}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Portfolio</div>
              <div className="text-xl font-bold text-white num">{formatCurrency(portfolioValue, true)}</div>
              <div className={`text-xs mt-1 num font-medium ${player.portfolio.dayChange >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                {player.portfolio.dayChange >= 0 ? '+' : ''}{formatCurrency(player.portfolio.dayChange, true)} today
              </div>
            </div>
            <div className={`p-2 rounded-lg ${player.portfolio.dayChange >= 0 ? 'bg-accent-green/10' : 'bg-accent-red/10'}`}>
              {player.portfolio.dayChange >= 0
                ? <TrendingUp size={18} className="text-accent-green" />
                : <TrendingDown size={18} className="text-accent-red" />
              }
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Job</div>
              <div className="text-sm font-bold text-white truncate max-w-[120px]">
                {player.currentJob ? player.currentJob.title : 'Unemployed'}
              </div>
              <div className="text-xs mt-1 text-gray-400 num">
                {player.currentJob ? `$${(player.currentJob.salary / 1000).toFixed(0)}K/yr` : 'Find work in Career tab'}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-dark-400">
              <Briefcase size={18} className="text-gray-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Left: Player stats */}
        <div className="space-y-3">
          <Card title="Character Stats" padding="sm">
            <div className="space-y-2 px-1 pb-1">
              <StatBar label="Intelligence" value={player.stats.intelligence} icon="🧠" />
              <StatBar label="Discipline" value={player.stats.discipline} icon="⚔️" />
              <StatBar label="Charisma" value={player.stats.charisma} icon="🗣️" />
              <StatBar label="Risk Tolerance" value={player.stats.riskTolerance} icon="⚡" />
              <StatBar label="Confidence" value={player.stats.confidence} icon="💪" />
              <StatBar label="Network" value={player.stats.network} icon="🌐" />
              <StatBar label="Reputation" value={player.stats.reputation} icon="⭐" />
            </div>
          </Card>

          <Card title="Key Skills" padding="sm">
            <div className="space-y-2 px-1 pb-1">
              <StatBar label="Finance" value={player.skills.finance} icon="📊" />
              <StatBar label="Trading Psych" value={player.skills.tradingPsychology} icon="🧠" />
              <StatBar label="Valuation" value={player.skills.valuation} icon="💡" />
              <StatBar label="Options" value={player.skills.options} icon="🎯" />
              <StatBar label="Leadership" value={player.skills.leadership} icon="👥" />
            </div>
          </Card>
        </div>

        {/* Center: Market & portfolio */}
        <div className="space-y-3">
          {/* Watchlist */}
          <Card title="Watchlist" padding="sm" headerRight={
            <button onClick={() => setScreen('market')} className="text-[10px] text-accent-blue hover:text-blue-400">View All →</button>
          }>
            <div className="space-y-1 px-1 pb-1">
              {watchlistStocks.length === 0 ? (
                <div className="text-xs text-gray-500 text-center py-4">
                  No stocks in watchlist. Go to Market to add some.
                </div>
              ) : watchlistStocks.map(stock => (
                <div key={stock.ticker} className="flex items-center gap-2 py-1.5 border-b border-dark-400 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{stock.ticker}</span>
                      <Badge variant={stock.changePercent >= 0 ? 'green' : 'red'} size="xs">
                        {formatPercent(stock.changePercent, 1)}
                      </Badge>
                    </div>
                    <div className="text-[10px] text-gray-500 truncate">{stock.name}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-semibold text-white num">${stock.currentPrice < 10 ? stock.currentPrice.toFixed(3) : stock.currentPrice.toFixed(2)}</div>
                    <MiniChart data={stock.priceHistory.slice(-20)} height={20} width={60} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Movers */}
          <Card title="Top Movers Today" padding="sm">
            <div className="space-y-2 px-1 pb-1">
              {topMoverUp && (
                <div className="flex items-center gap-2 p-2 bg-accent-green/5 rounded-lg border border-accent-green/10">
                  <TrendingUp size={14} className="text-accent-green flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{topMoverUp.ticker}</span>
                      <span className="text-[10px] text-gray-400 truncate">{topMoverUp.name}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-accent-green num">+{topMoverUp.changePercent.toFixed(2)}%</span>
                </div>
              )}
              {topMoverDown && (
                <div className="flex items-center gap-2 p-2 bg-accent-red/5 rounded-lg border border-accent-red/10">
                  <TrendingDown size={14} className="text-accent-red flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{topMoverDown.ticker}</span>
                      <span className="text-[10px] text-gray-400 truncate">{topMoverDown.name}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-accent-red num">{topMoverDown.changePercent.toFixed(2)}%</span>
                </div>
              )}
            </div>
          </Card>

          {/* Economy widget */}
          <Card title="Economy" padding="sm">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-1 pb-1">
              {[
                { label: 'Phase', value: economy.phase, isText: true },
                { label: 'GDP Growth', value: `${economy.gdpGrowth.toFixed(1)}%`, isText: true },
                { label: 'Inflation', value: `${economy.inflationRate.toFixed(1)}%`, isText: true },
                { label: 'Fed Rate', value: `${economy.federalFundsRate.toFixed(2)}%`, isText: true },
                { label: 'Unemployment', value: `${economy.unemploymentRate.toFixed(1)}%`, isText: true },
                { label: 'VIX', value: economy.vixLevel.toFixed(1), isText: true },
              ].map(item => (
                <div key={item.label}>
                  <div className="text-[9px] text-gray-600 uppercase">{item.label}</div>
                  <div className="text-xs font-semibold text-gray-200 capitalize">{item.value}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setScreen('economy')}
              className="mt-2 text-[10px] text-accent-blue hover:text-blue-400 px-1 transition-colors"
            >
              Full Economy Report →
            </button>
          </Card>
        </div>

        {/* Right: Biography, achievements */}
        <div className="space-y-3">
          {/* Level & XP */}
          <Card padding="sm">
            <div className="px-1 pb-1">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-xs text-gray-400">Level {player.level}</div>
                  <div className="text-lg font-bold text-white">{player.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-500">Age</div>
                  <div className="text-xl font-bold text-gray-200">{player.age}</div>
                </div>
              </div>
              <div className="w-full h-1.5 bg-dark-400 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent-blue to-accent-purple rounded-full transition-all duration-500"
                  style={{ width: `${(player.experiencePoints % 200) / 2}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                <span>XP: {player.experiencePoints.toLocaleString()}</span>
                <span>Next Level: {Math.ceil(player.experiencePoints / 200) * 200}</span>
              </div>
            </div>
          </Card>

          {/* Biography log */}
          <Card title="Life Events" padding="sm">
            <div className="space-y-2 px-1 pb-1">
              {recentBio.length === 0 ? (
                <div className="text-xs text-gray-500 text-center py-3">Your story begins here...</div>
              ) : recentBio.map((event, i) => (
                <div key={i} className={`
                  text-[11px] p-2 rounded border-l-2 leading-relaxed
                  ${event.type === 'good' ? 'border-l-accent-green bg-accent-green/5 text-gray-300' :
                    event.type === 'bad' ? 'border-l-accent-red bg-accent-red/5 text-gray-300' :
                    event.type === 'legendary' ? 'border-l-gold bg-gold/5 text-gray-200' :
                    'border-l-dark-300 bg-dark-600 text-gray-400'}
                `}>
                  {event.text}
                </div>
              ))}
            </div>
          </Card>

          {/* Recent achievements */}
          <Card title="Recent Achievements" padding="sm">
            <div className="space-y-1.5 px-1 pb-1">
              {Object.values(useGameStore.getState().achievements)
                .filter(a => a.dateEarned !== undefined)
                .sort((a, b) => (b.dateEarned || 0) - (a.dateEarned || 0))
                .slice(0, 4)
                .map(ach => (
                  <div key={ach.id} className="flex items-center gap-2">
                    <span className="text-base">{ach.icon}</span>
                    <div>
                      <div className="text-xs font-semibold text-white">{ach.title}</div>
                      <div className="text-[10px] text-gray-500">{ach.description}</div>
                    </div>
                  </div>
                ))
              }
              {Object.values(useGameStore.getState().achievements).filter(a => a.dateEarned).length === 0 && (
                <div className="text-xs text-gray-500 text-center py-3">
                  No achievements yet. Start playing!
                </div>
              )}
            </div>
          </Card>

          {/* Quick actions */}
          <Card title="Quick Actions" padding="sm">
            <div className="grid grid-cols-2 gap-2 px-1 pb-1">
              <Button variant="secondary" size="sm" onClick={() => setScreen('market')} icon={<TrendingUp size={12} />}>
                Market
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setScreen('career')} icon={<Briefcase size={12} />}>
                Jobs
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setScreen('skills')} icon={<Star size={12} />}>
                Skills
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setScreen('portfolio')} icon={<BarChart2 size={12} />}>
                Portfolio
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
