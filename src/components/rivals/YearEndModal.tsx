import React from 'react';
import { Trophy, TrendingUp, TrendingDown, X } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { formatCurrency } from '../../utils/formatting';

export default function YearEndModal() {
  const { yearEndSummary, dismissYearEnd, player } = useGameStore();
  if (!yearEndSummary || !player) return null;

  const { year, playerReturn, playerNetWorth, rivalRankings, playerRank, topPerformerName, topPerformerReturn } = yearEndSummary;
  const isWinner = playerRank === 1;

  const rankColor = (rank: number) => {
    if (rank === 1) return 'text-gold';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-amber-600';
    return 'text-gray-500';
  };
  const rankBg = (rank: number) => {
    if (rank === 1) return 'bg-gold/10 border-gold/30';
    if (rank === 2) return 'bg-gray-500/10 border-gray-500/20';
    if (rank === 3) return 'bg-amber-600/10 border-amber-600/20';
    return 'bg-dark-700 border-dark-500';
  };
  const rankMedal = (rank: number) => ['🥇', '🥈', '🥉'][rank - 1] || `#${rank}`;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={dismissYearEnd} />

      {/* Modal */}
      <div className="relative bg-dark-800 border border-dark-400 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className={`p-5 text-center ${isWinner ? 'bg-gold/10 border-b border-gold/20' : 'bg-dark-700 border-b border-dark-500'}`}>
          <div className="text-4xl mb-2">{isWinner ? '🏆' : '📅'}</div>
          <h2 className="text-xl font-bold text-white">Year {year} Complete</h2>
          <p className="text-sm text-gray-400 mt-1">Annual Performance Report</p>
        </div>

        {/* Player summary */}
        <div className="p-4 border-b border-dark-600">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Your Return — Year {year}</div>
              <div className={`text-3xl font-bold num ${playerReturn >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                {playerReturn >= 0 ? '+' : ''}{playerReturn.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400 num mt-1">{formatCurrency(playerNetWorth, true)} net worth</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase mb-1">Your Rank</div>
              <div className={`text-3xl font-bold ${rankColor(playerRank)}`}>{rankMedal(playerRank)}</div>
              <div className="text-xs text-gray-500">of {rivalRankings.length} managers</div>
            </div>
          </div>
          {isWinner && (
            <div className="mt-3 p-2 bg-gold/10 border border-gold/20 rounded-lg text-center text-xs text-gold font-semibold">
              🌟 You outperformed every rival fund this year!
            </div>
          )}
          {!isWinner && (
            <div className="mt-3 p-2 bg-dark-600 rounded-lg text-xs text-gray-400">
              Best performer: <span className="text-white font-semibold">{topPerformerName}</span> with{' '}
              <span className={`font-bold num ${topPerformerReturn >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                {topPerformerReturn >= 0 ? '+' : ''}{topPerformerReturn.toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="p-4">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-3">Year {year} Leaderboard</div>
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {rivalRankings.map((r, i) => {
              const rank = i + 1;
              return (
                <div
                  key={r.id}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border ${rankBg(rank)} ${r.isPlayer ? 'ring-1 ring-accent-blue/50' : ''}`}
                >
                  <span className="text-lg w-8 text-center flex-shrink-0">{rankMedal(rank)}</span>
                  <span className="text-lg flex-shrink-0">{r.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-bold truncate ${r.isPlayer ? 'text-accent-blue' : 'text-white'}`}>
                      {r.isPlayer ? `${r.name} (You)` : r.name}
                    </div>
                    <div className="text-[9px] text-gray-500 truncate">{r.fundName}</div>
                  </div>
                  <div className={`text-sm font-bold num flex-shrink-0 ${r.annualReturn >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                    {r.annualReturn >= 0 ? '+' : ''}{r.annualReturn.toFixed(1)}%
                  </div>
                  {r.annualReturn >= 0
                    ? <TrendingUp size={12} className="text-accent-green flex-shrink-0" />
                    : <TrendingDown size={12} className="text-accent-red flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <button
            onClick={dismissYearEnd}
            className="w-full py-2.5 bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/30 border border-accent-blue/30 rounded-xl text-sm font-semibold transition-all"
          >
            Continue to Year {year + 1} →
          </button>
        </div>

        {/* Close X */}
        <button
          onClick={dismissYearEnd}
          className="absolute top-4 right-4 p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-dark-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
