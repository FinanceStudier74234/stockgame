import React, { useMemo } from 'react';
import { BarChart, Bar, Cell, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { useGameStore } from '../../store/gameStore';
import { getPhaseColor, getPhaseDescription } from '../../engine/economyEngine';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import StatBar from '../ui/StatBar';

const PHASE_ICONS: Record<string, string> = {
  boom: '🚀',
  expansion: '📈',
  euphoria: '🔥',
  slowdown: '📉',
  recession: '🌧️',
  crisis: '⚡',
  recovery: '🌱',
  stagflation: '💀',
  deflation: '❄️',
};

export default function EconomyScreen() {
  const { economy, stocks } = useGameStore();

  const sectors = ['technology', 'ai', 'banking', 'healthcare', 'energy', 'consumer', 'defense', 'industrials', 'semiconductors', 'biotech', 'realestate', 'utilities'];
  const sectorPerformance = sectors.map(sector => {
    const sectorStocks = Object.values(stocks).filter(s => s.sector === sector);
    const avgChange = sectorStocks.length > 0
      ? sectorStocks.reduce((sum, s) => sum + s.changePercent, 0) / sectorStocks.length
      : 0;
    return { sector, change: parseFloat(avgChange.toFixed(2)) };
  }).sort((a, b) => b.change - a.change);

  const metrics = [
    { label: 'GDP Growth', value: economy.gdpGrowth, suffix: '%', good: v => v > 2 },
    { label: 'Inflation Rate', value: economy.inflationRate, suffix: '%', good: v => v < 3 },
    { label: 'Unemployment', value: economy.unemploymentRate, suffix: '%', good: v => v < 5 },
    { label: 'Fed Funds Rate', value: economy.federalFundsRate, suffix: '%', good: v => v < 4 },
    { label: '10Y Yield', value: economy.tenYearYield, suffix: '%', good: v => v < 5 },
    { label: 'Consumer Conf.', value: economy.consumerConfidence, suffix: '', good: v => v > 70 },
  ];

  const phasePhases: string[] = ['recovery', 'expansion', 'boom', 'euphoria', 'slowdown', 'recession', 'crisis'];
  const currentPhaseIdx = phasePhases.indexOf(economy.phase);

  return (
    <div className="screen-content h-full overflow-y-auto p-4 space-y-4">
      {/* Phase banner */}
      <Card padding="md" glowColor={economy.marketSentiment > 30 ? 'green' : economy.marketSentiment < -30 ? 'red' : 'none'}>
        <div className="flex items-center gap-4">
          <div className="text-5xl">{PHASE_ICONS[economy.phase] || '📊'}</div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className={`text-2xl font-bold capitalize ${getPhaseColor(economy.phase)}`}>
                {economy.phase}
              </h1>
              <Badge variant={economy.marketSentiment > 30 ? 'green' : economy.marketSentiment < -30 ? 'red' : 'yellow'} size="xs">
                ~{economy.phaseMonthsRemaining}mo remaining
              </Badge>
            </div>
            <p className="text-sm text-gray-400">{getPhaseDescription(economy.phase)}</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-gray-500 mb-1">Market Sentiment</div>
            <div className={`text-2xl font-bold num ${economy.marketSentiment > 0 ? 'text-accent-green' : 'text-accent-red'}`}>
              {economy.marketSentiment > 0 ? '+' : ''}{economy.marketSentiment.toFixed(0)}
            </div>
            <div className="text-[10px] text-gray-500">VIX: {economy.vixLevel.toFixed(1)}</div>
          </div>
        </div>

        {/* Economic cycle visualization */}
        <div className="mt-4 flex items-center justify-between">
          {phasePhases.map((phase, i) => (
            <div key={phase} className="flex items-center">
              <div className={`
                flex flex-col items-center gap-1
                ${phase === economy.phase ? 'opacity-100' : 'opacity-40'}
              `}>
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2
                  ${phase === economy.phase
                    ? `border-current ${getPhaseColor(economy.phase)} bg-current/10`
                    : 'border-dark-300 text-gray-600'}
                `}>
                  {PHASE_ICONS[phase]}
                </div>
                <div className={`text-[9px] capitalize ${phase === economy.phase ? getPhaseColor(economy.phase) : 'text-gray-600'}`}>
                  {phase}
                </div>
              </div>
              {i < phasePhases.length - 1 && (
                <div className={`h-px w-8 mx-1 ${i < currentPhaseIdx ? 'bg-accent-blue' : 'bg-dark-400'}`} />
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        {/* Key metrics */}
        <Card title="Economic Indicators" padding="md">
          <div className="space-y-3">
            {metrics.map(m => (
              <div key={m.label} className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{m.label}</span>
                <span className={`text-xs font-bold num ${m.good(m.value) ? 'text-accent-green' : 'text-accent-red'}`}>
                  {m.value.toFixed(2)}{m.suffix}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Sector rotation */}
        <Card title="Sector Performance Today" padding="md">
          <div className="space-y-1.5">
            {sectorPerformance.map(s => (
              <div key={s.sector} className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 w-24 truncate capitalize">{s.sector}</span>
                <div className="flex-1 h-3 bg-dark-400 rounded-full overflow-hidden relative">
                  {s.change !== 0 && (
                    <div
                      className="absolute h-full rounded-full"
                      style={{
                        left: s.change >= 0 ? '50%' : `${50 + s.change * 5}%`,
                        width: `${Math.abs(s.change) * 5}%`,
                        maxWidth: '50%',
                        backgroundColor: s.change >= 0 ? '#10b981' : '#ef4444',
                      }}
                    />
                  )}
                  <div className="absolute left-1/2 top-0 h-full w-px bg-dark-300" />
                </div>
                <span className={`text-[10px] font-semibold num w-14 text-right ${s.change >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                  {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-dark-400">
            <div className="text-[10px] text-gray-500 mb-1">Favored Sectors:</div>
            <div className="flex flex-wrap gap-1">
              {economy.sectorRotation.map(s => (
                <Badge key={s} variant="blue" size="xs">{s}</Badge>
              ))}
            </div>
          </div>
        </Card>

        {/* Market conditions */}
        <Card title="Market Conditions" padding="md">
          <div className="space-y-3">
            <StatBar label="Liquidity Index" value={economy.liquidityIndex} color="#3b82f6" />
            <StatBar label="Credit Availability" value={economy.creditAvailability} color="#8b5cf6" />
            <StatBar label="Consumer Confidence" value={economy.consumerConfidence} color="#10b981" />
            <StatBar label="Dollar Strength" value={economy.dollarsStrength} color="#f59e0b" />

            <div className="pt-2 border-t border-dark-400 grid grid-cols-2 gap-2">
              <div>
                <div className="text-[9px] text-gray-600 uppercase">Oil Price</div>
                <div className="text-xs font-semibold text-gray-200 num">${economy.oilPrice.toFixed(2)}/bbl</div>
              </div>
              <div>
                <div className="text-[9px] text-gray-600 uppercase">Gold Price</div>
                <div className="text-xs font-semibold text-accent-yellow num">${economy.goldPrice.toFixed(0)}/oz</div>
              </div>
              <div>
                <div className="text-[9px] text-gray-600 uppercase">Crypto Sentiment</div>
                <div className={`text-xs font-semibold num ${economy.cryptoSentiment > 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                  {economy.cryptoSentiment > 0 ? '+' : ''}{economy.cryptoSentiment.toFixed(0)}
                </div>
              </div>
              <div>
                <div className="text-[9px] text-gray-600 uppercase">VIX (Fear)</div>
                <div className={`text-xs font-semibold num ${economy.vixLevel > 30 ? 'text-accent-red' : economy.vixLevel < 18 ? 'text-accent-green' : 'text-accent-yellow'}`}>
                  {economy.vixLevel.toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Sector Heatmap */}
      <Card title="Sector Heatmap" padding="md">
        <div className="grid grid-cols-4 gap-2 mb-3">
          {sectorPerformance.map(s => {
            const intensity = Math.min(1, Math.abs(s.change) / 3);
            const bg = s.change > 0
              ? `rgba(16,185,129,${0.1 + intensity * 0.5})`
              : `rgba(239,68,68,${0.1 + intensity * 0.5})`;
            const border = s.change > 0
              ? `rgba(16,185,129,${0.2 + intensity * 0.4})`
              : `rgba(239,68,68,${0.2 + intensity * 0.4})`;
            const isFavored = economy.sectorRotation.includes(s.sector as any);
            return (
              <div
                key={s.sector}
                className="rounded-lg p-2.5 text-center relative"
                style={{ backgroundColor: bg, border: `1px solid ${border}` }}
              >
                {isFavored && (
                  <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent-yellow" />
                )}
                <div className="text-[9px] text-gray-300 capitalize truncate mb-1">
                  {s.sector}
                </div>
                <div className={`text-xs font-bold num ${s.change >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                  {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-[9px] text-gray-600 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-yellow" />
          Yellow dot = currently favored by market rotation
        </div>
      </Card>

      {/* News Feed */}
      {economy.newsHeadlines.length > 0 && (
        <Card title="Market News" padding="md">
          <div className="space-y-2">
            {economy.newsHeadlines.slice(0, 8).map(h => (
              <div key={h.id} className="flex items-start gap-3 py-2 border-b border-dark-500 last:border-0">
                <div className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  h.sentiment === 'bullish' ? 'bg-accent-green' :
                  h.sentiment === 'bearish' ? 'bg-accent-red' : 'bg-gray-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-200 leading-relaxed">{h.headline}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[9px] font-semibold ${
                      h.sentiment === 'bullish' ? 'text-accent-green' :
                      h.sentiment === 'bearish' ? 'text-accent-red' : 'text-gray-500'
                    }`}>{h.sentiment}</span>
                    {h.affectedSectors.slice(0, 2).map(s => (
                      <Badge key={s} variant="gray" size="xs">{s}</Badge>
                    ))}
                  </div>
                </div>
                <div className="text-[9px] text-gray-600 flex-shrink-0">Day {h.date}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Investing implications */}
      <Card title="Current Investment Implications" padding="md">
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              title: 'Equities',
              icon: '📈',
              sentiment: economy.marketSentiment > 20 ? 'Bullish' : economy.marketSentiment < -20 ? 'Bearish' : 'Neutral',
              color: economy.marketSentiment > 20 ? 'text-accent-green' : economy.marketSentiment < -20 ? 'text-accent-red' : 'text-accent-yellow',
              note: economy.phase === 'euphoria' ? 'Valuations stretched, caution advised' : economy.phase === 'recession' ? 'Accumulate quality in pullbacks' : 'Follow the macro trend',
            },
            {
              title: 'Fixed Income',
              icon: '🏛️',
              sentiment: economy.federalFundsRate > 4 ? 'Attractive' : 'Unattractive',
              color: economy.federalFundsRate > 4 ? 'text-accent-green' : 'text-gray-400',
              note: `${economy.tenYearYield.toFixed(1)}% yield — ${economy.tenYearYield > 4.5 ? 'High rates creating opportunity' : 'Low yield environment'}`,
            },
            {
              title: 'Crypto',
              icon: '🔮',
              sentiment: economy.cryptoSentiment > 30 ? 'Risk-On' : economy.cryptoSentiment < -30 ? 'Risk-Off' : 'Neutral',
              color: economy.cryptoSentiment > 30 ? 'text-accent-green' : economy.cryptoSentiment < -30 ? 'text-accent-red' : 'text-accent-yellow',
              note: 'High correlation with risk appetite',
            },
          ].map(item => (
            <div key={item.title} className="bg-dark-600 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <span>{item.icon}</span>
                <span className="text-sm font-semibold text-white">{item.title}</span>
              </div>
              <div className={`text-base font-bold ${item.color} mb-1`}>{item.sentiment}</div>
              <p className="text-[11px] text-gray-500 leading-relaxed">{item.note}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
