import React from 'react';
import {
  LayoutDashboard, Briefcase, TrendingUp, PieChart, BarChart2,
  GraduationCap, Building2, Users, Building, Globe, Trophy,
  Settings, Zap, ChevronRight, Home, Swords, Brain, Target
} from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { GameScreen } from '../../types';
import { formatCurrency, getTierLabel } from '../../utils/formatting';

interface NavItem {
  screen: GameScreen;
  label: string;
  icon: React.ReactNode;
  requiresMechanic?: string;
  badge?: string;
  category?: string;
}

const NAV_ITEMS: NavItem[] = [
  { screen: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} />, category: 'main' },
  { screen: 'career', label: 'Career', icon: <Briefcase size={16} />, category: 'main' },
  { screen: 'market', label: 'Market', icon: <TrendingUp size={16} />, category: 'main' },
  { screen: 'portfolio', label: 'Portfolio', icon: <PieChart size={16} />, category: 'main' },
  { screen: 'trading', label: 'Trading', icon: <BarChart2 size={16} />, category: 'main' },
  { screen: 'options', label: 'Options', icon: <Zap size={16} />, requiresMechanic: 'options_trading', category: 'advanced' },
  { screen: 'skills', label: 'Skills', icon: <GraduationCap size={16} />, category: 'growth' },
  { screen: 'business', label: 'Business', icon: <Building2 size={16} />, category: 'growth' },
  { screen: 'team', label: 'Team', icon: <Users size={16} />, requiresMechanic: 'team_hiring', category: 'growth' },
  { screen: 'fund', label: 'Fund', icon: <Building size={16} />, requiresMechanic: 'hedge_fund_registered', category: 'elite' },
  { screen: 'rivals', label: 'Rivals', icon: <Swords size={16} />, requiresMechanic: 'hedge_fund_registered', category: 'elite' },
  { screen: 'quant', label: 'Quant Lab', icon: <Brain size={16} />, requiresMechanic: 'quant_trading', category: 'elite' },
  { screen: 'lifestyle', label: 'Lifestyle', icon: <Home size={16} />, category: 'growth' },
  { screen: 'milestones', label: 'Milestones', icon: <Target size={16} />, category: 'info' },
  { screen: 'economy', label: 'Economy', icon: <Globe size={16} />, category: 'info' },
  { screen: 'achievements', label: 'Achievements', icon: <Trophy size={16} />, category: 'info' },
  { screen: 'settings', label: 'Settings', icon: <Settings size={16} />, category: 'info' },
];

const CATEGORY_LABELS: Record<string, string> = {
  main: 'Main',
  advanced: 'Advanced',
  growth: 'Growth',
  elite: 'Elite',
  info: 'Info',
};

export default function Sidebar() {
  const { ui, setScreen, player } = useGameStore();
  if (!player) return null;

  const netWorth = player.finances.totalNetWorth;
  const tier = getTierLabel(netWorth);

  const grouped = NAV_ITEMS.reduce<Record<string, NavItem[]>>((acc, item) => {
    const cat = item.category || 'main';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const categories = ['main', 'advanced', 'growth', 'elite', 'info'];

  return (
    <aside className="h-full bg-dark-800 border-r border-dark-500 flex flex-col overflow-hidden" style={{ gridRow: '2 / 4' }}>
      {/* Player card */}
      <div className="p-3 border-b border-dark-500">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {player.name[0]?.toUpperCase() || 'P'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm text-white truncate">{player.name}</div>
            <div className={`text-[10px] font-medium ${tier.color}`}>{tier.label}</div>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-500">Net Worth</span>
            <span className="text-xs font-bold text-accent-green num">{formatCurrency(netWorth, true)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-500">Cash</span>
            <span className="text-xs text-gray-200 num">{formatCurrency(player.finances.cash, true)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-500">Level</span>
            <span className="text-xs text-accent-blue font-medium">LV {player.level}</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {categories.map(cat => {
          const items = grouped[cat];
          if (!items) return null;
          const visibleItems = items.filter(item =>
            !item.requiresMechanic || player.unlockedMechanics.includes(item.requiresMechanic)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={cat} className="mb-1">
              {cat !== 'main' && (
                <div className="px-3 py-1">
                  <span className="text-[9px] uppercase tracking-widest text-gray-600 font-semibold">
                    {CATEGORY_LABELS[cat]}
                  </span>
                </div>
              )}
              {visibleItems.map(item => {
                const isActive = ui.currentScreen === item.screen;
                return (
                  <button
                    key={item.screen}
                    onClick={() => setScreen(item.screen)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 text-left transition-all duration-150
                      ${isActive
                        ? 'bg-accent-blue/15 text-accent-blue border-r-2 border-accent-blue'
                        : 'text-gray-400 hover:bg-dark-600 hover:text-gray-200'}
                    `}
                  >
                    <span className={isActive ? 'text-accent-blue' : 'text-gray-500'}>{item.icon}</span>
                    <span className="text-xs font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto text-[9px] bg-accent-red text-white px-1.5 py-0.5 rounded-full font-bold">
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight size={12} className="ml-auto text-accent-blue" />}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Bottom status */}
      <div className="p-3 border-t border-dark-500">
        <div className="grid grid-cols-3 gap-1 text-center">
          <div>
            <div className="text-[10px] text-gray-500">Energy</div>
            <div className={`text-xs font-bold num ${player.stats.energy > 50 ? 'text-accent-green' : player.stats.energy > 20 ? 'text-accent-yellow' : 'text-accent-red'}`}>
              {Math.round(player.stats.energy)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500">Stress</div>
            <div className={`text-xs font-bold num ${player.stats.stress < 30 ? 'text-accent-green' : player.stats.stress < 60 ? 'text-accent-yellow' : 'text-accent-red'}`}>
              {Math.round(player.stats.stress)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500">Health</div>
            <div className={`text-xs font-bold num ${player.stats.health > 60 ? 'text-accent-green' : player.stats.health > 30 ? 'text-accent-yellow' : 'text-accent-red'}`}>
              {Math.round(player.stats.health)}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
