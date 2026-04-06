import React, { useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { formatDate } from '../../utils/formatting';
import { clamp } from '../../utils/math';

function getFearGreed(vix: number, sentiment: number, avgMomentum: number): { value: number; label: string; color: string } {
  // Composite index: VIX (inverted), sentiment, momentum
  const vixScore = clamp((40 - vix) * 2, 0, 100);           // VIX 40 = 0, VIX 10 = 60
  const sentimentScore = clamp(50 + sentiment * 0.35, 0, 100); // sentiment -100..100 → 15..85
  const momentumScore = clamp(avgMomentum, 0, 100);

  const value = Math.round(vixScore * 0.35 + sentimentScore * 0.40 + momentumScore * 0.25);
  const label =
    value >= 75 ? 'Extreme Greed' :
    value >= 60 ? 'Greed' :
    value >= 45 ? 'Neutral' :
    value >= 30 ? 'Fear' : 'Extreme Fear';
  const color =
    value >= 75 ? 'text-accent-green' :
    value >= 60 ? 'text-green-400' :
    value >= 45 ? 'text-accent-yellow' :
    value >= 30 ? 'text-orange-400' : 'text-accent-red';

  return { value, label, color };
}

export default function TopBar() {
  const { time, stocks, economy, player } = useGameStore();

  const marketData = useMemo(() =>
    Object.values(stocks).slice(0, 14),
  [stocks]);

  const fearGreed = useMemo(() => {
    const avgMomentum = Object.values(stocks).length > 0
      ? Object.values(stocks).reduce((s, st) => s + st.momentum, 0) / Object.values(stocks).length
      : 50;
    return getFearGreed(economy.vixLevel, economy.marketSentiment, avgMomentum);
  }, [economy.vixLevel, economy.marketSentiment, stocks]);

  const tickerContent = marketData.map(s => (
    <span key={s.ticker} className="inline-flex items-center gap-1.5 mx-4 flex-shrink-0">
      <span className="text-gray-300 font-semibold text-[11px]">{s.ticker}</span>
      <span className="num text-[11px] text-gray-200">${s.currentPrice < 10 ? s.currentPrice.toFixed(3) : s.currentPrice.toFixed(2)}</span>
      <span className={`num text-[11px] font-medium ${s.changePercent >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
        {s.changePercent >= 0 ? '+' : ''}{s.changePercent.toFixed(2)}%
      </span>
    </span>
  ));

  // News headlines: format with sentiment tag
  const newsItems = useMemo(() => {
    if (!economy.newsHeadlines || economy.newsHeadlines.length === 0) return [];
    return economy.newsHeadlines.map(n => ({
      text: n.headline,
      sentiment: n.sentiment,
      tag: n.category?.slice(0, 6).toUpperCase() || 'NEWS',
    }));
  }, [economy.newsHeadlines]);

  const newsContent = newsItems.length > 0
    ? newsItems.map((n, i) => (
        <span key={i} className="inline-flex items-center gap-2 mx-6 flex-shrink-0">
          <span className={`text-[9px] font-bold px-1 rounded ${
            n.sentiment === 'bullish' ? 'bg-accent-green/20 text-accent-green' :
            n.sentiment === 'bearish' ? 'bg-accent-red/20 text-accent-red' :
            'bg-gray-500/20 text-gray-400'
          }`}>{n.tag}</span>
          <span className="text-[11px] text-gray-300">{n.text}</span>
        </span>
      ))
    : [<span key="none" className="text-[11px] text-gray-600 mx-6">Advance time to see market news...</span>];

  return (
    <div className="bg-dark-800 border-b border-dark-500 flex flex-col overflow-hidden relative z-10"
         style={{ gridColumn: '1 / -1', height: '64px' }}>

      {/* Row 1: Market info + stock price ticker */}
      <div className="h-8 flex items-center overflow-hidden border-b border-dark-600">
        {/* Left: fixed market info */}
        <div className="flex-shrink-0 flex items-center gap-4 px-4 border-r border-dark-600 h-full">
          <div className="flex flex-col leading-tight">
            <span className="text-[9px] text-gray-600 uppercase tracking-wider">Date</span>
            <span className="text-[11px] font-semibold text-gray-200">{formatDate(time.totalDays)}</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[9px] text-gray-600 uppercase tracking-wider">Phase</span>
            <span className={`text-[11px] font-semibold capitalize ${
              economy.phase === 'boom' || economy.phase === 'expansion' || economy.phase === 'euphoria' ? 'text-accent-green' :
              economy.phase === 'recession' || economy.phase === 'crisis' ? 'text-accent-red' :
              economy.phase === 'stagflation' ? 'text-accent-red' : 'text-accent-yellow'
            }`}>{economy.phase}</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[9px] text-gray-600 uppercase tracking-wider">VIX</span>
            <span className={`text-[11px] font-semibold num ${economy.vixLevel > 30 ? 'text-accent-red' : economy.vixLevel < 18 ? 'text-accent-green' : 'text-accent-yellow'}`}>
              {economy.vixLevel.toFixed(1)}
            </span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[9px] text-gray-600 uppercase tracking-wider">Rate</span>
            <span className="text-[11px] font-semibold text-gray-200 num">{economy.federalFundsRate.toFixed(2)}%</span>
          </div>
        </div>

        {/* Scrolling stock price ticker */}
        <div className="flex-1 overflow-hidden h-full flex items-center relative">
          <div className="ticker-scroll flex items-center whitespace-nowrap">
            {[...tickerContent, ...tickerContent]}
          </div>
        </div>

        {/* Right: fear/greed + sentiment */}
        <div className="flex-shrink-0 flex items-center gap-3 px-4 border-l border-dark-600 h-full">
          <div className="flex flex-col leading-tight items-end">
            <span className="text-[9px] text-gray-600 uppercase tracking-wider">Fear/Greed</span>
            <span className={`text-[11px] font-bold num ${fearGreed.color}`}>
              {fearGreed.value} · {fearGreed.label}
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Live news ticker */}
      <div className="h-8 flex items-center overflow-hidden bg-dark-900/50">
        <div className="flex-shrink-0 flex items-center px-3 border-r border-dark-600 h-full gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-red animate-pulse" />
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">LIVE</span>
        </div>
        <div className="flex-1 overflow-hidden h-full flex items-center relative">
          <div className="news-scroll flex items-center whitespace-nowrap">
            {[...newsContent, ...newsContent]}
          </div>
        </div>
      </div>
    </div>
  );
}
