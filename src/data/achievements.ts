import { Achievement } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
  // WEALTH MILESTONES
  { id: 'first_thousand', title: 'First $1,000', description: 'Save your first $1,000 in cash.', category: 'wealth', icon: '💵', condition: { type: 'cash', value: 1000, comparison: '>=' }, isSecret: false },
  { id: 'ten_thousand', title: 'Five-Figure Club', description: 'Reach $10,000 in net worth.', category: 'wealth', icon: '💰', condition: { type: 'netWorth', value: 10000, comparison: '>=' }, isSecret: false, reward: { type: 'stat_boost', field: 'confidence', amount: 5 } },
  { id: 'hundred_thousand', title: 'Six Figures', description: 'Reach $100,000 net worth. The first real milestone.', category: 'wealth', icon: '🏦', condition: { type: 'netWorth', value: 100000, comparison: '>=' }, isSecret: false, reward: { type: 'stat_boost', field: 'reputation', amount: 10 } },
  { id: 'quarter_million', title: 'Quarter Millionaire', description: 'Reach $250,000 net worth.', category: 'wealth', icon: '💎', condition: { type: 'netWorth', value: 250000, comparison: '>=' }, isSecret: false },
  { id: 'half_million', title: 'Half a Million', description: 'Reach $500,000 net worth.', category: 'wealth', icon: '🏆', condition: { type: 'netWorth', value: 500000, comparison: '>=' }, isSecret: false },
  { id: 'millionaire', title: 'MILLIONAIRE', description: 'Reach $1,000,000 net worth. You made it.', category: 'wealth', icon: '🌟', condition: { type: 'netWorth', value: 1000000, comparison: '>=' }, isSecret: false, reward: { type: 'title', title: 'Millionaire' } },
  { id: 'ten_million', title: 'Serious Money', description: 'Reach $10,000,000 net worth.', category: 'wealth', icon: '⚡', condition: { type: 'netWorth', value: 10000000, comparison: '>=' }, isSecret: false, reward: { type: 'title', title: 'Multi-Millionaire' } },
  { id: 'hundred_million', title: 'Centimillionaire', description: 'Reach $100,000,000 net worth.', category: 'wealth', icon: '👑', condition: { type: 'netWorth', value: 100000000, comparison: '>=' }, isSecret: false, reward: { type: 'title', title: 'Centimillionaire' } },
  { id: 'billionaire', title: 'BILLIONAIRE', description: 'Reach $1,000,000,000 net worth. You are a billionaire.', category: 'legendary', icon: '🚀', condition: { type: 'netWorth', value: 1000000000, comparison: '>=' }, isSecret: false, reward: { type: 'title', title: 'Billionaire' } },

  // TRADING ACHIEVEMENTS
  { id: 'first_trade', title: 'First Trade', description: 'Make your first stock trade.', category: 'trading', icon: '📊', condition: { type: 'trade', comparison: '>=', value: 1 }, isSecret: false },
  { id: 'first_profit', title: 'First Profit', description: 'Close a profitable trade.', category: 'trading', icon: '📈', condition: { type: 'custom', field: 'totalRealizedPnL', value: 1, comparison: '>=' }, isSecret: false },
  { id: 'ten_trades', title: 'Active Trader', description: 'Complete 10 trades.', category: 'trading', icon: '⚡', condition: { type: 'trade', value: 10, comparison: '>=' }, isSecret: false },
  { id: 'options_trader', title: 'Options Initiate', description: 'Make your first options trade.', category: 'trading', icon: '🎯', condition: { type: 'custom', field: 'optionsTrades', value: 1, comparison: '>=' }, isSecret: false },
  { id: 'ten_bagger', title: '10-Bagger', description: 'Achieve 1000% return on a single stock.', category: 'trading', icon: '🦄', condition: { type: 'custom', field: 'maxSingleReturn', value: 1000, comparison: '>=' }, isSecret: true },
  { id: 'survived_crash', title: 'Crash Survivor', description: 'Hold through a 30%+ market drawdown.', category: 'trading', icon: '🛡️', condition: { type: 'custom', field: 'crashSurvived', value: 1, comparison: '>=' }, isSecret: false },
  { id: 'short_master', title: 'Short Seller', description: 'Profit from a short position.', category: 'trading', icon: '🐻', condition: { type: 'custom', field: 'shortProfit', value: 1, comparison: '>=' }, isSecret: false },

  // CAREER ACHIEVEMENTS
  { id: 'first_job', title: 'Employed', description: 'Get your first job.', category: 'career', icon: '💼', condition: { type: 'job', comparison: 'exists' }, isSecret: false },
  { id: 'elite_job', title: 'Wall Street', description: 'Land an elite finance role.', category: 'career', icon: '🏙️', condition: { type: 'job', field: 'tier', value: 'elite', comparison: '==' }, isSecret: false, reward: { type: 'stat_boost', field: 'reputation', amount: 15 } },
  { id: 'salary_100k', title: '$100K Salary', description: 'Earn a six-figure salary.', category: 'career', icon: '💫', condition: { type: 'custom', field: 'salary', value: 100000, comparison: '>=' }, isSecret: false },

  // BUSINESS ACHIEVEMENTS
  { id: 'first_business', title: 'Entrepreneur', description: 'Start your first business.', category: 'business', icon: '🏪', condition: { type: 'business', comparison: '>=', value: 1 }, isSecret: false },
  { id: 'profitable_business', title: 'Cash Flow Positive', description: 'Run a profitable business for 3 months.', category: 'business', icon: '💹', condition: { type: 'custom', field: 'businessMonths', value: 3, comparison: '>=' }, isSecret: false },
  { id: 'business_empire', title: 'Business Empire', description: 'Own 3 or more active businesses.', category: 'business', icon: '🏢', condition: { type: 'business', value: 3, comparison: '>=' }, isSecret: false },

  // FUND ACHIEVEMENTS
  { id: 'fund_launched', title: 'Fund Manager', description: 'Launch your own hedge fund.', category: 'fund', icon: '🏛️', condition: { type: 'custom', field: 'fundLaunched', value: 1, comparison: '>=' }, isSecret: false, reward: { type: 'title', title: 'Fund Manager' } },
  { id: 'aum_10m', title: 'AUM: $10M', description: 'Manage $10 million in assets.', category: 'fund', icon: '📊', condition: { type: 'aum', value: 10000000, comparison: '>=' }, isSecret: false },
  { id: 'aum_100m', title: 'AUM: $100M', description: 'Manage $100 million in assets.', category: 'fund', icon: '💰', condition: { type: 'aum', value: 100000000, comparison: '>=' }, isSecret: false },
  { id: 'aum_1b', title: 'AUM: $1 Billion', description: 'Manage $1 billion in assets.', category: 'fund', icon: '👑', condition: { type: 'aum', value: 1000000000, comparison: '>=' }, isSecret: false, reward: { type: 'title', title: 'Billionaire Fund Manager' } },

  // LIFESTYLE ACHIEVEMENTS
  { id: 'pay_off_debt', title: 'Debt Free', description: 'Pay off all personal debt.', category: 'lifestyle', icon: '✂️', condition: { type: 'custom', field: 'totalDebt', value: 0, comparison: '==' }, isSecret: false },
  { id: 'upgrade_housing', title: 'Moving Up', description: 'Upgrade to a nice apartment or better.', category: 'lifestyle', icon: '🏠', condition: { type: 'custom', field: 'housingLevel', value: 'nice_apartment', comparison: '>=' }, isSecret: false },
  { id: 'penthouse', title: 'Penthouse Life', description: 'Live in a luxury condo or mansion.', category: 'lifestyle', icon: '🌆', condition: { type: 'custom', field: 'housingLevel', value: 'luxury_condo', comparison: '>=' }, isSecret: false },

  // LEGENDARY
  { id: 'financial_legend', title: 'Financial Legend', description: 'Achieve all major milestones. You are a legend.', category: 'legendary', icon: '⭐', condition: { type: 'custom', field: 'legendStatus', value: 1, comparison: '>=' }, isSecret: true, reward: { type: 'title', title: 'Financial Legend' } },
];

export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}

export function createAchievementsMap(): Record<string, Achievement> {
  return Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, { ...a }]));
}
