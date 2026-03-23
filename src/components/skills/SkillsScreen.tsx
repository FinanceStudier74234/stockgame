import React, { useState } from 'react';
import { BookOpen, Zap, TrendingUp, Users, Cpu, Lock } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { SKILL_TREE } from '../../data/skills';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import StatBar from '../ui/StatBar';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  finance: <TrendingUp size={16} className="text-accent-green" />,
  trading: <Zap size={16} className="text-accent-yellow" />,
  business: <BookOpen size={16} className="text-accent-blue" />,
  leadership: <Users size={16} className="text-accent-purple" />,
  tech: <Cpu size={16} className="text-accent-cyan" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  finance: 'Finance & Analysis',
  trading: 'Trading & Markets',
  business: 'Business & Sales',
  leadership: 'Leadership & Network',
  tech: 'Technology & Quant',
};

const CATEGORY_COLORS: Record<string, string> = {
  finance: 'text-accent-green border-accent-green/20 bg-accent-green/5',
  trading: 'text-accent-yellow border-accent-yellow/20 bg-accent-yellow/5',
  business: 'text-accent-blue border-accent-blue/20 bg-accent-blue/5',
  leadership: 'text-accent-purple border-accent-purple/20 bg-accent-purple/5',
  tech: 'text-accent-cyan border-accent-cyan/20 bg-accent-cyan/5',
};

export default function SkillsScreen() {
  const { player, doStudy } = useGameStore();
  const [selectedCategory, setSelectedCategory] = useState('finance');
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);

  if (!player) return null;

  const categories = ['finance', 'trading', 'business', 'leadership', 'tech'];

  const skillsInCategory = SKILL_TREE.filter(s => s.category === selectedCategory);

  const allSkillXP = Object.values(player.skills).reduce((sum, v) => sum + v, 0);
  const totalPossible = Object.keys(player.skills).length * 100;

  return (
    <div className="screen-content h-full overflow-y-auto p-4 space-y-4">
      {/* Overview */}
      <div className="grid grid-cols-4 gap-3">
        <Card padding="md">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Total Skill Points</div>
          <div className="text-xl font-bold text-accent-blue num">{Math.round(allSkillXP)}</div>
          <div className="text-xs text-gray-500 mt-1">{((allSkillXP / totalPossible) * 100).toFixed(1)}% mastery</div>
        </Card>
        <Card padding="md">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Strongest Skill</div>
          <div className="text-sm font-bold text-white">
            {Object.entries(player.skills).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'}
          </div>
          <div className="text-xs text-accent-green mt-1 num">
            {Math.round(Object.entries(player.skills).sort((a, b) => b[1] - a[1])[0]?.[1] || 0)} / 100
          </div>
        </Card>
        <Card padding="md">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Player Level</div>
          <div className="text-xl font-bold text-accent-purple">{player.level}</div>
          <div className="text-xs text-gray-500 mt-1 num">{player.experiencePoints} XP total</div>
        </Card>
        <Card padding="md">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Energy</div>
          <div className={`text-xl font-bold num ${player.stats.energy > 50 ? 'text-accent-green' : player.stats.energy > 20 ? 'text-accent-yellow' : 'text-accent-red'}`}>
            {Math.round(player.stats.energy)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Need 15 to study</div>
        </Card>
      </div>

      {/* All skills radar */}
      <Card title="All Skills Overview" padding="md">
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(player.skills).map(([skill, value]) => (
            <StatBar key={skill} label={skill.replace(/([A-Z])/g, ' $1').trim()} value={value} size="sm" />
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        {/* Category selector */}
        <div className="space-y-2">
          {categories.map(cat => {
            const catSkills = SKILL_TREE.filter(s => s.category === cat);
            const avgLevel = catSkills.reduce((sum, s) => {
              return sum + (player.skills[s.id as keyof typeof player.skills] || 0);
            }, 0) / catSkills.length;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`
                  w-full p-3 rounded-xl border text-left transition-all
                  ${selectedCategory === cat
                    ? CATEGORY_COLORS[cat]
                    : 'bg-dark-600 border-dark-400 text-gray-400 hover:bg-dark-500'}
                `}
              >
                <div className="flex items-center gap-2 mb-2">
                  {CATEGORY_ICONS[cat]}
                  <span className="text-xs font-semibold">{CATEGORY_LABELS[cat]}</span>
                </div>
                <div className="w-full h-1.5 bg-dark-400 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${avgLevel}%`, backgroundColor: selectedCategory === cat ? 'currentColor' : '#253347' }}
                  />
                </div>
                <div className="text-[10px] text-gray-500 mt-1 num">{avgLevel.toFixed(0)}% average</div>
              </button>
            );
          })}
        </div>

        {/* Skills in category */}
        <div className="col-span-3 space-y-2">
          <div className="flex items-center gap-2 mb-3">
            {CATEGORY_ICONS[selectedCategory]}
            <h2 className="text-sm font-bold text-white">{CATEGORY_LABELS[selectedCategory]}</h2>
          </div>

          {skillsInCategory.map(skill => {
            const currentLevel = player.skills[skill.id as keyof typeof player.skills] || 0;
            const isLocked = skill.requires.some(req => (player.skills[req as keyof typeof player.skills] || 0) < 5);
            const canStudy = !isLocked && player.stats.energy >= 15;
            const pct = (currentLevel / skill.maxLevel) * 100;

            return (
              <Card
                key={skill.id}
                padding="md"
                className={`transition-all ${isLocked ? 'opacity-60' : 'hover:border-dark-300'}`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl flex-shrink-0">{skill.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-white">{skill.name}</span>
                      {isLocked && <Badge variant="red" size="xs"><Lock size={8} /> Locked</Badge>}
                      <span className={`text-xs font-semibold num ${pct > 70 ? 'text-accent-green' : pct > 30 ? 'text-accent-blue' : 'text-gray-400'}`}>
                        Lv {currentLevel.toFixed(0)}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mb-2">{skill.description}</p>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-dark-400 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }}
                      />
                    </div>

                    {/* Effects */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {skill.effects.map((e, i) => (
                        <span key={i} className="text-[9px] bg-dark-600 text-gray-400 px-2 py-0.5 rounded-full">{e}</span>
                      ))}
                    </div>

                    {/* Requirements */}
                    {skill.requires.length > 0 && (
                      <div className="text-[10px] text-gray-600">
                        Requires: {skill.requires.map(r => {
                          const node = SKILL_TREE.find(s => s.id === r);
                          return node ? node.name : r;
                        }).join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={!canStudy}
                      onClick={() => doStudy(skill.id)}
                    >
                      Study
                    </Button>
                    <div className="text-[9px] text-gray-600 text-center mt-1">-15 energy</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
