import { EconomicPhase, Sector } from '../types';

export interface StockShockRule {
  sector?: Sector | 'all';
  multiplier: number;   // e.g. 0.6 = -40%, 1.4 = +40%
  specificTickers?: string[];
}

export interface MarketShock {
  id: string;
  name: string;
  headline: string;
  description: string;
  flavor: string;
  /** 0-1, daily probability of firing (very low) */
  probability: number;
  isOneTime: boolean;
  /** Only fire in these economy phases */
  allowedPhases?: EconomicPhase[];
  /** Economy phase to force after shock */
  forcePhase?: EconomicPhase;
  stockRules: StockShockRule[];
  cryptoMultiplier?: number;
  vixBump: number;
  sentimentShock: number;  // additive to marketSentiment
}

export const MARKET_SHOCKS: MarketShock[] = [
  {
    id: 'financial_crisis_2008',
    name: 'Global Financial Crisis',
    headline: 'BREAKING: Major bank collapse triggers global credit freeze',
    description: 'A systemically important bank has failed. Credit markets are seizing. The Fed is convening an emergency session. This is 2008 all over again.',
    flavor: '"When the music stops, in terms of liquidity, things will be complicated."',
    probability: 0.0004,
    isOneTime: true,
    forcePhase: 'crisis',
    stockRules: [
      { sector: 'banking', multiplier: 0.38 },
      { sector: 'realestate', multiplier: 0.45 },
      { sector: 'all', multiplier: 0.62 },
    ],
    cryptoMultiplier: 0.55,
    vixBump: 55,
    sentimentShock: -80,
  },
  {
    id: 'dotcom_bust',
    name: 'Tech Bubble Burst',
    headline: 'Tech valuations collapse as rate hikes destroy growth multiples',
    description: 'Years of easy money have inflated tech and AI valuations to absurd levels. The Fed\'s aggressive hiking has finally popped the bubble. Growth stocks are in freefall.',
    flavor: '"The Nasdaq lost 78% peak-to-trough last time."',
    probability: 0.0003,
    isOneTime: true,
    allowedPhases: ['euphoria', 'slowdown', 'recession'],
    forcePhase: 'recession',
    stockRules: [
      { sector: 'technology', multiplier: 0.42 },
      { sector: 'ai', multiplier: 0.35 },
      { sector: 'semiconductors', multiplier: 0.44 },
      { sector: 'biotech', multiplier: 0.55 },
      { sector: 'all', multiplier: 0.78 },
    ],
    cryptoMultiplier: 0.30,
    vixBump: 45,
    sentimentShock: -65,
  },
  {
    id: 'pandemic_shock',
    name: 'Global Pandemic Declared',
    headline: 'WHO declares global pandemic — economies shutting down',
    description: 'A fast-spreading pathogen has triggered worldwide lockdowns. Travel, hospitality, and retail are shutting down. Supply chains are breaking.',
    flavor: '"Nobody rang a bell at the top. Nobody rang a bell at the bottom."',
    probability: 0.0002,
    isOneTime: true,
    forcePhase: 'crisis',
    stockRules: [
      { sector: 'healthcare', multiplier: 1.35 },
      { sector: 'technology', multiplier: 1.15 },
      { sector: 'retail', multiplier: 0.40 },
      { sector: 'consumer', multiplier: 0.48 },
      { sector: 'energy', multiplier: 0.35 },
      { sector: 'all', multiplier: 0.72 },
    ],
    cryptoMultiplier: 0.60,
    vixBump: 60,
    sentimentShock: -75,
  },
  {
    id: 'flash_crash',
    name: 'Flash Crash',
    headline: 'Algorithmic cascade wipes 18% off markets in 23 minutes',
    description: 'A fat-finger trade at a major HFT firm triggered a cascade of stop-losses. Indices dropped 18% in minutes. Circuit breakers have kicked in. Expect a partial recovery.',
    flavor: '"Markets can remain irrational longer than you can remain solvent."',
    probability: 0.0008,
    isOneTime: false,
    allowedPhases: ['expansion', 'boom', 'euphoria', 'slowdown'],
    stockRules: [
      { sector: 'all', multiplier: 0.82 },
    ],
    cryptoMultiplier: 0.70,
    vixBump: 35,
    sentimentShock: -40,
  },
  {
    id: 'hyperinflation_shock',
    name: 'Hyperinflation Crisis',
    headline: 'CPI surges to 12.4% — Fed emergency 300bps rate hike',
    description: 'Runaway inflation has forced the Fed\'s hand. An emergency 300bps rate hike is hammering growth stocks and bonds. Value stocks, energy, and gold are surging.',
    flavor: '"Inflation is a form of hidden taxation."',
    probability: 0.0003,
    isOneTime: true,
    allowedPhases: ['boom', 'euphoria', 'stagflation'],
    forcePhase: 'stagflation',
    stockRules: [
      { sector: 'technology', multiplier: 0.62 },
      { sector: 'ai', multiplier: 0.58 },
      { sector: 'energy', multiplier: 1.42 },
      { sector: 'utilities', multiplier: 0.88 },
      { sector: 'realestate', multiplier: 0.70 },
      { sector: 'defense', multiplier: 1.12 },
      { sector: 'all', multiplier: 0.85 },
    ],
    cryptoMultiplier: 0.75,
    vixBump: 30,
    sentimentShock: -45,
  },
  {
    id: 'ai_bubble_burst',
    name: 'AI Bubble Implosion',
    headline: 'OpenAI revenue miss exposes AI sector as overhyped',
    description: 'A bombshell earnings report revealing AI monetization is years away has exposed the sector as a speculative bubble. AI and semiconductor stocks are in freefall.',
    flavor: '"Every bubble needs a pin."',
    probability: 0.0004,
    isOneTime: true,
    allowedPhases: ['euphoria', 'slowdown'],
    forcePhase: 'recession',
    stockRules: [
      { sector: 'ai', multiplier: 0.32 },
      { sector: 'semiconductors', multiplier: 0.40 },
      { sector: 'technology', multiplier: 0.60 },
      { sector: 'all', multiplier: 0.82 },
    ],
    cryptoMultiplier: 0.50,
    vixBump: 42,
    sentimentShock: -58,
  },
  {
    id: 'oil_crisis',
    name: 'Oil Shock',
    headline: 'OPEC+ cuts output by 5M barrels — oil spikes to $180/barrel',
    description: 'A surprise coordinated OPEC+ production cut has sent oil prices soaring. Energy stocks are spiking while airlines, transport, and consumer companies are crushed.',
    flavor: '"Cheap oil is a drug, and we\'re all addicts."',
    probability: 0.0005,
    isOneTime: false,
    stockRules: [
      { sector: 'energy', multiplier: 1.55 },
      { sector: 'industrials', multiplier: 0.80 },
      { sector: 'consumer', multiplier: 0.78 },
      { sector: 'retail', multiplier: 0.82 },
    ],
    vixBump: 20,
    sentimentShock: -25,
  },
  {
    id: 'crypto_contagion',
    name: 'Crypto Exchange Collapse',
    headline: 'Top crypto exchange insolvent — $40B in customer funds frozen',
    description: 'The second-largest crypto exchange has halted withdrawals. Customer funds are missing. A cascading collapse is underway across all crypto assets. Banking exposure is under scrutiny.',
    flavor: '"Not your keys, not your coins."',
    probability: 0.0005,
    isOneTime: true,
    stockRules: [
      { sector: 'banking', multiplier: 0.82 },
      { sector: 'technology', multiplier: 0.90 },
      { sector: 'all', multiplier: 0.93 },
    ],
    cryptoMultiplier: 0.22,
    vixBump: 28,
    sentimentShock: -35,
  },
  {
    id: 'sovereign_debt_crisis',
    name: 'Sovereign Debt Contagion',
    headline: 'Three EU nations miss bond payments — contagion spreads',
    description: 'Three European sovereigns have defaulted on bond payments. The ECB is overwhelmed. Global risk-off is in full force. Defensive assets and the dollar are surging.',
    flavor: '"Debt is the slavery of the free."',
    probability: 0.0003,
    isOneTime: true,
    allowedPhases: ['recession', 'crisis', 'slowdown'],
    forcePhase: 'crisis',
    stockRules: [
      { sector: 'banking', multiplier: 0.55 },
      { sector: 'realestate', multiplier: 0.62 },
      { sector: 'utilities', multiplier: 0.92 },
      { sector: 'defense', multiplier: 1.08 },
      { sector: 'all', multiplier: 0.74 },
    ],
    cryptoMultiplier: 0.65,
    vixBump: 48,
    sentimentShock: -70,
  },
  {
    id: 'bull_supercycle',
    name: 'Bull Market Supercycle Ignites',
    headline: 'Fed pivot + record earnings trigger historic bull run',
    description: 'The Fed has pivoted to aggressive rate cuts just as corporate earnings smash records. Institutional money is flooding into equities. A supercycle may be underway.',
    flavor: '"Bull markets are born on pessimism, grow on skepticism, mature on optimism, and die on euphoria."',
    probability: 0.0004,
    isOneTime: true,
    allowedPhases: ['recovery', 'recession'],
    forcePhase: 'euphoria',
    stockRules: [
      { sector: 'technology', multiplier: 1.30 },
      { sector: 'ai', multiplier: 1.45 },
      { sector: 'semiconductors', multiplier: 1.38 },
      { sector: 'all', multiplier: 1.18 },
    ],
    cryptoMultiplier: 1.60,
    vixBump: -20,
    sentimentShock: 60,
  },
];
