import { EconomyState, EconomicPhase, Sector, NewsHeadline } from '../types';
import { gaussianRandom, clamp } from '../utils/math';
import { generateNewsForDay } from '../data/newsTemplates';

const PHASE_TRANSITIONS: Record<EconomicPhase, { next: EconomicPhase[]; weights: number[]; avgDuration: number }> = {
  recovery:    { next: ['expansion', 'slowdown'],         weights: [0.8, 0.2],       avgDuration: 90 },
  expansion:   { next: ['boom', 'slowdown'],              weights: [0.6, 0.4],       avgDuration: 180 },
  boom:        { next: ['euphoria', 'slowdown'],          weights: [0.4, 0.6],       avgDuration: 120 },
  euphoria:    { next: ['slowdown', 'recession'],         weights: [0.5, 0.5],       avgDuration: 60 },
  slowdown:    { next: ['recession', 'expansion'],        weights: [0.55, 0.45],     avgDuration: 90 },
  recession:   { next: ['crisis', 'recovery'],            weights: [0.3, 0.7],       avgDuration: 180 },
  crisis:      { next: ['recession', 'recovery'],         weights: [0.4, 0.6],       avgDuration: 90 },
  stagflation: { next: ['recession', 'slowdown'],         weights: [0.5, 0.5],       avgDuration: 150 },
  deflation:   { next: ['crisis', 'recovery'],            weights: [0.4, 0.6],       avgDuration: 120 },
};

const PHASE_TARGETS: Record<EconomicPhase, Partial<EconomyState>> = {
  recovery:    { gdpGrowth: 1.5, inflationRate: 2.5, unemploymentRate: 6.5, marketSentiment: 10, liquidityIndex: 55, federalFundsRate: 2.0, vixLevel: 22 },
  expansion:   { gdpGrowth: 2.8, inflationRate: 2.8, unemploymentRate: 4.5, marketSentiment: 40, liquidityIndex: 70, federalFundsRate: 3.0, vixLevel: 16 },
  boom:        { gdpGrowth: 4.2, inflationRate: 3.5, unemploymentRate: 3.5, marketSentiment: 65, liquidityIndex: 80, federalFundsRate: 3.5, vixLevel: 13 },
  euphoria:    { gdpGrowth: 5.0, inflationRate: 4.5, unemploymentRate: 3.0, marketSentiment: 90, liquidityIndex: 90, federalFundsRate: 4.0, vixLevel: 10 },
  slowdown:    { gdpGrowth: 1.0, inflationRate: 3.0, unemploymentRate: 5.5, marketSentiment: -10, liquidityIndex: 55, federalFundsRate: 4.5, vixLevel: 25 },
  recession:   { gdpGrowth: -1.5, inflationRate: 2.0, unemploymentRate: 7.5, marketSentiment: -50, liquidityIndex: 40, federalFundsRate: 3.0, vixLevel: 35 },
  crisis:      { gdpGrowth: -4.0, inflationRate: 1.5, unemploymentRate: 10.0, marketSentiment: -85, liquidityIndex: 20, federalFundsRate: 0.5, vixLevel: 65 },
  stagflation: { gdpGrowth: 0.5, inflationRate: 7.0, unemploymentRate: 7.0, marketSentiment: -30, liquidityIndex: 45, federalFundsRate: 6.0, vixLevel: 30 },
  deflation:   { gdpGrowth: -2.0, inflationRate: -0.5, unemploymentRate: 8.0, marketSentiment: -60, liquidityIndex: 30, federalFundsRate: 0.25, vixLevel: 45 },
};

const SECTOR_ROTATION_BY_PHASE: Record<EconomicPhase, Sector[]> = {
  recovery:    ['consumer', 'technology', 'industrials'],
  expansion:   ['technology', 'consumer', 'banking', 'industrials'],
  boom:        ['technology', 'ai', 'semiconductors', 'consumer'],
  euphoria:    ['ai', 'semiconductors', 'technology', 'biotech'],
  slowdown:    ['utilities', 'healthcare', 'defense', 'banking'],
  recession:   ['utilities', 'healthcare', 'defense'],
  crisis:      ['utilities', 'defense', 'energy'],
  stagflation: ['energy', 'defense', 'utilities'],
  deflation:   ['utilities', 'healthcare', 'realestate'],
};

export function updateEconomy(economy: EconomyState): EconomyState {
  const targets = PHASE_TARGETS[economy.phase];
  const lerpFactor = 0.02; // slow convergence to targets

  function lerpToTarget(current: number, targetKey: keyof EconomyState): number {
    const target = targets[targetKey] as number | undefined;
    if (target === undefined) return current;
    return current + (target - current) * lerpFactor + gaussianRandom(0, Math.abs(target - current) * 0.05);
  }

  const newSentiment = clamp(
    lerpToTarget(economy.marketSentiment, 'marketSentiment') + gaussianRandom(0, 3),
    -100,
    100
  );

  const newVix = clamp(
    lerpToTarget(economy.vixLevel, 'vixLevel') + gaussianRandom(0, 2),
    5,
    100
  );

  const newGdp = lerpToTarget(economy.gdpGrowth, 'gdpGrowth') + gaussianRandom(0, 0.1);
  const newInflation = clamp(lerpToTarget(economy.inflationRate, 'inflationRate') + gaussianRandom(0, 0.1), -2, 20);
  const newUnemployment = clamp(lerpToTarget(economy.unemploymentRate, 'unemploymentRate') + gaussianRandom(0, 0.1), 2, 20);
  const newRates = clamp(lerpToTarget(economy.federalFundsRate, 'federalFundsRate') + gaussianRandom(0, 0.02), 0, 20);
  const newLiquidity = clamp(lerpToTarget(economy.liquidityIndex, 'liquidityIndex') + gaussianRandom(0, 1), 0, 100);
  const newConsumerConf = clamp(economy.consumerConfidence + (newSentiment - economy.marketSentiment) * 0.3 + gaussianRandom(0, 1), 0, 100);

  // Phase transition check
  const newMonthsRemaining = economy.phaseMonthsRemaining - 1;
  let newPhase = economy.phase;
  let newMonths = newMonthsRemaining;

  if (newMonthsRemaining <= 0) {
    const transition = PHASE_TRANSITIONS[economy.phase];
    const roll = Math.random();
    let cumulative = 0;
    for (let i = 0; i < transition.weights.length; i++) {
      cumulative += transition.weights[i];
      if (roll < cumulative) {
        newPhase = transition.next[i];
        break;
      }
    }
    newMonths = Math.floor(transition.avgDuration * (0.7 + Math.random() * 0.6));
  }

  // Oil & gold
  const newOil = clamp(economy.oilPrice * (1 + gaussianRandom(0, 0.01)), 30, 200);
  const newGold = clamp(economy.goldPrice * (1 + gaussianRandom(0, 0.005) + (newSentiment < -30 ? 0.002 : 0)), 1000, 5000);

  // Crypto sentiment follows general sentiment but with more volatility
  const newCryptoSentiment = clamp(
    economy.cryptoSentiment * 0.95 + newSentiment * 0.05 + gaussianRandom(0, 8),
    -100,
    100
  );

  const newTenYearYield = clamp(newRates + (newInflation * 0.3) + gaussianRandom(0, 0.1), 0.1, 15);
  const newCreditAvailability = clamp(
    100 - (newRates * 5) - (newVix / 2) + (newLiquidity / 3),
    0,
    100
  );
  const newDollarStrength = clamp(
    50 + (newRates - 3) * 5 + gaussianRandom(0, 1),
    20,
    90
  );

  // Generate news headlines every 3 days (when economy updates)
  const newTemplates = generateNewsForDay(newPhase, 0, 2);
  const newHeadlines: NewsHeadline[] = newTemplates.map((t, i) => ({
    id: `news_${Date.now()}_${i}`,
    date: 0,
    headline: t.headline,
    category: t.category,
    sentiment: t.sentiment,
    affectedSectors: t.affectedSectors,
    impactMagnitude: t.impactMagnitude,
  }));
  // Keep last 15 headlines
  const updatedHeadlines = [...newHeadlines, ...economy.newsHeadlines].slice(0, 15);

  return {
    ...economy,
    phase: newPhase,
    phaseMonthsRemaining: newMonths,
    gdpGrowth: parseFloat(newGdp.toFixed(2)),
    inflationRate: parseFloat(newInflation.toFixed(2)),
    unemploymentRate: parseFloat(newUnemployment.toFixed(2)),
    federalFundsRate: parseFloat(newRates.toFixed(2)),
    tenYearYield: parseFloat(newTenYearYield.toFixed(2)),
    creditAvailability: parseFloat(newCreditAvailability.toFixed(1)),
    marketSentiment: parseFloat(newSentiment.toFixed(1)),
    liquidityIndex: parseFloat(newLiquidity.toFixed(1)),
    consumerConfidence: parseFloat(newConsumerConf.toFixed(1)),
    vixLevel: parseFloat(newVix.toFixed(1)),
    dollarsStrength: parseFloat(newDollarStrength.toFixed(1)),
    oilPrice: parseFloat(newOil.toFixed(2)),
    goldPrice: parseFloat(newGold.toFixed(2)),
    cryptoSentiment: parseFloat(newCryptoSentiment.toFixed(1)),
    sectorRotation: SECTOR_ROTATION_BY_PHASE[newPhase],
    newsHeadlines: updatedHeadlines,
  };
}

export function createInitialEconomy(): EconomyState {
  // Randomize starting phase for replay variety
  const startingPhases: { phase: EconomicPhase; weight: number }[] = [
    { phase: 'expansion', weight: 0.30 },
    { phase: 'boom', weight: 0.15 },
    { phase: 'recovery', weight: 0.20 },
    { phase: 'slowdown', weight: 0.15 },
    { phase: 'recession', weight: 0.10 },
    { phase: 'euphoria', weight: 0.05 },
    { phase: 'stagflation', weight: 0.05 },
  ];
  let roll = Math.random();
  let startPhase: EconomicPhase = 'expansion';
  for (const sp of startingPhases) {
    roll -= sp.weight;
    if (roll <= 0) { startPhase = sp.phase; break; }
  }

  const targets = PHASE_TARGETS[startPhase];
  // Add noise to starting values so each game feels different
  const noise = (base: number, pct: number) => base + base * (Math.random() - 0.5) * pct;

  return {
    phase: startPhase,
    gdpGrowth: parseFloat(noise(targets.gdpGrowth as number || 2.0, 0.3).toFixed(2)),
    inflationRate: parseFloat(noise(targets.inflationRate as number || 2.5, 0.3).toFixed(2)),
    unemploymentRate: parseFloat(noise(targets.unemploymentRate as number || 5.0, 0.2).toFixed(2)),
    federalFundsRate: parseFloat(noise(targets.federalFundsRate as number || 3.0, 0.3).toFixed(2)),
    tenYearYield: parseFloat(noise(4.0, 0.3).toFixed(2)),
    creditAvailability: parseFloat(noise(60, 0.3).toFixed(1)),
    marketSentiment: parseFloat(noise(targets.marketSentiment as number || 20, 0.5).toFixed(1)),
    liquidityIndex: parseFloat(noise(targets.liquidityIndex as number || 60, 0.3).toFixed(1)),
    consumerConfidence: parseFloat(noise(65, 0.3).toFixed(1)),
    vixLevel: parseFloat(noise(targets.vixLevel as number || 18, 0.3).toFixed(1)),
    dollarsStrength: parseFloat(noise(55, 0.2).toFixed(1)),
    oilPrice: parseFloat(noise(78, 0.3).toFixed(2)),
    goldPrice: parseFloat(noise(2000, 0.15).toFixed(2)),
    cryptoSentiment: parseFloat(noise(40, 0.5).toFixed(1)),
    sectorRotation: SECTOR_ROTATION_BY_PHASE[startPhase],
    phaseMonthsRemaining: Math.floor(60 + Math.random() * 120),
    bubbleSectors: [],
    crisisTriggers: [],
    newsHeadlines: [],
  };
}

export function getPhaseColor(phase: EconomicPhase): string {
  const colors: Record<EconomicPhase, string> = {
    boom: 'text-accent-green',
    expansion: 'text-accent-blue',
    euphoria: 'text-accent-purple',
    slowdown: 'text-accent-yellow',
    recession: 'text-accent-orange',
    crisis: 'text-accent-red',
    recovery: 'text-accent-cyan',
    stagflation: 'text-accent-orange',
    deflation: 'text-accent-red',
  };
  return colors[phase] || 'text-gray-400';
}

export function getPhaseDescription(phase: EconomicPhase): string {
  const descriptions: Record<EconomicPhase, string> = {
    boom: 'Strong growth, high employment, rising markets',
    expansion: 'Healthy growth, stable employment, positive outlook',
    euphoria: 'Excessive optimism, stretched valuations, FOMO everywhere',
    slowdown: 'Growth decelerating, uncertainty rising',
    recession: 'Negative growth, rising unemployment, contracting credit',
    crisis: 'Financial system under stress, extreme volatility',
    recovery: 'Early stage rebound, cautious optimism',
    stagflation: 'Stagnant growth with high inflation — worst of both worlds',
    deflation: 'Falling prices, debt deflation risk, economic contraction',
  };
  return descriptions[phase] || '';
}
