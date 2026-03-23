// Black-Scholes Options Pricing Engine

// Cumulative normal distribution approximation
function normCDF(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return 0.5 * (1.0 + sign * y);
}

// Standard normal PDF
function normPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

export interface BSInputs {
  stockPrice: number;       // S
  strikePrice: number;      // K
  timeToExpiry: number;     // T in years
  riskFreeRate: number;     // r (e.g. 0.05 for 5%)
  impliedVolatility: number; // σ (e.g. 0.30 for 30%)
  optionType: 'call' | 'put';
}

export interface BSResult {
  premium: number;
  intrinsicValue: number;
  extrinsicValue: number;
  delta: number;
  gamma: number;
  theta: number;    // per day decay
  vega: number;
  rho: number;
  impliedVolatility: number;
}

export function blackScholes(inputs: BSInputs): BSResult {
  const { stockPrice: S, strikePrice: K, timeToExpiry: T, riskFreeRate: r, impliedVolatility: sigma, optionType } = inputs;

  // Handle edge cases
  if (T <= 0) {
    const intrinsic = optionType === 'call'
      ? Math.max(0, S - K)
      : Math.max(0, K - S);
    return {
      premium: intrinsic,
      intrinsicValue: intrinsic,
      extrinsicValue: 0,
      delta: optionType === 'call' ? (S > K ? 1 : 0) : (S < K ? -1 : 0),
      gamma: 0,
      theta: 0,
      vega: 0,
      rho: 0,
      impliedVolatility: sigma,
    };
  }

  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;

  let premium: number;
  let delta: number;
  let rho: number;

  if (optionType === 'call') {
    premium = S * normCDF(d1) - K * Math.exp(-r * T) * normCDF(d2);
    delta = normCDF(d1);
    rho = K * T * Math.exp(-r * T) * normCDF(d2) / 100;
  } else {
    premium = K * Math.exp(-r * T) * normCDF(-d2) - S * normCDF(-d1);
    delta = normCDF(d1) - 1;
    rho = -K * T * Math.exp(-r * T) * normCDF(-d2) / 100;
  }

  // Greeks
  const gamma = normPDF(d1) / (S * sigma * sqrtT);
  // Theta per day (divide annual by 365)
  const thetaAnnual = optionType === 'call'
    ? -(S * normPDF(d1) * sigma) / (2 * sqrtT) - r * K * Math.exp(-r * T) * normCDF(d2)
    : -(S * normPDF(d1) * sigma) / (2 * sqrtT) + r * K * Math.exp(-r * T) * normCDF(-d2);
  const theta = thetaAnnual / 365;

  const vega = S * normPDF(d1) * sqrtT / 100;

  const intrinsicValue = Math.max(0, optionType === 'call' ? S - K : K - S);
  const extrinsicValue = Math.max(0, premium - intrinsicValue);

  return {
    premium: Math.max(0, premium),
    intrinsicValue,
    extrinsicValue,
    delta,
    gamma,
    theta,
    vega,
    rho,
    impliedVolatility: sigma,
  };
}

export interface OptionsChainEntry {
  strike: number;
  call: BSResult & { openInterest: number; volume: number };
  put: BSResult & { openInterest: number; volume: number };
  inTheMoney: boolean;
}

export function generateOptionsChain(
  stockPrice: number,
  riskFreeRate: number,
  impliedVolatility: number,
  daysToExpiry: number
): OptionsChainEntry[] {
  const T = daysToExpiry / 365;
  const chain: OptionsChainEntry[] = [];

  // Generate strikes around ATM (every 2.5% up/down, 7 above and 7 below + ATM)
  const strikeSpacing = stockPrice < 20 ? 1 : stockPrice < 100 ? 5 : stockPrice < 500 ? 10 : 25;
  const atmStrike = Math.round(stockPrice / strikeSpacing) * strikeSpacing;

  for (let i = -7; i <= 7; i++) {
    const strike = atmStrike + i * strikeSpacing;
    if (strike <= 0) continue;

    const callInputs: BSInputs = { stockPrice, strikePrice: strike, timeToExpiry: T, riskFreeRate, impliedVolatility, optionType: 'call' };
    const putInputs: BSInputs = { stockPrice, strikePrice: strike, timeToExpiry: T, riskFreeRate, impliedVolatility, optionType: 'put' };

    const callResult = blackScholes(callInputs);
    const putResult = blackScholes(putInputs);

    // Simulate open interest: higher near ATM
    const distanceFromATM = Math.abs(i);
    const baseOI = Math.floor(1000 * Math.exp(-distanceFromATM * 0.4));
    const noise = () => Math.floor(Math.random() * 200);

    chain.push({
      strike,
      call: { ...callResult, openInterest: baseOI + noise(), volume: Math.floor(baseOI * 0.3) + noise() },
      put: { ...putResult, openInterest: baseOI + noise(), volume: Math.floor(baseOI * 0.3) + noise() },
      inTheMoney: false, // will be set after
    });
  }

  // Mark ITM
  return chain.map(entry => ({
    ...entry,
    inTheMoney: entry.strike <= stockPrice,
  }));
}

export const EXPIRY_OPTIONS = [
  { label: '1 Week', days: 7 },
  { label: '2 Weeks', days: 14 },
  { label: '1 Month', days: 30 },
  { label: '2 Months', days: 60 },
  { label: '3 Months', days: 90 },
  { label: '6 Months', days: 180 },
  { label: '1 Year (LEAPS)', days: 365 },
];

// Apply theta decay to an option contract (one day)
export function applyThetaDecay(
  currentValue: number,
  theta: number, // per day
  contracts: number
): number {
  // theta is per-share, each contract = 100 shares
  const decay = Math.abs(theta) * 100 * contracts;
  return Math.max(0, currentValue - decay);
}

// Calculate current option value given new stock price
export function updateOptionValue(
  originalStrike: number,
  originalExpiry: number, // totalDays at expiry
  currentTotalDay: number,
  currentStockPrice: number,
  riskFreeRate: number,
  impliedVolatility: number,
  type: 'call' | 'put'
): BSResult {
  const daysLeft = Math.max(0, originalExpiry - currentTotalDay);
  return blackScholes({
    stockPrice: currentStockPrice,
    strikePrice: originalStrike,
    timeToExpiry: daysLeft / 365,
    riskFreeRate,
    impliedVolatility,
    optionType: type,
  });
}
