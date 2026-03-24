// ============================================================
// CORE GAME TYPES
// ============================================================

export type GameScreen =
  | 'dashboard'
  | 'career'
  | 'market'
  | 'portfolio'
  | 'trading'
  | 'options'
  | 'skills'
  | 'business'
  | 'team'
  | 'fund'
  | 'lifestyle'
  | 'economy'
  | 'rivals'
  | 'quant'
  | 'milestones'
  | 'achievements'
  | 'settings'
  | 'insider';

export type EconomicPhase =
  | 'boom'
  | 'expansion'
  | 'slowdown'
  | 'recession'
  | 'crisis'
  | 'recovery'
  | 'euphoria'
  | 'stagflation'
  | 'deflation';

export type Sector =
  | 'technology'
  | 'ai'
  | 'semiconductors'
  | 'banking'
  | 'healthcare'
  | 'defense'
  | 'retail'
  | 'energy'
  | 'industrials'
  | 'biotech'
  | 'realestate'
  | 'consumer'
  | 'utilities'
  | 'communications'
  | 'crypto';

export type AssetType = 'stock' | 'etf' | 'bond' | 'crypto' | 'commodity' | 'option';

export type LifestyleTier = 'poverty' | 'struggling' | 'modest' | 'comfortable' | 'wealthy' | 'elite' | 'billionaire';

export type HousingLevel =
  | 'homeless'
  | 'shelter'
  | 'cheap_room'
  | 'studio'
  | 'apartment'
  | 'nice_apartment'
  | 'condo'
  | 'house'
  | 'luxury_condo'
  | 'mansion'
  | 'compound';

// ============================================================
// PLAYER TYPES
// ============================================================

export interface PlayerStats {
  intelligence: number;       // 0-100
  charisma: number;
  discipline: number;
  riskTolerance: number;
  financialKnowledge: number;
  tradingSkill: number;
  investingSkill: number;
  businessSkill: number;
  leadership: number;
  health: number;
  energy: number;
  stress: number;
  confidence: number;
  luck: number;
  reputation: number;
  network: number;
}

export interface PlayerSkills {
  finance: number;
  accounting: number;
  economics: number;
  macroAnalysis: number;
  tradingPsychology: number;
  chartAnalysis: number;
  valuation: number;
  options: number;
  entrepreneurship: number;
  negotiation: number;
  coding: number;
  quantResearch: number;
  networking: number;
  sales: number;
  branding: number;
  operations: number;
  leadership: number;
}

export interface PlayerFinances {
  cash: number;
  totalNetWorth: number;
  totalDebt: number;
  creditScore: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyDebtPayments: number;
  savedThisMonth: number;
  lifetimeEarnings: number;
  lifetimeLosses: number;
}

export interface Player {
  id: string;
  name: string;
  age: number;
  background: string;
  archetype: string;
  city: string;
  lifestyleTier: LifestyleTier;
  housingLevel: HousingLevel;
  stats: PlayerStats;
  skills: PlayerSkills;
  finances: PlayerFinances;
  currentJob: Job | null;
  currentSideHustle: SideHustle | null;
  ownedBusinesses: string[];  // business IDs
  portfolio: Portfolio;
  debtItems: DebtItem[];
  achievements: string[];
  unlockedMechanics: string[];
  milestones: string[];
  biographyEvents: BiographyEvent[];
  lastActionDate: number;
  experiencePoints: number;
  level: number;
}

export interface BiographyEvent {
  date: number;
  text: string;
  type: 'good' | 'bad' | 'neutral' | 'legendary';
}

// ============================================================
// JOB TYPES
// ============================================================

export type JobTier = 'entry' | 'low' | 'mid' | 'advanced' | 'elite' | 'legendary';

export interface Job {
  id: string;
  title: string;
  company: string;
  tier: JobTier;
  salary: number;           // annual
  dailyWage: number;
  stressPerDay: number;
  energyCostPerDay: number;
  skillRequirements: Partial<PlayerSkills>;
  statRequirements: Partial<PlayerStats>;
  skillGains: Partial<PlayerSkills>;
  statGains: Partial<PlayerStats>;
  experiencePerDay: number;
  networkingValue: number;
  prestige: number;
  burnoutRisk: number;
  promotionPath: string[];  // job IDs
  description: string;
  unlockCondition?: string;
}

export interface SideHustle {
  id: string;
  name: string;
  type: string;
  monthlyRevenue: number;
  monthlyExpenses: number;
  startupCost: number;
  risk: number;
  timeRequired: number;   // energy per day
  skillRequirements: Partial<PlayerSkills>;
  skillGains: Partial<PlayerSkills>;
  scalable: boolean;
  description: string;
}

// ============================================================
// MARKET TYPES
// ============================================================

export interface Stock {
  ticker: string;
  name: string;
  sector: Sector;
  assetType: AssetType;
  currentPrice: number;
  previousPrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  marketCap: number;
  peRatio: number;
  eps: number;
  dividendYield: number;
  // Quality metrics (0-100 scale)
  intrinsicQuality: number;
  hype: number;
  volatility: number;
  momentum: number;
  profitability: number;
  growthScore: number;
  debtLoad: number;
  valuation: number;   // 0=overvalued, 100=undervalued
  sentiment: number;
  earningsStrength: number;
  managementQuality: number;
  // Price history
  priceHistory: number[];
  // Derived
  changePercent: number;
  changeDollar: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  description: string;
  founded: number;
  employees: number;
  isInPlayerWatchlist: boolean;
}

export interface ETF {
  ticker: string;
  name: string;
  sector: Sector | 'diversified';
  currentPrice: number;
  previousPrice: number;
  priceHistory: number[];
  expenseRatio: number;
  dividendYield: number;
  changePercent: number;
  changeDollar: number;
  description: string;
}

export interface CryptoAsset {
  ticker: string;
  name: string;
  currentPrice: number;
  previousPrice: number;
  priceHistory: number[];
  volatility: number;
  marketCap: number;
  changePercent: number;
  changeDollar: number;
  hype: number;
  description: string;
}

// ============================================================
// PORTFOLIO TYPES
// ============================================================

export interface PortfolioHolding {
  ticker: string;
  assetType: AssetType;
  shares: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  realizedPnL: number;
  dividendsEarned: number;
  purchaseDate: number;
}

export interface OptionContract {
  id: string;
  ticker: string;
  type: 'call' | 'put';
  strikePrice: number;
  expirationDate: number;
  premium: number;
  contracts: number;  // each = 100 shares
  currentValue: number;
  intrinsicValue: number;
  extrinsicValue: number;
  delta: number;
  theta: number;
  impliedVolatility: number;
  daysToExpiry: number;
  purchaseDate: number;
}

export interface ShortPosition {
  ticker: string;
  shares: number;
  entryPrice: number;
  currentPrice: number;
  marginRequired: number;   // cash held as collateral
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  openDate: number;
  interestAccrued: number;
}

export interface LimitOrder {
  id: string;
  ticker: string;
  assetType: AssetType;
  orderType: 'limit' | 'stop_loss' | 'trailing_stop';
  side: 'buy' | 'sell';
  shares: number;
  limitPrice?: number;
  stopPrice?: number;
  trailingPercent?: number;
  createdDate: number;
  status: 'pending' | 'filled' | 'cancelled' | 'expired';
  expiryDays?: number;
}

export interface Portfolio {
  holdings: Record<string, PortfolioHolding>;
  options: OptionContract[];
  shortPositions: Record<string, ShortPosition>;
  limitOrders: LimitOrder[];
  watchlist: string[];
  totalValue: number;
  totalCost: number;
  totalUnrealizedPnL: number;
  totalRealizedPnL: number;
  totalDividends: number;
  dayChange: number;
  dayChangePercent: number;
  allTimeReturn: number;
  allTimeReturnPercent: number;
  portfolioHistory: PortfolioSnapshot[];
  tradeHistory: TradeRecord[];
  winRate: number;
  maxDrawdown: number;
  sharpeScore: number;
  concentrationScore: number;  // 0=diversified, 100=concentrated
}

export interface PortfolioSnapshot {
  date: number;
  totalValue: number;
  cash: number;
  netWorth: number;
}

export interface TradeRecord {
  id: string;
  date: number;
  ticker: string;
  action: 'buy' | 'sell' | 'short' | 'cover' | 'option_buy' | 'option_sell' | 'option_expire';
  shares: number;
  price: number;
  total: number;
  pnl?: number;
  notes?: string;
}

// ============================================================
// DEBT TYPES
// ============================================================

export interface DebtItem {
  id: string;
  type: 'credit_card' | 'personal_loan' | 'student_loan' | 'margin_loan' | 'business_loan' | 'mortgage';
  name: string;
  principal: number;
  currentBalance: number;
  interestRate: number;
  minimumPayment: number;
  monthlyPayment: number;
  startDate: number;
  dueDate?: number;
  isMarginLoan: boolean;
  marginCallThreshold?: number;
}

// ============================================================
// BUSINESS TYPES
// ============================================================

export interface Business {
  id: string;
  name: string;
  type: string;
  category: 'side_hustle' | 'small_business' | 'company' | 'enterprise';
  description: string;
  startupCost: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyProfit: number;
  employees: number;
  satisfaction: number;  // 0-100
  branding: number;      // 0-100
  scalability: number;   // 0-100
  risk: number;          // 0-100
  growthRate: number;    // monthly %
  reputationBonus: number;
  networkBonus: number;
  isActive: boolean;
  foundedDate: number;
  totalRevenue: number;
  totalProfit: number;
  level: number;
  canHire: boolean;
  upgrades: string[];
}

// ============================================================
// TEAM/EMPLOYEE TYPES
// ============================================================

export type EmployeeRole =
  | 'assistant'
  | 'junior_analyst'
  | 'analyst'
  | 'senior_analyst'
  | 'trader'
  | 'senior_trader'
  | 'macro_researcher'
  | 'quant_engineer'
  | 'software_developer'
  | 'coo'
  | 'cfo'
  | 'sales_head'
  | 'investor_relations'
  | 'compliance_officer'
  | 'portfolio_manager'
  | 'recruiter'
  | 'marketing_head';

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  salary: number;
  skills: Partial<PlayerSkills>;
  productivity: number;  // 0-100
  loyalty: number;       // 0-100
  stress: number;        // 0-100
  morale: number;        // 0-100
  cultureFit: number;    // 0-100
  reputationImpact: number;
  hiredDate: number;
  performanceHistory: number[];
  specialAbility?: string;
  isAtRisk: boolean;
}

// ============================================================
// HEDGE FUND TYPES
// ============================================================

export type FundStrategy =
  | 'long_only'
  | 'long_short'
  | 'global_macro'
  | 'quant'
  | 'event_driven'
  | 'distressed'
  | 'growth'
  | 'activist'
  | 'venture'
  | 'multi_strategy';

export interface LimitedPartner {
  id: string;
  name: string;
  type: 'individual' | 'institution' | 'pension' | 'endowment' | 'family_office';
  investedAmount: number;
  entryDate: number;
  satisfactionLevel: number;  // 0-100
  redemptionThreshold: number; // drawdown % that triggers redemption demand
  lockupPeriod: number;        // months
  isRedemptionPending: boolean;
}

export interface HedgeFund {
  id: string;
  name: string;
  strategy: FundStrategy;
  aum: number;
  nav: number;        // per share
  inceptionNAV: number;
  managementFee: number;  // annual %
  performanceFee: number; // % of profits
  hurdleRate: number;     // minimum return before perf fee
  highWaterMark: number;
  limitedPartners: LimitedPartner[];
  totalLPCapital: number;
  playerCapital: number;
  monthlyReturns: number[];
  annualReturns: number[];
  maxDrawdown: number;
  currentDrawdown: number;
  sharpeRatio: number;
  benchmarkReturn: number;
  isRegistered: boolean;
  registrationDate: number;
  totalManagementFeesEarned: number;
  totalPerformanceFeesEarned: number;
  reputation: number;  // 0-100
  mediaAttention: number;
  regulatoryPressure: number;
  employees: string[];  // employee IDs
}

// ============================================================
// ECONOMY TYPES
// ============================================================

export interface EconomyState {
  phase: EconomicPhase;
  gdpGrowth: number;          // % annual
  inflationRate: number;      // % annual
  unemploymentRate: number;   // %
  federalFundsRate: number;   // %
  tenYearYield: number;       // %
  creditAvailability: number; // 0-100
  marketSentiment: number;    // -100 to 100
  liquidityIndex: number;     // 0-100
  consumerConfidence: number; // 0-100
  vixLevel: number;           // volatility index
  dollarsStrength: number;    // 0-100
  oilPrice: number;
  goldPrice: number;
  cryptoSentiment: number;    // -100 to 100
  sectorRotation: Sector[];   // currently favored sectors
  phaseMonthsRemaining: number;
  bubbleSectors: Sector[];
  crisisTriggers: string[];
  newsHeadlines: NewsHeadline[];
}

export interface NewsHeadline {
  id: string;
  date: number;
  headline: string;
  category: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  affectedSectors: Sector[];
  impactMagnitude: number;  // 0-100
}

// ============================================================
// INSIDER TRADING TYPES
// ============================================================

export type InsiderTipType =
  | 'merger_acquisition'
  | 'earnings_beat'
  | 'earnings_miss'
  | 'drug_approval'
  | 'drug_rejection'
  | 'contract_win'
  | 'fraud_discovered'
  | 'buyout'
  | 'ceo_resignation'
  | 'regulatory_approval'
  | 'patent_granted';

export interface InsiderTip {
  id: string;
  ticker: string;
  stockName: string;
  tipType: InsiderTipType;
  /** Vague hint shown to player */
  hint: string;
  /** Full reveal after event fires */
  fullDescription: string;
  source: string;
  /** Expected price move % (+ or -) */
  expectedMovePercent: number;
  /** Days after createdDay that the event fires */
  eventFiringDay: number;
  createdDay: number;
  /** 0-100: how traceable this tip is */
  investigationRiskBase: number;
  isActedOn: boolean;
  isExpired: boolean;
  isRevealed: boolean;
  illegalProfitMade: number;
}

export interface SECStatus {
  /** 0-100. ≥40 informal inquiry, ≥70 formal investigation, ≥95 charges */
  investigationLevel: number;
  isUnderFormalInvestigation: boolean;
  isConvicted: boolean;
  totalIllegalProfits: number;
  tipsActedOn: number;
  /** Multiplier on daily risk while tips have been acted on */
  scrutinyMultiplier: number;
  /** Set when convicted, fine amount */
  lastFineAmount: number;
  hasLawyer: boolean;
  lawyerDaysRemaining: number;
}

// ============================================================
// EVENT TYPES
// ============================================================

export type EventCategory =
  | 'career'
  | 'market'
  | 'personal'
  | 'business'
  | 'fund'
  | 'economic'
  | 'black_swan'
  | 'opportunity'
  | 'crisis';

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  choices: EventChoice[];
  conditions?: EventCondition[];
  probability: number;      // 0-1
  isOneTime: boolean;
  triggeredByPhase?: EconomicPhase[];
  minNetWorth?: number;
  maxNetWorth?: number;
  minLevel?: number;
  requiredMechanics?: string[];
  flavor: string;
}

export interface EventChoice {
  id: string;
  label: string;
  description: string;
  outcomes: EventOutcome[];
  risk: number;         // 0-100
  rewardPotential: number;  // 0-100
  requiresSkill?: Partial<PlayerSkills>;
  requiresStat?: Partial<PlayerStats>;
  requiresCash?: number;
}

export interface EventOutcome {
  probability: number;
  description: string;
  cashChange?: number;
  statChanges?: Partial<PlayerStats>;
  skillChanges?: Partial<PlayerSkills>;
  unlockMechanic?: string;
  addDebt?: Partial<DebtItem>;
  addBiography?: string;
  achievementUnlock?: string;
  newsHeadline?: string;
  marketImpact?: { sector: Sector; magnitude: number };
}

export interface EventCondition {
  field: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value: number | string;
}

// ============================================================
// ACHIEVEMENT TYPES
// ============================================================

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'wealth' | 'career' | 'trading' | 'business' | 'fund' | 'lifestyle' | 'legendary';
  icon: string;
  condition: AchievementCondition;
  reward?: AchievementReward;
  isSecret: boolean;
  dateEarned?: number;
}

export interface AchievementCondition {
  type: 'netWorth' | 'cash' | 'aum' | 'job' | 'skill' | 'trade' | 'business' | 'custom';
  field?: string;
  value?: number | string;
  comparison?: '>' | '>=' | '==' | 'exists';
}

export interface AchievementReward {
  type: 'stat_boost' | 'skill_boost' | 'cash' | 'title' | 'unlock';
  amount?: number;
  field?: string;
  title?: string;
  mechanic?: string;
}

// ============================================================
// TIME/GAME STATE TYPES
// ============================================================

export interface GameTime {
  day: number;
  week: number;
  month: number;
  year: number;
  totalDays: number;
  season: 'spring' | 'summer' | 'fall' | 'winter';
}

export interface GameConfig {
  difficulty: 'casual' | 'standard' | 'hard' | 'brutal' | 'rags_to_titan';
  startingArchetype: string;
  playerName: string;
  autoSave: boolean;
  simulationSpeed: number;
  showTutorial: boolean;
}

export interface GameNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'achievement' | 'market';
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  duration?: number;
}

export interface GameState {
  config: GameConfig;
  time: GameTime;
  player: Player;
  economy: EconomyState;
  stocks: Record<string, Stock>;
  etfs: Record<string, ETF>;
  crypto: Record<string, CryptoAsset>;
  businesses: Record<string, Business>;
  employees: Record<string, Employee>;
  hedgeFund: HedgeFund | null;
  rivals: import('../data/rivals').RivalManager[];
  completedMilestones: string[];
  events: {
    activeEvent: GameEvent | null;
    eventHistory: string[];
    pendingEvents: string[];
  };
  insiderTips: InsiderTip[];
  secStatus: SECStatus;
  achievements: Record<string, Achievement>;
  notifications: GameNotification[];
  ui: {
    currentScreen: GameScreen;
    selectedStock: string | null;
    isMenuOpen: boolean;
    isPaused: boolean;
    tutorialStep: number;
  };
  gameVersion: string;
  saveDate: number;
  isNewGame: boolean;
}
