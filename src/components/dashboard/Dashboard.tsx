import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Briefcase, BarChart2, Star, Newspaper, Target, Calendar, Swords } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { formatCurrency, formatPercent, getTierLabel } from '../../utils/formatting';
import { MILESTONES } from '../../data/winConditions';
import { getRivalLeaderboard } from '../../data/rivals';
import { getXpForNextLevel } from '../../engine/playerEngine';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import StatBar from '../ui/StatBar';
import MiniChart from '../ui/MiniChart';
import Button from '../ui/Button';

export default function Dashboard() {
  const { player, economy, stocks, time, setScreen, businesses, hedgeFund, completedMilestones, rivals, weeklyChallenge } = useGameStore();
  if (!player) return null;

  const netWorth = player.finances.totalNetWorth;
  const portfolioValue = player.portfolio.totalValue;
  const tier = getTierLabel(netWorth);
  const aum = hedgeFund?.aum || 0;

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

  // Next milestone: find the incomplete one with highest progress
  const nextGoal = useMemo(() => {
    const bizCount = player.ownedBusinesses.length;
    const empCount = 0; // approximation
    return MILESTONES
      .filter(m => !completedMilestones.includes(m.id))
      .map(m => {
        let current = 0;
        const v = m.requirement.value;
        switch (m.requirement.type) {
          case 'netWorth': current = netWorth; break;
          case 'cash': current = player.finances.cash; break;
          case 'aum': current = aum; break;
          case 'businesses': current = bizCount; break;
          case 'employees': current = empCount; break;
          case 'level': current = player.level; break;
          case 'reputation': current = player.stats.reputation; break;
          case 'skill': current = m.requirement.field ? (player.skills[m.requirement.field as keyof typeof player.skills] || 0) : 0; break;
        }
        return { ...m, progress: Math.min(1, current / v), current };
      })
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 3);
  }, [completedMilestones, netWorth, player, aum]);

  // Rival leaderboard (top 4 entries by NAV)
  const rivalStandings = useMemo(() => {
    // Compute player NAV: use hedge fund nav if available, otherwise derive from portfolio all-time return
    const playerNAV = hedgeFund?.nav || (1000 * (1 + player.portfolio.allTimeReturnPercent / 100));
    const playerAUM = hedgeFund?.aum || player.finances.totalNetWorth;
    const leaderboard = getRivalLeaderboard(rivals, playerNAV, playerAUM);
    return leaderboard.slice(0, 5);
  }, [rivals, hedgeFund, player.finances.totalNetWorth]);
  const playerRank = rivalStandings.findIndex(r => r.id === 'player') + 1;

  // Today's Picks: momentum, value (discount to target), catalyst (earnings soon)
  const todaysPicks = useMemo(() => {
    const all = Object.values(stocks);
    const momentumPick = all
      .filter(s => s.changePercent > 1.0 && s.momentum > 55 && s.assetType === 'stock')
      .sort((a, b) => b.momentum - a.momentum)[0] || null;
    const valuePick = all
      .filter(s => s.analystPriceTarget > 0 && s.currentPrice > 0 && s.assetType === 'stock')
      .map(s => ({ ...s, upside: (s.analystPriceTarget - s.currentPrice) / s.currentPrice }))
      .filter(s => s.upside > 0.08)
      .sort((a, b) => b.upside - a.upside)[0] || null;
    const catalystPick = all
      .filter(s => s.nextEarningsDay && s.nextEarningsDay - time.totalDays >= 1 && s.nextEarningsDay - time.totalDays <= 6 && s.assetType === 'stock')
      .sort((a, b) => (a.nextEarningsDay || 0) - (b.nextEarningsDay || 0))[0] || null;
    return { momentumPick, valuePick: valuePick as typeof valuePick & { upside: number } | null, catalystPick };
  }, [stocks, time.totalDays]);

  // Beat-the-market: portfolio day change vs average stock day change
  const marketAvgChange = useMemo(() => {
    const all = Object.values(stocks);
    return all.reduce((s, st) => s + st.changePercent, 0) / (all.length || 1);
  }, [stocks]);
  const portfolioDayPct = portfolioValue > 0 ? (player.portfolio.dayChange / portfolioValue) * 100 : 0;
  const alpha = portfolioDayPct - marketAvgChange;

  // Upcoming portfolio events: earnings and dividends in next 14 days
  const upcomingEvents = useMemo(() => {
    const events: Array<{ ticker: string; type: 'earnings' | 'dividend'; daysAway: number; amount?: number }> = [];
    const holdings = Object.keys(player.portfolio.holdings);
    for (const ticker of holdings) {
      const stock = stocks[ticker];
      if (!stock) continue;
      const holding = player.portfolio.holdings[ticker];
      if (stock.nextEarningsDay) {
        const d = stock.nextEarningsDay - time.totalDays;
        if (d >= 0 && d <= 14) events.push({ ticker, type: 'earnings', daysAway: d });
      }
      if (stock.nextDividendDay && stock.dividendPerShare > 0) {
        const d = stock.nextDividendDay - time.totalDays;
        if (d >= 0 && d <= 21) events.push({ ticker, type: 'dividend', daysAway: d, amount: holding.shares * stock.dividendPerShare });
      }
    }
    return events.sort((a, b) => a.daysAway - b.daysAway).slice(0, 5);
  }, [player.portfolio.holdings, stocks, time.totalDays]);

  const showTips = time.totalDays <= 7;
  const TIPS = [
    { icon: '💼', text: 'Click Work each day in the action bar below to earn bonus pay + XP (base salary auto-credits monthly).' },
    { icon: '📈', text: 'Buy stocks in the Market tab. Click a stock → Trade. Start small — prices move every day.' },
    { icon: '🎯', text: 'Goal: Reach $1,000,000 net worth to become a Millionaire, then keep going to $1 Billion.' },
    { icon: '🔥', text: 'Work consecutive days to build a streak. 5-day streaks give bonus payouts!' },
    { icon: '⚡', text: 'Energy runs out after ~4 actions. Click Rest to recover +30 energy.' },
    { icon: '📊', text: 'Check Milestones tab to always know your next goal.' },
  ];

  return (
    <div className="screen-content h-full overflow-y-auto p-4 space-y-4">
      {/* First-week onboarding tips */}
      {showTips && (
        <div className="bg-accent-blue/5 border border-accent-blue/20 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-accent-blue">🚀 Getting Started — Day {time.totalDays}</span>
            <span className="text-[9px] text-gray-500">Tips hide after Day 7</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {TIPS.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-[10px] text-gray-400">
                <span className="flex-shrink-0">{tip.icon}</span>
                <span className="leading-relaxed">{tip.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
              {portfolioValue > 0 && (
                <div className={`text-[10px] mt-0.5 num ${alpha >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                  {alpha >= 0 ? '↑' : '↓'} {Math.abs(alpha).toFixed(2)}% vs market
                </div>
              )}
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

          {/* Today's Picks */}
          <Card title="Today's Picks" padding="sm" headerRight={
            <button onClick={() => setScreen('market')} className="text-[10px] text-accent-blue hover:text-blue-400">Market →</button>
          }>
            <div className="space-y-2 px-1 pb-1">
              {todaysPicks.momentumPick && (
                <div className="flex items-center gap-2 p-2 bg-accent-green/5 rounded-lg border border-accent-green/10 cursor-pointer hover:bg-accent-green/10 transition-colors" onClick={() => setScreen('market')}>
                  <span className="text-sm">🚀</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">{todaysPicks.momentumPick.ticker}</span>
                      <Badge variant="green" size="xs">Momentum</Badge>
                    </div>
                    <div className="text-[9px] text-gray-500">Strong move today · Momentum {todaysPicks.momentumPick.momentum.toFixed(0)}</div>
                  </div>
                  <span className="text-xs font-bold text-accent-green num">+{todaysPicks.momentumPick.changePercent.toFixed(2)}%</span>
                </div>
              )}
              {todaysPicks.valuePick && (
                <div className="flex items-center gap-2 p-2 bg-accent-blue/5 rounded-lg border border-accent-blue/10 cursor-pointer hover:bg-accent-blue/10 transition-colors" onClick={() => setScreen('market')}>
                  <span className="text-sm">💎</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">{todaysPicks.valuePick.ticker}</span>
                      <Badge variant="blue" size="xs">Value</Badge>
                    </div>
                    <div className="text-[9px] text-gray-500">
                      Target ${todaysPicks.valuePick.analystPriceTarget?.toFixed(0)} · {(todaysPicks.valuePick.upside * 100).toFixed(0)}% upside
                    </div>
                  </div>
                  <span className="text-xs font-bold text-accent-blue num">${todaysPicks.valuePick.currentPrice.toFixed(0)}</span>
                </div>
              )}
              {todaysPicks.catalystPick && (
                <div className="flex items-center gap-2 p-2 bg-accent-yellow/5 rounded-lg border border-accent-yellow/10 cursor-pointer hover:bg-accent-yellow/10 transition-colors" onClick={() => setScreen('market')}>
                  <span className="text-sm">📊</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">{todaysPicks.catalystPick.ticker}</span>
                      <Badge variant="yellow" size="xs">Catalyst</Badge>
                    </div>
                    <div className="text-[9px] text-gray-500">
                      Earnings in {(todaysPicks.catalystPick.nextEarningsDay || 0) - time.totalDays}d · {todaysPicks.catalystPick.analystRating?.replace('_', ' ')}
                    </div>
                  </div>
                  <span className={`text-xs font-bold num ${todaysPicks.catalystPick.changePercent >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                    {todaysPicks.catalystPick.changePercent.toFixed(2)}%
                  </span>
                </div>
              )}
              {!todaysPicks.momentumPick && !todaysPicks.valuePick && !todaysPicks.catalystPick && (
                <div className="text-xs text-gray-500 text-center py-3">No standout picks today. Check back tomorrow.</div>
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

        {/* Right: Character + news + achievements */}
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
              {(() => {
                // Calculate XP accumulated at the start of current level
                let xpAtStart = 0;
                let threshold = 100;
                for (let i = 1; i < player.level; i++) {
                  xpAtStart += threshold;
                  threshold = Math.floor(threshold * 1.5);
                }
                const xpForThisLevel = getXpForNextLevel(player.level);
                const xpIntoLevel = player.experiencePoints - xpAtStart;
                const pct = Math.min(100, (xpIntoLevel / xpForThisLevel) * 100);
                return (
                  <>
                    <div className="w-full h-1.5 bg-dark-400 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent-blue to-accent-purple rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                      <span>XP: {player.experiencePoints.toLocaleString()}</span>
                      <span>Next Lv: {(xpAtStart + xpForThisLevel).toLocaleString()}</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </Card>

          {/* Income streams summary */}
          {(Object.keys(businesses).length > 0 || hedgeFund) && (
            <Card title="Income Streams" padding="sm">
              <div className="space-y-1 px-1 pb-1">
                {player.currentJob && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">💼 {player.currentJob.title}</span>
                    <span className="text-accent-green num">+{formatCurrency(player.currentJob.dailyWage * 30, true)}/mo</span>
                  </div>
                )}
                {Object.values(businesses).map(biz => (
                  <div key={biz.id} className="flex justify-between text-xs">
                    <span className="text-gray-400">🏢 {biz.name}</span>
                    <span className={`num ${biz.monthlyProfit >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                      {biz.monthlyProfit >= 0 ? '+' : ''}{formatCurrency(biz.monthlyProfit, true)}/mo
                    </span>
                  </div>
                ))}
                {hedgeFund && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">🏛️ {hedgeFund.name}</span>
                    <span className="text-gold num">+{formatCurrency(hedgeFund.aum * hedgeFund.managementFee / 12, true)}/mo fees</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* News Feed */}
          <Card title="Market News" padding="sm" headerRight={
            <Newspaper size={12} className="text-gray-500" />
          }>
            <div className="space-y-2 px-1 pb-1">
              {economy.newsHeadlines.length === 0 ? (
                <div className="text-xs text-gray-500 text-center py-3">No news yet. Advance time to see market news.</div>
              ) : economy.newsHeadlines.slice(0, 5).map(news => (
                <div key={news.id} className={`
                  p-2 rounded-lg border-l-2 text-[10px] leading-relaxed
                  ${news.sentiment === 'bullish' ? 'border-l-accent-green bg-accent-green/5' :
                    news.sentiment === 'bearish' ? 'border-l-accent-red bg-accent-red/5' :
                    'border-l-dark-300 bg-dark-600'}
                `}>
                  <span className={news.sentiment === 'bullish' ? 'text-gray-200' : news.sentiment === 'bearish' ? 'text-gray-200' : 'text-gray-400'}>
                    {news.headline}
                  </span>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {news.affectedSectors.slice(0, 2).map(s => (
                      <span key={s} className="text-[9px] text-gray-600 bg-dark-400 px-1 rounded">{s}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Life Events */}
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

          {/* Rival Standings */}
          <Card title="Rival Standings" padding="sm" headerRight={
            <button onClick={() => setScreen('rivals')} className="text-[10px] text-accent-blue hover:text-blue-400">Full →</button>
          }>
            <div className="space-y-1 px-1 pb-1">
              {rivalStandings.map((r, i) => {
                const rank = i + 1;
                const isPlayer = r.id === 'player';
                const medal = ['🥇','🥈','🥉'][i] || `#${rank}`;
                return (
                  <div key={r.id} className={`flex items-center gap-2 py-1.5 rounded-lg px-1.5 ${isPlayer ? 'bg-accent-blue/10 border border-accent-blue/20' : ''}`}>
                    <span className="text-sm w-6 text-center flex-shrink-0">{medal}</span>
                    <span className="text-sm flex-shrink-0">{r.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[10px] font-semibold truncate ${isPlayer ? 'text-accent-blue' : 'text-gray-300'}`}>
                        {isPlayer ? 'You' : r.name}
                      </div>
                      <div className="text-[9px] text-gray-600 truncate">{r.fundName}</div>
                    </div>
                    <div className={`text-[10px] font-bold num flex-shrink-0 ${r.returnPct >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                      {r.returnPct >= 0 ? '+' : ''}{r.returnPct.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Next Goals */}
          <Card title="Next Goals" padding="sm" headerRight={
            <button onClick={() => setScreen('milestones')} className="text-[10px] text-accent-blue hover:text-blue-400">All →</button>
          }>
            <div className="space-y-2 px-1 pb-1">
              {nextGoal.map((m, i) => (
                <div key={m.id} className={`p-2 rounded-lg border ${i === 0 ? 'border-accent-yellow/30 bg-accent-yellow/5' : 'border-dark-500 bg-dark-700'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{m.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-white truncate">{m.title}</div>
                      <div className="text-[9px] text-gray-500 truncate">{m.description}</div>
                    </div>
                    <span className={`text-[10px] font-bold ${m.progress >= 0.8 ? 'text-accent-green' : m.progress >= 0.5 ? 'text-accent-yellow' : 'text-gray-500'}`}>
                      {(m.progress * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-1 bg-dark-400 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${m.progress >= 0.8 ? 'bg-accent-green' : m.progress >= 0.5 ? 'bg-accent-yellow' : 'bg-accent-blue'}`}
                      style={{ width: `${m.progress * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Weekly Challenge */}
          {weeklyChallenge && (
            <Card title="Weekly Challenge" padding="sm" headerRight={
              <span className="text-[10px] text-accent-yellow font-bold">
                {weeklyChallenge.completed ? '✅ Done!' : `${weeklyChallenge.progress}/${weeklyChallenge.target}`}
              </span>
            }>
              <div className="px-1 pb-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg">{weeklyChallenge.icon}</span>
                  <div>
                    <div className={`text-xs font-bold ${weeklyChallenge.completed ? 'text-accent-green' : 'text-white'}`}>{weeklyChallenge.title}</div>
                    <div className="text-[10px] text-gray-400">{weeklyChallenge.description}</div>
                  </div>
                </div>
                <div className="w-full h-2 bg-dark-500 rounded-full overflow-hidden mb-1.5">
                  <div
                    className={`h-full rounded-full transition-all ${weeklyChallenge.completed ? 'bg-accent-green' : 'bg-accent-blue'}`}
                    style={{ width: `${Math.min(100, (weeklyChallenge.progress / weeklyChallenge.target) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-gray-500">
                  <span>
                    Reward: {weeklyChallenge.reward.cash ? `+$${weeklyChallenge.reward.cash}` : ''}{weeklyChallenge.reward.xp ? ` +${weeklyChallenge.reward.xp}XP` : ''}{weeklyChallenge.reward.skill ? ` +${weeklyChallenge.reward.skillAmt} ${weeklyChallenge.reward.skill}` : ''}{weeklyChallenge.reward.stat ? ` +${weeklyChallenge.reward.statAmt} ${weeklyChallenge.reward.stat}` : ''}
                  </span>
                  <span>Expires day {weeklyChallenge.expiresDay}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Upcoming Portfolio Events */}
          {upcomingEvents.length > 0 && (
            <Card title="Upcoming Events" padding="sm" headerRight={<Calendar size={12} className="text-gray-500" />}>
              <div className="space-y-1.5 px-1 pb-1">
                {upcomingEvents.map((ev, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span>{ev.type === 'earnings' ? '📊' : '💰'}</span>
                      <span className="font-bold text-white">{ev.ticker}</span>
                      <Badge variant={ev.type === 'earnings' ? 'blue' : 'green'} size="xs">
                        {ev.type === 'earnings' ? 'Earnings' : 'Dividend'}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <span className={`font-semibold num ${ev.daysAway === 0 ? 'text-accent-red' : ev.daysAway <= 3 ? 'text-accent-yellow' : 'text-gray-400'}`}>
                        {ev.daysAway === 0 ? 'Today!' : `${ev.daysAway}d`}
                      </span>
                      {ev.amount != null && (
                        <div className="text-[9px] text-accent-green num">+${ev.amount.toFixed(2)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
