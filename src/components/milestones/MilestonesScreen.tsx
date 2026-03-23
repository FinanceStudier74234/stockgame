import React, { useMemo } from 'react';
import { Target, Trophy, Lock, CheckCircle, Star } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { MILESTONES } from '../../data/winConditions';
import { formatCurrency } from '../../utils/formatting';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const CATEGORY_CONFIG = {
  wealth: { label: 'Wealth', color: 'text-accent-yellow', bg: 'bg-accent-yellow/10 border-accent-yellow/20', icon: '💰' },
  career: { label: 'Career', color: 'text-accent-blue', bg: 'bg-accent-blue/10 border-accent-blue/20', icon: '💼' },
  empire: { label: 'Empire', color: 'text-accent-purple', bg: 'bg-accent-purple/10 border-accent-purple/20', icon: '🏛️' },
  legendary: { label: 'Legendary', color: 'text-gold', bg: 'bg-gold/10 border-gold/20', icon: '⭐' },
};

export default function MilestonesScreen() {
  const { player, completedMilestones, hedgeFund, businesses, employees } = useGameStore();

  if (!player) return null;

  const netWorth = player.finances.totalNetWorth;
  const aum = hedgeFund?.aum || 0;
  const bizCount = player.ownedBusinesses.length;
  const empCount = Object.keys(employees).length;

  const milestonesByCategory = useMemo(() => {
    const map: Record<string, typeof MILESTONES> = { wealth: [], career: [], empire: [], legendary: [] };
    for (const m of MILESTONES) {
      if (!map[m.category]) map[m.category] = [];
      map[m.category].push(m);
    }
    return map;
  }, []);

  function getProgress(milestone: typeof MILESTONES[0]): number {
    const { type, value, field } = milestone.requirement;
    let current = 0;
    switch (type) {
      case 'netWorth': current = netWorth; break;
      case 'cash': current = player.finances.cash; break;
      case 'aum': current = aum; break;
      case 'businesses': current = bizCount; break;
      case 'employees': current = empCount; break;
      case 'level': current = player.level; break;
      case 'reputation': current = player.stats.reputation; break;
      case 'skill': current = field ? (player.skills[field as keyof typeof player.skills] || 0) : 0; break;
    }
    return Math.min(1, current / value);
  }

  function formatRequirement(milestone: typeof MILESTONES[0]): string {
    const { type, value, field } = milestone.requirement;
    switch (type) {
      case 'netWorth':
      case 'cash':
      case 'aum': return formatCurrency(value, true);
      case 'businesses': return `${value} businesses`;
      case 'employees': return `${value} employees`;
      case 'level': return `Level ${value}`;
      case 'reputation': return `${value} reputation`;
      case 'skill': return `${field?.replace(/([A-Z])/g, ' $1')} ${value}`;
      default: return `${value}`;
    }
  }

  const totalMilestones = MILESTONES.length;
  const completedCount = completedMilestones.length;
  const overallProgress = completedCount / totalMilestones;

  return (
    <div className="screen-content h-full overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Target size={20} className="text-accent-green" />
        <div>
          <h1 className="text-lg font-bold text-white">Milestones</h1>
          <p className="text-xs text-gray-500">Track your journey to becoming a financial legend.</p>
        </div>
        <div className="ml-auto text-right">
          <div className="text-[10px] text-gray-500">Completed</div>
          <div className="text-xl font-bold text-accent-green">{completedCount}/{totalMilestones}</div>
        </div>
      </div>

      {/* Overall progress */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-bold text-white">Overall Progress</div>
          <div className="text-xs text-accent-yellow font-bold">{(overallProgress * 100).toFixed(0)}%</div>
        </div>
        <div className="w-full h-2 bg-dark-400 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent-blue via-accent-purple to-gold rounded-full transition-all"
            style={{ width: `${overallProgress * 100}%` }}
          />
        </div>
        <div className="mt-2 text-[10px] text-gray-500">
          {completedCount} completed · {totalMilestones - completedCount} remaining
        </div>
      </Card>

      {/* Win Condition Banner */}
      {completedMilestones.includes('ms_1b') ? (
        <div className="p-4 bg-gold/10 border-2 border-gold rounded-xl text-center">
          <div className="text-4xl mb-2">🏆</div>
          <div className="text-xl font-bold text-gold mb-1">BILLIONAIRE — YOU WIN!</div>
          <div className="text-sm text-gray-300">You've reached $1,000,000,000 net worth. The ultimate achievement.</div>
        </div>
      ) : (
        <div className="p-3 bg-dark-600 border border-dark-400 rounded-lg">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Ultimate Goal</div>
          <div className="flex items-center gap-2">
            <div className="text-2xl">🌍</div>
            <div>
              <div className="text-sm font-bold text-white">Become a Billionaire</div>
              <div className="text-[10px] text-gray-500">Reach $1,000,000,000 net worth to WIN the game.</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-xs text-gray-500">Progress</div>
              <div className="text-xs font-bold text-gold">{formatCurrency(netWorth, true)} / $1B</div>
            </div>
          </div>
          <div className="mt-2 w-full h-1.5 bg-dark-400 rounded-full overflow-hidden">
            <div
              className="h-full bg-gold rounded-full transition-all"
              style={{ width: `${Math.min(100, (netWorth / 1_000_000_000) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Milestones by category */}
      {(['wealth', 'career', 'empire', 'legendary'] as const).map(cat => {
        const milestones = milestonesByCategory[cat] || [];
        const config = CATEGORY_CONFIG[cat];
        const catCompleted = milestones.filter(m => completedMilestones.includes(m.id)).length;

        return (
          <div key={cat}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{config.icon}</span>
                <span className={`text-sm font-bold ${config.color}`}>{config.label}</span>
              </div>
              <span className="text-[10px] text-gray-500">{catCompleted}/{milestones.length}</span>
            </div>

            <div className="space-y-2">
              {milestones.map(milestone => {
                const isCompleted = completedMilestones.includes(milestone.id);
                const progress = getProgress(milestone);
                const isNearby = !isCompleted && progress >= 0.6;

                return (
                  <div
                    key={milestone.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isCompleted
                        ? `${config.bg} border-opacity-50`
                        : milestone.isWinCondition
                        ? 'bg-gold/5 border-gold/30'
                        : 'bg-dark-700 border-dark-500'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-xl flex-shrink-0">
                        {isCompleted ? '✅' : milestone.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-sm font-bold ${isCompleted ? 'text-white' : 'text-gray-300'}`}>
                            {milestone.title}
                          </span>
                          {milestone.isWinCondition && <Badge variant="gold" size="xs">WIN</Badge>}
                          {isNearby && !isCompleted && <Badge variant="green" size="xs">CLOSE</Badge>}
                        </div>
                        <div className="text-[10px] text-gray-500">{milestone.description}</div>

                        {!isCompleted && (
                          <div className="mt-2">
                            <div className="flex justify-between text-[9px] mb-1">
                              <span className="text-gray-600">Progress</span>
                              <span className={`font-bold ${progress >= 0.8 ? 'text-accent-green' : 'text-gray-500'}`}>
                                {(progress * 100).toFixed(0)}% · Goal: {formatRequirement(milestone)}
                              </span>
                            </div>
                            <div className="w-full h-1 bg-dark-400 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  progress >= 0.9 ? 'bg-accent-green' :
                                  progress >= 0.5 ? 'bg-accent-yellow' : 'bg-dark-300'
                                }`}
                                style={{ width: `${progress * 100}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {isCompleted && (
                          <div className={`text-[10px] mt-1 ${config.color}`}>
                            ✓ Reward: {milestone.reward}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
