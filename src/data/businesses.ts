export interface BusinessTemplate {
  id: string;
  name: string;
  type: string;
  category: 'side_hustle' | 'small_business' | 'company' | 'enterprise';
  description: string;
  startupCost: number;
  monthlyRevenue: [number, number]; // min, max
  monthlyExpenses: [number, number];
  risk: number;
  scalability: number;
  timeRequired: number;  // hours/week
  requiredSkills: Record<string, number>;
  requiredUnlocks: string[];
  icon: string;
  flavor: string;
}

export const BUSINESS_TEMPLATES: BusinessTemplate[] = [
  {
    id: 'finance_newsletter',
    name: 'Finance Newsletter',
    type: 'media',
    category: 'side_hustle',
    description: 'Weekly finance insights and stock picks for retail investors.',
    startupCost: 500,
    monthlyRevenue: [200, 2000],
    monthlyExpenses: [50, 200],
    risk: 30,
    scalability: 80,
    timeRequired: 10,
    requiredSkills: { finance: 15, branding: 5 },
    requiredUnlocks: ['basic_investing'],
    icon: '📰',
    flavor: 'Build your audience one subscriber at a time.',
  },
  {
    id: 'trading_discord',
    name: 'Trading Discord Community',
    type: 'media',
    category: 'side_hustle',
    description: 'Private trading community with stock alerts and analysis.',
    startupCost: 200,
    monthlyRevenue: [500, 5000],
    monthlyExpenses: [100, 400],
    risk: 40,
    scalability: 70,
    timeRequired: 15,
    requiredSkills: { chartAnalysis: 15, branding: 8 },
    requiredUnlocks: ['basic_investing'],
    icon: '💬',
    flavor: 'Community is the product.',
  },
  {
    id: 'finance_course',
    name: 'Online Finance Course',
    type: 'education',
    category: 'side_hustle',
    description: 'Sell recorded courses teaching investing fundamentals.',
    startupCost: 1500,
    monthlyRevenue: [300, 4000],
    monthlyExpenses: [100, 300],
    risk: 25,
    scalability: 90,
    timeRequired: 8,
    requiredSkills: { finance: 25, branding: 10 },
    requiredUnlocks: ['stock_research'],
    icon: '🎓',
    flavor: 'Once created, it earns while you sleep.',
  },
  {
    id: 'research_subscription',
    name: 'Research Subscription Service',
    type: 'research',
    category: 'small_business',
    description: 'Premium deep-dive research for serious investors.',
    startupCost: 3000,
    monthlyRevenue: [1000, 10000],
    monthlyExpenses: [300, 1000],
    risk: 35,
    scalability: 75,
    timeRequired: 20,
    requiredSkills: { valuation: 20, finance: 30, macroAnalysis: 15 },
    requiredUnlocks: ['fundamental_analysis'],
    icon: '🔍',
    flavor: 'Premium insights command premium prices.',
  },
  {
    id: 'consulting_firm',
    name: 'Financial Consulting',
    type: 'consulting',
    category: 'small_business',
    description: 'Advise small businesses and entrepreneurs on finance and growth.',
    startupCost: 2000,
    monthlyRevenue: [2000, 15000],
    monthlyExpenses: [500, 2000],
    risk: 30,
    scalability: 50,
    timeRequired: 25,
    requiredSkills: { finance: 25, negotiation: 15, networking: 15 },
    requiredUnlocks: ['fundamental_analysis'],
    icon: '💼',
    flavor: 'Your experience has value.',
  },
  {
    id: 'prop_trading_group',
    name: 'Proprietary Trading Group',
    type: 'trading',
    category: 'company',
    description: 'Trade your own capital with leverage. Risk managed but aggressive.',
    startupCost: 50000,
    monthlyRevenue: [5000, 100000],
    monthlyExpenses: [2000, 10000],
    risk: 80,
    scalability: 60,
    timeRequired: 40,
    requiredSkills: { chartAnalysis: 40, tradingPsychology: 35, options: 20 },
    requiredUnlocks: ['options_trading'],
    icon: '⚡',
    flavor: 'Your money, your rules, your results.',
  },
  {
    id: 'data_analytics_startup',
    name: 'Financial Data Analytics',
    type: 'tech',
    category: 'company',
    description: 'Build analytics tools and data products for financial firms.',
    startupCost: 25000,
    monthlyRevenue: [3000, 50000],
    monthlyExpenses: [5000, 20000],
    risk: 55,
    scalability: 90,
    timeRequired: 50,
    requiredSkills: { coding: 30, quantResearch: 20, finance: 25 },
    requiredUnlocks: ['automation_tools'],
    icon: '💻',
    flavor: 'Data is the new oil.',
  },
  {
    id: 'media_brand',
    name: 'Finance Media Brand',
    type: 'media',
    category: 'company',
    description: 'YouTube channel, podcast, and social media empire for finance content.',
    startupCost: 10000,
    monthlyRevenue: [2000, 80000],
    monthlyExpenses: [2000, 15000],
    risk: 45,
    scalability: 95,
    timeRequired: 35,
    requiredSkills: { branding: 30, sales: 20, finance: 20, networking: 20 },
    requiredUnlocks: ['media_presence'],
    icon: '📱',
    flavor: 'Attention is the most valuable currency.',
  },
  {
    id: 'family_office',
    name: 'Family Office',
    type: 'investment',
    category: 'enterprise',
    description: 'Manage your own wealth and that of ultra-high-net-worth individuals.',
    startupCost: 500000,
    monthlyRevenue: [50000, 500000],
    monthlyExpenses: [30000, 150000],
    risk: 30,
    scalability: 40,
    timeRequired: 60,
    requiredSkills: { finance: 70, leadership: 60, valuation: 60, macroAnalysis: 50 },
    requiredUnlocks: ['institutional_capital'],
    icon: '🏛️',
    flavor: 'Generational wealth preservation.',
  },
];

export function getBusinessTemplateById(id: string): BusinessTemplate | undefined {
  return BUSINESS_TEMPLATES.find(b => b.id === id);
}

export function getAvailableBusinesses(
  playerSkills: Record<string, number>,
  unlockedMechanics: string[],
  playerCash: number
): BusinessTemplate[] {
  return BUSINESS_TEMPLATES.filter(b => {
    const skillsMet = Object.entries(b.requiredSkills).every(
      ([skill, req]) => (playerSkills[skill] || 0) >= req
    );
    const unlocksMet = b.requiredUnlocks.every(u => unlockedMechanics.includes(u));
    return skillsMet && unlocksMet && playerCash >= b.startupCost;
  });
}
