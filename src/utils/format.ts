import { AVAILABLE_CURRENCIES } from '../types/models';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const SHORT_MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function getCurrencySymbol(code: string): string {
  const found = AVAILABLE_CURRENCIES.find((c) => c.code === code);
  return found?.symbol ?? '$';
}

export function formatCurrency(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat(currencyCode === 'IDR' ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: currencyCode === 'JPY' || currencyCode === 'IDR' ? 0 : 2,
      maximumFractionDigits: currencyCode === 'JPY' || currencyCode === 'IDR' ? 0 : 2,
    }).format(amount);
  } catch {
    const symbol = getCurrencySymbol(currencyCode);
    const sign = amount < 0 ? '-' : '';
    return `${sign}${symbol}${Math.abs(amount).toFixed(2)}`;
  }
}

export function getMonthName(month: number): string {
  return MONTH_NAMES[Math.max(0, Math.min(11, month - 1))];
}

export function getShortMonthName(month: number): string {
  return SHORT_MONTH_NAMES[Math.max(0, Math.min(11, month - 1))];
}

export function getWeekdayShort(date: Date): string {
  return WEEKDAY_SHORT[date.getDay()];
}

export function getWeekdayFull(date: Date): string {
  return WEEKDAY_FULL[date.getDay()];
}

export function formatTransactionDate(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '';
  return `${WEEKDAY_SHORT[d.getDay()]}, ${d.getDate()} ${SHORT_MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatShortDate(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '';
  return `${SHORT_MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function budgetKey(month: number, year: number): string {
  return `${String(month).padStart(2, '0')}-${year}`;
}

export function generateId(prefix = ''): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const ts = Date.now().toString(36);
  return prefix ? `${prefix}-${ts}-${rand}` : `${ts}-${rand}`;
}
