import { Employee, EmployeeRole } from '../types';

export interface EmployeeCandidate {
  id: string;
  name: string;
  role: EmployeeRole;
  salary: number;
  description: string;
  skills: Record<string, number>;
  productivity: number;
  specialAbility?: string;
  cultureFit: number;
  minLeadership?: number;   // player leadership skill needed to hire
  minReputation?: number;   // player reputation needed
  tier: 'junior' | 'mid' | 'senior' | 'elite';
}

export const EMPLOYEE_POOL: EmployeeCandidate[] = [
  // JUNIOR TIER
  {
    id: 'emp_01',
    name: 'Jordan Lee',
    role: 'assistant',
    salary: 45000,
    description: 'Recent grad. Eager to learn, fast worker, no experience.',
    skills: { finance: 8, operations: 5, networking: 3 },
    productivity: 55,
    cultureFit: 75,
    tier: 'junior',
  },
  {
    id: 'emp_02',
    name: 'Priya Kapoor',
    role: 'junior_analyst',
    salary: 65000,
    description: 'Finance degree from a solid school. Strong modeler.',
    skills: { finance: 20, accounting: 18, valuation: 10 },
    productivity: 65,
    cultureFit: 80,
    tier: 'junior',
  },
  {
    id: 'emp_03',
    name: 'Marcus Webb',
    role: 'junior_analyst',
    salary: 60000,
    description: 'Self-taught investor. Passionate but unpolished.',
    skills: { finance: 15, chartAnalysis: 20, tradingPsychology: 12 },
    productivity: 60,
    cultureFit: 65,
    tier: 'junior',
    specialAbility: 'Lucky Picks: 5% chance of surfacing an exceptional trade idea.',
  },
  {
    id: 'emp_04',
    name: 'Aisha Torres',
    role: 'recruiter',
    salary: 55000,
    description: 'HR specialist. Helps find better candidates faster.',
    skills: { networking: 25, sales: 15 },
    productivity: 70,
    cultureFit: 85,
    tier: 'junior',
    specialAbility: 'Expand Talent Pool: Unlocks 3 additional candidates.',
  },

  // MID TIER
  {
    id: 'emp_05',
    name: 'Daniel Chen',
    role: 'analyst',
    salary: 90000,
    description: 'Ex-bulge bracket analyst. Deep fundamental analysis skills.',
    skills: { finance: 40, valuation: 35, accounting: 30, macroAnalysis: 20 },
    productivity: 75,
    cultureFit: 70,
    minLeadership: 15,
    tier: 'mid',
  },
  {
    id: 'emp_06',
    name: 'Sofia Martinez',
    role: 'trader',
    salary: 85000,
    description: 'Prop trader background. Excellent execution and risk management.',
    skills: { chartAnalysis: 40, tradingPsychology: 38, options: 25 },
    productivity: 80,
    cultureFit: 72,
    minLeadership: 15,
    tier: 'mid',
    specialAbility: 'Sharp Execution: Fund trading costs reduced by 15%.',
  },
  {
    id: 'emp_07',
    name: 'Kevin Park',
    role: 'software_developer',
    salary: 110000,
    description: 'Full-stack dev. Builds internal tools, dashboards, and automation.',
    skills: { coding: 45, quantResearch: 15, operations: 20 },
    productivity: 78,
    cultureFit: 65,
    minLeadership: 10,
    tier: 'mid',
    specialAbility: 'Tech Edge: Unlocks automation tools mechanic.',
  },
  {
    id: 'emp_08',
    name: 'Rachel Kim',
    role: 'compliance_officer',
    salary: 95000,
    description: 'Former SEC. Keeps your fund legally compliant.',
    skills: { accounting: 30, operations: 25 },
    productivity: 72,
    cultureFit: 68,
    minLeadership: 15,
    tier: 'mid',
    specialAbility: 'Compliance Shield: Reduces regulatory pressure on fund by 20%.',
  },
  {
    id: 'emp_09',
    name: 'Omar Hassan',
    role: 'investor_relations',
    salary: 80000,
    description: 'Former banker. Excellent LP relationship management.',
    skills: { sales: 35, networking: 40, negotiation: 30 },
    productivity: 73,
    cultureFit: 78,
    minReputation: 25,
    tier: 'mid',
    specialAbility: 'LP Magnet: Monthly chance to attract new LP investors.',
  },
  {
    id: 'emp_10',
    name: 'Lena Volkova',
    role: 'macro_researcher',
    salary: 100000,
    description: 'PhD economist. Deep macro and geopolitical analysis.',
    skills: { macroAnalysis: 50, economics: 45, finance: 30 },
    productivity: 76,
    cultureFit: 62,
    minLeadership: 20,
    tier: 'mid',
    specialAbility: 'Macro Edge: Economy phase transitions trigger 2 days earlier.',
  },

  // SENIOR TIER
  {
    id: 'emp_11',
    name: 'William Foster',
    role: 'senior_analyst',
    salary: 160000,
    description: 'CFA charterholder. 12 years at top-tier funds. Portfolio construction expert.',
    skills: { finance: 65, valuation: 60, macroAnalysis: 45, accounting: 50 },
    productivity: 88,
    cultureFit: 75,
    minLeadership: 30,
    minReputation: 40,
    tier: 'senior',
    specialAbility: 'Alpha Generator: Boosts fund Sharpe ratio by 0.15.',
  },
  {
    id: 'emp_12',
    name: 'Jessica Huang',
    role: 'quant_engineer',
    salary: 200000,
    description: 'MIT PhD. Builds systematic trading models. Exceptional quant talent.',
    skills: { quantResearch: 70, coding: 65, chartAnalysis: 45 },
    productivity: 90,
    cultureFit: 60,
    minLeadership: 25,
    minReputation: 35,
    tier: 'senior',
    specialAbility: 'Quant Engine: Unlocks quant_trading mechanic, boosts all returns 5%.',
  },
  {
    id: 'emp_13',
    name: 'Andre Laurent',
    role: 'senior_trader',
    salary: 175000,
    description: 'Former Goldman flow trader. Executes size without moving the market.',
    skills: { chartAnalysis: 60, tradingPsychology: 65, options: 55 },
    productivity: 85,
    cultureFit: 70,
    minLeadership: 30,
    minReputation: 45,
    tier: 'senior',
    specialAbility: 'Market Maker: Adds $2M virtual liquidity to fund position sizing.',
  },
  {
    id: 'emp_14',
    name: 'Natalie Ross',
    role: 'sales_head',
    salary: 145000,
    description: 'Built a $500M institutional client base. LP fundraising expert.',
    skills: { sales: 65, networking: 70, negotiation: 60 },
    productivity: 83,
    cultureFit: 78,
    minReputation: 50,
    tier: 'senior',
    specialAbility: 'Deal Closer: LP minimum investment threshold reduced 30%. Monthly LP events.',
  },

  // ELITE TIER
  {
    id: 'emp_15',
    name: 'Thomas Blackwell',
    role: 'coo',
    salary: 300000,
    description: 'Ran operations for a $5B fund. Handles everything so you can focus on alpha.',
    skills: { operations: 80, leadership: 70, finance: 55 },
    productivity: 92,
    cultureFit: 80,
    minLeadership: 50,
    minReputation: 60,
    tier: 'elite',
    specialAbility: 'Operational Excellence: Reduces all costs by 15%. Enables fund to scale AUM 2x faster.',
  },
  {
    id: 'emp_16',
    name: 'Christine Yao',
    role: 'portfolio_manager',
    salary: 350000,
    description: 'Co-PM at a top-10 hedge fund. Will run a sleeve of the portfolio independently.',
    skills: { finance: 80, valuation: 75, macroAnalysis: 65, tradingPsychology: 70 },
    productivity: 95,
    cultureFit: 82,
    minLeadership: 60,
    minReputation: 70,
    tier: 'elite',
    specialAbility: 'Independent Sleeve: Generates +3% alpha contribution monthly.',
  },
  {
    id: 'emp_17',
    name: 'Raj Mehta',
    role: 'cfo',
    salary: 280000,
    description: 'CFO experience at 3 public companies. Manages fund accounting and investor reporting.',
    skills: { accounting: 80, finance: 70, operations: 65 },
    productivity: 90,
    cultureFit: 75,
    minLeadership: 45,
    minReputation: 55,
    tier: 'elite',
    specialAbility: 'Financial Fortress: Enables complex fee structures. Cuts LP redemption risk by 25%.',
  },
];

export const ROLE_LABELS: Record<EmployeeRole, string> = {
  assistant: 'Executive Assistant',
  junior_analyst: 'Junior Analyst',
  analyst: 'Analyst',
  senior_analyst: 'Senior Analyst',
  trader: 'Trader',
  senior_trader: 'Senior Trader',
  macro_researcher: 'Macro Researcher',
  quant_engineer: 'Quant Engineer',
  software_developer: 'Software Developer',
  coo: 'Chief Operating Officer',
  cfo: 'Chief Financial Officer',
  sales_head: 'Head of Sales & IR',
  investor_relations: 'Investor Relations',
  compliance_officer: 'Compliance Officer',
  portfolio_manager: 'Portfolio Manager',
  recruiter: 'Talent Recruiter',
  marketing_head: 'Marketing Director',
};

export const ROLE_COLORS: Partial<Record<EmployeeRole, string>> = {
  assistant: 'text-gray-400',
  junior_analyst: 'text-accent-blue',
  analyst: 'text-accent-blue',
  senior_analyst: 'text-accent-purple',
  trader: 'text-accent-green',
  senior_trader: 'text-accent-green',
  macro_researcher: 'text-accent-yellow',
  quant_engineer: 'text-accent-cyan',
  software_developer: 'text-accent-cyan',
  coo: 'text-gold',
  cfo: 'text-gold',
  sales_head: 'text-accent-orange',
  investor_relations: 'text-accent-orange',
  compliance_officer: 'text-gray-300',
  portfolio_manager: 'text-gold',
  recruiter: 'text-accent-purple',
  marketing_head: 'text-accent-orange',
};

export function getAvailableCandidates(
  playerLeadership: number,
  playerReputation: number,
  hiredIds: string[]
): EmployeeCandidate[] {
  return EMPLOYEE_POOL.filter(emp => {
    if (hiredIds.includes(emp.id)) return false;
    if (emp.minLeadership && playerLeadership < emp.minLeadership) return false;
    if (emp.minReputation && playerReputation < emp.minReputation) return false;
    return true;
  });
}

export function createEmployeeFromCandidate(candidate: EmployeeCandidate, hiredDate: number): Employee {
  return {
    id: candidate.id,
    name: candidate.name,
    role: candidate.role,
    salary: candidate.salary,
    skills: candidate.skills as any,
    productivity: candidate.productivity,
    loyalty: 70,
    stress: 20,
    morale: 75,
    cultureFit: candidate.cultureFit,
    reputationImpact: candidate.tier === 'elite' ? 10 : candidate.tier === 'senior' ? 5 : 2,
    hiredDate,
    performanceHistory: [],
    specialAbility: candidate.specialAbility,
    isAtRisk: false,
  };
}

// Calculate total monthly payroll
export function calculateMonthlyPayroll(employees: Record<string, Employee>): number {
  return Object.values(employees).reduce((sum, emp) => sum + emp.salary / 12, 0);
}

// Calculate team productivity bonus to fund performance
export function calculateTeamBonus(employees: Record<string, Employee>): number {
  const list = Object.values(employees);
  if (list.length === 0) return 0;
  const avgProductivity = list.reduce((s, e) => s + e.productivity, 0) / list.length;
  // Each 10 points of avg productivity above 50 = 0.1% monthly return bonus
  return Math.max(0, (avgProductivity - 50) / 10 * 0.001);
}
