import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  GameState, GameScreen, Player, Stock, Business, Employee, HedgeFund, LimitedPartner,
  GameNotification, Portfolio, Job, DebtItem, AssetType, HousingLevel, OptionContract,
  InsiderTip, SECStatus, YearEndSummary
} from '../types';
import { createInitialStocks, createInitialETFs, createInitialCrypto } from '../data/stocks';
import { createInitialEconomy, updateEconomy } from '../engine/economyEngine';
import { updateAllStocks, updateAllCrypto, simulateEarnings, reset52WeekRange } from '../engine/marketEngine';
import { clamp } from '../utils/math';
import { createAchievementsMap } from '../data/achievements';
import {
  createPlayerFromArchetype,
  applyJobWork, applyRest, applyStudy, applyExercise,
  applyNetworking, processDebtInterest, updateNetWorth, calculateNetWorth,
  addDebt, payDebt, upgradeHousing, getHousingCost
} from '../engine/playerEngine';
import {
  executeBuy, executeSell, calculatePortfolioValue,
  updatePortfolioHistory, addToWatchlist, removeFromWatchlist
} from '../engine/portfolioEngine';
import { blackScholes, updateOptionValue } from '../engine/optionsEngine';
import { getArchetypeById } from '../data/archetypes';
import { getJobById, getAvailableJobs } from '../data/jobs';
import { getRandomEvents } from '../data/events';
import { MARKET_SHOCKS } from '../data/marketShocks';
import { getBusinessTemplateById } from '../data/businesses';
import { createEmployeeFromCandidate, EMPLOYEE_POOL, calculateMonthlyPayroll, calculateTeamBonus } from '../data/employeeRoster';
import { RIVAL_MANAGERS, simulateRivalReturn } from '../data/rivals';
import { MILESTONES, checkMilestones } from '../data/winConditions';
import { v4 as uuidv4 } from '../utils/uuid';

interface GameActions {
  // Game lifecycle
  startNewGame: (archetypeId: string, playerName: string, difficulty: string) => void;
  loadGame: () => void;
  resetGame: () => void;

  // Time
  advanceDay: () => void;
  advanceWeek: () => void;

  // Player actions
  doWork: () => void;
  doRest: () => void;
  doStudy: (skillId: string) => void;
  doExercise: () => void;
  doNetwork: () => void;
  applyForJob: (jobId: string) => void;
  quitJob: () => void;
  upgradeHousing: (level: HousingLevel) => void;
  payDebt: (debtId: string, amount: number) => void;
  takePersonalLoan: (amount: number) => void;

  // Trading
  buyStock: (ticker: string, assetType: AssetType, shares: number, price: number) => void;
  sellStock: (ticker: string, shares: number, price: number) => void;
  addToWatchlist: (ticker: string) => void;
  removeFromWatchlist: (ticker: string) => void;

  // Short selling
  shortSell: (ticker: string, shares: number) => void;
  coverShort: (ticker: string, shares: number) => void;

  // Limit orders
  placeLimitOrder: (order: Omit<import('../types').LimitOrder, 'id' | 'status' | 'createdDate'>) => void;
  cancelLimitOrder: (orderId: string) => void;

  // Options
  buyOption: (ticker: string, type: 'call' | 'put', strike: number, daysToExpiry: number, contracts: number) => void;
  sellOption: (optionId: string) => void;
  exerciseOption: (optionId: string) => void;

  // Business
  startBusiness: (templateId: string) => void;
  upgradeBusiness: (businessId: string) => void;
  closeBusiness: (businessId: string) => void;

  // Team
  hireEmployee: (candidateId: string) => void;
  fireEmployee: (employeeId: string) => void;

  // Fund
  launchHedgeFund: (name: string, strategy: string, initialCapital: number) => void;
  addLimitedPartner: (name: string, type: LimitedPartner['type'], amount: number) => void;
  redeemLP: (lpId: string) => void;
  updateFundStrategy: (strategy: string) => void;
  scheduleLPCall: () => void;
  sendLPReport: () => void;
  hostInvestorDay: () => void;

  // Events
  resolveEvent: (eventId: string, choiceId: string) => void;
  dismissEvent: () => void;

  // UI
  setScreen: (screen: GameScreen) => void;
  selectStock: (ticker: string | null) => void;
  dismissNotification: (id: string) => void;
  addNotification: (notification: Omit<GameNotification, 'id' | 'timestamp' | 'isRead'>) => void;

  // Insider trading
  actOnInsiderTip: (tipId: string) => void;
  hireLawyer: () => void;
  destroyEvidence: () => void;
  openOffshoreAccount: () => void;
  formShellCompany: () => void;
  buyBurnerIdentity: () => void;
  tipOffContact: (tipId: string) => void;

  // Year-end
  dismissYearEnd: () => void;

  // Save
  saveGame: () => void;
}

const INITIAL_STATE: Omit<GameState, keyof GameActions> = {
  config: {
    difficulty: 'standard',
    startingArchetype: 'broke_retail',
    playerName: 'Player',
    autoSave: true,
    simulationSpeed: 1,
    showTutorial: true,
  },
  time: { day: 1, week: 1, month: 1, year: 1, totalDays: 0, season: 'spring' },
  player: null as any,
  economy: createInitialEconomy(),
  stocks: createInitialStocks(),
  etfs: createInitialETFs(),
  crypto: createInitialCrypto(),
  businesses: {},
  employees: {},
  hedgeFund: null,
  rivals: RIVAL_MANAGERS.map(r => ({ ...r })),
  completedMilestones: [] as string[],
  events: { activeEvent: null, eventHistory: [], pendingEvents: [] },
  insiderTips: [],
  firedMarketShocks: [],
  secStatus: {
    investigationLevel: 0,
    isUnderFormalInvestigation: false,
    isConvicted: false,
    totalIllegalProfits: 0,
    tipsActedOn: 0,
    scrutinyMultiplier: 1,
    lastFineAmount: 0,
    hasLawyer: false,
    lawyerDaysRemaining: 0,
    hasOffshoreAccount: false,
    hasShellCompany: false,
    burnerUsesRemaining: 0,
    contactExposureCount: 0,
  },
  achievements: createAchievementsMap(),
  notifications: [],
  ui: { currentScreen: 'dashboard', selectedStock: null, isMenuOpen: false, isPaused: false, tutorialStep: 0 },
  yearEndSummary: null,
  gameVersion: '1.0.0',
  saveDate: Date.now(),
  isNewGame: true,
};

type GameStore = GameState & GameActions;

function getSeason(dayOfYear: number): 'spring' | 'summer' | 'fall' | 'winter' {
  if (dayOfYear < 90) return 'winter';
  if (dayOfYear < 180) return 'spring';
  if (dayOfYear < 270) return 'summer';
  if (dayOfYear < 360) return 'fall';
  return 'winter';
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      startNewGame: (archetypeId: string, playerName: string, difficulty: string) => {
        const archetype = getArchetypeById(archetypeId);
        if (!archetype) return;
        const player = createPlayerFromArchetype(archetype, playerName);
        const startingJob = archetype.startingJobId ? getJobById(archetype.startingJobId) : null;
        const playerWithJob = startingJob ? { ...player, currentJob: startingJob } : player;

        set({
          ...INITIAL_STATE,
          config: {
            ...INITIAL_STATE.config,
            difficulty: difficulty as any,
            startingArchetype: archetypeId,
            playerName,
          },
          player: playerWithJob,
          stocks: createInitialStocks(),
          etfs: createInitialETFs(),
          crypto: createInitialCrypto(),
          economy: createInitialEconomy(),
          achievements: createAchievementsMap(),
          isNewGame: false,
          ui: { ...INITIAL_STATE.ui, currentScreen: 'dashboard' },
        });

        get().addNotification({
          type: 'info',
          title: `Welcome, ${playerName}!`,
          message: `You\'ve chosen the ${archetype.name} path. Starting in ${archetype.startingCity} with $${player.finances.cash.toFixed(0)}.`,
          duration: 6000,
        });
      },

      loadGame: () => {
        // Handled by zustand persist
      },

      resetGame: () => {
        set({ ...INITIAL_STATE, isNewGame: true });
      },

      advanceDay: () => {
        const state = get();
        if (!state.player) return;

        const totalDays = state.time.totalDays + 1;
        const dayOfYear = totalDays % 365;
        const newTime = {
          day: (state.time.day % 30) + 1,
          week: Math.floor(totalDays / 7) + 1,
          month: Math.floor(dayOfYear / 30) + 1,
          year: Math.floor(totalDays / 365) + 1,
          totalDays,
          season: getSeason(dayOfYear),
        };

        // Update economy (slower tick - every 3 days)
        let newEconomy = totalDays % 3 === 0 ? updateEconomy(state.economy) : state.economy;

        // Update markets
        const newStocks = updateAllStocks(state.stocks, newEconomy);
        const newCrypto = updateAllCrypto(state.crypto, newEconomy);

        // ── Earnings reports: each stock fires on its own nextEarningsDay ──
        for (const ticker of Object.keys(newStocks)) {
          const stock = newStocks[ticker];
          if (!stock.nextEarningsDay) continue;
          if (totalDays === stock.nextEarningsDay) {
            const result = simulateEarnings(stock, newEconomy);
            const newPrice = Math.max(0.01, stock.currentPrice * (1 + result.priceImpact));
            // Update analyst rating & price target after earnings
            const newEarningsStrength = clamp(
              stock.earningsStrength + (result.beatMiss === 'beat' ? 4 : result.beatMiss === 'miss' ? -5 : 0), 10, 100
            );
            const newAnalystRating: Stock['analystRating'] = result.beatMiss === 'beat'
              ? (stock.analystRating === 'sell' ? 'hold' : stock.analystRating === 'hold' ? 'buy' : 'strong_buy')
              : result.beatMiss === 'miss'
              ? (stock.analystRating === 'strong_buy' ? 'buy' : stock.analystRating === 'buy' ? 'hold' : 'sell')
              : stock.analystRating;
            const targetAdjust = result.beatMiss === 'beat' ? 1.05 : result.beatMiss === 'miss' ? 0.93 : 1.0;
            newStocks[ticker] = {
              ...stock,
              currentPrice: parseFloat(newPrice.toFixed(4)),
              eps: result.newEps,
              peRatio: result.newPE,
              earningsStrength: newEarningsStrength,
              lastEarningsResult: result.beatMiss,
              analystRating: newAnalystRating,
              analystPriceTarget: parseFloat((stock.analystPriceTarget * targetAdjust).toFixed(2)),
              earningsHistory: [
                { day: totalDays, result: result.beatMiss, impact: parseFloat((result.priceImpact * 100).toFixed(1)) },
                ...(stock.earningsHistory || []).slice(0, 7),
              ],
              nextEarningsDay: totalDays + 90, // next earnings in ~90 days
            };
            {
              const revStr = result.revenueBeat ? '✓ Rev' : '✗ Rev';
              const guidanceStr = result.guidance === 'raised' ? ' · Guidance ↑' : result.guidance === 'lowered' ? ' · Guidance ↓' : '';
              const impactStr = `${result.priceImpact > 0 ? '+' : ''}${(result.priceImpact * 100).toFixed(1)}%`;
              const isHeld = !!state.player.portfolio.holdings[ticker];
              get().addNotification({
                type: result.beatMiss === 'beat' ? 'success' : result.beatMiss === 'miss' ? 'warning' : 'info',
                title: `📊 ${ticker} Q${Math.ceil((totalDays % 365) / 91) || 1} Earnings ${result.beatMiss === 'beat' ? '✅ BEAT' : result.beatMiss === 'miss' ? '❌ MISS' : '➡️ Inline'}`,
                message: `${result.headline} · ${revStr}${guidanceStr} · Price ${impactStr}${isHeld ? ' · YOU HOLD' : ''}`,
                duration: result.beatMiss === 'inline' ? 5000 : 9000,
              });
            }
          }
        }

        // ── Reset 52-week ranges annually ──
        if (totalDays % 365 === 1) {
          for (const ticker of Object.keys(newStocks)) {
            newStocks[ticker] = reset52WeekRange(newStocks[ticker]);
          }
        }

        // Update ETFs (simpler)
        const newEtfs = { ...state.etfs };
        for (const ticker of Object.keys(newEtfs)) {
          const etf = newEtfs[ticker];
          const move = (Math.random() - 0.485) * 0.012;
          const newPrice = Math.max(etf.currentPrice * (1 + move), 0.01);
          newEtfs[ticker] = {
            ...etf,
            previousPrice: etf.currentPrice,
            currentPrice: parseFloat(newPrice.toFixed(2)),
            changePercent: parseFloat((move * 100).toFixed(2)),
            changeDollar: parseFloat((newPrice - etf.currentPrice).toFixed(2)),
            priceHistory: [...etf.priceHistory.slice(-89), parseFloat(newPrice.toFixed(2))],
          };
        }

        // Update portfolio valuation
        const newPortfolio = calculatePortfolioValue(state.player.portfolio, newStocks, newEtfs, newCrypto);

        // Apply debt interest daily
        let updatedPlayer = processDebtInterest(state.player);
        updatedPlayer = { ...updatedPlayer, portfolio: newPortfolio };
        updatedPlayer = updateNetWorth(updatedPlayer, newPortfolio.totalValue);

        // ── Dividend payments: each stock fires on its nextDividendDay ──
        let dividendIncome = 0;
        const dividendReceipts: string[] = [];
        for (const ticker of Object.keys(newStocks)) {
          const stock = newStocks[ticker];
          if (!stock.nextDividendDay || stock.dividendPerShare <= 0) continue;
          if (totalDays === stock.nextDividendDay) {
            const holding = updatedPlayer.portfolio.holdings[ticker];
            if (holding && holding.shares > 0) {
              const payment = parseFloat((holding.shares * stock.dividendPerShare).toFixed(2));
              dividendIncome += payment;
              dividendReceipts.push(`${ticker}: $${payment.toFixed(2)}`);
              updatedPlayer = {
                ...updatedPlayer,
                portfolio: {
                  ...updatedPlayer.portfolio,
                  holdings: {
                    ...updatedPlayer.portfolio.holdings,
                    [ticker]: {
                      ...holding,
                      dividendsEarned: (holding.dividendsEarned || 0) + payment,
                    },
                  },
                },
              };
            }
            // Slight dividend drift and schedule next quarterly payout
            const newDivPerShare = parseFloat(Math.max(0, stock.dividendPerShare * (0.98 + Math.random() * 0.06)).toFixed(2));
            newStocks[ticker] = {
              ...stock,
              dividendPerShare: newDivPerShare,
              dividendYield: stock.currentPrice > 0 ? parseFloat(((newDivPerShare * 4 / stock.currentPrice) * 100).toFixed(2)) : stock.dividendYield,
              nextDividendDay: totalDays + 91,
            };
          }
        }
        if (dividendIncome > 0) {
          updatedPlayer = {
            ...updatedPlayer,
            finances: { ...updatedPlayer.finances, cash: updatedPlayer.finances.cash + dividendIncome },
          };
          get().addNotification({
            type: 'success',
            title: `💰 Dividend Payments Received`,
            message: `+$${dividendIncome.toFixed(2)} from ${dividendReceipts.length} holding${dividendReceipts.length > 1 ? 's' : ''}. ${dividendReceipts.slice(0, 3).join(' | ')}`,
            duration: 8000,
          });
        }

        // Aging + year-end rival summary every 365 days
        if (totalDays % 365 === 0) {
          updatedPlayer = { ...updatedPlayer, age: updatedPlayer.age + 1 };
          get().addNotification({
            type: 'info',
            title: 'Birthday!',
            message: `You are now ${updatedPlayer.age} years old. Time flies.`,
          });

          // Build year-end summary
          const yearNum = Math.floor(totalDays / 365);
          // Approximate yearly return from portfolio history snapshots
          const snapshots = updatedPlayer.portfolio.portfolioHistory || [];
          const yearAgoSnap = snapshots.length >= 12 ? snapshots[snapshots.length - 12] : snapshots[0];
          const yearAgoNetWorth = yearAgoSnap?.netWorth || (updatedPlayer.finances.totalNetWorth * 0.9);
          const playerAnnualReturn = yearAgoNetWorth > 0
            ? ((updatedPlayer.finances.totalNetWorth - yearAgoNetWorth) / yearAgoNetWorth) * 100
            : 0;
          // Compute each rival's yearly return from last 12 monthly returns
          const rivalRows = state.rivals.map(r => {
            const last12 = r.monthlyReturns.slice(-12);
            const navAtYearStart = last12.reduce((n, ret) => n / (1 + ret), r.monthlyReturns.reduce((n, ret) => n * (1 + ret), 1000));
            const navNow = r.monthlyReturns.reduce((n, ret) => n * (1 + ret), 1000);
            const annualReturn = navAtYearStart > 0 ? ((navNow - navAtYearStart) / navAtYearStart) * 100 : last12.reduce((s, r) => s + r, 0) * 100;
            return { id: r.id, name: r.name, fundName: r.fundName, avatar: r.avatar, annualReturn };
          });
          const allRows = [...rivalRows, { id: 'player', name: updatedPlayer.name, fundName: 'Your Portfolio', avatar: '⭐', annualReturn: playerAnnualReturn, isPlayer: true }];
          allRows.sort((a, b) => b.annualReturn - a.annualReturn);
          const playerRank = allRows.findIndex(r => r.id === 'player') + 1;
          const top = allRows[0];
          const yearSummary: YearEndSummary = {
            year: yearNum,
            playerReturn: playerAnnualReturn,
            playerNetWorth: updatedPlayer.finances.totalNetWorth,
            rivalRankings: allRows,
            playerRank,
            topPerformerName: top.name,
            topPerformerReturn: top.annualReturn,
          };
          set({ yearEndSummary: yearSummary });
        }

        // Process options: theta decay and update values
        if (updatedPlayer.portfolio.options.length > 0) {
          const newOptions: OptionContract[] = [];
          const expiredOptions: OptionContract[] = [];
          for (const opt of updatedPlayer.portfolio.options) {
            if (opt.expirationDate <= totalDays) {
              expiredOptions.push(opt);
            } else {
              const stock = newStocks[opt.ticker];
              if (stock) {
                const updatedBS = updateOptionValue(
                  opt.strikePrice, opt.expirationDate, totalDays,
                  stock.currentPrice, newEconomy.federalFundsRate / 100,
                  opt.impliedVolatility, opt.type
                );
                const newValue = updatedBS.premium * 100 * opt.contracts;
                newOptions.push({
                  ...opt,
                  currentValue: newValue,
                  intrinsicValue: updatedBS.intrinsicValue * 100 * opt.contracts,
                  extrinsicValue: updatedBS.extrinsicValue * 100 * opt.contracts,
                  delta: updatedBS.delta,
                  theta: updatedBS.theta,
                  daysToExpiry: opt.expirationDate - totalDays,
                });
              } else {
                newOptions.push(opt);
              }
            }
          }

          // Process expired options
          let expiredCash = 0;
          for (const expired of expiredOptions) {
            const stock = newStocks[expired.ticker];
            if (!stock) continue;
            const intrinsic = expired.type === 'call'
              ? Math.max(0, stock.currentPrice - expired.strikePrice)
              : Math.max(0, expired.strikePrice - stock.currentPrice);
            const exerciseValue = intrinsic * 100 * expired.contracts;
            expiredCash += exerciseValue;
            if (exerciseValue > 0) {
              get().addNotification({
                type: 'success',
                title: `Option Expired ITM!`,
                message: `${expired.ticker} ${expired.type} $${expired.strikePrice}: Received $${exerciseValue.toFixed(2)}`,
              });
            } else {
              get().addNotification({
                type: 'warning',
                title: `Option Expired Worthless`,
                message: `${expired.ticker} ${expired.type} $${expired.strikePrice} expired at $0.`,
              });
            }
          }

          updatedPlayer = {
            ...updatedPlayer,
            portfolio: { ...updatedPlayer.portfolio, options: newOptions },
            finances: expiredCash > 0
              ? { ...updatedPlayer.finances, cash: updatedPlayer.finances.cash + expiredCash }
              : updatedPlayer.finances,
          };
        }

        // Business revenue (monthly)
        if (totalDays % 30 === 0) {
          let businessIncome = 0;
          const updatedBusinesses = { ...state.businesses };
          for (const [id, biz] of Object.entries(updatedBusinesses)) {
            if (biz.isActive) {
              // Ramping revenue: grows towards potential over first 12 months
              const monthsOpen = Math.floor((totalDays - biz.foundedDate) / 30);
              const rampFactor = Math.min(1, 0.3 + monthsOpen * 0.06);
              const template_maxRev = biz.monthlyRevenue / rampFactor;
              const growthNoise = (Math.random() * 0.08 - 0.02);
              const newRevenue = Math.min(template_maxRev, biz.monthlyRevenue * (1 + biz.growthRate + growthNoise));
              const profit = newRevenue - biz.monthlyExpenses;
              businessIncome += profit;
              updatedBusinesses[id] = {
                ...biz,
                monthlyRevenue: newRevenue,
                monthlyExpenses: biz.monthlyExpenses * (1 + 0.01 + Math.random() * 0.01),
                monthlyProfit: profit,
                totalRevenue: biz.totalRevenue + newRevenue,
                totalProfit: biz.totalProfit + profit,
                satisfaction: Math.min(100, biz.satisfaction + (profit > 0 ? 1 : -2)),
              };
            }
          }
          if (Object.keys(updatedBusinesses).length > 0) {
            set({ businesses: updatedBusinesses });
          }
          if (businessIncome !== 0) {
            updatedPlayer = {
              ...updatedPlayer,
              finances: { ...updatedPlayer.finances, cash: updatedPlayer.finances.cash + businessIncome },
            };
            if (businessIncome > 0) {
              get().addNotification({
                type: 'success',
                title: 'Business Revenue',
                message: `Your businesses generated +$${businessIncome.toFixed(0)} this month.`,
              });
            } else {
              get().addNotification({
                type: 'warning',
                title: 'Business Loss',
                message: `Your businesses lost $${Math.abs(businessIncome).toFixed(0)} this month.`,
              });
            }
          }
        }

        // Monthly payroll for employees
        if (totalDays % 30 === 0) {
          const payroll = calculateMonthlyPayroll(state.employees);
          if (payroll > 0) {
            updatedPlayer = {
              ...updatedPlayer,
              finances: { ...updatedPlayer.finances, cash: updatedPlayer.finances.cash - payroll },
            };
            get().addNotification({
              type: 'info',
              title: 'Team Payroll',
              message: `Paid $${payroll.toFixed(0)} in monthly salaries.`,
            });
          }
        }

        // Hedge fund monthly processing
        let newHedgeFund = state.hedgeFund;
        if (newHedgeFund && totalDays % 30 === 0) {
          // Calculate month's portfolio return with employee contributions
          const portfolioReturn = updatedPlayer.portfolio.dayChangePercent / 100;
          const teamBonus = calculateTeamBonus(state.employees);
          const strategyBonus = newHedgeFund.strategy === 'quant' ? 0.002 : 0;

          // Employee special ability bonuses
          const empList = Object.values(state.employees);
          let empAlpha = 0;
          for (const emp of empList) {
            if (emp.specialAbility?.includes('Alpha Generator')) empAlpha += 0.0015; // +0.15%/mo
            if (emp.specialAbility?.includes('Independent Sleeve')) empAlpha += 0.003; // +0.3%/mo
            if (emp.specialAbility?.includes('Quant Engine')) empAlpha += 0.002; // +0.2%/mo
            if (emp.specialAbility?.includes('Sharp Execution')) empAlpha += 0.001; // reduced costs
            if (emp.specialAbility?.includes('Market Maker')) empAlpha += 0.0008; // liquidity edge
          }

          const monthlyReturn = portfolioReturn + teamBonus + strategyBonus + empAlpha;

          // Update NAV
          const newNAV = newHedgeFund.nav * (1 + monthlyReturn);
          const navGain = newNAV - newHedgeFund.nav;

          // Management fee (annual / 12)
          const mgmtFee = newHedgeFund.aum * newHedgeFund.managementFee / 12;

          // Performance fee (only if above high water mark and hurdle rate)
          let perfFee = 0;
          if (newNAV > newHedgeFund.highWaterMark && monthlyReturn > newHedgeFund.hurdleRate / 12) {
            const gains = (newNAV - newHedgeFund.highWaterMark) * newHedgeFund.aum / newHedgeFund.nav;
            perfFee = gains * newHedgeFund.performanceFee;
          }

          const totalFees = mgmtFee + perfFee;

          // Update AUM based on returns
          const aumGrowth = newHedgeFund.aum * monthlyReturn;
          const newAUM = newHedgeFund.aum + aumGrowth;

          // LP satisfaction — more nuanced by type
          const hasCFO = Object.values(state.employees).some(e => e.role === 'cfo');
          const hasCompliance = Object.values(state.employees).some(e => e.role === 'compliance_officer');
          const updatedLPs = newHedgeFund.limitedPartners.map(lp => {
            // Different LP types have different expectations
            const expectation = lp.type === 'pension' ? 0.005 : // pensions want steady 0.5%/mo
              lp.type === 'endowment' ? 0.008 : // endowments want 0.8%/mo
              lp.type === 'institution' ? 0.01 : // institutions want 1%/mo
              lp.type === 'family_office' ? 0.012 : // family offices want more
              0.006; // individuals are moderate

            let satChange = 0;
            if (monthlyReturn > expectation * 2) satChange = 8; // crushed it
            else if (monthlyReturn > expectation) satChange = 4; // beat expectations
            else if (monthlyReturn > 0) satChange = 1; // positive but below par
            else if (monthlyReturn > -0.02) satChange = -3; // small loss
            else if (monthlyReturn > -0.05) satChange = -8; // meaningful loss
            else satChange = -15; // big loss

            // CFO and compliance officers help retain LPs
            if (hasCFO) satChange = satChange < 0 ? satChange * 0.7 : satChange * 1.1;
            if (hasCompliance && satChange < 0) satChange *= 0.85;

            const newSat = Math.min(100, Math.max(0, lp.satisfactionLevel + satChange));
            const pastLockup = (totalDays - lp.entryDate) / 30 > lp.lockupPeriod;

            return {
              ...lp,
              satisfactionLevel: Math.round(newSat),
              isRedemptionPending: newSat < lp.redemptionThreshold && pastLockup,
            };
          });

          // Random new LP events — quality depends on reputation and employees
          const hasIR = Object.values(state.employees).some(e => e.role === 'investor_relations' || e.role === 'sales_head');
          const hasSalesHead = Object.values(state.employees).some(e => e.role === 'sales_head');
          const chanceNewLP = hasSalesHead ? 0.30 : hasIR ? 0.18 : 0.06;
          if (Math.random() < chanceNewLP && newHedgeFund.reputation > 30) {
            const rep = newHedgeFund.reputation;
            const lpTypes: LimitedPartner['type'][] = rep > 70
              ? ['institution', 'pension', 'endowment', 'family_office']
              : rep > 45
              ? ['individual', 'institution', 'family_office']
              : ['individual'];
            const randomType = lpTypes[Math.floor(Math.random() * lpTypes.length)];

            const LP_NAMES: Record<LimitedPartner['type'], string[]> = {
              individual: [
                'Dr. Richard Hartley', 'Susan Cho', 'Michael Adebayo', 'Elena Vasquez',
                'James Worthington III', 'Patricia Liu', 'Ahmed Al-Rashid', 'Olivia Brennan',
                'Thomas Ikeda', 'Natasha Petrov', 'Robert Greenfield', 'Diana Okonkwo',
              ],
              institution: [
                'Atlas Capital Partners', 'Meridian Asset Management', 'Vanguard Institutional',
                'Wellington Management', 'Citadel Allocations', 'Two Sigma Ventures',
                'AQR Capital Management', 'Point72 Asset Management', 'Coatue Management',
                'Marshall Wace', 'Man Group', 'Winton Capital',
              ],
              pension: [
                'CalPERS Fund', 'NY State Teachers Pension', 'Ontario Teachers Fund',
                'Texas Municipal Retirement', 'UK Pension Authority', 'Danish ATP Fund',
                'Florida Retirement System', 'Ohio Public Employees', 'Norwegian Government Pension',
                'Australian Super Fund', 'CPP Investment Board', 'Swiss National Pension',
              ],
              endowment: [
                'Harvard Management Company', 'Yale Endowment Office', 'Stanford Endowment',
                'Princeton Investment Co.', 'MIT Endowment Fund', 'Duke Capital Management',
                'Rockefeller Foundation', 'Ford Foundation', 'Getty Trust',
              ],
              family_office: [
                'Riverside Family Office', 'Walton Legacy Partners', 'Pritzker Group',
                'Lauder Family Holdings', 'Mars Capital Trust', 'Simons Family Foundation',
                'Soros Family Office', 'Dalio Family Capital', 'Griffin Family Trust',
                'Bezos Expeditions', 'Koch Capital', 'Bloomberg Family Office',
              ],
            };
            const namePool = LP_NAMES[randomType];
            const existingNames = new Set(updatedLPs.map(lp => lp.name));
            const available = namePool.filter(n => !existingNames.has(n));
            const randomName = available.length > 0
              ? available[Math.floor(Math.random() * available.length)]
              : `${namePool[0]} (${Math.floor(Math.random() * 999)})`;

            const repMultiplier = 0.5 + rep / 100;
            const lpAmount = Math.floor(
              randomType === 'pension' ? (2000000 + Math.random() * 8000000) * repMultiplier :
              randomType === 'endowment' ? (1000000 + Math.random() * 5000000) * repMultiplier :
              randomType === 'institution' ? (500000 + Math.random() * 3000000) * repMultiplier :
              randomType === 'family_office' ? (250000 + Math.random() * 2000000) * repMultiplier :
              (50000 + Math.random() * 500000) * repMultiplier
            );

            const newLP: LimitedPartner = {
              id: `lp_auto_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
              name: randomName,
              type: randomType,
              investedAmount: lpAmount,
              entryDate: totalDays,
              satisfactionLevel: 65 + Math.floor(Math.random() * 20),
              redemptionThreshold: randomType === 'individual' ? 30 :
                randomType === 'institution' ? 15 : randomType === 'pension' ? 12 : 20,
              lockupPeriod: randomType === 'pension' ? 24 :
                randomType === 'endowment' ? 18 : randomType === 'institution' ? 12 : 6,
              isRedemptionPending: false,
            };
            updatedLPs.push(newLP);
            get().addNotification({
              type: 'success',
              title: 'New LP Investor!',
              message: `${randomName} (${randomType.replace('_', ' ')}) invested $${(lpAmount / 1000).toFixed(0)}K in your fund.`,
              duration: 8000,
            });
          }

          newHedgeFund = {
            ...newHedgeFund,
            nav: Math.max(0.01, newNAV),
            aum: Math.max(0, newAUM),
            limitedPartners: updatedLPs,
            monthlyReturns: [...newHedgeFund.monthlyReturns.slice(-23), monthlyReturn],
            highWaterMark: Math.max(newHedgeFund.highWaterMark, newNAV),
            maxDrawdown: Math.min(newHedgeFund.maxDrawdown, -Math.abs(Math.min(0, monthlyReturn) * 12)),
            reputation: Math.min(100, newHedgeFund.reputation + (monthlyReturn > 0.02 ? 2 : monthlyReturn < -0.05 ? -3 : 0)),
            totalManagementFeesEarned: newHedgeFund.totalManagementFeesEarned + mgmtFee,
            totalPerformanceFeesEarned: newHedgeFund.totalPerformanceFeesEarned + perfFee,
          };

          // Fees go to player cash
          if (totalFees > 0) {
            updatedPlayer = {
              ...updatedPlayer,
              finances: { ...updatedPlayer.finances, cash: updatedPlayer.finances.cash + totalFees },
            };
            get().addNotification({
              type: 'success',
              title: 'Fund Fees Received',
              message: `Mgmt Fee: $${mgmtFee.toFixed(0)} | Perf Fee: $${perfFee.toFixed(0)} | Monthly Return: ${(monthlyReturn * 100).toFixed(2)}%`,
            });
          }

          set({ hedgeFund: newHedgeFund });
        }

        // Monthly expenses (every 30 days)
        if (totalDays % 30 === 0) {
          const housing = getHousingCost(updatedPlayer.housingLevel);
          const totalMonthlyExpenses = housing + updatedPlayer.finances.monthlyDebtPayments +
            (updatedPlayer.finances.monthlyExpenses * 0.4);
          // Auto-credit monthly salary so players don't starve for not clicking Work every day.
          // Work action gives bonus pay + XP + skills on top of this base.
          const monthlySalary = updatedPlayer.currentJob ? updatedPlayer.currentJob.salary / 12 : 0;
          const netMonthly = monthlySalary - totalMonthlyExpenses;
          updatedPlayer = {
            ...updatedPlayer,
            finances: {
              ...updatedPlayer.finances,
              cash: updatedPlayer.finances.cash + netMonthly,
              monthlyIncome: monthlySalary,
            },
          };

          if (updatedPlayer.finances.cash < 0) {
            get().addNotification({
              type: 'warning',
              title: '⚠️ Negative Cash!',
              message: `Monthly expenses: $${totalMonthlyExpenses.toFixed(0)} | Salary: $${monthlySalary.toFixed(0)} | Net: ${netMonthly >= 0 ? '+' : ''}$${netMonthly.toFixed(0)}. Find better income!`,
              duration: 8000,
            });
          } else {
            get().addNotification({
              type: 'info',
              title: '📅 Monthly Summary',
              message: `Salary +$${monthlySalary.toFixed(0)} · Expenses -$${totalMonthlyExpenses.toFixed(0)} · Net ${netMonthly >= 0 ? '+' : ''}$${netMonthly.toFixed(0)}. Clicking Work earns bonus pay + XP!`,
              duration: 5000,
            });
          }
        }

        // Portfolio history snapshot (daily)
        const snapshotPortfolio = updatePortfolioHistory(
          newPortfolio,
          updatedPlayer.finances.cash,
          calculateNetWorth(updatedPlayer, newPortfolio.totalValue),
          totalDays
        );
        updatedPlayer = { ...updatedPlayer, portfolio: snapshotPortfolio };

        // Random events (every 7 days check)
        if (totalDays % 7 === 0) {
          const events = getRandomEvents(
            1,
            newEconomy.phase,
            updatedPlayer.level,
            updatedPlayer.finances.totalNetWorth,
            updatedPlayer.unlockedMechanics,
            state.events.eventHistory
          );
          if (events.length > 0 && !state.events.activeEvent) {
            set(s => ({ events: { ...s.events, activeEvent: events[0] } }));
          }
        }

        // Process short positions (update P&L and margin calls)
        if (Object.keys(updatedPlayer.portfolio.shortPositions || {}).length > 0) {
          const updatedShorts: Record<string, import('../types').ShortPosition> = {};
          let marginCallTriggered = false;
          for (const [ticker, short] of Object.entries(updatedPlayer.portfolio.shortPositions)) {
            const stock = newStocks[ticker];
            if (!stock) { updatedShorts[ticker] = short; continue; }
            const pnl = (short.entryPrice - stock.currentPrice) * short.shares;
            const pnlPct = pnl / (short.entryPrice * short.shares);
            const dailyInterest = short.entryPrice * short.shares * 0.08 / 365;
            const newInterest = short.interestAccrued + dailyInterest;
            updatedShorts[ticker] = {
              ...short,
              currentPrice: stock.currentPrice,
              unrealizedPnL: pnl - newInterest,
              unrealizedPnLPercent: pnlPct * 100,
              interestAccrued: newInterest,
            };
            // Margin call if loss exceeds 30% of collateral
            if (pnlPct < -0.30) {
              marginCallTriggered = true;
              get().addNotification({
                type: 'error',
                title: `MARGIN CALL: ${ticker}`,
                message: `Short position on ${ticker} has lost 30%+. Cover position immediately!`,
                duration: 12000,
              });
            }
          }
          updatedPlayer = {
            ...updatedPlayer,
            portfolio: { ...updatedPlayer.portfolio, shortPositions: updatedShorts },
          };
        }

        // Process limit orders
        const openOrders = (updatedPlayer.portfolio.limitOrders || []).filter(o => o.status === 'pending');
        if (openOrders.length > 0) {
          let portfolioAfterOrders = updatedPlayer.portfolio;
          let cashAfterOrders = updatedPlayer.finances.cash;
          const processedOrders: import('../types').LimitOrder[] = [];

          for (const order of openOrders) {
            const stock = newStocks[order.ticker];
            if (!stock) { processedOrders.push(order); continue; }
            const price = stock.currentPrice;
            let filled = false;

            if (order.orderType === 'limit') {
              filled = order.side === 'buy' ? price <= (order.limitPrice || Infinity) : price >= (order.limitPrice || 0);
            } else if (order.orderType === 'stop_loss') {
              filled = order.side === 'sell' ? price <= (order.stopPrice || 0) : price >= (order.stopPrice || Infinity);
            } else if (order.orderType === 'trailing_stop') {
              const trail = order.trailingPercent || 5;
              filled = order.side === 'sell' && price <= (order.stopPrice || 0) * (1 - trail / 100);
            }

            if (filled) {
              if (order.side === 'buy') {
                const cost = price * order.shares;
                if (cashAfterOrders >= cost) {
                  const r = executeBuy(portfolioAfterOrders, order.ticker, order.assetType, order.shares, price, cashAfterOrders, totalDays);
                  if (!r.error) {
                    portfolioAfterOrders = r.portfolio;
                    cashAfterOrders = r.newCash;
                    processedOrders.push({ ...order, status: 'filled' as const });
                    get().addNotification({ type: 'success', title: `Order Filled: ${order.ticker}`, message: `Bought ${order.shares} shares @ $${price.toFixed(2)}` });
                    continue;
                  }
                }
              } else {
                const r = executeSell(portfolioAfterOrders, order.ticker, order.shares, price, cashAfterOrders, totalDays);
                if (!r.error) {
                  portfolioAfterOrders = r.portfolio;
                  cashAfterOrders = r.newCash;
                  processedOrders.push({ ...order, status: 'filled' as const });
                  get().addNotification({ type: 'success', title: `Order Filled: ${order.ticker}`, message: `Sold ${order.shares} shares @ $${price.toFixed(2)}` });
                  continue;
                }
              }
            }
            // Expire orders older than expiryDays
            if (order.expiryDays && totalDays - order.createdDate > order.expiryDays) {
              processedOrders.push({ ...order, status: 'expired' as const });
            } else {
              processedOrders.push(order);
            }
          }

          // Keep filled/expired in history, only pass active ones forward
          const allOrders = [
            ...(updatedPlayer.portfolio.limitOrders || []).filter(o => o.status !== 'pending'),
            ...processedOrders,
          ].slice(-50);

          updatedPlayer = {
            ...updatedPlayer,
            portfolio: { ...portfolioAfterOrders, limitOrders: allOrders },
            finances: { ...updatedPlayer.finances, cash: cashAfterOrders },
          };
        }

        // Rival simulation (monthly)
        let updatedRivals = state.rivals;
        if (totalDays % 30 === 0 && state.rivals.length > 0) {
          updatedRivals = state.rivals.map(rival => {
            const monthReturn = simulateRivalReturn(rival, newEconomy.phase);
            return {
              ...rival,
              monthlyReturns: [...rival.monthlyReturns.slice(-23), monthReturn],
              nav: rival.nav * (1 + monthReturn),
              aum: rival.aum * (1 + monthReturn * 0.5 + (Math.random() - 0.45) * 0.02),
            };
          });
        }

        // Milestone checks (monthly)
        let updatedCompletedMilestones = state.completedMilestones;
        if (totalDays % 7 === 0) {
          const newMilestones = checkMilestones(
            state.completedMilestones,
            updatedPlayer.finances.totalNetWorth,
            updatedPlayer.finances.cash,
            state.hedgeFund?.aum || 0,
            updatedPlayer.ownedBusinesses.length,
            Object.keys(state.employees).length,
            updatedPlayer.level,
            updatedPlayer.stats.reputation,
            updatedPlayer.skills as unknown as Record<string, number>
          );
          if (newMilestones.length > 0) {
            updatedCompletedMilestones = [...state.completedMilestones, ...newMilestones.map(m => m.id)];
            for (const m of newMilestones) {
              get().addNotification({
                type: m.isWinCondition ? 'achievement' : 'success',
                title: m.isWinCondition ? `🏆 WIN CONDITION: ${m.title}` : `Milestone: ${m.title}`,
                message: `${m.description} — Reward: ${m.reward}`,
                duration: m.isWinCondition ? 0 : 8000,
              });
            }
          }
        }

        // Check achievements
        checkAchievements(updatedPlayer, state, set, get);

        // ── Insider trading: SEC investigation tracking ──────────────────
        let updatedInsiderTips = state.insiderTips;
        let updatedSEC = state.secStatus;

        // Lawyer tick
        if (updatedSEC.hasLawyer && updatedSEC.lawyerDaysRemaining > 0) {
          updatedSEC = {
            ...updatedSEC,
            lawyerDaysRemaining: updatedSEC.lawyerDaysRemaining - 1,
            hasLawyer: updatedSEC.lawyerDaysRemaining > 1,
          };
        }

        // Reveal tips whose event day has arrived
        updatedInsiderTips = updatedInsiderTips.map(tip => {
          if (!tip.isRevealed && totalDays >= tip.eventFiringDay) {
            const stock = newStocks[tip.ticker];
            if (stock && tip.isActedOn) {
              // Apply the actual move to the stock (adds extra volatility on event day)
              const bumpPct = tip.expectedMovePercent / 100;
              const bumpedPrice = stock.currentPrice * (1 + bumpPct);
              newStocks[tip.ticker] = { ...stock, currentPrice: parseFloat(bumpedPrice.toFixed(4)) };

              // Calculate illegal profit from any holdings in this ticker
              const holding = updatedPlayer.portfolio.holdings[tip.ticker];
              const illegalProfit = holding
                ? holding.shares * (bumpedPrice - holding.averageCost)
                : 0;

              // Record it in the SEC status
              if (illegalProfit > 0) {
                updatedSEC = {
                  ...updatedSEC,
                  totalIllegalProfits: updatedSEC.totalIllegalProfits + illegalProfit,
                  scrutinyMultiplier: Math.min(5, updatedSEC.scrutinyMultiplier + 0.1),
                };
              }

              get().addNotification({
                type: bumpPct > 0 ? 'success' : 'warning',
                title: `Insider Event Fired: ${tip.ticker}`,
                message: `${tip.fullDescription}. ${tip.ticker} moved ${tip.expectedMovePercent > 0 ? '+' : ''}${tip.expectedMovePercent}%.${illegalProfit > 0 ? ` Illegal profit: $${illegalProfit.toFixed(0)}` : ''}`,
                duration: 8000,
              });

              return { ...tip, isRevealed: true, illegalProfitMade: illegalProfit };
            }
            return { ...tip, isRevealed: true };
          }
          return tip;
        });

        // Expire tips older than 60 days past event
        updatedInsiderTips = updatedInsiderTips.map(tip =>
          (!tip.isExpired && totalDays > tip.eventFiringDay + 60) ? { ...tip, isExpired: true } : tip
        );

        // Generate new insider tip every 14 days if network stat is high enough
        if (totalDays % 14 === 0 && updatedPlayer.stats.network >= 20) {
          const tipChance = Math.min(0.7, 0.15 + updatedPlayer.stats.network / 200);
          if (Math.random() < tipChance) {
            const activeTickers = Object.keys(newStocks).filter(t => newStocks[t].currentPrice > 5);
            if (activeTickers.length > 0) {
              const ticker = activeTickers[Math.floor(Math.random() * activeTickers.length)];
              const stock = newStocks[ticker];
              const tipTemplates: Array<{
                tipType: InsiderTip['tipType']; hint: string; fullDescription: string;
                move: number; risk: number; source: string;
              }> = [
                { tipType: 'merger_acquisition', hint: `Unusual activity around ${ticker}. A contact at a bulge-bracket bank is acting strange.`, fullDescription: `${stock.name} acquired by strategic buyer`, move: 25 + Math.random() * 20, risk: 75, source: 'Goldman contact' },
                { tipType: 'earnings_beat', hint: `A CFO acquaintance dropped hints ${ticker}'s quarter is "blowing out estimates."`, fullDescription: `${stock.name} crushed earnings — EPS 40%+ above consensus`, move: 10 + Math.random() * 15, risk: 45, source: 'CFO acquaintance' },
                { tipType: 'earnings_miss', hint: `Word is ${ticker} is going to disappoint the street badly next week.`, fullDescription: `${stock.name} massive earnings miss — revenue down YoY`, move: -(12 + Math.random() * 18), risk: 50, source: 'IR contact' },
                { tipType: 'drug_approval', hint: `Someone at the FDA is very upbeat about ${ticker}'s upcoming decision.`, fullDescription: `${stock.name} receives FDA approval for flagship drug`, move: 40 + Math.random() * 30, risk: 60, source: 'FDA consultant' },
                { tipType: 'drug_rejection', hint: `Hear ${ticker}'s drug trial data is worse than expected. Much worse.`, fullDescription: `${stock.name} drug rejected by FDA — clinical failure`, move: -(30 + Math.random() * 30), risk: 65, source: 'Lab researcher' },
                { tipType: 'contract_win', hint: `${ticker} is about to announce a huge government contract. Source: procurement officer.`, fullDescription: `${stock.name} wins multi-billion government contract`, move: 15 + Math.random() * 12, risk: 40, source: 'Gov. procurement' },
                { tipType: 'fraud_discovered', hint: `Something's seriously wrong with ${ticker}'s books. Short interest is quietly building.`, fullDescription: `${stock.name} under SEC investigation for accounting fraud`, move: -(35 + Math.random() * 25), risk: 70, source: 'Short seller contact' },
                { tipType: 'buyout', hint: `Private equity is circling ${ticker}. Deal could be announced any day.`, fullDescription: `${stock.name} taken private in LBO at significant premium`, move: 20 + Math.random() * 25, risk: 80, source: 'PE analyst friend' },
                { tipType: 'ceo_resignation', hint: `The CEO of ${ticker} is having "health issues." Expect an announcement soon.`, fullDescription: `${stock.name} CEO unexpectedly resigns amid board pressure`, move: -(8 + Math.random() * 15), risk: 35, source: 'Board member contact' },
                { tipType: 'regulatory_approval', hint: `${ticker}'s regulatory hurdle is about to be cleared. Regulatory contact very confident.`, fullDescription: `${stock.name} receives key regulatory clearance`, move: 12 + Math.random() * 18, risk: 55, source: 'Regulatory consultant' },
              ];
              const template = tipTemplates[Math.floor(Math.random() * tipTemplates.length)];
              const eventFiringDay = totalDays + 7 + Math.floor(Math.random() * 14);
              const newTip: InsiderTip = {
                id: `tip_${totalDays}_${ticker}`,
                ticker,
                stockName: stock.name,
                tipType: template.tipType,
                hint: template.hint,
                fullDescription: template.fullDescription,
                source: template.source,
                expectedMovePercent: parseFloat(template.move.toFixed(1)),
                eventFiringDay,
                createdDay: totalDays,
                investigationRiskBase: template.risk,
                isActedOn: false,
                isExpired: false,
                isRevealed: false,
                illegalProfitMade: 0,
              };
              updatedInsiderTips = [...updatedInsiderTips.slice(-19), newTip];
              get().addNotification({
                type: 'warning',
                title: 'New Insider Tip',
                message: `A contact has information. Check your Underground network.`,
                duration: 6000,
              });
            }
          }
        }

        // ── Market shocks ────────────────────────────────────────────────────
        let firedMarketShocks = state.firedMarketShocks || [];
        for (const shock of MARKET_SHOCKS) {
          if (shock.isOneTime && firedMarketShocks.includes(shock.id)) continue;
          if (shock.allowedPhases && !shock.allowedPhases.includes(newEconomy.phase)) continue;
          if (Math.random() > shock.probability) continue;

          // Apply stock price multipliers
          for (const rule of shock.stockRules) {
            if (rule.specificTickers) {
              for (const t of rule.specificTickers) {
                if (newStocks[t]) {
                  newStocks[t] = {
                    ...newStocks[t],
                    currentPrice: parseFloat((newStocks[t].currentPrice * rule.multiplier).toFixed(4)),
                  };
                }
              }
            } else if (rule.sector && rule.sector !== 'all') {
              for (const t of Object.keys(newStocks)) {
                if (newStocks[t].sector === rule.sector) {
                  newStocks[t] = {
                    ...newStocks[t],
                    currentPrice: parseFloat((newStocks[t].currentPrice * rule.multiplier).toFixed(4)),
                  };
                }
              }
            } else if (rule.sector === 'all') {
              for (const t of Object.keys(newStocks)) {
                newStocks[t] = {
                  ...newStocks[t],
                  currentPrice: parseFloat((newStocks[t].currentPrice * rule.multiplier).toFixed(4)),
                };
              }
            }
          }
          // Apply crypto multiplier
          if (shock.cryptoMultiplier) {
            for (const t of Object.keys(newCrypto)) {
              newCrypto[t] = {
                ...newCrypto[t],
                currentPrice: parseFloat((newCrypto[t].currentPrice * shock.cryptoMultiplier).toFixed(4)),
              };
            }
          }
          // Update economy sentiment + vix
          const newSentiment = Math.max(-100, Math.min(100, newEconomy.marketSentiment + shock.sentimentShock));
          const newVix = Math.min(100, (newEconomy.vixLevel || 20) + shock.vixBump);
          const shockedEconomy = {
            ...newEconomy,
            marketSentiment: newSentiment,
            vixLevel: newVix,
            ...(shock.forcePhase ? { phase: shock.forcePhase } : {}),
          };
          // eslint-disable-next-line no-param-reassign
          (newEconomy as any) = shockedEconomy;

          if (shock.isOneTime) {
            firedMarketShocks = [...firedMarketShocks, shock.id];
          }
          get().addNotification({
            type: 'error',
            title: `⚡ ${shock.name}`,
            message: shock.headline,
            duration: 0,
          });
          // Only one shock per day
          break;
        }

        // ── daysInDebt + broke spiral ─────────────────────────────────────
        if (updatedPlayer.finances.cash < 0) {
          const prevDaysInDebt = updatedPlayer.finances.daysInDebt || 0;
          const newDaysInDebt = prevDaysInDebt + 1;
          updatedPlayer = {
            ...updatedPlayer,
            finances: { ...updatedPlayer.finances, daysInDebt: newDaysInDebt },
          };

          // Every 30 days in debt: force a payday loan
          if (newDaysInDebt > 0 && newDaysInDebt % 30 === 0) {
            const loanAmount = 2000;
            const paydayDebt: DebtItem = {
              id: `payday_${totalDays}`,
              type: 'personal_loan',
              name: 'Payday Loan (35% APR)',
              principal: loanAmount,
              currentBalance: loanAmount,
              interestRate: 0.35,
              minimumPayment: loanAmount * 0.05,
              monthlyPayment: loanAmount * 0.08,
              startDate: totalDays,
              isMarginLoan: false,
            };
            updatedPlayer = {
              ...updatedPlayer,
              finances: {
                ...updatedPlayer.finances,
                cash: updatedPlayer.finances.cash + loanAmount,
                totalDebt: updatedPlayer.finances.totalDebt + loanAmount,
              },
              debtItems: [...updatedPlayer.debtItems, paydayDebt],
              stats: {
                ...updatedPlayer.stats,
                stress: Math.min(100, updatedPlayer.stats.stress + 15),
                reputation: Math.max(0, updatedPlayer.stats.reputation - 5),
                confidence: Math.max(0, updatedPlayer.stats.confidence - 5),
              },
            };
            get().addNotification({
              type: 'error',
              title: 'Payday Loan Forced',
              message: `You're out of money! A $${loanAmount.toLocaleString()} payday loan at 35% APR was taken automatically. Get out of the hole fast.`,
              duration: 0,
            });
          }
        } else if ((updatedPlayer.finances.daysInDebt || 0) > 0) {
          // Reset daysInDebt once cash is positive again
          updatedPlayer = {
            ...updatedPlayer,
            finances: { ...updatedPlayer.finances, daysInDebt: 0 },
          };
        }

        // Daily SEC investigation pressure
        const actedTips = updatedInsiderTips.filter(t => t.isActedOn && !t.isExpired);
        if (actedTips.length > 0 || updatedSEC.investigationLevel > 0) {
          const lawyerReduction = updatedSEC.hasLawyer ? 0.4 : 1.0;
          // Compliance officer reduces SEC pressure
          const hasComplianceOfficer = Object.values(state.employees).some(e => e.role === 'compliance_officer');
          const complianceReduction = hasComplianceOfficer ? 0.6 : 1.0;
          // Each acted tip adds small daily pressure
          const dailyRisk = actedTips.reduce((sum, t) => sum + t.investigationRiskBase * 0.01, 0);
          const dailyPressure = dailyRisk * updatedSEC.scrutinyMultiplier * lawyerReduction * complianceReduction;
          // Natural decay when clean (compliance officer boosts decay)
          const decay = actedTips.length === 0 ? (hasComplianceOfficer ? 1.0 : 0.5) : (hasComplianceOfficer ? 0.3 : 0);
          let newLevel = Math.max(0, Math.min(100, updatedSEC.investigationLevel + dailyPressure - decay));

          // Threshold notifications
          if (updatedSEC.investigationLevel < 40 && newLevel >= 40) {
            get().addNotification({
              type: 'warning',
              title: 'SEC Informal Inquiry',
              message: 'The SEC has flagged unusual trading patterns around your account. Consider slowing down.',
              duration: 10000,
            });
          }
          if (updatedSEC.investigationLevel < 70 && newLevel >= 70) {
            updatedSEC = { ...updatedSEC, isUnderFormalInvestigation: true };
            get().addNotification({
              type: 'error',
              title: 'FORMAL SEC INVESTIGATION OPENED',
              message: 'The SEC has formally opened an investigation into your trading activity. Get a lawyer NOW.',
              duration: 0,
            });
          }
          if (!updatedSEC.isConvicted && newLevel >= 95) {
            // Charges filed — calculate fine
            const fine = Math.max(50000, updatedSEC.totalIllegalProfits * 3 + 100000);
            const newCash = Math.max(-fine, updatedPlayer.finances.cash - fine);
            updatedPlayer = {
              ...updatedPlayer,
              finances: { ...updatedPlayer.finances, cash: newCash },
              stats: {
                ...updatedPlayer.stats,
                reputation: Math.max(0, updatedPlayer.stats.reputation - 40),
                stress: Math.min(100, updatedPlayer.stats.stress + 50),
                confidence: Math.max(0, updatedPlayer.stats.confidence - 30),
              },
              biographyEvents: [...updatedPlayer.biographyEvents, {
                date: totalDays,
                text: `SEC charges filed. Paid $${fine.toLocaleString()} in fines and disgorgement. Reputation destroyed.`,
                type: 'bad' as const,
              }],
            };
            updatedSEC = {
              ...updatedSEC,
              isConvicted: true,
              investigationLevel: 0,
              isUnderFormalInvestigation: false,
              lastFineAmount: fine,
              scrutinyMultiplier: updatedSEC.scrutinyMultiplier + 1,
              totalIllegalProfits: 0,
            };
            updatedInsiderTips = updatedInsiderTips.map(t => ({ ...t, isActedOn: false, isExpired: true }));
            get().addNotification({
              type: 'error',
              title: 'SEC CHARGES FILED — CONVICTED',
              message: `You have been charged with insider trading. Fine: $${fine.toLocaleString()}. Reputation -40. Your record is tainted permanently.`,
              duration: 0,
            });
          } else {
            updatedSEC = { ...updatedSEC, investigationLevel: newLevel };
          }
        }

        set({
          time: newTime,
          economy: newEconomy,
          stocks: newStocks,
          etfs: newEtfs,
          crypto: newCrypto,
          player: updatedPlayer,
          rivals: updatedRivals,
          completedMilestones: updatedCompletedMilestones,
          insiderTips: updatedInsiderTips,
          secStatus: updatedSEC,
          firedMarketShocks,
        });
      },

      advanceWeek: () => {
        for (let i = 0; i < 7; i++) {
          get().advanceDay();
        }
      },

      doWork: () => {
        const { player, time } = get();
        if (!player || !player.currentJob) {
          get().addNotification({ type: 'warning', title: 'No Job', message: 'Apply for a job in the Career tab first.' });
          return;
        }
        if (player.stats.energy < 10) {
          get().addNotification({ type: 'warning', title: 'Exhausted', message: 'You\'re too tired to work. Rest up first.' });
          return;
        }
        const currentDay = time.totalDays;
        // Streak: maintained if last worked was yesterday
        const newStreak = player.lastWorkedDay === currentDay - 1 ? (player.workStreak + 1) : 1;

        // RNG variance: ~15% exceptional, ~12% rough day, rest normal
        const roll = Math.random();
        const WORK_FLAVORS_GREAT = [
          'Client praised your analysis.', 'Landed a key deal today.', 'Boss noticed your extra effort.',
          'Crushed it in the team meeting.', 'Discovered an inefficiency that saved the firm money.',
        ];
        const WORK_FLAVORS_NORMAL = [
          'Another productive day.', 'Steady progress on all fronts.', 'Nothing spectacular, but solid work.',
          'Met every deadline today.', 'Good day — kept your head down and delivered.',
        ];
        const WORK_FLAVORS_BAD = [
          'Difficult client today.', 'Meeting ran 3 hours over. Drained.', 'Unexpected setback slowed you down.',
          'Manager was difficult. Stress is up.', 'Made a small error that cost you time.',
        ];
        let wageMultiplier = 1.0;
        let notifType: 'success' | 'info' | 'warning' = 'success';
        let flavor = '';
        let title = 'Work Done';
        if (roll < 0.13) {
          wageMultiplier = 1.75;
          flavor = WORK_FLAVORS_GREAT[Math.floor(Math.random() * WORK_FLAVORS_GREAT.length)];
          notifType = 'success';
          title = '🌟 Great Day!';
        } else if (roll < 0.25) {
          wageMultiplier = 0.65;
          flavor = WORK_FLAVORS_BAD[Math.floor(Math.random() * WORK_FLAVORS_BAD.length)];
          notifType = 'warning';
          title = '😤 Rough Day';
        } else {
          flavor = WORK_FLAVORS_NORMAL[Math.floor(Math.random() * WORK_FLAVORS_NORMAL.length)];
        }
        const effectiveWage = player.currentJob.dailyWage * wageMultiplier;

        // Streak milestone rewards
        let streakBonus = 0;
        let streakMsg = '';
        if (newStreak === 5)  { streakBonus = Math.round(player.currentJob.dailyWage * 3); streakMsg = ` 🔥 5-day streak! +$${streakBonus} bonus!`; }
        if (newStreak === 10) { streakBonus = Math.round(player.currentJob.dailyWage * 8); streakMsg = ` 🔥 10-day streak! +$${streakBonus} bonus!`; }
        if (newStreak === 20) { streakBonus = Math.round(player.currentJob.dailyWage * 20); streakMsg = ` 🔥🔥 20-day streak! +$${streakBonus} bonus!`; }
        if (newStreak > 20 && newStreak % 30 === 0) { streakBonus = Math.round(player.currentJob.dailyWage * 30); streakMsg = ` 🔥🔥🔥 ${newStreak}-day streak! +$${streakBonus}!`; }

        let updatedPlayer = applyJobWork(player, { ...player.currentJob, dailyWage: effectiveWage });
        updatedPlayer = {
          ...updatedPlayer,
          workStreak: newStreak,
          lastWorkedDay: currentDay,
          finances: { ...updatedPlayer.finances, cash: updatedPlayer.finances.cash + streakBonus },
        };
        set({ player: updatedPlayer });
        get().advanceDay();
        get().addNotification({
          type: notifType,
          title,
          message: `$${effectiveWage.toFixed(0)} earned${wageMultiplier > 1 ? ` (${Math.round(wageMultiplier * 100)}%!)` : ''}. ${flavor}${streakMsg}`,
        });
      },

      doRest: () => {
        const { player } = get();
        if (!player) return;
        const REST_FLAVORS = [
          'You slept soundly. Ready for tomorrow.',
          'Caught up on some reading between naps.',
          'Long walk and an early night. Refreshed.',
          'Ordered delivery and watched the news. Recharged.',
          'Quick power nap turned into a 10-hour sleep. Worth it.',
        ];
        const updatedPlayer = applyRest(player);
        set({ player: updatedPlayer });
        get().advanceDay();
        get().addNotification({
          type: 'info',
          title: 'Rested',
          message: `+30 Energy, -15 Stress. ${REST_FLAVORS[Math.floor(Math.random() * REST_FLAVORS.length)]}`,
        });
      },

      doStudy: (skillId: string) => {
        const { player } = get();
        if (!player) return;
        if (player.stats.energy < 15) {
          get().addNotification({ type: 'warning', title: 'Too Tired', message: 'Rest before studying — you can\'t focus like this.' });
          return;
        }
        const SKILL_LABELS: Record<string, string> = {
          finance: 'Finance', chartAnalysis: 'Chart Analysis', tradingPsychology: 'Trading Psychology',
          economics: 'Economics', options: 'Options', coding: 'Coding',
          entrepreneurship: 'Entrepreneurship', macroAnalysis: 'Macro Analysis',
        };
        const isBreakthrough = Math.random() < 0.12; // 12% chance of 3× gain
        const multiplier = isBreakthrough ? 3 : 1;
        const updatedPlayer = applyStudy(player, skillId as any, 4 * multiplier);
        set({ player: updatedPlayer });
        get().advanceDay();
        const gain = (updatedPlayer.skills[skillId as keyof typeof updatedPlayer.skills] || 0) -
          (player.skills[skillId as keyof typeof player.skills] || 0);
        const label = SKILL_LABELS[skillId] || skillId;
        if (isBreakthrough) {
          get().addNotification({
            type: 'achievement',
            title: `💡 Breakthrough! ${label}`,
            message: `Something clicked! +${gain.toFixed(1)} (3× gain). You understand this on a deeper level now.`,
          });
        } else {
          const STUDY_FLAVORS = [
            'Steady progress.', 'Concepts are starting to connect.',
            'Good session — took detailed notes.', 'Read three chapters. Solid gains.',
          ];
          get().addNotification({
            type: 'info',
            title: `Studied ${label}`,
            message: `+${gain.toFixed(1)} skill. ${STUDY_FLAVORS[Math.floor(Math.random() * STUDY_FLAVORS.length)]}`,
          });
        }
      },

      doExercise: () => {
        const { player } = get();
        if (!player) return;
        const isPR = Math.random() < 0.10; // 10% personal record
        const updatedPlayer = applyExercise(player);
        const finalPlayer = isPR
          ? { ...updatedPlayer, stats: { ...updatedPlayer.stats, confidence: Math.min(100, updatedPlayer.stats.confidence + 3), health: Math.min(100, updatedPlayer.stats.health + 3) } }
          : updatedPlayer;
        set({ player: finalPlayer });
        get().advanceDay();
        const EX_FLAVORS = [
          'Hit the gym hard today.', 'Morning run cleared your head.',
          'Yoga session — stress is way down.', 'Pushed through a tough workout.',
        ];
        if (isPR) {
          get().addNotification({ type: 'success', title: '🏆 Personal Record!', message: 'Best workout yet. +8 Health, +10 Confidence, -10 Stress. Feeling unstoppable.' });
        } else {
          get().addNotification({ type: 'info', title: 'Exercised', message: `+5 Health, -10 Stress. ${EX_FLAVORS[Math.floor(Math.random() * EX_FLAVORS.length)]}` });
        }
      },

      doNetwork: () => {
        const { player } = get();
        if (!player) return;
        if (player.stats.energy < 10) {
          get().addNotification({ type: 'warning', title: 'Too Tired', message: 'You\'re too drained to network effectively.' });
          return;
        }
        const isValuableContact = Math.random() < 0.18; // 18% high-value contact
        const cashBonus = isValuableContact && Math.random() < 0.35 ? Math.round(200 + Math.random() * 1300) : 0;
        let updatedPlayer = applyNetworking(player);
        if (isValuableContact) {
          updatedPlayer = {
            ...updatedPlayer,
            stats: { ...updatedPlayer.stats, network: Math.min(100, updatedPlayer.stats.network + 2), reputation: Math.min(100, updatedPlayer.stats.reputation + 1) },
            finances: cashBonus > 0 ? { ...updatedPlayer.finances, cash: updatedPlayer.finances.cash + cashBonus } : updatedPlayer.finances,
          };
        }
        set({ player: updatedPlayer });
        get().advanceDay();
        const NET_FLAVORS = [
          'Met several promising contacts.', 'Exchanged cards at an industry mixer.',
          'Long lunch with a former colleague.', 'Attended a finance networking event.',
        ];
        if (isValuableContact) {
          get().addNotification({
            type: 'success',
            title: '🤝 High-Value Contact!',
            message: `Connected with someone influential. +3 Network, +1 Reputation.${cashBonus > 0 ? ` They introduced you to a client — +$${cashBonus}!` : ''}`,
          });
        } else {
          get().addNotification({ type: 'info', title: 'Networked', message: `+1 Network, +0.5 Networking. ${NET_FLAVORS[Math.floor(Math.random() * NET_FLAVORS.length)]}` });
        }
      },

      applyForJob: (jobId: string) => {
        const { player } = get();
        if (!player) return;
        const job = getJobById(jobId);
        if (!job) return;
        // Check requirements
        const availJobs = getAvailableJobs(
          player.skills as any,
          player.stats as any,
          player.unlockedMechanics
        );
        if (!availJobs.find(j => j.id === jobId)) {
          get().addNotification({ type: 'error', title: 'Not Qualified', message: 'You don\'t meet the requirements for this job.' });
          return;
        }
        const updatedPlayer = { ...player, currentJob: job };
        set({ player: updatedPlayer });
        get().addNotification({
          type: 'success',
          title: 'Job Accepted!',
          message: `You are now a ${job.title} at ${job.company}. Salary: $${job.salary.toLocaleString()}/yr`,
        });
      },

      quitJob: () => {
        const { player } = get();
        if (!player) return;
        set({ player: { ...player, currentJob: null } });
        get().addNotification({ type: 'info', title: 'Resigned', message: 'You left your job. Find something new!' });
      },

      upgradeHousing: (level: HousingLevel) => {
        const { player } = get();
        if (!player) return;
        const newPlayer = upgradeHousing(player, level);
        set({ player: newPlayer });
        get().addNotification({ type: 'success', title: 'Housing Upgraded!', message: `You moved to a ${level.replace(/_/g, ' ')}.` });
      },

      payDebt: (debtId: string, amount: number) => {
        const { player } = get();
        if (!player) return;
        if (player.finances.cash < amount) {
          get().addNotification({ type: 'error', title: 'Insufficient Funds', message: 'Not enough cash to make this payment.' });
          return;
        }
        const updatedPlayer = payDebt(player, debtId, amount);
        set({ player: updatedPlayer });
        get().addNotification({ type: 'success', title: 'Debt Payment Made', message: `Paid $${amount.toFixed(0)} toward your debt.` });
      },

      takePersonalLoan: (amount: number) => {
        const { player } = get();
        if (!player) return;
        const rate = 0.12 + (1 - player.finances.creditScore / 850) * 0.10;
        const newDebt: DebtItem = {
          id: `loan_${Date.now()}`,
          type: 'personal_loan',
          name: 'Personal Loan',
          principal: amount,
          currentBalance: amount,
          interestRate: rate,
          minimumPayment: amount * 0.02,
          monthlyPayment: amount * 0.03,
          startDate: get().time.totalDays,
          isMarginLoan: false,
        };
        const updatedPlayer = addDebt(player, newDebt);
        set({ player: updatedPlayer });
        get().addNotification({
          type: 'info',
          title: 'Loan Approved',
          message: `$${amount.toLocaleString()} personal loan at ${(rate * 100).toFixed(1)}% APR.`,
        });
      },

      buyStock: (ticker: string, assetType: AssetType, shares: number, price: number) => {
        const { player, stocks, etfs, crypto, time } = get();
        if (!player) return;

        const result = executeBuy(player.portfolio, ticker, assetType, shares, price, player.finances.cash, time.totalDays);
        if (result.error) {
          get().addNotification({ type: 'error', title: 'Trade Failed', message: result.error });
          return;
        }

        const newPortfolio = calculatePortfolioValue(result.portfolio, stocks, etfs, crypto);
        const updatedPlayer = {
          ...player,
          portfolio: newPortfolio,
          finances: { ...player.finances, cash: result.newCash },
        };
        set({ player: updatedPlayer });
        get().addNotification({
          type: 'success',
          title: `Bought ${ticker}`,
          message: `${shares} shares @ $${price.toFixed(2)} = $${(shares * price).toFixed(2)}`,
        });
      },

      sellStock: (ticker: string, shares: number, price: number) => {
        const { player, stocks, etfs, crypto, time } = get();
        if (!player) return;

        const result = executeSell(player.portfolio, ticker, shares, price, player.finances.cash, time.totalDays);
        if (result.error) {
          get().addNotification({ type: 'error', title: 'Trade Failed', message: result.error });
          return;
        }

        const newPortfolio = calculatePortfolioValue(result.portfolio, stocks, etfs, crypto);
        const updatedPlayer = {
          ...player,
          portfolio: newPortfolio,
          finances: { ...player.finances, cash: result.newCash },
        };
        set({ player: updatedPlayer });
        const pnl = result.portfolio.tradeHistory[0]?.pnl || 0;
        get().addNotification({
          type: pnl >= 0 ? 'success' : 'warning',
          title: `Sold ${ticker}`,
          message: `${shares} shares @ $${price.toFixed(2)} | P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`,
        });
      },

      addToWatchlist: (ticker: string) => {
        const { player } = get();
        if (!player) return;
        const newPortfolio = addToWatchlist(player.portfolio, ticker);
        set({ player: { ...player, portfolio: newPortfolio } });
      },

      removeFromWatchlist: (ticker: string) => {
        const { player } = get();
        if (!player) return;
        const newPortfolio = removeFromWatchlist(player.portfolio, ticker);
        set({ player: { ...player, portfolio: newPortfolio } });
      },

      buyOption: (ticker: string, type: 'call' | 'put', strike: number, daysToExpiry: number, contracts: number) => {
        const { player, stocks, economy, time } = get();
        if (!player) return;
        const stock = stocks[ticker];
        if (!stock) { get().addNotification({ type: 'error', title: 'Stock Not Found', message: `${ticker} not found.` }); return; }

        const bsResult = blackScholes({
          stockPrice: stock.currentPrice,
          strikePrice: strike,
          timeToExpiry: daysToExpiry / 365,
          riskFreeRate: economy.federalFundsRate / 100,
          impliedVolatility: (stock.volatility / 100) * 1.2, // IV premium
          optionType: type,
        });

        const totalCost = bsResult.premium * 100 * contracts; // 100 shares per contract
        if (totalCost <= 0) { get().addNotification({ type: 'error', title: 'Invalid Option', message: 'Option has no value.' }); return; }
        if (player.finances.cash < totalCost) {
          get().addNotification({ type: 'error', title: 'Insufficient Funds', message: `Need $${totalCost.toFixed(2)} to buy this option.` });
          return;
        }

        const optionContract: OptionContract = {
          id: `opt_${Date.now()}_${Math.random().toString(36).substr(2,6)}`,
          ticker,
          type,
          strikePrice: strike,
          expirationDate: time.totalDays + daysToExpiry,
          premium: bsResult.premium,
          contracts,
          currentValue: totalCost,
          intrinsicValue: bsResult.intrinsicValue * 100 * contracts,
          extrinsicValue: bsResult.extrinsicValue * 100 * contracts,
          delta: bsResult.delta,
          theta: bsResult.theta,
          impliedVolatility: bsResult.impliedVolatility,
          daysToExpiry,
          purchaseDate: time.totalDays,
        };

        const newPortfolio: Portfolio = {
          ...player.portfolio,
          options: [...player.portfolio.options, optionContract],
        };
        const updatedPlayer = {
          ...player,
          portfolio: newPortfolio,
          finances: { ...player.finances, cash: player.finances.cash - totalCost },
        };
        set({ player: updatedPlayer });
        get().addNotification({
          type: 'success',
          title: `Bought ${contracts}x ${ticker} ${type.toUpperCase()} $${strike}`,
          message: `Premium: $${bsResult.premium.toFixed(2)}/share | Total: $${totalCost.toFixed(2)} | Exp: ${daysToExpiry}d`,
        });
      },

      sellOption: (optionId: string) => {
        const { player, stocks, economy, time } = get();
        if (!player) return;
        const option = player.portfolio.options.find(o => o.id === optionId);
        if (!option) return;
        const stock = stocks[option.ticker];
        if (!stock) return;

        const daysLeft = Math.max(0, option.expirationDate - time.totalDays);
        const currentBS = updateOptionValue(
          option.strikePrice, option.expirationDate, time.totalDays,
          stock.currentPrice, economy.federalFundsRate / 100,
          option.impliedVolatility, option.type
        );
        const saleValue = currentBS.premium * 100 * option.contracts;
        const pnl = saleValue - option.premium * 100 * option.contracts;

        const updatedPlayer = {
          ...player,
          portfolio: {
            ...player.portfolio,
            options: player.portfolio.options.filter(o => o.id !== optionId),
            totalRealizedPnL: player.portfolio.totalRealizedPnL + pnl,
          },
          finances: { ...player.finances, cash: player.finances.cash + saleValue },
        };
        set({ player: updatedPlayer });
        get().addNotification({
          type: pnl >= 0 ? 'success' : 'warning',
          title: `Sold ${option.ticker} Option`,
          message: `P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} | Received $${saleValue.toFixed(2)}`,
        });
      },

      exerciseOption: (optionId: string) => {
        const { player, stocks, time } = get();
        if (!player) return;
        const option = player.portfolio.options.find(o => o.id === optionId);
        if (!option) return;
        const stock = stocks[option.ticker];
        if (!stock) return;

        const totalShares = option.contracts * 100;
        const exerciseCost = option.type === 'call'
          ? option.strikePrice * totalShares
          : 0;
        const exerciseProceeds = option.type === 'put'
          ? option.strikePrice * totalShares
          : 0;

        if (option.type === 'call' && player.finances.cash < exerciseCost) {
          get().addNotification({ type: 'error', title: 'Insufficient Funds', message: 'Not enough cash to exercise this call option.' });
          return;
        }

        let updatedPlayer = { ...player };

        if (option.type === 'call') {
          // Buy shares at strike price
          const result = executeBuy(
            updatedPlayer.portfolio, option.ticker, 'stock',
            totalShares, option.strikePrice, updatedPlayer.finances.cash, time.totalDays
          );
          if (!result.error) {
            updatedPlayer = {
              ...updatedPlayer,
              portfolio: { ...result.portfolio, options: result.portfolio.options.filter(o => o.id !== optionId) },
              finances: { ...updatedPlayer.finances, cash: result.newCash },
            };
          }
        } else {
          // Sell shares at strike price (if we hold them)
          const holding = updatedPlayer.portfolio.holdings[option.ticker];
          if (!holding || holding.shares < totalShares) {
            get().addNotification({ type: 'error', title: 'Not Enough Shares', message: 'You need the underlying shares to exercise this put.' });
            return;
          }
          const result = executeSell(
            updatedPlayer.portfolio, option.ticker, totalShares, option.strikePrice,
            updatedPlayer.finances.cash, time.totalDays
          );
          if (!result.error) {
            updatedPlayer = {
              ...updatedPlayer,
              portfolio: { ...result.portfolio, options: result.portfolio.options.filter(o => o.id !== optionId) },
              finances: { ...updatedPlayer.finances, cash: result.newCash },
            };
          }
        }

        set({ player: updatedPlayer });
        get().addNotification({
          type: 'success',
          title: `Option Exercised`,
          message: `${option.ticker} ${option.type} exercised at $${option.strikePrice}`,
        });
      },

      startBusiness: (templateId: string) => {
        const { player, time } = get();
        if (!player) return;
        const template = getBusinessTemplateById(templateId);
        if (!template) return;

        if (player.finances.cash < template.startupCost) {
          get().addNotification({ type: 'error', title: 'Insufficient Funds', message: `Need ${template.startupCost.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} to start this business.` });
          return;
        }

        const bizId = `biz_${Date.now()}`;
        const [minRev, maxRev] = template.monthlyRevenue;
        const [minExp, maxExp] = template.monthlyExpenses;
        const initialRevenue = minRev + Math.random() * (maxRev - minRev);
        const initialExpenses = minExp + Math.random() * (maxExp - minExp);

        const newBusiness: Business = {
          id: bizId,
          name: template.name,
          type: template.type,
          category: template.category,
          description: template.description,
          startupCost: template.startupCost,
          monthlyRevenue: initialRevenue * 0.3, // starts at 30% capacity
          monthlyExpenses: initialExpenses,
          monthlyProfit: (initialRevenue * 0.3) - initialExpenses,
          employees: 0,
          satisfaction: 60,
          branding: 30,
          scalability: template.scalability,
          risk: template.risk,
          growthRate: 0.05 + Math.random() * 0.05,
          reputationBonus: 2,
          networkBonus: 1,
          isActive: true,
          foundedDate: time.totalDays,
          totalRevenue: 0,
          totalProfit: 0,
          level: 1,
          canHire: template.category !== 'side_hustle',
          upgrades: [],
        };

        const updatedPlayer = {
          ...player,
          finances: { ...player.finances, cash: player.finances.cash - template.startupCost },
          ownedBusinesses: [...player.ownedBusinesses, bizId],
          unlockedMechanics: player.unlockedMechanics.includes('business_owner')
            ? player.unlockedMechanics
            : [...player.unlockedMechanics, 'business_owner'],
          biographyEvents: [...player.biographyEvents, {
            date: time.totalDays,
            text: `Founded ${template.name}. Invested $${template.startupCost.toLocaleString()}.`,
            type: 'good' as const,
          }],
        };

        set(state => ({
          player: updatedPlayer,
          businesses: { ...state.businesses, [bizId]: newBusiness },
        }));

        get().addNotification({
          type: 'success',
          title: `${template.name} Launched!`,
          message: `Your business is open. Revenue will ramp up over the first few months.`,
          duration: 6000,
        });
      },

      upgradeBusiness: (businessId: string) => {
        const { player, businesses } = get();
        if (!player) return;
        const biz = businesses[businessId];
        if (!biz) return;
        const upgradeCost = biz.startupCost * 0.5 * biz.level;
        if (player.finances.cash < upgradeCost) {
          get().addNotification({ type: 'error', title: 'Insufficient Funds', message: `Upgrade costs $${upgradeCost.toLocaleString()}` });
          return;
        }
        const upgradedBiz: Business = {
          ...biz,
          level: biz.level + 1,
          monthlyRevenue: biz.monthlyRevenue * 1.4,
          monthlyExpenses: biz.monthlyExpenses * 1.15,
          monthlyProfit: (biz.monthlyRevenue * 1.4) - (biz.monthlyExpenses * 1.15),
          reputationBonus: biz.reputationBonus + 2,
        };
        set(state => ({
          player: { ...player, finances: { ...player.finances, cash: player.finances.cash - upgradeCost } },
          businesses: { ...state.businesses, [businessId]: upgradedBiz },
        }));
        get().addNotification({ type: 'success', title: 'Business Upgraded!', message: `${biz.name} is now level ${biz.level + 1}. Revenue increased 40%.` });
      },

      closeBusiness: (businessId: string) => {
        const { player, businesses } = get();
        if (!player) return;
        const biz = businesses[businessId];
        if (!biz) return;
        // Liquidation value = 20% of startup cost
        const liquidation = biz.startupCost * 0.2;
        const newBusinesses = { ...businesses };
        delete newBusinesses[businessId];
        set({
          player: {
            ...player,
            finances: { ...player.finances, cash: player.finances.cash + liquidation },
            ownedBusinesses: player.ownedBusinesses.filter(id => id !== businessId),
          },
          businesses: newBusinesses,
        });
        get().addNotification({ type: 'info', title: 'Business Closed', message: `${biz.name} closed. Recovered $${liquidation.toFixed(0)}.` });
      },

      hireEmployee: (candidateId: string) => {
        const { player, employees, time, hedgeFund } = get();
        if (!player) return;
        const candidate = EMPLOYEE_POOL.find(e => e.id === candidateId);
        if (!candidate) return;

        if (player.finances.cash < candidate.salary * 0.1) {
          get().addNotification({ type: 'error', title: 'Insufficient Funds', message: `Need at least ${(candidate.salary * 0.1).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} cash to hire.` });
          return;
        }

        const newEmployee = createEmployeeFromCandidate(candidate, time.totalDays);
        const reputationGain = newEmployee.reputationImpact;

        // Check for special abilities that unlock mechanics
        const newUnlocks = [...player.unlockedMechanics];
        if (candidate.specialAbility?.includes('automation tools') && !newUnlocks.includes('automation_tools')) {
          newUnlocks.push('automation_tools');
        }
        if (candidate.specialAbility?.includes('quant_trading') && !newUnlocks.includes('quant_trading')) {
          newUnlocks.push('quant_trading');
        }

        const updatedPlayer = {
          ...player,
          stats: {
            ...player.stats,
            reputation: Math.min(100, player.stats.reputation + reputationGain),
          },
          unlockedMechanics: newUnlocks,
        };

        // Add to fund's employee list if fund exists
        if (hedgeFund) {
          set(state => ({
            hedgeFund: state.hedgeFund
              ? { ...state.hedgeFund, employees: [...state.hedgeFund.employees, candidateId] }
              : null,
            employees: { ...state.employees, [candidateId]: newEmployee },
            player: updatedPlayer,
          }));
        } else {
          set(state => ({
            employees: { ...state.employees, [candidateId]: newEmployee },
            player: updatedPlayer,
          }));
        }

        get().addNotification({
          type: 'success',
          title: `${candidate.name} Hired!`,
          message: `${candidate.role.replace(/_/g, ' ')} joined the team. Salary: $${(candidate.salary / 1000).toFixed(0)}K/yr`,
          duration: 5000,
        });
      },

      fireEmployee: (employeeId: string) => {
        const { employees, player, hedgeFund } = get();
        const emp = employees[employeeId];
        if (!emp) return;
        const severance = emp.salary * 0.1; // 1 month severance
        const newEmployees = { ...employees };
        delete newEmployees[employeeId];

        set(state => ({
          employees: newEmployees,
          player: state.player ? {
            ...state.player,
            finances: { ...state.player.finances, cash: state.player.finances.cash - severance },
          } : state.player,
          hedgeFund: hedgeFund
            ? { ...hedgeFund, employees: hedgeFund.employees.filter(id => id !== employeeId) }
            : null,
        }));
        get().addNotification({ type: 'info', title: `${emp.name} Let Go`, message: `Severance paid: $${severance.toFixed(0)}` });
      },

      addLimitedPartner: (name: string, type: LimitedPartner['type'], amount: number) => {
        const { hedgeFund, time } = get();
        if (!hedgeFund) return;
        const lp: LimitedPartner = {
          id: `lp_${Date.now()}`,
          name,
          type,
          investedAmount: amount,
          entryDate: time.totalDays,
          satisfactionLevel: 70,
          redemptionThreshold: type === 'institution' ? 15 : type === 'individual' ? 25 : 20,
          lockupPeriod: type === 'institution' ? 12 : 6,
          isRedemptionPending: false,
        };
        set(state => ({
          hedgeFund: state.hedgeFund ? {
            ...state.hedgeFund,
            limitedPartners: [...state.hedgeFund.limitedPartners, lp],
            aum: state.hedgeFund.aum + amount,
            totalLPCapital: state.hedgeFund.totalLPCapital + amount,
          } : null,
        }));
        get().addNotification({
          type: 'success',
          title: 'New LP Investor!',
          message: `${name} invested $${amount.toLocaleString()} in your fund. AUM increased.`,
          duration: 6000,
        });
      },

      redeemLP: (lpId: string) => {
        const { hedgeFund } = get();
        if (!hedgeFund) return;
        const lp = hedgeFund.limitedPartners.find(p => p.id === lpId);
        if (!lp) return;
        set(state => ({
          hedgeFund: state.hedgeFund ? {
            ...state.hedgeFund,
            limitedPartners: state.hedgeFund.limitedPartners.filter(p => p.id !== lpId),
            aum: Math.max(0, state.hedgeFund.aum - lp.investedAmount),
            totalLPCapital: Math.max(0, state.hedgeFund.totalLPCapital - lp.investedAmount),
          } : null,
        }));
        get().addNotification({ type: 'warning', title: 'LP Redeemed', message: `${lp.name} withdrew $${lp.investedAmount.toLocaleString()} from the fund.` });
      },

      updateFundStrategy: (strategy: string) => {
        set(state => ({
          hedgeFund: state.hedgeFund ? { ...state.hedgeFund, strategy: strategy as any } : null,
        }));
        get().addNotification({ type: 'info', title: 'Strategy Updated', message: `Fund strategy changed to ${strategy.replace(/_/g, ' ')}.` });
      },

      scheduleLPCall: () => {
        const { hedgeFund, time } = get();
        if (!hedgeFund) return;
        const cooldown = 7;
        if ((hedgeFund.lastLPCallDay || 0) > time.totalDays - cooldown) {
          get().addNotification({ type: 'warning', title: 'LP Call on Cooldown', message: `You called LPs recently. Next call available in ${cooldown - (time.totalDays - (hedgeFund.lastLPCallDay || 0))} days.` });
          return;
        }
        if (hedgeFund.limitedPartners.length === 0) {
          get().addNotification({ type: 'warning', title: 'No LPs', message: 'Add LP investors first before scheduling calls.' });
          return;
        }
        // Boost satisfaction +5-12 for each LP, small chance a happy LP refers a new one
        const boostPerLP = 5 + Math.floor(Math.random() * 8);
        const updatedLPs = hedgeFund.limitedPartners.map(lp => ({
          ...lp,
          satisfactionLevel: Math.min(100, lp.satisfactionLevel + boostPerLP),
          isRedemptionPending: lp.satisfactionLevel + boostPerLP >= lp.redemptionThreshold ? false : lp.isRedemptionPending,
        }));
        const referralChance = updatedLPs.filter(lp => lp.satisfactionLevel >= 80).length * 0.08;
        const gotReferral = Math.random() < referralChance;
        set(state => ({
          hedgeFund: state.hedgeFund ? {
            ...state.hedgeFund,
            limitedPartners: updatedLPs,
            lastLPCallDay: time.totalDays,
            reputation: Math.min(100, state.hedgeFund.reputation + 2),
          } : null,
        }));
        get().addNotification({
          type: 'success',
          title: '📞 LP Call Complete',
          message: `Called all ${hedgeFund.limitedPartners.length} LPs. Each gained +${boostPerLP} satisfaction.${gotReferral ? ' 🎉 One LP offered to refer a colleague!' : ''}`,
          duration: 7000,
        });
        get().advanceDay();
      },

      sendLPReport: () => {
        const { hedgeFund, time } = get();
        if (!hedgeFund) return;
        const cooldown = 25;
        if ((hedgeFund.lastLPReportDay || 0) > time.totalDays - cooldown) {
          get().addNotification({ type: 'warning', title: 'Report on Cooldown', message: `Sent a report recently. Next report in ${cooldown - (time.totalDays - (hedgeFund.lastLPReportDay || 0))} days.` });
          return;
        }
        if (hedgeFund.limitedPartners.length === 0) {
          get().addNotification({ type: 'warning', title: 'No LPs', message: 'Add LP investors first.' });
          return;
        }
        const navReturn = ((hedgeFund.nav - hedgeFund.inceptionNAV) / hedgeFund.inceptionNAV * 100).toFixed(1);
        const isPositive = hedgeFund.nav > hedgeFund.inceptionNAV;
        const boost = isPositive ? 8 : -3;
        const updatedLPs = hedgeFund.limitedPartners.map(lp => ({
          ...lp,
          satisfactionLevel: Math.min(100, Math.max(0, lp.satisfactionLevel + boost + Math.floor(Math.random() * 5))),
        }));
        set(state => ({
          hedgeFund: state.hedgeFund ? {
            ...state.hedgeFund,
            limitedPartners: updatedLPs,
            lastLPReportDay: time.totalDays,
            reputation: Math.min(100, state.hedgeFund.reputation + 1),
          } : null,
        }));
        get().addNotification({
          type: isPositive ? 'success' : 'info',
          title: '📊 Monthly LP Report Sent',
          message: `Sent performance report to all LPs. Fund return: ${navReturn}%. LPs ${isPositive ? 'pleased' : 'concerned'} with results. Satisfaction ${isPositive ? '+8' : '-3'}.`,
          duration: 7000,
        });
      },

      hostInvestorDay: () => {
        const { hedgeFund, player, time } = get();
        if (!hedgeFund || !player) return;
        const cost = 15000;
        if (player.finances.cash < cost) {
          get().addNotification({ type: 'error', title: 'Insufficient Funds', message: `Hosting an Investor Day costs $${cost.toLocaleString()}.` });
          return;
        }
        if ((hedgeFund.lastInvestorDayDay || 0) > time.totalDays - 90) {
          get().addNotification({ type: 'warning', title: 'Too Soon', message: `Hosted an Investor Day recently. Wait ${90 - (time.totalDays - (hedgeFund.lastInvestorDayDay || 0))} more days.` });
          return;
        }
        // Big boost to all LPs + reputation + chance of new LPs
        const newLP_chance = 0.5 + hedgeFund.reputation / 200;
        const gotNewLP = Math.random() < newLP_chance;
        const updatedLPs = hedgeFund.limitedPartners.map(lp => ({
          ...lp,
          satisfactionLevel: Math.min(100, lp.satisfactionLevel + 15),
          isRedemptionPending: false,
        }));
        set(state => ({
          player: state.player ? {
            ...state.player,
            finances: { ...state.player.finances, cash: state.player.finances.cash - cost },
          } : null,
          hedgeFund: state.hedgeFund ? {
            ...state.hedgeFund,
            limitedPartners: updatedLPs,
            reputation: Math.min(100, state.hedgeFund.reputation + 8),
            lastInvestorDayDay: time.totalDays,
          } : null,
        }));
        get().addNotification({
          type: 'success',
          title: '🎉 Investor Day Success!',
          message: `Spent $${cost.toLocaleString()} hosting Investor Day. All LPs +15 satisfaction, all redemptions cleared. Reputation +8.${gotNewLP ? ' A new prospect signed up!' : ''}`,
          duration: 10000,
        });
        get().advanceDay();
      },

      shortSell: (ticker: string, shares: number) => {
        const { player, stocks, time } = get();
        if (!player) return;
        const stock = stocks[ticker];
        if (!stock) return;
        const marginRequired = stock.currentPrice * shares * 0.5; // 50% margin
        if (player.finances.cash < marginRequired) {
          get().addNotification({ type: 'error', title: 'Insufficient Margin', message: `Need $${marginRequired.toFixed(2)} as margin collateral (50% of position).` });
          return;
        }
        const existing = player.portfolio.shortPositions?.[ticker];
        const newShort: import('../types').ShortPosition = {
          ticker,
          shares: (existing?.shares || 0) + shares,
          entryPrice: existing
            ? ((existing.entryPrice * existing.shares) + (stock.currentPrice * shares)) / (existing.shares + shares)
            : stock.currentPrice,
          currentPrice: stock.currentPrice,
          marginRequired: (existing?.marginRequired || 0) + marginRequired,
          unrealizedPnL: 0,
          unrealizedPnLPercent: 0,
          openDate: time.totalDays,
          interestAccrued: 0,
        };
        const updatedPlayer = {
          ...player,
          portfolio: {
            ...player.portfolio,
            shortPositions: { ...(player.portfolio.shortPositions || {}), [ticker]: newShort },
          },
          finances: { ...player.finances, cash: player.finances.cash - marginRequired },
        };
        set({ player: updatedPlayer });
        get().addNotification({ type: 'success', title: `Short: ${ticker}`, message: `Shorted ${shares} shares @ $${stock.currentPrice.toFixed(2)}. Margin: $${marginRequired.toFixed(0)}` });
      },

      coverShort: (ticker: string, shares: number) => {
        const { player, stocks, time } = get();
        if (!player) return;
        const stock = stocks[ticker];
        const short = player.portfolio.shortPositions?.[ticker];
        if (!stock || !short) return;
        const coverShares = Math.min(shares, short.shares);
        const pnl = (short.entryPrice - stock.currentPrice) * coverShares - short.interestAccrued * (coverShares / short.shares);
        const marginReturn = short.marginRequired * (coverShares / short.shares);

        const newShorts = { ...(player.portfolio.shortPositions || {}) };
        if (short.shares - coverShares <= 0) {
          delete newShorts[ticker];
        } else {
          newShorts[ticker] = {
            ...short,
            shares: short.shares - coverShares,
            marginRequired: short.marginRequired * ((short.shares - coverShares) / short.shares),
            interestAccrued: short.interestAccrued * ((short.shares - coverShares) / short.shares),
          };
        }

        const tradeRecord: import('../types').TradeRecord = {
          id: `trade_${Date.now()}`,
          date: time.totalDays,
          ticker,
          action: 'cover',
          shares: coverShares,
          price: stock.currentPrice,
          total: coverShares * stock.currentPrice,
          pnl,
        };

        const updatedPlayer = {
          ...player,
          portfolio: {
            ...player.portfolio,
            shortPositions: newShorts,
            totalRealizedPnL: player.portfolio.totalRealizedPnL + pnl,
            tradeHistory: [tradeRecord, ...player.portfolio.tradeHistory.slice(0, 199)],
          },
          finances: { ...player.finances, cash: player.finances.cash + marginReturn + pnl },
        };
        set({ player: updatedPlayer });
        get().addNotification({
          type: pnl >= 0 ? 'success' : 'warning',
          title: `Covered Short: ${ticker}`,
          message: `${coverShares} shares @ $${stock.currentPrice.toFixed(2)} | P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`,
        });
      },

      placeLimitOrder: (orderData) => {
        const { player, time } = get();
        if (!player) return;
        const order: import('../types').LimitOrder = {
          ...orderData,
          id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          status: 'pending',
          createdDate: time.totalDays,
        };
        const updatedPlayer = {
          ...player,
          portfolio: {
            ...player.portfolio,
            limitOrders: [...(player.portfolio.limitOrders || []), order],
          },
        };
        set({ player: updatedPlayer });
        get().addNotification({ type: 'info', title: 'Order Placed', message: `${order.orderType.replace(/_/g, ' ')} ${order.side} ${order.shares}x ${order.ticker}` });
      },

      cancelLimitOrder: (orderId: string) => {
        const { player } = get();
        if (!player) return;
        const updatedPlayer = {
          ...player,
          portfolio: {
            ...player.portfolio,
            limitOrders: (player.portfolio.limitOrders || []).map(o =>
              o.id === orderId ? { ...o, status: 'cancelled' as const } : o
            ),
          },
        };
        set({ player: updatedPlayer });
        get().addNotification({ type: 'info', title: 'Order Cancelled', message: 'Limit order cancelled.' });
      },

      launchHedgeFund: (name: string, strategy: string, initialCapital: number) => {
        const { player, time } = get();
        if (!player) return;
        if (player.finances.cash < initialCapital) {
          get().addNotification({ type: 'error', title: 'Insufficient Capital', message: 'Not enough cash to launch the fund.' });
          return;
        }
        const fund: HedgeFund = {
          id: `fund_${Date.now()}`,
          name,
          strategy: strategy as any,
          aum: initialCapital,
          nav: 1000,
          inceptionNAV: 1000,
          managementFee: 0.02,
          performanceFee: 0.20,
          hurdleRate: 0.08,
          highWaterMark: 1000,
          limitedPartners: [],
          totalLPCapital: 0,
          playerCapital: initialCapital,
          monthlyReturns: [],
          annualReturns: [],
          maxDrawdown: 0,
          currentDrawdown: 0,
          sharpeRatio: 0,
          benchmarkReturn: 0,
          isRegistered: true,
          registrationDate: time.totalDays,
          totalManagementFeesEarned: 0,
          totalPerformanceFeesEarned: 0,
          reputation: 30,
          mediaAttention: 10,
          regulatoryPressure: 5,
          employees: [],
        };
        const updatedPlayer = {
          ...player,
          finances: { ...player.finances, cash: player.finances.cash - initialCapital },
          unlockedMechanics: [...player.unlockedMechanics, 'hedge_fund_registered'],
          biographyEvents: [
            ...player.biographyEvents,
            { date: time.totalDays, text: `Launched ${name} hedge fund with $${initialCapital.toLocaleString()} initial capital.`, type: 'legendary' as const },
          ],
        };
        set({ hedgeFund: fund, player: updatedPlayer });
        get().addNotification({
          type: 'achievement',
          title: 'Hedge Fund Launched!',
          message: `${name} is now open. You are now a fund manager. Go prove yourself.`,
        });
      },

      resolveEvent: (eventId: string, choiceId: string) => {
        const { events, player, time } = get();
        if (!events.activeEvent || !player) return;
        const event = events.activeEvent;
        const choice = event.choices.find(c => c.id === choiceId);
        if (!choice) return;

        // Roll outcomes
        let roll = Math.random();
        let cumulativeProb = 0;
        let chosenOutcome = choice.outcomes[0];

        for (const outcome of choice.outcomes) {
          cumulativeProb += outcome.probability;
          if (roll <= cumulativeProb) {
            chosenOutcome = outcome;
            break;
          }
        }

        let updatedPlayer = { ...player };

        // Apply cash changes
        if (chosenOutcome.cashChange) {
          updatedPlayer = {
            ...updatedPlayer,
            finances: {
              ...updatedPlayer.finances,
              cash: updatedPlayer.finances.cash + chosenOutcome.cashChange,
            },
          };
        }

        // Apply stat changes
        if (chosenOutcome.statChanges) {
          const newStats = { ...updatedPlayer.stats };
          for (const [key, val] of Object.entries(chosenOutcome.statChanges)) {
            newStats[key as keyof typeof newStats] = Math.max(0, Math.min(100, (newStats[key as keyof typeof newStats] || 0) + (val as number)));
          }
          updatedPlayer = { ...updatedPlayer, stats: newStats };
        }

        // Apply skill changes
        if (chosenOutcome.skillChanges) {
          const newSkills = { ...updatedPlayer.skills };
          for (const [key, val] of Object.entries(chosenOutcome.skillChanges)) {
            newSkills[key as keyof typeof newSkills] = Math.max(0, Math.min(100, (newSkills[key as keyof typeof newSkills] || 0) + (val as number)));
          }
          updatedPlayer = { ...updatedPlayer, skills: newSkills };
        }

        // Apply biography
        if (chosenOutcome.addBiography) {
          updatedPlayer = {
            ...updatedPlayer,
            biographyEvents: [...updatedPlayer.biographyEvents, {
              date: time.totalDays,
              text: chosenOutcome.addBiography,
              type: (chosenOutcome.cashChange || 0) >= 0 ? 'good' as const : 'bad' as const,
            }],
          };
        }

        // Unlock mechanics
        if (chosenOutcome.unlockMechanic && !updatedPlayer.unlockedMechanics.includes(chosenOutcome.unlockMechanic)) {
          updatedPlayer = {
            ...updatedPlayer,
            unlockedMechanics: [...updatedPlayer.unlockedMechanics, chosenOutcome.unlockMechanic],
          };
        }

        set({
          player: updatedPlayer,
          events: {
            activeEvent: null,
            eventHistory: [...events.eventHistory, eventId],
            pendingEvents: events.pendingEvents.filter(id => id !== eventId),
          },
        });

        get().addNotification({
          type: (chosenOutcome.cashChange || 0) >= 0 ? 'info' : 'warning',
          title: 'Event Resolved',
          message: chosenOutcome.description,
          duration: 8000,
        });
      },

      dismissEvent: () => {
        set(s => ({ events: { ...s.events, activeEvent: null } }));
      },

      setScreen: (screen: GameScreen) => {
        set(s => ({ ui: { ...s.ui, currentScreen: screen } }));
      },

      selectStock: (ticker: string | null) => {
        set(s => ({ ui: { ...s.ui, selectedStock: ticker } }));
      },

      dismissNotification: (id: string) => {
        set(s => ({ notifications: s.notifications.filter(n => n.id !== id) }));
      },

      addNotification: (notification) => {
        const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newNotif: GameNotification = { ...notification, id, timestamp: Date.now(), isRead: false };
        set(s => ({ notifications: [newNotif, ...s.notifications.slice(0, 49)] }));

        // Auto-dismiss
        const duration = notification.duration || 4000;
        if (duration > 0) {
          setTimeout(() => {
            set(s => ({ notifications: s.notifications.filter(n => n.id !== id) }));
          }, duration);
        }
      },

      dismissYearEnd: () => {
        set({ yearEndSummary: null });
      },

      saveGame: () => {
        set({ saveDate: Date.now() });
        get().addNotification({ type: 'info', title: 'Game Saved', message: 'Your progress has been saved.' });
      },

      actOnInsiderTip: (tipId: string) => {
        const state = get();
        if (!state.player) return;
        const tip = state.insiderTips.find(t => t.id === tipId);
        if (!tip || tip.isActedOn || tip.isExpired || tip.isRevealed) {
          get().addNotification({ type: 'warning', title: 'Tip Unavailable', message: 'This tip is no longer actionable.' });
          return;
        }
        const updatedTips = state.insiderTips.map(t =>
          t.id === tipId ? { ...t, isActedOn: true } : t
        );
        // Risk calculation — countermeasures reduce exposure
        let riskBump = tip.investigationRiskBase * 0.15;
        let usedBurner = false;
        const sec = state.secStatus;
        if (sec.burnerUsesRemaining > 0) { riskBump *= 0.25; usedBurner = true; }
        else if (sec.hasShellCompany && sec.hasOffshoreAccount) { riskBump *= 0.35; }
        else if (sec.hasShellCompany) { riskBump *= 0.55; }
        else if (sec.hasOffshoreAccount) { riskBump *= 0.65; }
        const newSEC: SECStatus = {
          ...state.secStatus,
          tipsActedOn: state.secStatus.tipsActedOn + 1,
          investigationLevel: Math.min(90, state.secStatus.investigationLevel + riskBump),
          burnerUsesRemaining: usedBurner ? Math.max(0, (state.secStatus.burnerUsesRemaining || 0) - 1) : (state.secStatus.burnerUsesRemaining || 0),
        };
        set({ insiderTips: updatedTips, secStatus: newSEC });
        get().setScreen('trading');
        get().selectStock(tip.ticker);
        const countermeasureNote = usedBurner ? ' Burner identity used — very low trace risk.' :
          sec.hasShellCompany && sec.hasOffshoreAccount ? ' Shell + offshore active — minimal exposure.' :
          sec.hasShellCompany ? ' Shell company routing active.' :
          sec.hasOffshoreAccount ? ' Offshore account routing active.' : '';
        get().addNotification({
          type: 'warning',
          title: 'Tip Activated',
          message: `You're acting on inside information about ${tip.ticker}. Risk added: +${riskBump.toFixed(1)}.${countermeasureNote}`,
          duration: 8000,
        });
      },

      hireLawyer: () => {
        const state = get();
        if (!state.player) return;
        const cost = 25000;
        if (state.player.finances.cash < cost) {
          get().addNotification({ type: 'error', title: 'Insufficient Funds', message: `Hiring a securities lawyer costs $${cost.toLocaleString()}.` });
          return;
        }
        set({
          player: {
            ...state.player,
            finances: { ...state.player.finances, cash: state.player.finances.cash - cost },
          },
          secStatus: {
            ...state.secStatus,
            hasLawyer: true,
            lawyerDaysRemaining: 60,
            investigationLevel: Math.max(0, state.secStatus.investigationLevel - 15),
          },
        });
        get().addNotification({
          type: 'success',
          title: 'Lawyer Hired',
          message: 'Your securities attorney is on retainer for 60 days. SEC investigation risk reduced by 40%.',
          duration: 8000,
        });
      },

      destroyEvidence: () => {
        const state = get();
        if (!state.player) return;
        const cost = 15000;
        if (state.player.finances.cash < cost) {
          get().addNotification({ type: 'error', title: 'Insufficient Funds', message: `Evidence destruction costs $${cost.toLocaleString()} in "consulting fees."` });
          return;
        }
        const reduction = 10 + Math.random() * 20;
        set({
          player: {
            ...state.player,
            finances: { ...state.player.finances, cash: state.player.finances.cash - cost },
          },
          secStatus: {
            ...state.secStatus,
            investigationLevel: Math.max(0, state.secStatus.investigationLevel - reduction),
          },
        });
        get().addNotification({
          type: 'info',
          title: 'Evidence Cleared',
          message: `Trading records "cleaned up." Investigation level reduced by ${reduction.toFixed(0)} points.`,
          duration: 6000,
        });
      },

      openOffshoreAccount: () => {
        const state = get();
        if (!state.player) return;
        const cost = 75000;
        if (state.secStatus.hasOffshoreAccount) {
          get().addNotification({ type: 'info', title: 'Already Active', message: 'You already have an offshore account in the Cayman Islands.' }); return;
        }
        if (state.player.finances.cash < cost) {
          get().addNotification({ type: 'error', title: 'Insufficient Funds', message: `Offshore account setup requires $${cost.toLocaleString()}.` }); return;
        }
        set({
          player: { ...state.player, finances: { ...state.player.finances, cash: state.player.finances.cash - cost } },
          secStatus: { ...state.secStatus, hasOffshoreAccount: true, scrutinyMultiplier: Math.max(0.4, state.secStatus.scrutinyMultiplier - 0.5) },
        });
        get().addNotification({
          type: 'success', title: 'Offshore Account Opened',
          message: 'Cayman Islands account active. SEC scrutiny multiplier permanently reduced. Profits routed offshore remain harder to trace.',
          duration: 10000,
        });
      },

      formShellCompany: () => {
        const state = get();
        if (!state.player) return;
        const cost = 40000;
        if (state.secStatus.hasShellCompany) {
          get().addNotification({ type: 'info', title: 'Already Active', message: 'Your Delaware shell company is already operational.' }); return;
        }
        if (state.player.finances.cash < cost) {
          get().addNotification({ type: 'error', title: 'Insufficient Funds', message: `Shell company formation costs $${cost.toLocaleString()}.` }); return;
        }
        set({
          player: { ...state.player, finances: { ...state.player.finances, cash: state.player.finances.cash - cost } },
          secStatus: { ...state.secStatus, hasShellCompany: true, scrutinyMultiplier: Math.max(0.6, state.secStatus.scrutinyMultiplier - 0.3) },
        });
        get().addNotification({
          type: 'success', title: 'Shell Company Formed',
          message: '"Apex Horizon LLC" registered in Delaware. Trades routed through the entity are 30% less traceable to you personally.',
          duration: 10000,
        });
      },

      buyBurnerIdentity: () => {
        const state = get();
        if (!state.player) return;
        const cost = 20000;
        if (state.player.finances.cash < cost) {
          get().addNotification({ type: 'error', title: 'Insufficient Funds', message: `Burner identities cost $${cost.toLocaleString()} each.` }); return;
        }
        set({
          player: { ...state.player, finances: { ...state.player.finances, cash: state.player.finances.cash - cost } },
          secStatus: { ...state.secStatus, burnerUsesRemaining: (state.secStatus.burnerUsesRemaining || 0) + 3 },
        });
        get().addNotification({
          type: 'success', title: 'Burner Identities Acquired',
          message: '3 anonymous trading accounts loaded. When acting on a tip, you can execute trades through these with significantly reduced SEC exposure.',
          duration: 8000,
        });
      },

      tipOffContact: (tipId: string) => {
        const state = get();
        if (!state.player) return;
        const tip = state.insiderTips.find(t => t.id === tipId);
        if (!tip || tip.isExpired || tip.isRevealed) {
          get().addNotification({ type: 'warning', title: 'Tip Unavailable', message: 'This tip can no longer be shared.' }); return;
        }
        // Sharing the tip with a contact creates exposure but they'll cut you in
        const cutPercentage = 0.20; // 20% of their profits come back to you
        const updatedTips = state.insiderTips.map(t =>
          t.id === tipId ? { ...t, isActedOn: true } : t
        );
        // Increases contact exposure — more people know = more risk
        const newExposure = (state.secStatus.contactExposureCount || 0) + 1;
        const additionalRisk = newExposure * 5; // each additional contact multiplies exposure
        set({
          insiderTips: updatedTips,
          secStatus: {
            ...state.secStatus,
            tipsActedOn: state.secStatus.tipsActedOn + 1,
            contactExposureCount: newExposure,
            scrutinyMultiplier: Math.min(5, state.secStatus.scrutinyMultiplier + 0.2),
            investigationLevel: Math.min(90, state.secStatus.investigationLevel + additionalRisk),
          },
        });
        get().addNotification({
          type: 'warning', title: 'Tip Shared',
          message: `You tipped off a contact about ${tip.ticker}. They'll pay you 20% of their profits — but now ${newExposure} person${newExposure > 1 ? 's' : ''} know${newExposure === 1 ? 's' : ''} about this. Each one is a potential witness.`,
          duration: 10000,
        });
      },
    }),
    {
      name: 'stockgame-save',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        config: state.config,
        time: state.time,
        player: state.player,
        economy: state.economy,
        stocks: state.stocks,
        etfs: state.etfs,
        crypto: state.crypto,
        businesses: state.businesses,
        employees: state.employees,
        hedgeFund: state.hedgeFund,
        rivals: state.rivals,
        completedMilestones: state.completedMilestones,
        events: state.events,
        achievements: state.achievements,
        insiderTips: state.insiderTips,
        secStatus: state.secStatus,
        firedMarketShocks: state.firedMarketShocks,
        isNewGame: state.isNewGame,
        saveDate: state.saveDate,
        gameVersion: state.gameVersion,
      }),
    }
  )
);

function checkAchievements(player: Player, state: GameState, set: any, get: any) {
  const { achievements } = state;
  const netWorth = player.finances.totalNetWorth;
  const portfolioValue = player.portfolio.totalValue;

  const checks: Array<[string, boolean]> = [
    ['first_thousand', player.finances.cash >= 1000],
    ['ten_thousand', netWorth >= 10000],
    ['hundred_thousand', netWorth >= 100000],
    ['quarter_million', netWorth >= 250000],
    ['half_million', netWorth >= 500000],
    ['millionaire', netWorth >= 1000000],
    ['ten_million', netWorth >= 10000000],
    ['hundred_million', netWorth >= 100000000],
    ['billionaire', netWorth >= 1000000000],
    ['first_trade', player.portfolio.tradeHistory.length >= 1],
    ['first_job', player.currentJob !== null],
    ['pay_off_debt', player.finances.totalDebt <= 0 && player.biographyEvents.length > 2],
  ];

  const newAchievements = { ...achievements };
  let earned = false;

  for (const [id, condition] of checks) {
    if (condition && newAchievements[id] && !newAchievements[id].dateEarned) {
      newAchievements[id] = { ...newAchievements[id], dateEarned: state.time.totalDays };
      earned = true;
      get().addNotification({
        type: 'achievement',
        title: `Achievement Unlocked! ${newAchievements[id].icon}`,
        message: newAchievements[id].title + ': ' + newAchievements[id].description,
        duration: 7000,
      });
    }
  }

  if (earned) {
    set({ achievements: newAchievements });
  }
}
