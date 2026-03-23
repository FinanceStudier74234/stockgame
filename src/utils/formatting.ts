export function formatCurrency(amount: number, compact = false): string {
  if (compact) {
    if (Math.abs(amount) >= 1_000_000_000) {
      return `$${(amount / 1_000_000_000).toFixed(2)}B`;
    }
    if (Math.abs(amount) >= 1_000_000) {
      return `$${(amount / 1_000_000).toFixed(2)}M`;
    }
    if (Math.abs(amount) >= 1_000) {
      return `$${(amount / 1_000).toFixed(1)}K`;
    }
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: amount < 10 && amount > -10 ? 2 : 0,
    maximumFractionDigits: amount < 10 && amount > -10 ? 4 : 0,
  }).format(amount);
}

export function formatPercent(value: number, decimals = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number, compact = false): string {
  if (compact) {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatDate(gameDay: number): string {
  // Each game day = 1 real day, starting from Jan 1, Year 1
  const startYear = 2015;
  const totalDays = gameDay;
  const year = startYear + Math.floor(totalDays / 365);
  const dayOfYear = totalDays % 365;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let month = 0;
  let day = dayOfYear;
  for (let i = 0; i < 12; i++) {
    if (day < daysPerMonth[i]) {
      month = i;
      break;
    }
    day -= daysPerMonth[i];
  }
  return `${months[month]} ${day + 1}, ${year}`;
}

export function formatTimeAgo(totalDays: number, currentDay: number): string {
  const diff = currentDay - totalDays;
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  if (diff < 365) return `${Math.floor(diff / 30)}mo ago`;
  return `${Math.floor(diff / 365)}y ago`;
}

export function getPnLColor(value: number): string {
  if (value > 0) return 'text-accent-green';
  if (value < 0) return 'text-accent-red';
  return 'text-gray-400';
}

export function getPnLBg(value: number): string {
  if (value > 0) return 'bg-accent-green/10 text-accent-green';
  if (value < 0) return 'bg-accent-red/10 text-accent-red';
  return 'bg-gray-700/50 text-gray-400';
}

export function getTierLabel(netWorth: number): { label: string; color: string } {
  if (netWorth < 0) return { label: 'In Debt', color: 'text-accent-red' };
  if (netWorth < 10000) return { label: 'Struggling', color: 'text-gray-400' };
  if (netWorth < 100000) return { label: 'Getting There', color: 'text-accent-yellow' };
  if (netWorth < 1000000) return { label: 'Comfortable', color: 'text-accent-blue' };
  if (netWorth < 10000000) return { label: 'Wealthy', color: 'text-accent-purple' };
  if (netWorth < 100000000) return { label: 'Rich', color: 'text-gold' };
  if (netWorth < 1000000000) return { label: 'Ultra-High Net Worth', color: 'text-gold' };
  return { label: 'BILLIONAIRE', color: 'text-gold' };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
