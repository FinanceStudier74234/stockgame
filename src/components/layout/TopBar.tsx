import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { formatDate } from '../../utils/formatting';

export default function TopBar() {
  const { time, stocks, economy, player } = useGameStore();

  const marketData = useMemo(() => {
    const entries = Object.values(stocks).slice(0, 12);
    return entries;
  }, [stocks]);

  const tickerContent = marketData.map(s => (
    <span key={s.ticker} className="inline-flex items-center gap-1.5 mx-4">
      <span className="text-gray-300 font-semibold text-xs">{s.ticker}</span>
      <span className="num text-xs text-gray-200">${s.currentPrice < 10 ? s.currentPrice.toFixed(3) : s.currentPrice.toFixed(2)}</span>
      <span className={`num text-xs font-medium ${s.changePercent >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
        {s.changePercent >= 0 ? '+' : ''}{s.changePercent.toFixed(2)}%
      </span>
    </span>
  ));

  return (
    <div className="h-12 bg-dark-800 border-b border-dark-500 flex items-center overflow-hidden relative z-10"
         style={{ gridColumn: '1 / -1' }}>
      {/* Date and game info - fixed left */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 border-r border-dark-500 h-full">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Date</span>
          <span className="text-xs font-semibold text-gray-200">{formatDate(time.totalDays)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Market</span>
          <span className={`text-xs font-semibold capitalize ${economy.marketSentiment > 20 ? 'text-accent-green' : economy.marketSentiment < -20 ? 'text-accent-red' : 'text-accent-yellow'}`}>
            {economy.phase}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">VIX</span>
          <span className={`text-xs font-semibold num ${economy.vixLevel > 30 ? 'text-accent-red' : economy.vixLevel < 18 ? 'text-accent-green' : 'text-accent-yellow'}`}>
            {economy.vixLevel.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Scrolling ticker */}
      <div className="flex-1 overflow-hidden h-full flex items-center relative">
        <div className="ticker-scroll flex items-center">
          {[...tickerContent, ...tickerContent]}
        </div>
      </div>

      {/* Right side info */}
      <div className="flex-shrink-0 flex items-center gap-4 px-4 border-l border-dark-500 h-full">
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-gray-500 uppercase">Sentiment</span>
          <span className={`text-xs font-semibold num ${economy.marketSentiment > 0 ? 'text-accent-green' : 'text-accent-red'}`}>
            {economy.marketSentiment > 0 ? '+' : ''}{economy.marketSentiment.toFixed(0)}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-gray-500 uppercase">Rate</span>
          <span className="text-xs font-semibold text-gray-200 num">{economy.federalFundsRate.toFixed(2)}%</span>
        </div>
      </div>
    </div>
  );
}
