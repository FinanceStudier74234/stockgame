import React from 'react';
import { Trophy, Lock } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { formatDate } from '../../utils/formatting';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const CATEGORY_COLORS: Record<string, string> = {
  wealth: 'text-accent-green',
  career: 'text-accent-blue',
  trading: 'text-accent-yellow',
  business: 'text-accent-orange',
  fund: 'text-accent-purple',
  lifestyle: 'text-accent-cyan',
  legendary: 'text-gold',
};

export default function AchievementsScreen() {
  const { achievements, time } = useGameStore();
  const allAchievements = Object.values(achievements);
  const earned = allAchievements.filter(a => a.dateEarned !== undefined);
  const categories = ['wealth', 'career', 'trading', 'business', 'fund', 'lifestyle', 'legendary'];

  return (
    <div className="screen-content h-full overflow-y-auto p-4 space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <Card padding="md" glowColor="gold">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Achievements Earned</div>
          <div className="text-2xl font-bold text-gold">{earned.length} / {allAchievements.length}</div>
        </Card>
        <Card padding="md">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Completion</div>
          <div className="text-2xl font-bold text-accent-green">
            {((earned.length / allAchievements.length) * 100).toFixed(0)}%
          </div>
        </Card>
        <Card padding="md">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Latest</div>
          <div className="text-xs font-semibold text-white">
            {earned.sort((a, b) => (b.dateEarned || 0) - (a.dateEarned || 0))[0]?.title || 'None yet'}
          </div>
        </Card>
        <Card padding="md">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Legendary</div>
          <div className="text-2xl font-bold text-gold">
            {earned.filter(a => a.category === 'legendary').length}
          </div>
        </Card>
      </div>

      {categories.map(cat => {
        const catAchievements = allAchievements.filter(a => a.category === cat);
        if (catAchievements.length === 0) return null;
        return (
          <div key={cat}>
            <h2 className={`text-xs font-bold uppercase tracking-wider mb-2 ${CATEGORY_COLORS[cat]}`}>
              {cat} ({catAchievements.filter(a => a.dateEarned).length}/{catAchievements.length})
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {catAchievements.map(ach => {
                const isEarned = ach.dateEarned !== undefined;
                const isSecret = ach.isSecret && !isEarned;
                return (
                  <div
                    key={ach.id}
                    className={`
                      card p-3 transition-all
                      ${isEarned ? `border-${cat === 'legendary' ? 'gold' : 'dark-300'}/30` : 'opacity-60'}
                      ${isEarned && cat === 'legendary' ? 'shadow-[0_0_15px_rgba(251,191,36,0.1)]' : ''}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`text-2xl ${!isEarned && !isSecret ? 'grayscale opacity-50' : ''}`}>
                        {isSecret ? '🔒' : ach.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-bold ${isEarned ? 'text-white' : 'text-gray-500'}`}>
                          {isSecret ? '???' : ach.title}
                        </div>
                        <div className="text-[10px] text-gray-600 mt-0.5 leading-relaxed">
                          {isSecret ? 'Secret achievement' : ach.description}
                        </div>
                        {isEarned && ach.dateEarned !== undefined && (
                          <div className="text-[9px] text-gray-600 mt-1">
                            Earned Day {ach.dateEarned}
                          </div>
                        )}
                      </div>
                      {isEarned && <Trophy size={12} className={CATEGORY_COLORS[cat]} />}
                      {!isEarned && !isSecret && <Lock size={12} className="text-gray-700" />}
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
