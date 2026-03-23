import { Player, Job, PlayerStats, PlayerSkills, DebtItem, HousingLevel, LifestyleTier } from '../types';
import { clamp } from '../utils/math';
import { Archetype } from '../data/archetypes';
import { createInitialPortfolio } from './portfolioEngine';

export function createPlayerFromArchetype(archetype: Archetype, playerName: string): Player {
  return {
    id: `player_${Date.now()}`,
    name: playerName,
    age: archetype.age,
    background: archetype.description,
    archetype: archetype.id,
    city: archetype.startingCity,
    lifestyleTier: archetype.lifestyleTier,
    housingLevel: archetype.housingLevel,
    stats: { ...archetype.startingStats },
    skills: { ...archetype.startingSkills },
    finances: {
      cash: archetype.startingFinances.cash || 1000,
      totalNetWorth: (archetype.startingFinances.cash || 1000) - (archetype.startingFinances.totalDebt || 0),
      totalDebt: archetype.startingFinances.totalDebt || 0,
      creditScore: archetype.startingFinances.creditScore || 600,
      monthlyIncome: 0,
      monthlyExpenses: archetype.startingFinances.monthlyExpenses || 1200,
      monthlyDebtPayments: 0,
      savedThisMonth: 0,
      lifetimeEarnings: 0,
      lifetimeLosses: 0,
    },
    currentJob: null,
    currentSideHustle: null,
    ownedBusinesses: [],
    portfolio: createInitialPortfolio(),
    debtItems: archetype.startingDebt.map((d, i) => ({
      id: `debt_${i}`,
      type: d.type as any,
      name: d.name,
      principal: d.amount,
      currentBalance: d.amount,
      interestRate: d.interestRate,
      minimumPayment: d.amount * 0.02,
      monthlyPayment: d.amount * 0.025,
      startDate: 0,
      isMarginLoan: false,
    })),
    achievements: [],
    unlockedMechanics: [...archetype.startingUnlocks],
    milestones: [],
    biographyEvents: [
      {
        date: 0,
        text: `Started with the "${archetype.name}" background in ${archetype.startingCity}.`,
        type: 'neutral',
      },
    ],
    lastActionDate: 0,
    experiencePoints: 0,
    level: 1,
  };
}

export function applyJobWork(player: Player, job: Job): Player {
  const newStats = { ...player.stats };
  const newSkills = { ...player.skills };

  // Apply skill gains
  for (const [skill, gain] of Object.entries(job.skillGains)) {
    newSkills[skill as keyof PlayerSkills] = clamp(
      (newSkills[skill as keyof PlayerSkills] || 0) + (gain as number),
      0,
      100
    );
  }

  // Apply stat gains
  for (const [stat, gain] of Object.entries(job.statGains)) {
    newStats[stat as keyof PlayerStats] = clamp(
      (newStats[stat as keyof PlayerStats] || 0) + (gain as number),
      0,
      100
    );
  }

  // Energy and stress
  newStats.energy = clamp(newStats.energy - job.energyCostPerDay, 0, 100);
  newStats.stress = clamp(newStats.stress + job.stressPerDay * 0.3, 0, 100);

  // Rest recovery
  if (newStats.energy < 20) {
    newStats.stress = clamp(newStats.stress + 5, 0, 100);
  }

  const newXP = player.experiencePoints + job.experiencePerDay;
  const newLevel = calculateLevel(newXP);

  return {
    ...player,
    stats: newStats,
    skills: newSkills,
    experiencePoints: newXP,
    level: newLevel,
    finances: {
      ...player.finances,
      cash: player.finances.cash + job.dailyWage,
      monthlyIncome: job.salary / 12,
      lifetimeEarnings: player.finances.lifetimeEarnings + job.dailyWage,
    },
  };
}

export function applyRest(player: Player): Player {
  const newStats = { ...player.stats };
  newStats.energy = clamp(newStats.energy + 30, 0, 100);
  newStats.stress = clamp(newStats.stress - 15, 0, 100);
  newStats.health = clamp(newStats.health + 2, 0, 100);
  return { ...player, stats: newStats };
}

export function applyStudy(player: Player, skillId: keyof PlayerSkills, hoursStudied: number): Player {
  const newSkills = { ...player.skills };
  const newStats = { ...player.stats };
  const gain = hoursStudied * 0.5 * (player.stats.intelligence / 100) * (player.stats.discipline / 100 + 0.5);
  newSkills[skillId] = clamp((newSkills[skillId] || 0) + gain, 0, 100);
  newStats.energy = clamp(newStats.energy - hoursStudied * 5, 0, 100);
  newStats.stress = clamp(newStats.stress + hoursStudied * 2, 0, 100);
  const newXP = player.experiencePoints + hoursStudied * 3;
  return { ...player, skills: newSkills, stats: newStats, experiencePoints: newXP, level: calculateLevel(newXP) };
}

export function applyExercise(player: Player): Player {
  const newStats = { ...player.stats };
  newStats.health = clamp(newStats.health + 5, 0, 100);
  newStats.energy = clamp(newStats.energy - 15 + 5, 0, 100); // costs energy but restores some
  newStats.stress = clamp(newStats.stress - 10, 0, 100);
  newStats.discipline = clamp(newStats.discipline + 0.1, 0, 100);
  newStats.confidence = clamp(newStats.confidence + 0.2, 0, 100);
  return { ...player, stats: newStats };
}

export function applyNetworking(player: Player): Player {
  const newStats = { ...player.stats };
  const newSkills = { ...player.skills };
  newStats.network = clamp(newStats.network + 1 + player.stats.charisma / 50, 0, 100);
  newStats.energy = clamp(newStats.energy - 10, 0, 100);
  newStats.stress = clamp(newStats.stress + 5, 0, 100);
  newSkills.networking = clamp((newSkills.networking || 0) + 0.5, 0, 100);
  return { ...player, stats: newStats, skills: newSkills };
}

export function applyMonthlyExpenses(player: Player): Player {
  const housing = getHousingCost(player.housingLevel);
  const debtPayments = player.debtItems.reduce((sum, d) => sum + d.monthlyPayment, 0);
  const totalExpenses = housing + debtPayments + (player.finances.monthlyExpenses - housing);
  const newCash = player.finances.cash - totalExpenses;
  const savedThisMonth = newCash - (player.finances.cash - totalExpenses + totalExpenses);

  return {
    ...player,
    finances: {
      ...player.finances,
      cash: newCash,
      totalDebt: player.debtItems.reduce((sum, d) => sum + d.currentBalance, 0),
      monthlyExpenses: totalExpenses,
      monthlyDebtPayments: debtPayments,
      savedThisMonth,
    },
  };
}

export function processDebtInterest(player: Player): Player {
  const updatedDebts = player.debtItems.map(debt => {
    const dailyRate = debt.interestRate / 365;
    const newBalance = debt.currentBalance * (1 + dailyRate);
    return { ...debt, currentBalance: newBalance };
  });
  const totalDebt = updatedDebts.reduce((sum, d) => sum + d.currentBalance, 0);
  return {
    ...player,
    debtItems: updatedDebts,
    finances: { ...player.finances, totalDebt },
  };
}

export function calculateNetWorth(player: Player, portfolioValue: number): number {
  return player.finances.cash + portfolioValue - player.finances.totalDebt;
}

export function updateNetWorth(player: Player, portfolioValue: number): Player {
  const netWorth = calculateNetWorth(player, portfolioValue);
  const lifestyle = getLifestyleTier(netWorth);
  return {
    ...player,
    finances: { ...player.finances, totalNetWorth: netWorth },
    lifestyleTier: lifestyle,
  };
}

export function calculateLevel(xp: number): number {
  // Level formula: each level requires more XP
  // Level 1: 0, Level 2: 100, Level 3: 250, Level 4: 500...
  let level = 1;
  let threshold = 100;
  let accumulated = 0;
  while (xp >= accumulated + threshold && level < 50) {
    accumulated += threshold;
    threshold = Math.floor(threshold * 1.5);
    level++;
  }
  return level;
}

export function getXpForNextLevel(level: number): number {
  let threshold = 100;
  for (let i = 1; i < level; i++) {
    threshold = Math.floor(threshold * 1.5);
  }
  return threshold;
}

export function getHousingCost(level: HousingLevel): number {
  const costs: Record<HousingLevel, number> = {
    homeless: 0,
    shelter: 200,
    cheap_room: 450,
    studio: 750,
    apartment: 1100,
    nice_apartment: 1600,
    condo: 2200,
    house: 2800,
    luxury_condo: 5000,
    mansion: 12000,
    compound: 30000,
  };
  return costs[level] || 0;
}

export function getLifestyleTier(netWorth: number): LifestyleTier {
  if (netWorth < 0) return 'poverty';
  if (netWorth < 10000) return 'struggling';
  if (netWorth < 100000) return 'modest';
  if (netWorth < 1000000) return 'comfortable';
  if (netWorth < 10000000) return 'wealthy';
  if (netWorth < 1000000000) return 'elite';
  return 'billionaire';
}

export function canAffordHousing(player: Player, level: HousingLevel): boolean {
  const cost = getHousingCost(level);
  return player.finances.monthlyIncome > cost * 1.5 || player.finances.cash > cost * 12;
}

export function upgradeHousing(player: Player, level: HousingLevel): Player {
  return { ...player, housingLevel: level };
}

export function addDebt(player: Player, debt: DebtItem): Player {
  return {
    ...player,
    debtItems: [...player.debtItems, debt],
    finances: {
      ...player.finances,
      cash: player.finances.cash + debt.principal,
      totalDebt: player.finances.totalDebt + debt.principal,
      creditScore: Math.max(player.finances.creditScore - 15, 300),
    },
  };
}

export function payDebt(player: Player, debtId: string, amount: number): Player {
  const updatedDebts = player.debtItems.map(d => {
    if (d.id !== debtId) return d;
    const newBalance = Math.max(d.currentBalance - amount, 0);
    return { ...d, currentBalance: newBalance };
  }).filter(d => d.currentBalance > 0);

  const totalDebt = updatedDebts.reduce((sum, d) => sum + d.currentBalance, 0);
  const creditBoost = amount > 500 ? 2 : 0;

  return {
    ...player,
    debtItems: updatedDebts,
    finances: {
      ...player.finances,
      cash: player.finances.cash - amount,
      totalDebt,
      creditScore: clamp(player.finances.creditScore + creditBoost, 300, 850),
    },
  };
}
