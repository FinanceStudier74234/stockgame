import React, { useState, useMemo } from 'react';
import { Trophy, TrendingUp, TrendingDown, Users, Swords, Handshake } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { formatCurrency, formatPercent } from '../../utils/formatting';
import { RIVAL_MANAGERS, getRivalLeaderboard, RivalManager } from '../../data/rivals';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const PERSONALITY_COLORS: Record<string, string> = {
  aggressive: 'text-accent-red',
  conservative: 'text-accent-blue',
  contrarian: 'text-accent-yellow',
  momentum: 'text-accent-green',
  quant: 'text-accent-cyan',
  macro: 'text-accent-purple',
};

const PERSONALITY_LABELS: Record<string, string> = {
  aggressive: 'Aggressive',
  conservative: 'Conservative',
  contrarian: 'Contrarian',
  momentum: 'Momentum',
  quant: 'Quantitative',
  macro: 'Global Macro',
};

export default function RivalsScreen() {
  const { player, hedgeFund } = useGameStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<'leaderboard' | 'profiles'>('leaderboard');

  if (!player) return null;

  const playerNAV = hedgeFund?.nav || 1000;
  const playerAUM = hedgeFund?.aum || 0;

  const leaderboard = useMemo(() =>
    getRivalLeaderboard(RIVAL_MANAGERS, playerNAV, playerAUM),
    [playerNAV, playerAUM]
  );

  const selectedRival = RIVAL_MANAGERS.find(r => r.id === selected);

  return (
    <div className="screen-content h-full overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Swords size={20} className="text-accent-red" />
          <div>
            <h1 className="text-lg font-bold text-white">Rival Managers</h1>
            <p className="text-xs text-gray-500">The industry's best — and your competition.</p>
          </div>
        </div>
        {hedgeFund && (
          <div className="text-right">
            <div className="text-[10px] text-gray-500">Your Fund Rank</div>
            <div className="text-xl font-bold text-gold">
              #{leaderboard.findIndex(e => e.id === 'player') + 1} of {leaderboard.length}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5">
        {[
          { id: 'leaderboard', label: '🏆 Leaderboard' },
          { id: 'profiles', label: '👤 Profiles' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
              tab === t.id ? 'bg-accent-red text-white' : 'bg-dark-400 text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* LEADERBOARD */}
      {tab === 'leaderboard' && (
        <div className="space-y-2">
          {!hedgeFund && (
            <div className="p-3 bg-dark-600 rounded-lg text-xs text-gray-400 mb-3">
              Launch your hedge fund to appear on the industry leaderboard and compete directly with these managers.
            </div>
          )}
          {leaderboard.map((entry, rank) => {
            const isPlayer = entry.id === 'player';
            const isWinning = isPlayer ? false : entry.returnPct < leaderboard.find(e => e.id === 'player')?.returnPct!;

            return (
              <div
                key={entry.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  isPlayer
                    ? 'border-accent-blue bg-accent-blue/10'
                    : 'border-dark-400 bg-dark-700 hover:border-dark-300 cursor-pointer'
                }`}
                onClick={() => !isPlayer && setSelected(entry.id)}
              >
                <div className={`text-lg font-bold w-6 text-center ${
                  rank === 0 ? 'text-gold' : rank === 1 ? 'text-gray-300' : rank === 2 ? 'text-accent-yellow' : 'text-gray-500'
                }`}>
                  #{rank + 1}
                </div>
                <div className="text-xl">{entry.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${isPlayer ? 'text-accent-blue' : 'text-white'}`}>
                      {entry.name}
                    </span>
                    {isPlayer && <Badge variant="blue" size="xs">YOU</Badge>}
                    {!isPlayer && <span className="text-[10px] text-gray-500">{entry.personality}</span>}
                  </div>
                  <div className="text-[10px] text-gray-500">{entry.fundName}</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold num ${entry.returnPct >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                    {entry.returnPct >= 0 ? '+' : ''}{entry.returnPct.toFixed(2)}%
                  </div>
                  <div className="text-[10px] text-gray-500 num">{formatCurrency(entry.aum, true)} AUM</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PROFILES */}
      {tab === 'profiles' && (
        <div className="grid grid-cols-2 gap-3">
          {RIVAL_MANAGERS.map(rival => (
            <Card
              key={rival.id}
              padding="md"
              hover
              onClick={() => setSelected(selected === rival.id ? null : rival.id)}
              glowColor={rival.relationshipWithPlayer === 'rival' ? 'red' : rival.relationshipWithPlayer === 'ally' ? 'green' : 'none'}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="text-3xl">{rival.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{rival.name}</span>
                    <Badge variant={
                      rival.relationshipWithPlayer === 'rival' ? 'red' :
                      rival.relationshipWithPlayer === 'ally' ? 'green' : 'gray'
                    } size="xs">
                      {rival.relationshipWithPlayer}
                    </Badge>
                  </div>
                  <div className="text-[10px] text-gray-400">{rival.fundName}</div>
                  <div className={`text-[10px] font-semibold mt-0.5 ${PERSONALITY_COLORS[rival.personality]}`}>
                    {PERSONALITY_LABELS[rival.personality]}
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-gray-400 leading-relaxed mb-3">{rival.backstory}</p>

              <div className="italic text-[10px] text-gray-500 border-l-2 border-dark-300 pl-2 mb-3">
                {rival.quote}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[9px] text-gray-600 mb-0.5">AUM</div>
                  <div className="text-xs font-bold text-white num">{formatCurrency(rival.aum, true)}</div>
                </div>
                <div>
                  <div className="text-[9px] text-gray-600 mb-0.5">Years Active</div>
                  <div className="text-xs font-bold text-gray-200">{rival.yearsActive}y</div>
                </div>
                <div>
                  <div className="text-[9px] text-gray-600 mb-0.5">Reputation</div>
                  <div className="text-xs font-bold text-accent-yellow">{rival.reputation}/100</div>
                </div>
                <div>
                  <div className="text-[9px] text-gray-600 mb-0.5">Media Presence</div>
                  <div className="text-xs font-bold text-accent-blue">{rival.mediaPresence}/100</div>
                </div>
              </div>

              {selected === rival.id && (
                <div className="mt-3 space-y-1.5 border-t border-dark-400 pt-3">
                  <div className="text-[9px] text-gray-500 uppercase mb-1">Skill Assessment</div>
                  {Object.entries(rival.skills).map(([skill, val]) => (
                    <div key={skill}>
                      <div className="flex justify-between text-[9px] mb-0.5">
                        <span className="text-gray-400 capitalize">{skill.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-gray-300">{val}</span>
                      </div>
                      <div className="w-full h-1 bg-dark-400 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${val >= 80 ? 'bg-accent-green' : val >= 60 ? 'bg-accent-yellow' : 'bg-accent-red'}`}
                          style={{ width: `${val}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
