// Win Conditions & Endgame Milestones

export interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'wealth' | 'career' | 'empire' | 'legendary';
  requirement: {
    type: 'netWorth' | 'cash' | 'aum' | 'businesses' | 'employees' | 'level' | 'reputation' | 'skill';
    value: number;
    field?: string;
  };
  reward: string;
  isWinCondition?: boolean;
  isBiographyEvent?: boolean;
}

export const MILESTONES: Milestone[] = [
  // Wealth milestones
  { id: 'ms_1k', title: 'First Thousand', icon: '💵', category: 'wealth', description: '$1,000 cash in hand', requirement: { type: 'cash', value: 1000 }, reward: '+5 Confidence' },
  { id: 'ms_10k', title: 'Five Figures', icon: '💰', category: 'wealth', description: '$10,000 net worth', requirement: { type: 'netWorth', value: 10000 }, reward: '+5 Discipline' },
  { id: 'ms_50k', title: 'Getting Serious', icon: '📈', category: 'wealth', description: '$50,000 net worth', requirement: { type: 'netWorth', value: 50000 }, reward: '+10 Financial Knowledge' },
  { id: 'ms_100k', title: 'Six Figures', icon: '🥂', category: 'wealth', description: '$100,000 net worth', requirement: { type: 'netWorth', value: 100000 }, reward: 'Unlock advanced trading', isBiographyEvent: true },
  { id: 'ms_500k', title: 'Half a Million', icon: '💎', category: 'wealth', description: '$500,000 net worth', requirement: { type: 'netWorth', value: 500000 }, reward: '+10 Reputation', isBiographyEvent: true },
  { id: 'ms_1m', title: 'Millionaire', icon: '🏆', category: 'wealth', description: '$1,000,000 net worth', requirement: { type: 'netWorth', value: 1000000 }, reward: 'Unlock hedge fund', isBiographyEvent: true },
  { id: 'ms_5m', title: 'Multi-Millionaire', icon: '🌟', category: 'wealth', description: '$5,000,000 net worth', requirement: { type: 'netWorth', value: 5000000 }, reward: '+15 Reputation, unlock institutional_capital', isBiographyEvent: true },
  { id: 'ms_10m', title: 'Ultra Wealthy', icon: '🚀', category: 'wealth', description: '$10,000,000 net worth', requirement: { type: 'netWorth', value: 10000000 }, reward: 'Unlock compound housing' },
  { id: 'ms_50m', title: 'Top 1%', icon: '💫', category: 'wealth', description: '$50,000,000 net worth', requirement: { type: 'netWorth', value: 50000000 }, reward: 'Media attention unlocked', isBiographyEvent: true },
  { id: 'ms_100m', title: 'Centimillionaire', icon: '👑', category: 'wealth', description: '$100,000,000 net worth', requirement: { type: 'netWorth', value: 100000000 }, reward: 'Legacy mode unlocked', isBiographyEvent: true },
  { id: 'ms_1b', title: 'BILLIONAIRE', icon: '🌍', category: 'wealth', description: '$1,000,000,000 net worth — The Ultimate Win', requirement: { type: 'netWorth', value: 1000000000 }, reward: 'YOU WIN. New Game+ unlocked.', isWinCondition: true, isBiographyEvent: true },

  // Career milestones
  { id: 'ms_first_job', title: 'Day One', icon: '💼', category: 'career', description: 'Land your first job', requirement: { type: 'level', value: 1 }, reward: '+5 Confidence' },
  { id: 'ms_analyst', title: 'Analyst', icon: '📊', category: 'career', description: 'Reach analyst level job', requirement: { type: 'level', value: 5 }, reward: '+10 Financial Knowledge' },
  { id: 'ms_senior', title: 'Senior Level', icon: '🎯', category: 'career', description: 'Reach senior career tier', requirement: { type: 'level', value: 10 }, reward: 'Team hiring unlocked' },
  { id: 'ms_elite', title: 'Industry Elite', icon: '⭐', category: 'career', description: 'Reach elite career status', requirement: { type: 'level', value: 15 }, reward: '+20 Reputation' },

  // Empire milestones
  { id: 'ms_first_biz', title: 'Entrepreneur', icon: '🏪', category: 'empire', description: 'Launch your first business', requirement: { type: 'businesses', value: 1 }, reward: 'Entrepreneurship +10' },
  { id: 'ms_biz_empire', title: 'Business Empire', icon: '🏙️', category: 'empire', description: 'Own 3+ active businesses', requirement: { type: 'businesses', value: 3 }, reward: '+10 Reputation', isBiographyEvent: true },
  { id: 'ms_team_5', title: 'Team Leader', icon: '👥', category: 'empire', description: 'Hire 5 employees', requirement: { type: 'employees', value: 5 }, reward: '+10 Leadership stat', isBiographyEvent: true },
  { id: 'ms_aum_10m', title: 'Fund Manager', icon: '🏛️', category: 'empire', description: '$10M AUM under management', requirement: { type: 'aum', value: 10000000 }, reward: '+10 Reputation' },
  { id: 'ms_aum_100m', title: 'Institutional Player', icon: '🏦', category: 'empire', description: '$100M AUM under management', requirement: { type: 'aum', value: 100000000 }, reward: '+15 Reputation', isBiographyEvent: true },
  { id: 'ms_aum_1b', title: 'Billion Dollar Fund', icon: '🌐', category: 'empire', description: '$1B AUM under management', requirement: { type: 'aum', value: 1000000000 }, reward: 'Legendary status', isWinCondition: false, isBiographyEvent: true },

  // Legendary
  { id: 'ms_legend_options', title: 'Options Oracle', icon: '🎯', category: 'legendary', description: 'Options skill reaches 80', requirement: { type: 'skill', value: 80, field: 'options' }, reward: 'Options trading mastered' },
  { id: 'ms_legend_quant', title: 'Quant Legend', icon: '🤖', category: 'legendary', description: 'Quant Research skill reaches 80', requirement: { type: 'skill', value: 80, field: 'quantResearch' }, reward: 'Systematic trading unlocked' },
  { id: 'ms_legend_reputation', title: 'Industry Icon', icon: '⭐', category: 'legendary', description: 'Reputation reaches 90', requirement: { type: 'reputation', value: 90 }, reward: 'Speaking circuit unlocked', isBiographyEvent: true },
];

export function checkMilestones(
  completedIds: string[],
  netWorth: number,
  cash: number,
  aum: number,
  businessCount: number,
  employeeCount: number,
  level: number,
  reputation: number,
  skills: Record<string, number>
): Milestone[] {
  return MILESTONES.filter(m => {
    if (completedIds.includes(m.id)) return false;
    const { type, value, field } = m.requirement;
    switch (type) {
      case 'netWorth': return netWorth >= value;
      case 'cash': return cash >= value;
      case 'aum': return aum >= value;
      case 'businesses': return businessCount >= value;
      case 'employees': return employeeCount >= value;
      case 'level': return level >= value;
      case 'reputation': return reputation >= value;
      case 'skill': return field ? (skills[field] || 0) >= value : false;
      default: return false;
    }
  });
}

// Short selling margin requirements
export const SHORT_MARGIN_REQUIREMENT = 0.5; // 50% margin required
export const MARGIN_CALL_THRESHOLD = 0.30;   // margin call at 30% equity
export const MARGIN_INTEREST_RATE = 0.08;    // 8% annual on margin balance

// Limit order types
export type OrderType = 'market' | 'limit' | 'stop_loss' | 'stop_limit' | 'trailing_stop';

export interface LimitOrder {
  id: string;
  ticker: string;
  assetType: string;
  orderType: OrderType;
  side: 'buy' | 'sell';
  shares: number;
  limitPrice?: number;
  stopPrice?: number;
  trailingPercent?: number;
  createdDate: number;
  status: 'pending' | 'filled' | 'cancelled' | 'expired';
  expiryDate?: number;
  notes?: string;
}
