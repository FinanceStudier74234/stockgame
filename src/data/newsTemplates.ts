import { EconomicPhase, Sector } from '../types';

export interface NewsTemplate {
  headline: string;
  category: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  affectedSectors: Sector[];
  impactMagnitude: number;  // 0-100
  phase?: EconomicPhase[];
}

export const NEWS_TEMPLATES: NewsTemplate[] = [
  // Bullish macro
  { headline: 'Fed signals pause in rate hikes, markets rally', category: 'macro', sentiment: 'bullish', affectedSectors: ['banking', 'realestate', 'technology'], impactMagnitude: 70, phase: ['recovery', 'expansion'] },
  { headline: 'GDP growth beats expectations at 3.5% annualized', category: 'macro', sentiment: 'bullish', affectedSectors: ['technology', 'consumer', 'industrials'], impactMagnitude: 60 },
  { headline: 'Unemployment drops to 3.8%, labor market remains resilient', category: 'macro', sentiment: 'bullish', affectedSectors: ['consumer', 'retail'], impactMagnitude: 45 },
  { headline: 'Consumer confidence surges to 12-year high', category: 'macro', sentiment: 'bullish', affectedSectors: ['retail', 'consumer'], impactMagnitude: 50 },
  { headline: 'Treasury yields stabilize after weeks of volatility', category: 'macro', sentiment: 'bullish', affectedSectors: ['banking', 'realestate'], impactMagnitude: 40 },
  { headline: 'Inflation cools to 2.1%, below Fed target', category: 'macro', sentiment: 'bullish', affectedSectors: ['technology', 'consumer', 'realestate'], impactMagnitude: 65, phase: ['recovery', 'expansion'] },

  // Bearish macro
  { headline: 'Fed raises rates by 50bps, signals more hikes ahead', category: 'macro', sentiment: 'bearish', affectedSectors: ['realestate', 'banking', 'technology'], impactMagnitude: 75, phase: ['stagflation', 'slowdown'] },
  { headline: 'CPI hits 7.2% as inflation remains stubbornly high', category: 'macro', sentiment: 'bearish', affectedSectors: ['consumer', 'retail', 'utilities'], impactMagnitude: 70, phase: ['stagflation'] },
  { headline: 'Yield curve inverts for first time since 2019', category: 'macro', sentiment: 'bearish', affectedSectors: ['banking', 'realestate'], impactMagnitude: 65, phase: ['slowdown', 'recession'] },
  { headline: 'US recession fears mount as PMI falls below 50', category: 'macro', sentiment: 'bearish', affectedSectors: ['industrials', 'consumer'], impactMagnitude: 70, phase: ['recession', 'crisis'] },
  { headline: 'Credit spreads widen sharply on default concerns', category: 'macro', sentiment: 'bearish', affectedSectors: ['banking', 'realestate'], impactMagnitude: 75, phase: ['crisis'] },

  // Tech sector
  { headline: 'AI chipmaker beats Q3 earnings by 40%, raises guidance', category: 'earnings', sentiment: 'bullish', affectedSectors: ['ai', 'semiconductors'], impactMagnitude: 80 },
  { headline: 'Big Tech announces $50B AI infrastructure buildout', category: 'tech', sentiment: 'bullish', affectedSectors: ['ai', 'technology', 'semiconductors'], impactMagnitude: 65 },
  { headline: 'Antitrust regulators launch new probe into tech giant', category: 'regulatory', sentiment: 'bearish', affectedSectors: ['technology', 'ai'], impactMagnitude: 55 },
  { headline: 'Semiconductor shortage eases, supply chains normalize', category: 'supply', sentiment: 'bullish', affectedSectors: ['semiconductors', 'technology'], impactMagnitude: 55 },
  { headline: 'Startup IPO season reopens with string of tech listings', category: 'market', sentiment: 'bullish', affectedSectors: ['technology'], impactMagnitude: 40 },
  { headline: 'Cloud computing growth accelerates, enterprise spending up 28%', category: 'tech', sentiment: 'bullish', affectedSectors: ['technology', 'ai'], impactMagnitude: 50 },
  { headline: 'Major data breach shakes confidence in cloud providers', category: 'security', sentiment: 'bearish', affectedSectors: ['technology'], impactMagnitude: 55 },

  // Energy
  { headline: 'OPEC+ slashes output by 1.5M bpd in surprise move', category: 'energy', sentiment: 'bullish', affectedSectors: ['energy'], impactMagnitude: 70 },
  { headline: 'Oil prices crash 15% on global demand concerns', category: 'energy', sentiment: 'bearish', affectedSectors: ['energy'], impactMagnitude: 75 },
  { headline: 'Renewable energy investment hits record $1.8T globally', category: 'energy', sentiment: 'bullish', affectedSectors: ['energy', 'utilities'], impactMagnitude: 50 },
  { headline: 'Natural gas supply crunch drives utilities higher', category: 'energy', sentiment: 'bullish', affectedSectors: ['utilities', 'energy'], impactMagnitude: 55 },

  // Healthcare/Biotech
  { headline: 'FDA approves breakthrough gene therapy for rare disease', category: 'biotech', sentiment: 'bullish', affectedSectors: ['biotech', 'healthcare'], impactMagnitude: 75 },
  { headline: 'Drug trial failure wipes out $8B in biotech market cap', category: 'biotech', sentiment: 'bearish', affectedSectors: ['biotech'], impactMagnitude: 65 },
  { headline: 'Medicare pricing negotiations to cut drug costs 40%', category: 'regulatory', sentiment: 'bearish', affectedSectors: ['healthcare', 'biotech'], impactMagnitude: 60 },
  { headline: 'Pharma M&A wave: 3 major deals announced this week', category: 'mergers', sentiment: 'bullish', affectedSectors: ['healthcare', 'biotech'], impactMagnitude: 55 },

  // Banking/Finance
  { headline: 'Major bank reports record trading revenue of $18B', category: 'earnings', sentiment: 'bullish', affectedSectors: ['banking'], impactMagnitude: 60 },
  { headline: 'Regional bank failures spark contagion fears', category: 'crisis', sentiment: 'bearish', affectedSectors: ['banking', 'realestate'], impactMagnitude: 80, phase: ['crisis'] },
  { headline: 'Private equity deal flow picks up as credit markets ease', category: 'market', sentiment: 'bullish', affectedSectors: ['banking'], impactMagnitude: 45 },

  // Defense
  { headline: 'Pentagon announces $80B defense procurement package', category: 'defense', sentiment: 'bullish', affectedSectors: ['defense'], impactMagnitude: 65 },
  { headline: 'Geopolitical tensions rise, defense stocks surge', category: 'geopolitical', sentiment: 'bullish', affectedSectors: ['defense'], impactMagnitude: 55 },

  // Crypto
  { headline: 'Bitcoin ETF approval triggers massive institutional inflows', category: 'crypto', sentiment: 'bullish', affectedSectors: ['crypto'], impactMagnitude: 85 },
  { headline: 'Crypto exchange collapses, $3B in customer funds frozen', category: 'crypto', sentiment: 'bearish', affectedSectors: ['crypto'], impactMagnitude: 80 },
  { headline: 'Central bank digital currency pilot launches in 5 countries', category: 'crypto', sentiment: 'neutral', affectedSectors: ['crypto', 'banking'], impactMagnitude: 40 },

  // Real estate
  { headline: 'Commercial real estate vacancies hit 30-year high', category: 'realestate', sentiment: 'bearish', affectedSectors: ['realestate'], impactMagnitude: 60, phase: ['recession', 'slowdown'] },
  { headline: 'Housing starts surge 22% on falling mortgage rates', category: 'realestate', sentiment: 'bullish', affectedSectors: ['realestate'], impactMagnitude: 55 },

  // Market structure
  { headline: 'Short squeeze in heavily-shorted small caps drives 50% moves', category: 'market', sentiment: 'bullish', affectedSectors: ['technology', 'biotech'], impactMagnitude: 50 },
  { headline: 'VIX spikes to 35 as options market prices in turbulence', category: 'market', sentiment: 'bearish', affectedSectors: ['technology'], impactMagnitude: 55 },
  { headline: 'Institutional buying accelerates as retail sentiment turns negative', category: 'market', sentiment: 'bullish', affectedSectors: ['technology', 'consumer'], impactMagnitude: 45 },
  { headline: 'S&P 500 breaks 2-year high, momentum traders pile in', category: 'market', sentiment: 'bullish', affectedSectors: ['technology', 'industrials'], impactMagnitude: 60, phase: ['boom', 'euphoria'] },
  { headline: 'Market breadth deteriorates, only 20% of stocks above 200-day MA', category: 'market', sentiment: 'bearish', affectedSectors: ['technology', 'consumer'], impactMagnitude: 45, phase: ['slowdown', 'recession'] },
];

export function generateNewsForDay(
  phase: EconomicPhase,
  totalDays: number,
  count: number = 3
): NewsTemplate[] {
  // Filter by phase if applicable
  const phaseTemplates = NEWS_TEMPLATES.filter(t =>
    !t.phase || t.phase.includes(phase)
  );

  // Shuffle and pick
  const shuffled = [...phaseTemplates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
