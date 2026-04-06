import { Stock, EconomyState, Sector, CryptoAsset } from '../types';
import { gaussianRandom, clamp } from '../utils/math';

const SECTOR_ECONOMY_SENSITIVITY: Record<Sector | string, number> = {
  technology: 1.3,
  ai: 1.6,
  semiconductors: 1.5,
  banking: 1.4,
  healthcare: 0.6,
  defense: 0.4,
  retail: 0.9,
  energy: 1.1,
  industrials: 1.2,
  biotech: 0.8,
  realestate: 1.1,
  consumer: 1.0,
  utilities: 0.4,
  communications: 1.0,
  crypto: 2.0,
};

/**
 * Calculate a fair price estimate from fundamentals.
 * This anchors prices so they can't drift to absurd levels.
 */
function estimateFairValue(stock: Stock): number {
  if (stock.eps <= 0) {
    // Unprofitable companies: anchor to intrinsic quality * base multiplier
    return Math.max(1, stock.intrinsicQuality * 0.5 * (1 + stock.growthScore / 100));
  }
  // Fair P/E based on growth + quality
  const fairPE = 8 + (stock.growthScore / 100) * 25 + (stock.intrinsicQuality / 100) * 12;
  return stock.eps * fairPE;
}

export function calculateStockMove(
  stock: Stock,
  economy: EconomyState,
  daysSinceLastEarnings: number
): number {
  const { phase, inflationRate, federalFundsRate, marketSentiment, liquidityIndex } = economy;

  // Base volatility from stock's own characteristic
  const baseVol = stock.volatility / 100;

  // Gaussian random component — primary driver of daily noise (reduced from 0.015)
  const randomMove = gaussianRandom(0, baseVol * 0.012);

  // Momentum factor (weaker to prevent runaway trends)
  const momentumFactor = (stock.momentum - 50) / 7000;

  // Economy phase factor
  let phaseFactor = 0;
  switch (phase) {
    case 'boom': phaseFactor = 0.002; break;
    case 'expansion': phaseFactor = 0.0012; break;
    case 'euphoria': phaseFactor = 0.004; break;
    case 'slowdown': phaseFactor = -0.001; break;
    case 'recession': phaseFactor = -0.003; break;
    case 'crisis': phaseFactor = -0.008; break;
    case 'recovery': phaseFactor = 0.001; break;
    case 'stagflation': phaseFactor = -0.0015; break;
    case 'deflation': phaseFactor = -0.002; break;
  }

  // Sector sensitivity to economy
  const sectorSens = SECTOR_ECONOMY_SENSITIVITY[stock.sector] || 1.0;
  phaseFactor *= sectorSens;

  // Interest rate pressure (higher rates = lower multiples for growth)
  const ratePressure = -(federalFundsRate / 100) * 0.0004 * (stock.growthScore / 50);

  // Sentiment factor
  const sentimentFactor = (marketSentiment / 100) * 0.0006;

  // *** FUNDAMENTAL MEAN REVERSION — anchors prices to fair value ***
  const fairValue = estimateFairValue(stock);
  const priceToFairRatio = stock.currentPrice / fairValue;
  // Stronger reversion: if 2x fair value → -0.4% daily drag; 0.5x → +0.4% pull
  const fundamentalReversion = clamp((1 - priceToFairRatio) * 0.004, -0.006, 0.006);

  // Valuation mean reversion (supplements fundamental reversion)
  const valuationFactor = (stock.valuation - 50) / 80000;

  // Liquidity factor
  const liquidityFactor = (liquidityIndex - 50) / 12000;

  // Inflation effect - hurts growth stocks, helps value/energy
  const inflationEffect = stock.sector === 'energy' ? inflationRate * 0.00015 : -inflationRate * 0.00008;

  // Hype — fades faster now (more realistic)
  const hypeFactor = (stock.hype - 50) / 30000;

  // Earnings quality reversion
  const earningsFactor = (stock.earningsStrength - 50) / 60000;

  // Combine all factors
  const totalMove =
    randomMove +
    momentumFactor +
    phaseFactor +
    ratePressure +
    sentimentFactor +
    fundamentalReversion +
    valuationFactor +
    liquidityFactor +
    inflationEffect +
    hypeFactor +
    earningsFactor;

  // Cap daily moves: ±8% for normal stocks, ±12% for high-vol biotech/small caps
  const maxMove = (stock.sector === 'biotech' || stock.volatility > 70) ? 0.12 : 0.08;
  return clamp(totalMove, -maxMove, maxMove);
}

/**
 * Simulate quarterly earnings for a stock.
 * Returns price impact multiplier and updated stock qualities.
 */
export function simulateEarnings(stock: Stock, economy: EconomyState): {
  beatMiss: 'beat' | 'miss' | 'inline';
  priceImpact: number;
  newEps: number;
  newPE: number;
  headline: string;
  revenueBeat: boolean;
  guidance: 'raised' | 'maintained' | 'lowered';
  epsSurprisePct: number;
} {
  const qualityRoll = Math.random() * 100;
  const beatChance = stock.earningsStrength * 0.6 + (economy.gdpGrowth > 0 ? 15 : -10);

  let beatMiss: 'beat' | 'miss' | 'inline';
  let epsChange: number;
  let priceImpact: number;
  let epsSurprisePct = 0;

  if (qualityRoll < beatChance) {
    beatMiss = 'beat';
    const beatMagnitude = 0.05 + Math.random() * 0.20;
    epsChange = stock.eps > 0 ? stock.eps * beatMagnitude : Math.random() * 0.5;
    epsSurprisePct = beatMagnitude * 100;
    priceImpact = 0.02 + Math.random() * 0.07; // 2-9% pop (reduced from 10%)
    if (stock.hype > 80) priceImpact *= 0.4; // priced in
  } else if (qualityRoll > beatChance + 25) {
    beatMiss = 'miss';
    const missMagnitude = 0.05 + Math.random() * 0.20;
    epsChange = stock.eps > 0 ? -stock.eps * missMagnitude : -(Math.random() * 0.4);
    epsSurprisePct = -missMagnitude * 100;
    priceImpact = -(0.02 + Math.random() * 0.10); // 2-12% drop
    if (stock.valuation > 70) priceImpact *= 0.6; // cushioned if already cheap
  } else {
    beatMiss = 'inline';
    epsChange = stock.eps * (Math.random() * 0.04 - 0.02);
    priceImpact = gaussianRandom(0, 0.015);
    epsSurprisePct = epsChange / Math.max(0.01, Math.abs(stock.eps)) * 100;
  }

  // Revenue beat/miss (correlated but not identical to EPS)
  const revenueBeat = beatMiss === 'beat'
    ? Math.random() < 0.75
    : beatMiss === 'miss'
      ? Math.random() < 0.25
      : Math.random() < 0.5;

  // Guidance
  const guidanceRoll = Math.random();
  const guidance: 'raised' | 'maintained' | 'lowered' =
    beatMiss === 'beat' ? (guidanceRoll < 0.55 ? 'raised' : 'maintained') :
    beatMiss === 'miss' ? (guidanceRoll < 0.60 ? 'lowered' : 'maintained') :
    (guidanceRoll < 0.2 ? 'raised' : guidanceRoll < 0.75 ? 'maintained' : 'lowered');

  // Guidance amplifies price move
  if (guidance === 'raised') priceImpact += 0.01;
  if (guidance === 'lowered') priceImpact -= 0.015;

  const newEps = parseFloat((stock.eps + epsChange).toFixed(2));
  const newPrice = stock.currentPrice * (1 + priceImpact);
  const newPE = newEps > 0 ? parseFloat((newPrice / newEps).toFixed(1)) : stock.peRatio;

  const beatPct = Math.abs(epsSurprisePct).toFixed(0);
  const guidanceStr = guidance === 'raised' ? ', raises guidance 🚀' : guidance === 'lowered' ? ', cuts guidance ⚠️' : '';
  const revStr = revenueBeat ? ' Rev ✓' : ' Rev ✗';

  const headlines: Record<string, string[]> = {
    beat: [
      `${stock.ticker} Q earnings BEAT +${beatPct}% vs estimates${guidanceStr}`,
      `${stock.ticker} blowout quarter: EPS surpasses consensus${guidanceStr}`,
      `${stock.ticker} smashes estimates${revStr}${guidanceStr}`,
    ],
    miss: [
      `${stock.ticker} Q earnings MISS ${beatPct}% below estimates${guidanceStr}`,
      `${stock.ticker} disappoints: weaker-than-expected quarter${guidanceStr}`,
      `${stock.ticker} misses on EPS${revStr}${guidanceStr}`,
    ],
    inline: [
      `${stock.ticker} in-line quarter${revStr}${guidanceStr}`,
      `${stock.ticker} meets expectations, market reaction mixed`,
    ],
  };
  const headlineList = headlines[beatMiss];
  const headline = headlineList[Math.floor(Math.random() * headlineList.length)];

  return { beatMiss, priceImpact, newEps, newPE, headline, revenueBeat, guidance, epsSurprisePct };
}

export function updateStock(stock: Stock, economy: EconomyState): Stock {
  const movePercent = calculateStockMove(stock, economy, 0);
  const newPrice = Math.max(stock.currentPrice * (1 + movePercent), 0.01);
  const priceHistory = [...stock.priceHistory.slice(-89), parseFloat(newPrice.toFixed(4))];

  // Metrics drift with mean reversion
  // Formula: new = old * (1-α) + target * α + noise  →  equilibrium = target
  const newHype = clamp(
    stock.hype * 0.97 + 50 * 0.03 + gaussianRandom(0, 0.8),
    0, 100
  );
  const newMomentum = clamp(
    stock.momentum * 0.96 + 50 * 0.04 + // properly reverts to 50
    (movePercent > 0 ? 1.2 : -1.2) + gaussianRandom(0, 1.2),
    0, 100
  );
  const newSentiment = clamp(
    stock.sentiment * 0.97 + 50 * 0.03 + // properly reverts to 50
    (economy.marketSentiment / 100) * 1.5 + gaussianRandom(0, 0.8),
    0, 100
  );

  // Slowly update valuation score based on price vs fair value
  const fairValue = estimateFairValue(stock);
  const priceRatio = newPrice / fairValue;
  // If trading at 2x fair value, valuation should trend lower (overvalued)
  const valuationTarget = clamp(50 / priceRatio, 5, 95);
  const newValuation = clamp(
    stock.valuation * 0.98 + valuationTarget * 0.02,
    0, 100
  );

  const changeDollar = parseFloat((newPrice - stock.previousPrice).toFixed(4));
  const changePercent = parseFloat(((changeDollar / stock.previousPrice) * 100).toFixed(2));

  return {
    ...stock,
    previousPrice: stock.currentPrice,
    openPrice: stock.openPrice || stock.previousPrice,
    currentPrice: parseFloat(newPrice.toFixed(4)),
    highPrice: Math.max(stock.highPrice || newPrice, newPrice),
    lowPrice: Math.min(stock.lowPrice || newPrice, newPrice),
    changeDollar,
    changePercent,
    priceHistory,
    hype: newHype,
    momentum: newMomentum,
    sentiment: newSentiment,
    valuation: newValuation,
    volume: Math.floor(stock.volume * (0.7 + Math.random() * 0.6)),
  };
}

/**
 * Reset 52-week high/low tracking. Call at start of each year.
 */
export function reset52WeekRange(stock: Stock): Stock {
  return {
    ...stock,
    fiftyTwoWeekHigh: stock.currentPrice * 1.01,
    fiftyTwoWeekLow: stock.currentPrice * 0.99,
    highPrice: stock.currentPrice,
    lowPrice: stock.currentPrice,
  };
}

export function updateCrypto(crypto: CryptoAsset, economy: EconomyState): CryptoAsset {
  const sentimentBonus = economy.cryptoSentiment / 100 * 0.004;
  const vol = (crypto.volatility / 100) * 0.022;
  const randomMove = gaussianRandom(sentimentBonus, vol);
  // Small mean reversion for crypto too — prevents $10M bitcoin or $0.001 bitcoin
  const meanReversion = crypto.currentPrice > 200000 ? -0.001 : crypto.currentPrice < 5000 ? 0.001 : 0;
  const cappedMove = clamp(randomMove + meanReversion, -0.18, 0.18);
  const newPrice = Math.max(crypto.currentPrice * (1 + cappedMove), 0.000001);
  const priceHistory = [...crypto.priceHistory.slice(-89), parseFloat(newPrice.toFixed(8))];
  const changeDollar = newPrice - crypto.previousPrice;
  const changePercent = (changeDollar / crypto.previousPrice) * 100;
  return {
    ...crypto,
    previousPrice: crypto.currentPrice,
    currentPrice: parseFloat(newPrice.toFixed(8)),
    priceHistory,
    changePercent: parseFloat(changePercent.toFixed(2)),
    changeDollar: parseFloat(changeDollar.toFixed(8)),
    hype: clamp(crypto.hype * 0.995 + 50 * 0.005 + gaussianRandom(0, 1.5), 0, 100),
  };
}

export function updateAllStocks(
  stocks: Record<string, Stock>,
  economy: EconomyState
): Record<string, Stock> {
  const updated: Record<string, Stock> = {};
  for (const ticker of Object.keys(stocks)) {
    updated[ticker] = updateStock(stocks[ticker], economy);
  }
  return updated;
}

export function updateAllCrypto(
  crypto: Record<string, CryptoAsset>,
  economy: EconomyState
): Record<string, CryptoAsset> {
  const updated: Record<string, CryptoAsset> = {};
  for (const ticker of Object.keys(crypto)) {
    updated[ticker] = updateCrypto(crypto[ticker], economy);
  }
  return updated;
}

export function generateMarketNews(economy: EconomyState, stocks: Record<string, Stock>): string[] {
  const headlines: string[] = [];
  const { phase, inflationRate, federalFundsRate, marketSentiment } = economy;

  // Phase-specific headlines with more variety
  const phaseHeadlines: Record<string, string[]> = {
    boom: [
      'Markets rally for third consecutive week on strong earnings',
      'Record IPO pipeline as companies rush to capitalize on bull market',
      'Corporate buybacks surge as companies deploy excess cash',
      'M&A activity hits record pace across multiple sectors',
    ],
    crisis: [
      'Credit markets seize as liquidity dries up across sectors',
      'Emergency Fed meeting called amid market freefall',
      'Bank stocks crater as contagion fears spread',
      'Treasury yields spike as panic selling hits bond markets',
    ],
    recession: [
      'Unemployment rises to multi-year high as layoffs spread',
      'Consumer confidence drops sharply amid economic uncertainty',
      'Retail sales plunge as consumers tighten belts',
      'Manufacturing PMI contracts for sixth straight month',
    ],
    euphoria: [
      'Tech stocks post historic gains as AI mania continues',
      'Analysts warn of stretched valuations but bulls remain undeterred',
      'Retail trading volume hits all-time high across platforms',
      'Margin debt surges to record levels — analysts concerned',
    ],
    recovery: [
      'Economic indicators showing early signs of stabilization',
      'Central bank signals potential rate cuts as economy recovers',
      'Job openings tick up for first time in months',
      'Housing starts rise as confidence slowly returns',
    ],
    expansion: [
      'Steady growth continues with balanced economic outlook',
      'Earnings season delivers solid results across sectors',
      'Consumer spending rises modestly on improved employment',
      'Infrastructure spending boosts industrial sector outlook',
    ],
    slowdown: [
      'Growth shows signs of cooling as leading indicators soften',
      'Yield curve flattening raises recession probability',
      'Corporate guidance becomes cautious as margins compress',
      'Housing market cools as mortgage rates climb',
    ],
    stagflation: [
      'Inflation stubbornly high despite stagnant growth',
      'Real wages decline as prices outpace earnings',
      'Fed caught between fighting inflation and supporting growth',
      'Energy costs squeeze consumer budgets nationwide',
    ],
    deflation: [
      'Prices falling across major categories — deflation concerns mount',
      'Central bank considers unconventional measures to stimulate demand',
      'Debt burdens grow heavier as real interest rates rise',
      'Consumer hoarding cash as spending drops sharply',
    ],
  };

  const phaseOptions = phaseHeadlines[phase] || [];
  if (phaseOptions.length > 0) {
    // Pick 1-2 random headlines for this phase
    const shuffled = [...phaseOptions].sort(() => Math.random() - 0.5);
    headlines.push(shuffled[0]);
    if (Math.random() > 0.5 && shuffled.length > 1) headlines.push(shuffled[1]);
  }

  if (inflationRate > 5) {
    headlines.push(`CPI comes in hot at ${inflationRate.toFixed(1)}% — Fed under pressure to act`);
  } else if (inflationRate < 1) {
    headlines.push('Deflationary fears rise as inflation undershoots targets');
  }

  if (federalFundsRate > 5) {
    headlines.push('High rates continue to pressure growth and real estate sectors');
  } else if (federalFundsRate < 1) {
    headlines.push('Near-zero rates fuel risk appetite across asset classes');
  }

  if (marketSentiment < -50) {
    headlines.push('Fear index spikes as investors flee to safety');
  } else if (marketSentiment > 70) {
    headlines.push('Greed index at extreme levels — contrarians warning of correction');
  }

  // Stock-specific news: movers, analyst calls, insider activity
  const allStocks = Object.values(stocks).filter(s => s.assetType === 'stock');
  const bigMover = allStocks.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))[0];
  if (bigMover && Math.abs(bigMover.changePercent) > 2.5) {
    if (bigMover.changePercent > 0) {
      headlines.push(`${bigMover.ticker} (+${bigMover.changePercent.toFixed(1)}%) leads gainers on volume surge`);
    } else {
      headlines.push(`${bigMover.ticker} (${bigMover.changePercent.toFixed(1)}%) leads decliners amid selling`);
    }
  }

  // Analyst upgrade/downgrade (random, weighted by analyst rating)
  const upgradeCandidates = allStocks.filter(s => s.analystRating === 'sell' || s.analystRating === 'hold');
  const downgradeCandidates = allStocks.filter(s => s.analystRating === 'strong_buy' || s.analystRating === 'buy');
  const ANALYST_FIRMS = ['Goldman Sachs', 'Morgan Stanley', 'JPMorgan', 'Citi', 'BofA', 'Deutsche Bank', 'UBS', 'Barclays'];
  const firm = ANALYST_FIRMS[Math.floor(Math.random() * ANALYST_FIRMS.length)];

  if (Math.random() < 0.35 && upgradeCandidates.length > 0) {
    const s = upgradeCandidates[Math.floor(Math.random() * upgradeCandidates.length)];
    const newTarget = Math.round(s.currentPrice * (1.1 + Math.random() * 0.3));
    headlines.push(`${firm} upgrades ${s.ticker} to Buy, raises PT to $${newTarget}`);
  } else if (Math.random() < 0.25 && downgradeCandidates.length > 0) {
    const s = downgradeCandidates[Math.floor(Math.random() * downgradeCandidates.length)];
    headlines.push(`${firm} downgrades ${s.ticker} to Hold, cites valuation concerns`);
  }

  // Earnings coming up (upcoming catalysts)
  const earningsSoon = allStocks.filter(s => s.nextEarningsDay && s.nextEarningsDay > 0).slice(0, 3);
  if (earningsSoon.length > 0 && Math.random() < 0.4) {
    const picks = earningsSoon.slice(0, 2).map(s => s.ticker).join(', ');
    headlines.push(`Earnings watch: ${picks} reporting results soon — analysts divided`);
  }

  // Hot sector rotation
  const SECTORS = ['technology', 'ai', 'energy', 'healthcare', 'financials', 'industrials'];
  if (Math.random() < 0.3) {
    const hotSector = SECTORS[Math.floor(Math.random() * SECTORS.length)];
    const coldSector = SECTORS.filter(s => s !== hotSector)[Math.floor(Math.random() * (SECTORS.length - 1))];
    headlines.push(`Rotation: money flows into ${hotSector} while ${coldSector} sees outflows`);
  }

  return headlines.slice(0, 6);
}
