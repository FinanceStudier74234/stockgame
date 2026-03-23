export interface SkillNode {
  id: string;
  name: string;
  description: string;
  category: string;
  maxLevel: number;
  costPerLevel: number;
  requires: string[];
  effects: string[];
  unlocks?: string[];
  icon: string;
}

export const SKILL_TREE: SkillNode[] = [
  // FINANCE TRACK
  { id: 'finance', name: 'Financial Analysis', description: 'Understand financial statements and company fundamentals.', category: 'finance', maxLevel: 100, costPerLevel: 5, requires: [], effects: ['Better stock evaluation', 'Unlock advanced research'], icon: '📊', unlocks: ['fundamental_analysis'] },
  { id: 'accounting', name: 'Accounting', description: 'Read balance sheets, income statements, and cash flows.', category: 'finance', maxLevel: 100, costPerLevel: 5, requires: [], effects: ['Spot earnings quality issues', 'Better valuation accuracy'], icon: '🧾' },
  { id: 'valuation', name: 'Valuation Models', description: 'DCF, comps, and relative valuation mastery.', category: 'finance', maxLevel: 100, costPerLevel: 8, requires: ['finance', 'accounting'], effects: ['Find undervalued stocks', 'Better entry prices'], icon: '💡', unlocks: ['deep_value_investing'] },
  { id: 'economics', name: 'Economics', description: 'Understand supply, demand, growth, and business cycles.', category: 'finance', maxLevel: 100, costPerLevel: 6, requires: ['finance'], effects: ['Better macro context', 'Sector timing improvements'], icon: '🌐' },
  { id: 'macroAnalysis', name: 'Macro Analysis', description: 'Fed policy, rates, currencies, global flows.', category: 'finance', maxLevel: 100, costPerLevel: 10, requires: ['economics'], effects: ['Predict market trends', 'Sector rotation mastery'], icon: '🌍', unlocks: ['macro_investing'] },

  // TRADING TRACK
  { id: 'chartAnalysis', name: 'Technical Analysis', description: 'Read charts, patterns, momentum signals.', category: 'trading', maxLevel: 100, costPerLevel: 6, requires: [], effects: ['Better entry/exit timing', 'Momentum trading skills'], icon: '📉' },
  { id: 'tradingPsychology', name: 'Trading Psychology', description: 'Control fear, greed, and discipline.', category: 'trading', maxLevel: 100, costPerLevel: 8, requires: [], effects: ['Reduce emotional mistakes', 'Larger position sizing'], icon: '🧠' },
  { id: 'options', name: 'Options Trading', description: 'Calls, puts, spreads, hedging strategies.', category: 'trading', maxLevel: 100, costPerLevel: 12, requires: ['chartAnalysis', 'tradingPsychology'], effects: ['Access options trading', 'Hedging capabilities', 'Leverage instruments'], icon: '🎯', unlocks: ['options_trading'] },
  { id: 'quantResearch', name: 'Quantitative Research', description: 'Statistical models, backtesting, algorithmic signals.', category: 'trading', maxLevel: 100, costPerLevel: 15, requires: ['chartAnalysis', 'coding'], effects: ['Algorithmic strategies', 'Statistical edge finding'], icon: '🔬', unlocks: ['quant_trading'] },

  // BUSINESS TRACK
  { id: 'entrepreneurship', name: 'Entrepreneurship', description: 'Build, launch, and scale businesses.', category: 'business', maxLevel: 100, costPerLevel: 8, requires: [], effects: ['Better business success rates', 'Faster growth'], icon: '🚀', unlocks: ['side_hustle'] },
  { id: 'operations', name: 'Operations', description: 'Run efficient teams and processes.', category: 'business', maxLevel: 100, costPerLevel: 5, requires: [], effects: ['Lower business costs', 'Better team management'], icon: '⚙️' },
  { id: 'sales', name: 'Sales', description: 'Close deals, win clients, grow revenue.', category: 'business', maxLevel: 100, costPerLevel: 6, requires: [], effects: ['Better LP fundraising', 'More business revenue'], icon: '🤝' },
  { id: 'branding', name: 'Branding & Marketing', description: 'Build reputation, audience, and brand value.', category: 'business', maxLevel: 100, costPerLevel: 7, requires: ['sales'], effects: ['Better reputation growth', 'Media attention'], icon: '📢', unlocks: ['media_presence'] },
  { id: 'negotiation', name: 'Negotiation', description: 'Get better terms on everything.', category: 'business', maxLevel: 100, costPerLevel: 8, requires: ['sales'], effects: ['Better deal terms', 'Better LP negotiations', 'Better salaries'], icon: '⚖️' },

  // LEADERSHIP TRACK
  { id: 'leadership', name: 'Leadership', description: 'Lead teams, inspire people, build culture.', category: 'leadership', maxLevel: 100, costPerLevel: 8, requires: [], effects: ['Better team performance', 'Lower employee turnover'], icon: '👥', unlocks: ['team_hiring'] },
  { id: 'networking', name: 'Networking', description: 'Build your professional network.', category: 'leadership', maxLevel: 100, costPerLevel: 6, requires: [], effects: ['Better job opportunities', 'More LP connections'], icon: '🌐' },

  // TECH TRACK
  { id: 'coding', name: 'Coding & Programming', description: 'Python, data analysis, automation tools.', category: 'tech', maxLevel: 100, costPerLevel: 10, requires: [], effects: ['Unlock quant research', 'Build trading tools', 'Automate analysis'], icon: '💻', unlocks: ['automation_tools'] },
];

export function getSkillById(id: string): SkillNode | undefined {
  return SKILL_TREE.find(s => s.id === id);
}

export function getSkillsByCategory(category: string): SkillNode[] {
  return SKILL_TREE.filter(s => s.category === category);
}
