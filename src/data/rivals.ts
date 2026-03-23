// Rival Fund Manager NPC System

export type RivalPersonality = 'aggressive' | 'conservative' | 'contrarian' | 'momentum' | 'quant' | 'macro';

export interface RivalManager {
  id: string;
  name: string;
  fundName: string;
  personality: RivalPersonality;
  aum: number;             // assets under management
  nav: number;             // NAV per share (start 1000)
  monthlyReturns: number[];
  reputation: number;      // 0-100
  mediaPresence: number;   // 0-100
  relationshipWithPlayer: 'rival' | 'neutral' | 'ally';
  backstory: string;
  quote: string;
  avatar: string;          // emoji
  skills: {
    macroVision: number;
    riskManagement: number;
    lpRelations: number;
    marketTiming: number;
  };
  isActive: boolean;
  yearsActive: number;
}

export const RIVAL_MANAGERS: RivalManager[] = [
  {
    id: 'rival_01',
    name: 'Victor Crane',
    fundName: 'Ironclad Capital',
    personality: 'aggressive',
    aum: 500_000_000,
    nav: 1000,
    monthlyReturns: [],
    reputation: 72,
    mediaPresence: 65,
    relationshipWithPlayer: 'rival',
    backstory: 'Former prop trader who built a reputation trading through two crashes. Ruthless, brash, and always in the media. Sees you as a small fish.',
    quote: '"Markets are a zero-sum game. Your loss is my gain. Simple math."',
    avatar: '🦅',
    skills: { macroVision: 55, riskManagement: 40, lpRelations: 60, marketTiming: 85 },
    isActive: true,
    yearsActive: 12,
  },
  {
    id: 'rival_02',
    name: 'Diana Lowe',
    fundName: 'Meridian Endowment Advisors',
    personality: 'conservative',
    aum: 2_000_000_000,
    nav: 1000,
    monthlyReturns: [],
    reputation: 88,
    mediaPresence: 45,
    relationshipWithPlayer: 'neutral',
    backstory: 'Yale endowment veteran. Manages multi-generational wealth with a 60-year investment horizon. Doesn\'t care about short-term noise. Respects competence.',
    quote: '"Compounding is the eighth wonder of the world. Slow and steady builds dynasties."',
    avatar: '🦉',
    skills: { macroVision: 90, riskManagement: 95, lpRelations: 85, marketTiming: 50 },
    isActive: true,
    yearsActive: 28,
  },
  {
    id: 'rival_03',
    name: 'Marcus Webb',
    fundName: 'Webb Asymmetric',
    personality: 'contrarian',
    aum: 800_000_000,
    nav: 1000,
    monthlyReturns: [],
    reputation: 78,
    mediaPresence: 82,
    relationshipWithPlayer: 'neutral',
    backstory: 'Made his name shorting the 2008 housing bubble. Permanently sees the world as overvalued. Regularly on financial TV calling crashes. Hit rate: 40%.',
    quote: '"Everyone I know who got rich did it by avoiding what everyone else was running into."',
    avatar: '🐻',
    skills: { macroVision: 80, riskManagement: 70, lpRelations: 55, marketTiming: 65 },
    isActive: true,
    yearsActive: 18,
  },
  {
    id: 'rival_04',
    name: 'Sophia Lin',
    fundName: 'Quanta Systematic Capital',
    personality: 'quant',
    aum: 3_500_000_000,
    nav: 1000,
    monthlyReturns: [],
    reputation: 91,
    mediaPresence: 30,
    relationshipWithPlayer: 'neutral',
    backstory: 'MIT PhD in mathematics. Built models at Renaissance Technologies before launching her own fund. Doesn\'t do interviews. The model speaks for itself.',
    quote: '"Emotion is a bug in human decision-making. My edge is having none."',
    avatar: '🤖',
    skills: { macroVision: 70, riskManagement: 92, lpRelations: 60, marketTiming: 95 },
    isActive: true,
    yearsActive: 9,
  },
  {
    id: 'rival_05',
    name: 'Jordan Price',
    fundName: 'Price Momentum Partners',
    personality: 'momentum',
    aum: 200_000_000,
    nav: 1000,
    monthlyReturns: [],
    reputation: 58,
    mediaPresence: 90,
    relationshipWithPlayer: 'rival',
    backstory: 'Social media finance star turned fund manager. Massive following, controversial calls. Same age as you, same background — which is exactly why you two clash.',
    quote: '"The trend is your friend until it isn\'t. Ride it while it lasts."',
    avatar: '⚡',
    skills: { macroVision: 40, riskManagement: 35, lpRelations: 75, marketTiming: 78 },
    isActive: true,
    yearsActive: 4,
  },
  {
    id: 'rival_06',
    name: 'Alexander Voss',
    fundName: 'Voss Global Macro',
    personality: 'macro',
    aum: 5_000_000_000,
    nav: 1000,
    monthlyReturns: [],
    reputation: 95,
    mediaPresence: 70,
    relationshipWithPlayer: 'neutral',
    backstory: 'The gold standard. Predicted every major macro shift of the last 20 years. Mentored half the industry. Reaching his level is the ultimate career goal.',
    quote: '"Everything in markets is a function of credit, currency, and time. Master those three and you master everything."',
    avatar: '👑',
    skills: { macroVision: 98, riskManagement: 88, lpRelations: 90, marketTiming: 82 },
    isActive: true,
    yearsActive: 35,
  },
];

// Simulate rival monthly return based on personality and economy phase
export function simulateRivalReturn(rival: RivalManager, economyPhase: string): number {
  const base = 0.008; // 0.8% base monthly return (~10% annualized)
  let multiplier = 1;
  let noise = (Math.random() - 0.5) * 0.04;

  switch (rival.personality) {
    case 'aggressive':
      multiplier = ['boom', 'euphoria'].includes(economyPhase) ? 2.5 : ['crisis', 'recession'].includes(economyPhase) ? -1.5 : 1.2;
      noise *= 2;
      break;
    case 'conservative':
      multiplier = ['crisis', 'recession'].includes(economyPhase) ? 0.8 : ['boom', 'euphoria'].includes(economyPhase) ? 0.5 : 0.9;
      noise *= 0.5;
      break;
    case 'contrarian':
      multiplier = ['crisis', 'recession'].includes(economyPhase) ? 2.0 : ['boom', 'euphoria'].includes(economyPhase) ? -0.5 : 0.8;
      break;
    case 'momentum':
      multiplier = ['boom', 'euphoria', 'expansion'].includes(economyPhase) ? 2.0 : ['crisis'].includes(economyPhase) ? -2.0 : 1.0;
      noise *= 1.5;
      break;
    case 'quant':
      multiplier = 1.1; // consistent edge
      noise *= 0.6;     // lower variance
      break;
    case 'macro':
      multiplier = 1.3; // generally above average
      break;
  }

  return base * multiplier + noise;
}

// Get rival's total return vs player for leaderboard
export function getRivalLeaderboard(rivals: RivalManager[], playerNAV: number, playerAUM: number) {
  const playerReturn = ((playerNAV - 1000) / 1000) * 100;

  const entries = rivals.map(r => {
    const totalReturn = r.monthlyReturns.reduce((nav, ret) => nav * (1 + ret), 1000);
    const returnPct = ((totalReturn - 1000) / 1000) * 100;
    return {
      id: r.id,
      name: r.name,
      fundName: r.fundName,
      aum: r.aum,
      nav: totalReturn,
      returnPct,
      avatar: r.avatar,
      personality: r.personality,
    };
  });

  entries.push({
    id: 'player',
    name: 'You',
    fundName: 'Your Fund',
    aum: playerAUM,
    nav: playerNAV,
    returnPct: playerReturn,
    avatar: '⭐',
    personality: 'player' as any,
  });

  return entries.sort((a, b) => b.returnPct - a.returnPct);
}
