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

export function calculateStockMove(
  stock: Stock,
  economy: EconomyState,
  daysSinceLastEarnings: number
): number {
  const { phase, inflationRate, federalFundsRate, marketSentiment, liquidityIndex } = economy;

  // Base volatility from stock's own characteristic
  const baseVol = stock.volatility / 100;

  // Gaussian random component
  const randomMove = gaussianRandom(0, baseVol * 0.015);

  // Momentum factor
  const momentumFactor = (stock.momentum - 50) / 5000;

  // Economy phase factor
  let phaseFactor = 0;
  switch (phase) {
    case 'boom': phaseFactor = 0.003; break;
    case 'expansion': phaseFactor = 0.002; break;
    case 'euphoria': phaseFactor = 0.005; break;
    case 'slowdown': phaseFactor = -0.001; break;
    case 'recession': phaseFactor = -0.004; break;
    case 'crisis': phaseFactor = -0.010; break;
    case 'recovery': phaseFactor = 0.001; break;
    case 'stagflation': phaseFactor = -0.002; break;
    case 'deflation': phaseFactor = -0.003; break;
  }

  // Sector sensitivity to economy
  const sectorSens = SECTOR_ECONOMY_SENSITIVITY[stock.sector] || 1.0;
  phaseFactor *= sectorSens;

  // Interest rate pressure (higher rates = lower multiples for growth)
  const ratePressure = -(federalFundsRate / 100) * 0.0005 * (stock.growthScore / 50);

  // Sentiment factor
  const sentimentFactor = (marketSentiment / 100) * 0.0008;

  // Valuation mean reversion (overvalued = slight drag, undervalued = slight pull)
  const valuationFactor = (stock.valuation - 50) / 100000;

  // Liquidity factor
  const liquidityFactor = (liquidityIndex - 50) / 10000;

  // Inflation effect - hurts growth stocks, helps value/energy
  const inflationEffect = stock.sector === 'energy' ? inflationRate * 0.0002 : -inflationRate * 0.0001;

  // Hype decay or buildup
  const hypeFactor = (stock.hype - 50) / 20000;

  // Earnings quality reversion
  const earningsFactor = (stock.earningsStrength - 50) / 50000;

  // Combine all factors
  const totalMove =
    randomMove +
    momentumFactor +
    phaseFactor +
    ratePressure +
    sentimentFactor +
    valuationFactor +
    liquidityFactor +
    inflationEffect +
    hypeFactor +
    earningsFactor;

  // Cap extreme moves to realistic intraday ranges
  return clamp(totalMove, -0.15, 0.15);
}

export function updateStock(stock: Stock, economy: EconomyState): Stock {
  const movePercent = calculateStockMove(stock, economy, 0);
  const newPrice = Math.max(stock.currentPrice * (1 + movePercent), 0.01);
  const priceHistory = [...stock.priceHistory.slice(-89), parseFloat(newPrice.toFixed(4))];

  // Update metrics with random drift
  const newHype = clamp(stock.hype + gaussianRandom(0, 1), 0, 100);
  const newMomentum = clamp(stock.momentum * 0.97 + (movePercent > 0 ? 3 : -3) + gaussianRandom(0, 2), 0, 100);
  const newSentiment = clamp(stock.sentiment * 0.98 + (economy.marketSentiment / 100) * 2 + gaussianRandom(0, 1), 0, 100);

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
    volume: Math.floor(stock.volume * (0.7 + Math.random() * 0.6)),
  };
}

export function updateCrypto(crypto: CryptoAsset, economy: EconomyState): CryptoAsset {
  const sentimentBonus = economy.cryptoSentiment / 100 * 0.005;
  const vol = (crypto.volatility / 100) * 0.025;
  const randomMove = gaussianRandom(sentimentBonus, vol);
  const cappedMove = clamp(randomMove, -0.20, 0.20);
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
    hype: clamp(crypto.hype + gaussianRandom(0, 2), 0, 100),
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

  if (phase === 'boom') {
    headlines.push('Markets rally for third consecutive week on strong earnings');
    headlines.push('Record IPO pipeline as companies rush to capitalize on bull market');
  } else if (phase === 'crisis') {
    headlines.push('Credit markets seize as liquidity dries up across sectors');
    headlines.push('Emergency Fed meeting called amid market freefall');
  } else if (phase === 'recession') {
    headlines.push('Unemployment rises to multi-year high as layoffs spread');
    headlines.push('Consumer confidence drops sharply amid economic uncertainty');
  } else if (phase === 'euphoria') {
    headlines.push('Tech stocks post historic gains as AI mania continues');
    headlines.push('Analysts warn of stretched valuations but bulls remain undeterred');
  } else if (phase === 'recovery') {
    headlines.push('Economic indicators showing early signs of stabilization');
    headlines.push('Central bank signals potential rate cuts as economy recovers');
  }

  if (inflationRate > 5) {
    headlines.push(`CPI comes in hot at ${inflationRate.toFixed(1)}% — Fed under pressure to act`);
  } else if (inflationRate < 2) {
    headlines.push('Deflationary fears rise as inflation undershoots targets');
  }

  if (federalFundsRate > 5) {
    headlines.push('High rates continue to pressure growth and real estate sectors');
  }

  if (marketSentiment < -50) {
    headlines.push('Fear index spikes as investors flee to safety');
  } else if (marketSentiment > 70) {
    headlines.push('Greed index at extreme levels — contrarians warning of correction');
  }

  // Random stock-specific news
  const tickers = Object.keys(stocks);
  if (tickers.length > 0) {
    const randomTicker = tickers[Math.floor(Math.random() * tickers.length)];
    const stock = stocks[randomTicker];
    if (stock.changePercent > 5) {
      headlines.push(`${randomTicker} surges ${stock.changePercent.toFixed(1)}% on strong momentum`);
    } else if (stock.changePercent < -5) {
      headlines.push(`${randomTicker} drops ${Math.abs(stock.changePercent).toFixed(1)}% amid selling pressure`);
    }
  }

  return headlines.slice(0, 5);
}
