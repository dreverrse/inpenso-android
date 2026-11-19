import { Expense, FinanceCategory } from '../types/models';
import { budgetKey, formatCurrency, getShortMonthName, getWeekdayFull, getWeekdayShort } from './format';

export interface SpendingInsight {
  type: 'positive' | 'neutral' | 'negative';
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface DailySpending {
  date: Date;
  amount: number;
  dayOfMonth: number;
  weekday: string;
}

export interface MonthlyTrend {
  month: number;
  year: number;
  amount: number;
  shortMonthName: string;
}

export interface CategoryTrend {
  categoryID: string;
  previousAmount: number;
  currentAmount: number;
  percentChange: number;
  isIncreasing: boolean;
}

export interface PatternAnalysis {
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface BudgetComplianceItem {
  month: number;
  year: number;
  monthName: string;
  compliancePercent: number;
  color: string;
}

export interface AnalyticsSnapshot {
  totalSpent: number;
  totalIncome: number;
  netCashflow: number;
  spendingByCategory: Record<string, number>;
  incomeByCategory: Record<string, number>;
  dailySpending: DailySpending[];
  monthlyTrends: MonthlyTrend[];
  categoryTrends: CategoryTrend[];
  insights: SpendingInsight[];
  averageDailySpend: number;
  projectedMonthlySpend: number;
  biggestExpenseCategory: [string, number] | null;
  fastestGrowingCategory: [string, number] | null;
  currentBudget: number;
  daysRemainingInMonth: number;
  budgetRemainingPerDay: number;
  mostActiveWeekday: string | null;
  weekdayVsWeekend: PatternAnalysis | null;
  monthlyPattern: PatternAnalysis | null;
  suggestedBudget: number;
  budgetCompliance: BudgetComplianceItem[];
}

function totalsByCategory(transactions: Expense[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const tx of transactions) {
    totals[tx.categoryID] = (totals[tx.categoryID] ?? 0) + tx.price;
  }
  return totals;
}

function sameDayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function computeAnalytics(
  expenses: Expense[],
  selectedMonth: number,
  selectedYear: number,
  monthlyBudgets: Record<string, number>,
  currencyCode: string,
  getCategory: (id: string) => FinanceCategory
): AnalyticsSnapshot {
  const filteredTransactions = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
  });

  const filteredExpenses = filteredTransactions.filter((e) => e.type === 'expense');
  const filteredIncomes = filteredTransactions.filter((e) => e.type === 'income');

  const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.price, 0);
  const totalIncome = filteredIncomes.reduce((sum, e) => sum + e.price, 0);
  const netCashflow = totalIncome - totalSpent;

  const spendingByCategory = totalsByCategory(filteredExpenses);
  const incomeByCategory = totalsByCategory(filteredIncomes);

  let biggestExpenseCategory: [string, number] | null = null;
  for (const entry of Object.entries(spendingByCategory)) {
    if (!biggestExpenseCategory || entry[1] > biggestExpenseCategory[1]) {
      biggestExpenseCategory = entry;
    }
  }

  // Daily spending across all days in selected month
  const dayTotals: Record<string, number> = {};
  for (const e of filteredExpenses) {
    const key = sameDayKey(new Date(e.date));
    dayTotals[key] = (dayTotals[key] ?? 0) + e.price;
  }

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const dailySpending: DailySpending[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(selectedYear, selectedMonth - 1, day);
    const amount = dayTotals[sameDayKey(date)] ?? 0;
    dailySpending.push({
      date,
      amount,
      dayOfMonth: day,
      weekday: getWeekdayShort(date),
    });
  }

  const daysWithExpenses = dailySpending.filter((d) => d.amount > 0);
  const averageDailySpend =
    daysWithExpenses.length > 0
      ? daysWithExpenses.reduce((sum, d) => sum + d.amount, 0) / daysWithExpenses.length
      : 0;

  const projectedMonthlySpend = averageDailySpend > 0 ? averageDailySpend * daysInMonth : totalSpent;

  // Monthly trends (last 6 months including current)
  const now = new Date();
  const monthlyTrends: MonthlyTrend[] = [];
  for (let i = 5; i >= 0; i--) {
    const target = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = target.getMonth() + 1;
    const y = target.getFullYear();
    const amount = expenses
      .filter((e) => {
        if (e.type !== 'expense') return false;
        const d = new Date(e.date);
        return d.getMonth() + 1 === m && d.getFullYear() === y;
      })
      .reduce((sum, e) => sum + e.price, 0);

    monthlyTrends.push({
      month: m,
      year: y,
      amount,
      shortMonthName: getShortMonthName(m),
    });
  }

  // Category trends vs previous month
  const prevDate = new Date(selectedYear, selectedMonth - 2, 1);
  const prevMonth = prevDate.getMonth() + 1;
  const prevYear = prevDate.getFullYear();

  const prevExpenses = expenses.filter((e) => {
    if (e.type !== 'expense') return false;
    const d = new Date(e.date);
    return d.getMonth() + 1 === prevMonth && d.getFullYear() === prevYear;
  });

  const prevTotals = totalsByCategory(prevExpenses);
  const allCatIds = new Set([...Object.keys(spendingByCategory), ...Object.keys(prevTotals)]);
  const categoryTrends: CategoryTrend[] = [];

  for (const catId of allCatIds) {
    const currentAmount = spendingByCategory[catId] ?? 0;
    const previousAmount = prevTotals[catId] ?? 0;
    if (currentAmount <= 0 && previousAmount <= 0) continue;

    const percentChange =
      previousAmount > 0 ? ((currentAmount - previousAmount) / previousAmount) * 100 : currentAmount > 0 ? 100 : 0;

    categoryTrends.push({
      categoryID: catId,
      previousAmount,
      currentAmount,
      percentChange,
      isIncreasing: currentAmount > previousAmount,
    });
  }

  const growing = categoryTrends.filter((t) => t.previousAmount > 0 && t.currentAmount > t.previousAmount);
  let fastestGrowingCategory: [string, number] | null = null;
  for (const g of growing) {
    if (!fastestGrowingCategory || g.percentChange > fastestGrowingCategory[1]) {
      fastestGrowingCategory = [g.categoryID, g.percentChange];
    }
  }

  // Budget & days remaining
  const currentBudget = monthlyBudgets[budgetKey(selectedMonth, selectedYear)] ?? 0;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1);
  const endOfMonth = new Date(selectedYear, selectedMonth - 1, daysInMonth);

  let daysRemainingInMonth = 0;
  let budgetRemainingPerDay = 0;

  if (endOfMonth < today) {
    daysRemainingInMonth = 0;
    budgetRemainingPerDay = 0;
  } else if (startOfMonth > today) {
    daysRemainingInMonth = daysInMonth;
    budgetRemainingPerDay = daysRemainingInMonth > 0 ? currentBudget / daysRemainingInMonth : 0;
  } else {
    daysRemainingInMonth = Math.max(0, Math.round((endOfMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    const remainingBudget = Math.max(0, currentBudget - totalSpent);
    budgetRemainingPerDay = daysRemainingInMonth > 0 ? remainingBudget / daysRemainingInMonth : 0;
  }

  // Auto-generated insights (ported directly from AnalyticsViewModel.swift)
  const insights: SpendingInsight[] = [];

  if (currentBudget > 0) {
    const percentUsed = (totalSpent / currentBudget) * 100;
    if (percentUsed >= 90) {
      insights.push({
        type: 'negative',
        title: 'Budget Alert',
        description: `You've used ${Math.floor(percentUsed)}% of your monthly budget.`,
        icon: 'exclamationmark.triangle',
        color: '#FF3B30',
      });
    } else if (percentUsed >= 75) {
      insights.push({
        type: 'neutral',
        title: 'Budget Notice',
        description: `You've used ${Math.floor(percentUsed)}% of your monthly budget.`,
        icon: 'bell',
        color: '#FF9500',
      });
    } else if (daysRemainingInMonth < 7 && percentUsed < 60) {
      insights.push({
        type: 'positive',
        title: 'Under Budget',
        description: "Great job! You're under budget this month.",
        icon: 'checkmark.circle',
        color: '#34C759',
      });
    }
  }

  if (fastestGrowingCategory && fastestGrowingCategory[1] > 30) {
    const catName = getCategory(fastestGrowingCategory[0]).name;
    insights.push({
      type: 'negative',
      title: 'Spending Increase',
      description: `${catName} spending increased by ${Math.floor(fastestGrowingCategory[1])}% from last month.`,
      icon: 'arrow.up.right',
      color: '#FF3B30',
    });
  }

  const reduced = categoryTrends.filter(
    (t) => t.previousAmount > 0 && t.currentAmount < t.previousAmount && Math.abs(t.percentChange) > 20
  );
  if (reduced.length > 0) {
    const bestReduction = reduced.reduce((best, cur) => (cur.percentChange < best.percentChange ? cur : best));
    const catName = getCategory(bestReduction.categoryID).name;
    insights.push({
      type: 'positive',
      title: 'Spending Decrease',
      description: `You reduced ${catName} spending by ${Math.floor(Math.abs(bestReduction.percentChange))}%.`,
      icon: 'arrow.down.right',
      color: '#34C759',
    });
  }

  if (projectedMonthlySpend > currentBudget && currentBudget > 0) {
    const overage = projectedMonthlySpend - currentBudget;
    insights.push({
      type: 'negative',
      title: 'Projected Overspending',
      description: `At this rate, you might exceed your budget by ${formatCurrency(overage, currencyCode)}.`,
      icon: 'chart.line.uptrend.xyaxis',
      color: '#FF3B30',
    });
  }

  // Most active spending weekday
  let mostActiveWeekday: string | null = null;
  if (daysWithExpenses.length > 0) {
    const byWeekday: Record<string, { sum: number; count: number }> = {};
    for (const d of daysWithExpenses) {
      const name = getWeekdayFull(d.date);
      if (!byWeekday[name]) byWeekday[name] = { sum: 0, count: 0 };
      byWeekday[name].sum += d.amount;
      byWeekday[name].count += 1;
    }
    let bestAvg = -1;
    for (const [name, stats] of Object.entries(byWeekday)) {
      const avg = stats.sum / stats.count;
      if (avg > bestAvg) {
        bestAvg = avg;
        mostActiveWeekday = name;
      }
    }
  }

  // Weekday vs Weekend pattern
  let weekdayVsWeekend: PatternAnalysis | null = null;
  if (daysWithExpenses.length > 0) {
    const weekdayVals: number[] = [];
    const weekendVals: number[] = [];
    for (const d of dailySpending) {
      const dayOfWeek = d.date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) weekendVals.push(d.amount);
      else weekdayVals.push(d.amount);
    }
    const weekdayAvg = weekdayVals.reduce((s, v) => s + v, 0) / Math.max(1, weekdayVals.length);
    const weekendAvg = weekendVals.reduce((s, v) => s + v, 0) / Math.max(1, weekendVals.length);
    const ratio = weekdayAvg > 0 ? weekendAvg / weekdayAvg : 0;

    if (ratio > 1.5) {
      weekdayVsWeekend = {
        title: 'Weekend Spender',
        description: `You spend ${Math.floor(ratio * 100)}% more on weekends compared to weekdays`,
        icon: 'party.popper',
        color: '#FF9500',
      };
    } else if (ratio > 1.1) {
      weekdayVsWeekend = {
        title: 'Slightly Higher Weekend Spending',
        description: 'Your weekend spending is moderately higher than weekdays',
        icon: 'calendar.badge.plus',
        color: '#007AFF',
      };
    } else if (ratio < 0.7) {
      weekdayVsWeekend = {
        title: 'Weekday Focused',
        description: 'You spend significantly more on weekdays than weekends',
        icon: 'briefcase',
        color: '#AF52DE',
      };
    } else {
      weekdayVsWeekend = {
        title: 'Balanced Spending',
        description: 'Your spending is fairly consistent throughout the week',
        icon: 'equal.circle',
        color: '#34C759',
      };
    }
  }

  // Monthly pattern (early / mid / late)
  let monthlyPattern: PatternAnalysis | null = null;
  if (daysWithExpenses.length > 0) {
    const early: number[] = [];
    const mid: number[] = [];
    const late: number[] = [];
    for (const d of dailySpending) {
      if (d.dayOfMonth <= 10) early.push(d.amount);
      else if (d.dayOfMonth <= 20) mid.push(d.amount);
      else late.push(d.amount);
    }
    const earlyAvg = early.reduce((s, v) => s + v, 0) / Math.max(1, early.length);
    const midAvg = mid.reduce((s, v) => s + v, 0) / Math.max(1, mid.length);
    const lateAvg = late.reduce((s, v) => s + v, 0) / Math.max(1, late.length);
    const maxAvg = Math.max(earlyAvg, midAvg, lateAvg);

    if (maxAvg === earlyAvg && earlyAvg > midAvg * 1.3 && earlyAvg > lateAvg * 1.3) {
      monthlyPattern = {
        title: 'Early Month Spender',
        description: 'You tend to spend more in the first part of the month',
        icon: 'calendar.badge.plus',
        color: '#34C759',
      };
    } else if (maxAvg === lateAvg && lateAvg > earlyAvg * 1.3 && lateAvg > midAvg * 1.3) {
      monthlyPattern = {
        title: 'End of Month Spender',
        description: 'Your spending increases toward the end of the month',
        icon: 'calendar.badge.exclamationmark',
        color: '#FF3B30',
      };
    } else if (maxAvg === midAvg && midAvg > earlyAvg * 1.3 && midAvg > lateAvg * 1.3) {
      monthlyPattern = {
        title: 'Mid-Month Spike',
        description: 'Your spending peaks in the middle of the month',
        icon: 'waveform.path.ecg',
        color: '#FF9500',
      };
    } else {
      monthlyPattern = {
        title: 'Consistent Throughout Month',
        description: 'Your spending is fairly evenly distributed throughout the month',
        icon: 'equal.circle',
        color: '#007AFF',
      };
    }
  }

  // Suggested budget
  let suggestedBudget = 0;
  const nonZeroRecent = monthlyTrends.slice(-3).filter((m) => m.amount > 0);
  if (nonZeroRecent.length >= 3) {
    const avg = nonZeroRecent.reduce((s, m) => s + m.amount, 0) / nonZeroRecent.length;
    suggestedBudget = Math.ceil((avg * 1.1) / 10) * 10;
  } else if (projectedMonthlySpend > 0) {
    suggestedBudget = Math.ceil((projectedMonthlySpend * 1.05) / 10) * 10;
  }

  // Historical budget compliance (previous months)
  const budgetCompliance: BudgetComplianceItem[] = [];
  for (const trend of monthlyTrends.slice(0, -1)) {
    const b = monthlyBudgets[budgetKey(trend.month, trend.year)];
    if (b && b > 0) {
      const pct = (trend.amount / b) * 100;
      const color = pct <= 90 ? '#34C759' : pct <= 100 ? '#007AFF' : pct <= 110 ? '#FF9500' : '#FF3B30';
      budgetCompliance.push({
        month: trend.month,
        year: trend.year,
        monthName: trend.shortMonthName,
        compliancePercent: pct,
        color,
      });
    }
  }

  return {
    totalSpent,
    totalIncome,
    netCashflow,
    spendingByCategory,
    incomeByCategory,
    dailySpending,
    monthlyTrends,
    categoryTrends,
    insights,
    averageDailySpend,
    projectedMonthlySpend,
    biggestExpenseCategory,
    fastestGrowingCategory,
    currentBudget,
    daysRemainingInMonth,
    budgetRemainingPerDay,
    mostActiveWeekday,
    weekdayVsWeekend,
    monthlyPattern,
    suggestedBudget,
    budgetCompliance,
  };
}
