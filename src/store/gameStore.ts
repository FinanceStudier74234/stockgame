import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  GameState, GameScreen, Player, Stock, Business, Employee, HedgeFund,
  GameNotification, Portfolio, Job, DebtItem, AssetType, HousingLevel
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
import { getArchetypeById } from '../data/archetypes';
import { getJobById, getAvailableJobs } from '../data/jobs';
import { getRandomEvents } from '../data/events';
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

  // Business
  startBusiness: (templateId: string) => void;
  upgradeBusiness: (businessId: string) => void;

  // Fund
  launchHedgeFund: (name: string, strategy: string, initialCapital: number) => void;

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

        // Business revenue (monthly)
        if (totalDays % 30 === 0) {
          let businessIncome = 0;
          const updatedBusinesses = { ...state.businesses };
          for (const [id, biz] of Object.entries(updatedBusinesses)) {
            if (biz.isActive) {
              const profit = biz.monthlyRevenue - biz.monthlyExpenses;
              businessIncome += profit;
              updatedBusinesses[id] = {
                ...biz,
                totalRevenue: biz.totalRevenue + biz.monthlyRevenue,
                totalProfit: biz.totalProfit + profit,
                monthlyRevenue: biz.monthlyRevenue * (1 + (Math.random() * 0.04 - 0.01)),
              };
            }
          }
          if (businessIncome > 0) {
            updatedPlayer = {
              ...updatedPlayer,
              finances: {
                ...updatedPlayer.finances,
                cash: updatedPlayer.finances.cash + businessIncome,
              },
            };
            get().addNotification({
              type: 'success',
              title: 'Business Revenue',
              message: `Your businesses generated $${businessIncome.toFixed(0)} this month.`,
            });
          }
          set({ businesses: updatedBusinesses });
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

        // Check achievements
        checkAchievements(updatedPlayer, state, set, get);

        set({
          time: newTime,
          economy: newEconomy,
          stocks: newStocks,
          etfs: newEtfs,
          crypto: newCrypto,
          player: updatedPlayer,
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

      startBusiness: (templateId: string) => {
        const { player } = get();
        if (!player) return;
        // TODO: Full business creation from template
        get().addNotification({ type: 'success', title: 'Business Started!', message: `Your new business is now active.` });
      },

      upgradeBusiness: (businessId: string) => {
        // TODO: Upgrade logic
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
