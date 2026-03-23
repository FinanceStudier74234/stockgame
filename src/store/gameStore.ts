import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  GameState, GameScreen, Player, Stock, Business, Employee, HedgeFund, LimitedPartner,
  GameNotification, Portfolio, Job, DebtItem, AssetType, HousingLevel, OptionContract
} from '../types';
import { createInitialStocks, createInitialETFs, createInitialCrypto } from '../data/stocks';
import { createInitialEconomy, updateEconomy } from '../engine/economyEngine';
import { updateAllStocks, updateAllCrypto } from '../engine/marketEngine';
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

  // Events
  resolveEvent: (eventId: string, choiceId: string) => void;
  dismissEvent: () => void;

  // UI
  setScreen: (screen: GameScreen) => void;
  selectStock: (ticker: string | null) => void;
  dismissNotification: (id: string) => void;
  addNotification: (notification: Omit<GameNotification, 'id' | 'timestamp' | 'isRead'>) => void;

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
  achievements: createAchievementsMap(),
  notifications: [],
  ui: { currentScreen: 'dashboard', selectedStock: null, isMenuOpen: false, isPaused: false, tutorialStep: 0 },
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
        const newEconomy = totalDays % 3 === 0 ? updateEconomy(state.economy) : state.economy;

        // Update markets
        const newStocks = updateAllStocks(state.stocks, newEconomy);
        const newCrypto = updateAllCrypto(state.crypto, newEconomy);

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

        // Aging: every 365 days
        if (totalDays % 365 === 0) {
          updatedPlayer = { ...updatedPlayer, age: updatedPlayer.age + 1 };
          get().addNotification({
            type: 'info',
            title: 'Birthday!',
            message: `You are now ${updatedPlayer.age} years old. Time flies.`,
          });
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
          // Calculate month's portfolio return
          const portfolioReturn = updatedPlayer.portfolio.dayChangePercent / 100;
          const teamBonus = calculateTeamBonus(state.employees);
          const strategyBonus = newHedgeFund.strategy === 'quant' ? 0.002 : 0;
          const monthlyReturn = portfolioReturn + teamBonus + strategyBonus;

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

          // LP satisfaction changes
          const updatedLPs = newHedgeFund.limitedPartners.map(lp => ({
            ...lp,
            satisfactionLevel: Math.min(100, Math.max(0,
              lp.satisfactionLevel + (monthlyReturn > 0.01 ? 5 : monthlyReturn < -0.05 ? -10 : 1)
            )),
            isRedemptionPending: lp.satisfactionLevel < 30 && (totalDays - lp.entryDate) / 30 > lp.lockupPeriod,
          }));

          // Random new LP events (if IR employee exists)
          const hasIR = Object.values(state.employees).some(e => e.role === 'investor_relations' || e.role === 'sales_head');
          const chanceNewLP = hasIR ? 0.25 : 0.08;
          if (Math.random() < chanceNewLP && newHedgeFund.reputation > 40) {
            const lpTypes: LimitedPartner['type'][] = ['individual', 'institution', 'pension', 'family_office'];
            const randomType = lpTypes[Math.floor(Math.random() * lpTypes.length)];
            const lpNames = ['Atlas Capital', 'Meridian Endowment', 'Riverside Family Office', 'Pacific Pension Fund', 'Summit Ventures', 'Zenith Partners'];
            const randomName = lpNames[Math.floor(Math.random() * lpNames.length)];
            const lpAmount = randomType === 'institution' ? 500000 + Math.random() * 2000000 :
              randomType === 'pension' ? 1000000 + Math.random() * 5000000 :
              100000 + Math.random() * 500000;

            const newLP: LimitedPartner = {
              id: `lp_auto_${Date.now()}`,
              name: randomName,
              type: randomType,
              investedAmount: lpAmount,
              entryDate: totalDays,
              satisfactionLevel: 70,
              redemptionThreshold: 20,
              lockupPeriod: 12,
              isRedemptionPending: false,
            };
            updatedLPs.push(newLP);
            get().addNotification({
              type: 'success',
              title: 'New LP Approaching!',
              message: `${randomName} wants to invest $${(lpAmount / 1000).toFixed(0)}K in your fund.`,
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
            (updatedPlayer.finances.monthlyExpenses * 0.4); // other living expenses
          updatedPlayer = {
            ...updatedPlayer,
            finances: {
              ...updatedPlayer.finances,
              cash: updatedPlayer.finances.cash - totalMonthlyExpenses,
            },
          };

          if (updatedPlayer.finances.cash < 0) {
            get().addNotification({
              type: 'warning',
              title: 'Negative Cash!',
              message: 'You\'ve run out of money! Find income fast or you may need to take on debt.',
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

        set({
          time: newTime,
          economy: newEconomy,
          stocks: newStocks,
          etfs: newEtfs,
          crypto: newCrypto,
          player: updatedPlayer,
          rivals: updatedRivals,
          completedMilestones: updatedCompletedMilestones,
        });
      },

      advanceWeek: () => {
        for (let i = 0; i < 7; i++) {
          get().advanceDay();
        }
      },

      doWork: () => {
        const { player } = get();
        if (!player || !player.currentJob) {
          get().addNotification({ type: 'warning', title: 'No Job', message: 'You don\'t have a job! Apply for one first.' });
          return;
        }
        if (player.stats.energy < 10) {
          get().addNotification({ type: 'warning', title: 'Too Tired', message: 'You\'re exhausted! Rest first.' });
          return;
        }
        const updatedPlayer = applyJobWork(player, player.currentJob);
        set({ player: updatedPlayer });
        get().advanceDay();
        get().addNotification({
          type: 'success',
          title: 'Work Done',
          message: `Earned $${player.currentJob.dailyWage.toFixed(2)} today. +${player.currentJob.experiencePerDay} XP`,
        });
      },

      doRest: () => {
        const { player } = get();
        if (!player) return;
        const updatedPlayer = applyRest(player);
        set({ player: updatedPlayer });
        get().advanceDay();
        get().addNotification({ type: 'info', title: 'Rested', message: 'Energy restored. +30 Energy, -15 Stress' });
      },

      doStudy: (skillId: string) => {
        const { player } = get();
        if (!player) return;
        if (player.stats.energy < 15) {
          get().addNotification({ type: 'warning', title: 'Too Tired', message: 'Rest before studying.' });
          return;
        }
        const updatedPlayer = applyStudy(player, skillId as any, 4);
        set({ player: updatedPlayer });
        get().advanceDay();
        const gain = (updatedPlayer.skills[skillId as keyof typeof updatedPlayer.skills] || 0) -
          (player.skills[skillId as keyof typeof player.skills] || 0);
        get().addNotification({ type: 'info', title: 'Studied', message: `${skillId} improved by +${gain.toFixed(1)}` });
      },

      doExercise: () => {
        const { player } = get();
        if (!player) return;
        const updatedPlayer = applyExercise(player);
        set({ player: updatedPlayer });
        get().advanceDay();
        get().addNotification({ type: 'info', title: 'Exercised', message: '+5 Health, -10 Stress, +0.2 Confidence' });
      },

      doNetwork: () => {
        const { player } = get();
        if (!player) return;
        if (player.stats.energy < 10) {
          get().addNotification({ type: 'warning', title: 'Too Tired', message: 'Rest before networking.' });
          return;
        }
        const updatedPlayer = applyNetworking(player);
        set({ player: updatedPlayer });
        get().advanceDay();
        get().addNotification({ type: 'info', title: 'Networked', message: '+1 Network, +0.5 Networking skill' });
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

      saveGame: () => {
        set({ saveDate: Date.now() });
        get().addNotification({ type: 'info', title: 'Game Saved', message: 'Your progress has been saved.' });
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
