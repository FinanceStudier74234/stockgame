import { Portfolio, PortfolioHolding, TradeRecord, Stock, CryptoAsset, ETF, AssetType, OptionContract } from '../types';
import { calculateSharpe, calculateMaxDrawdown } from '../utils/math';

export function calculatePortfolioValue(
  portfolio: Portfolio,
  stocks: Record<string, Stock>,
  etfs: Record<string, ETF>,
  crypto: Record<string, CryptoAsset>
): Portfolio {
  let totalValue = 0;
  let totalCost = 0;
  let totalUnrealizedPnL = 0;
  let dayChange = 0;

  const updatedHoldings: Record<string, PortfolioHolding> = {};

  for (const [ticker, holding] of Object.entries(portfolio.holdings)) {
    let currentPrice = holding.currentPrice;

    if (stocks[ticker]) currentPrice = stocks[ticker].currentPrice;
    else if (etfs[ticker]) currentPrice = etfs[ticker].currentPrice;
    else if (crypto[ticker]) currentPrice = crypto[ticker].currentPrice;

    const marketValue = currentPrice * holding.shares;
    const cost = holding.averageCost * holding.shares;
    const unrealizedPnL = marketValue - cost;
    const unrealizedPnLPercent = cost > 0 ? (unrealizedPnL / cost) * 100 : 0;
    const prevValue = holding.currentPrice * holding.shares;

    totalValue += marketValue;
    totalCost += cost;
    totalUnrealizedPnL += unrealizedPnL;
    dayChange += marketValue - prevValue;

    updatedHoldings[ticker] = {
      ...holding,
      currentPrice,
      marketValue,
      unrealizedPnL,
      unrealizedPnLPercent,
    };
  }

  // Calculate options value
  let optionsValue = 0;
  const updatedOptions = portfolio.options.map(opt => {
    const stock = stocks[opt.ticker];
    if (!stock) return opt;
    const intrinsic = opt.type === 'call'
      ? Math.max(stock.currentPrice - opt.strikePrice, 0)
      : Math.max(opt.strikePrice - stock.currentPrice, 0);
    const extrinsic = Math.max(opt.currentValue - intrinsic, 0);
    const value = (intrinsic + extrinsic) * 100 * opt.contracts;
    optionsValue += value;
    return { ...opt, currentValue: value, intrinsicValue: intrinsic, extrinsicValue: extrinsic };
  });

  totalValue += optionsValue;

  const dayChangePercent = totalCost > 0 ? (dayChange / totalValue) * 100 : 0;
  const allTimeReturn = totalValue - totalCost + portfolio.totalRealizedPnL;
  const allTimeReturnPercent = totalCost > 0 ? (allTimeReturn / (totalCost + portfolio.totalRealizedPnL + portfolio.totalDividends)) * 100 : 0;

  // Update concentration
  const concentrationScore = totalValue > 0
    ? Math.max(...Object.values(updatedHoldings).map(h => (h.marketValue / totalValue) * 100))
    : 0;

  return {
    ...portfolio,
    holdings: updatedHoldings,
    options: updatedOptions,
    totalValue,
    totalCost,
    totalUnrealizedPnL,
    dayChange,
    dayChangePercent: parseFloat(dayChangePercent.toFixed(2)),
    allTimeReturn,
    allTimeReturnPercent: parseFloat(allTimeReturnPercent.toFixed(2)),
    concentrationScore: parseFloat(concentrationScore.toFixed(1)),
  };
}

export function executeBuy(
  portfolio: Portfolio,
  ticker: string,
  assetType: AssetType,
  shares: number,
  price: number,
  cash: number,
  totalDay: number
): { portfolio: Portfolio; newCash: number; error?: string } {
  const cost = shares * price;

  if (cost > cash) {
    return { portfolio, newCash: cash, error: 'Insufficient funds' };
  }
  if (shares <= 0) {
    return { portfolio, newCash: cash, error: 'Invalid share quantity' };
  }

  const existing = portfolio.holdings[ticker];
  let newHolding: PortfolioHolding;

  if (existing) {
    const totalShares = existing.shares + shares;
    const newAvgCost = (existing.averageCost * existing.shares + price * shares) / totalShares;
    newHolding = {
      ...existing,
      shares: totalShares,
      averageCost: newAvgCost,
      currentPrice: price,
      marketValue: totalShares * price,
      unrealizedPnL: (price - newAvgCost) * totalShares,
      unrealizedPnLPercent: newAvgCost > 0 ? ((price - newAvgCost) / newAvgCost) * 100 : 0,
    };
  } else {
    newHolding = {
      ticker,
      assetType,
      shares,
      averageCost: price,
      currentPrice: price,
      marketValue: shares * price,
      unrealizedPnL: 0,
      unrealizedPnLPercent: 0,
      realizedPnL: 0,
      dividendsEarned: 0,
      purchaseDate: totalDay,
    };
  }

  const tradeRecord: TradeRecord = {
    id: `trade_${Date.now()}`,
    date: totalDay,
    ticker,
    action: 'buy',
    shares,
    price,
    total: cost,
  };

  return {
    portfolio: {
      ...portfolio,
      holdings: { ...portfolio.holdings, [ticker]: newHolding },
      tradeHistory: [tradeRecord, ...portfolio.tradeHistory.slice(0, 199)],
    },
    newCash: cash - cost,
  };
}

export function executeSell(
  portfolio: Portfolio,
  ticker: string,
  shares: number,
  price: number,
  cash: number,
  totalDay: number
): { portfolio: Portfolio; newCash: number; error?: string } {
  const holding = portfolio.holdings[ticker];

  if (!holding) return { portfolio, newCash: cash, error: 'You don\'t own this stock' };
  if (shares > holding.shares) return { portfolio, newCash: cash, error: 'Not enough shares to sell' };
  if (shares <= 0) return { portfolio, newCash: cash, error: 'Invalid share quantity' };

  const proceeds = shares * price;
  const costBasis = holding.averageCost * shares;
  const realizedPnL = proceeds - costBasis;

  const remainingShares = holding.shares - shares;
  const updatedHoldings = { ...portfolio.holdings };

  if (remainingShares <= 0) {
    delete updatedHoldings[ticker];
  } else {
    updatedHoldings[ticker] = {
      ...holding,
      shares: remainingShares,
      marketValue: remainingShares * price,
      unrealizedPnL: (price - holding.averageCost) * remainingShares,
      unrealizedPnLPercent: holding.averageCost > 0 ? ((price - holding.averageCost) / holding.averageCost) * 100 : 0,
      realizedPnL: holding.realizedPnL + realizedPnL,
    };
  }

  const tradeRecord: TradeRecord = {
    id: `trade_${Date.now()}`,
    date: totalDay,
    ticker,
    action: 'sell',
    shares,
    price,
    total: proceeds,
    pnl: realizedPnL,
  };

  // Win rate calculation
  const trades = [tradeRecord, ...portfolio.tradeHistory];
  const closedTrades = trades.filter(t => t.pnl !== undefined);
  const wins = closedTrades.filter(t => (t.pnl || 0) > 0).length;
  const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;

  return {
    portfolio: {
      ...portfolio,
      holdings: updatedHoldings,
      totalRealizedPnL: portfolio.totalRealizedPnL + realizedPnL,
      tradeHistory: [tradeRecord, ...portfolio.tradeHistory.slice(0, 199)],
      winRate: parseFloat(winRate.toFixed(1)),
    },
    newCash: cash + proceeds,
  };
}

export function createInitialPortfolio(): Portfolio {
  return {
    holdings: {},
    options: [],
    shortPositions: {},
    limitOrders: [],
    watchlist: ['APX', 'NVDA', 'SPY'],
    totalValue: 0,
    totalCost: 0,
    totalUnrealizedPnL: 0,
    totalRealizedPnL: 0,
    totalDividends: 0,
    dayChange: 0,
    dayChangePercent: 0,
    allTimeReturn: 0,
    allTimeReturnPercent: 0,
    portfolioHistory: [],
    tradeHistory: [],
    winRate: 0,
    maxDrawdown: 0,
    sharpeScore: 0,
    concentrationScore: 0,
  };
}

export function addToWatchlist(portfolio: Portfolio, ticker: string): Portfolio {
  if (portfolio.watchlist.includes(ticker)) return portfolio;
  return { ...portfolio, watchlist: [...portfolio.watchlist, ticker] };
}

export function removeFromWatchlist(portfolio: Portfolio, ticker: string): Portfolio {
  return { ...portfolio, watchlist: portfolio.watchlist.filter(t => t !== ticker) };
}

export function updatePortfolioHistory(portfolio: Portfolio, cash: number, netWorth: number, day: number): Portfolio {
  const snapshot = {
    date: day,
    totalValue: portfolio.totalValue,
    cash,
    netWorth,
  };
  const history = [...portfolio.portfolioHistory.slice(-364), snapshot];

  // Update sharpe and drawdown from history
  if (history.length > 10) {
    const dailyReturns = history.slice(1).map((h, i) => {
      const prev = history[i].totalValue + history[i].cash;
      const curr = h.totalValue + h.cash;
      return prev > 0 ? (curr - prev) / prev : 0;
    });
    const sharpe = calculateSharpe(dailyReturns);
    const values = history.map(h => h.netWorth);
    const maxDD = calculateMaxDrawdown(values);
    return { ...portfolio, portfolioHistory: history, sharpeScore: parseFloat(sharpe.toFixed(2)), maxDrawdown: parseFloat((maxDD * 100).toFixed(2)) };
  }
  return { ...portfolio, portfolioHistory: history };
}
