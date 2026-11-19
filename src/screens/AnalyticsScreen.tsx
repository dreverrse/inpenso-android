import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import { computeAnalytics } from '../utils/analytics';
import { formatCurrency, getCurrencySymbol, getMonthName } from '../utils/format';
import { mapIconName } from '../utils/icons';
import { MonthYearPicker } from '../components/MonthYearPicker';
import { BarChart, BarDatum } from '../components/BarChart';

type AnalyticsTab = 'overview' | 'trends' | 'insights' | 'budget';

const TABS: { key: AnalyticsTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'trends', label: 'Trends' },
  { key: 'insights', label: 'Insights' },
  { key: 'budget', label: 'Budget' },
];

export function AnalyticsScreen() {
  const { theme, expenses, monthlyBudgets, selectedCurrency, getCategoryById, setMonthlyBudget } = useApp();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedTab, setSelectedTab] = useState<AnalyticsTab>('overview');
  const [budgetInput, setBudgetInput] = useState('');

  const analytics = useMemo(
    () => computeAnalytics(expenses, selectedMonth, selectedYear, monthlyBudgets, selectedCurrency, getCategoryById),
    [expenses, selectedMonth, selectedYear, monthlyBudgets, selectedCurrency, getCategoryById]
  );

  useEffect(() => {
    setBudgetInput(analytics.currentBudget > 0 ? String(analytics.currentBudget) : '');
  }, [selectedMonth, selectedYear, analytics.currentBudget]);

  const handleSaveBudget = () => {
    const cleaned = budgetInput.replace(',', '.').trim();
    const val = Number(cleaned);
    if (!cleaned || Number.isNaN(val) || val < 0) {
      Alert.alert('Invalid Budget', 'Please enter a valid non-negative number.');
      return;
    }
    setMonthlyBudget(selectedMonth, selectedYear, val);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    Alert.alert('Budget Saved', 'Your monthly budget has been saved successfully.');
  };

  const dailyBars: BarDatum[] = useMemo(() => {
    return analytics.dailySpending.map((d) => ({
      key: String(d.dayOfMonth),
      label: d.dayOfMonth === 1 || d.dayOfMonth % 5 === 0 ? String(d.dayOfMonth) : '',
      value: d.amount,
    }));
  }, [analytics.dailySpending]);

  const monthlyTrendBars: BarDatum[] = useMemo(() => {
    return analytics.monthlyTrends.map((t) => ({
      key: `${t.year}-${t.month}`,
      label: t.shortMonthName,
      value: t.amount,
    }));
  }, [analytics.monthlyTrends]);

  const sortedCategories = useMemo(
    () => Object.entries(analytics.spendingByCategory).sort((a, b) => b[1] - a[1]),
    [analytics.spendingByCategory]
  );

  const budgetUsedPct =
    analytics.currentBudget > 0 ? Math.min(100, (analytics.totalSpent / analytics.currentBudget) * 100) : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.groupedBackground }]}>
      <View style={styles.topBar}>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Analytics</Text>
        <Text style={[styles.monthSubtitle, { color: theme.secondaryText }]}>
          {getMonthName(selectedMonth)} {selectedYear}
        </Text>
      </View>

      <MonthYearPicker
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onChange={(m, y) => {
          setSelectedMonth(m);
          setSelectedYear(y);
        }}
      />

      {/* Sub-tab selector */}
      <View style={[styles.tabStrip, { backgroundColor: theme.tertiaryBackground }]}>
        {TABS.map((t) => {
          const active = selectedTab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setSelectedTab(t.key)}
              style={[styles.tabPill, active && { backgroundColor: theme.cardBackground }]}
            >
              <Text style={[styles.tabPillText, { color: active ? theme.accent : theme.secondaryText }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {selectedTab === 'overview' && (
          <>
            {/* 6 Summary Cards Grid */}
            <View style={styles.summaryGrid}>
              <SummaryTile
                title="Total Spent"
                value={formatCurrency(analytics.totalSpent, selectedCurrency)}
                icon="cash"
                color={theme.accent}
                cardBg={theme.cardBackground}
                textColor={theme.text}
                subColor={theme.secondaryText}
              />
              <SummaryTile
                title="Income"
                value={formatCurrency(analytics.totalIncome, selectedCurrency)}
                icon="arrow-down-circle"
                color={theme.green}
                cardBg={theme.cardBackground}
                textColor={theme.text}
                subColor={theme.secondaryText}
              />
              <SummaryTile
                title="Net"
                value={formatCurrency(analytics.netCashflow, selectedCurrency)}
                icon="remove-circle"
                color={analytics.netCashflow >= 0 ? theme.green : theme.red}
                cardBg={theme.cardBackground}
                textColor={theme.text}
                subColor={theme.secondaryText}
              />
              <SummaryTile
                title="Daily Average"
                value={formatCurrency(analytics.averageDailySpend, selectedCurrency)}
                icon="calendar"
                color={theme.green}
                cardBg={theme.cardBackground}
                textColor={theme.text}
                subColor={theme.secondaryText}
              />
              <SummaryTile
                title={analytics.currentBudget > 0 ? 'Budget Used' : 'Budget'}
                value={analytics.currentBudget > 0 ? `${Math.round(budgetUsedPct)}%` : 'Not set'}
                icon="pie-chart"
                color={
                  analytics.currentBudget <= 0
                    ? theme.gray
                    : budgetUsedPct >= 90
                    ? theme.red
                    : budgetUsedPct >= 75
                    ? theme.orange
                    : theme.accent
                }
                cardBg={theme.cardBackground}
                textColor={theme.text}
                subColor={theme.secondaryText}
              />
              <SummaryTile
                title={analytics.currentBudget > 0 && analytics.daysRemainingInMonth > 0 ? 'Per Day Left' : 'Days Left'}
                value={
                  analytics.currentBudget > 0 && analytics.daysRemainingInMonth > 0
                    ? formatCurrency(analytics.budgetRemainingPerDay, selectedCurrency)
                    : `${analytics.daysRemainingInMonth} days`
                }
                icon="time"
                color={theme.purple}
                cardBg={theme.cardBackground}
                textColor={theme.text}
                subColor={theme.secondaryText}
              />
            </View>

            {/* Daily Spending Chart */}
            <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Daily Spending</Text>
              {analytics.totalSpent <= 0 ? (
                <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No expenses for this month</Text>
              ) : (
                <BarChart
                  data={dailyBars}
                  height={160}
                  averageValue={analytics.averageDailySpend}
                  barColor={theme.accent}
                  compact
                />
              )}
            </View>

            {/* Category Breakdown */}
            <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Category Breakdown</Text>
              {sortedCategories.length === 0 ? (
                <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No category data</Text>
              ) : (
                sortedCategories.map(([catId, amount]) => {
                  const cat = getCategoryById(catId);
                  const pct = analytics.totalSpent > 0 ? (amount / analytics.totalSpent) * 100 : 0;
                  return (
                    <View key={catId} style={styles.breakdownItem}>
                      <View style={styles.breakdownHeader}>
                        <View style={styles.breakdownLeft}>
                          <View style={[styles.catBadge, { backgroundColor: cat.colorHex }]}>
                            <Ionicons name={mapIconName(cat.iconName)} size={14} color="#FFFFFF" />
                          </View>
                          <Text style={[styles.rowTitle, { color: theme.text }]}>{cat.name}</Text>
                        </View>
                        <Text style={[styles.rowAmount, { color: theme.text }]}>
                          {formatCurrency(amount, selectedCurrency)} ({Math.round(pct)}%)
                        </Text>
                      </View>
                      <View style={[styles.progressTrack, { backgroundColor: theme.track }]}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${Math.min(100, Math.round(pct))}%`, backgroundColor: cat.colorHex },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}

        {selectedTab === 'trends' && (
          <>
            {/* 6-Month Spending Trend */}
            <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>6-Month Spending Trend</Text>
              <BarChart data={monthlyTrendBars} height={170} barColor={theme.accent} showValues />
            </View>

            {/* Category Month-over-Month Trends */}
            <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Category Trends vs Last Month</Text>
              {analytics.categoryTrends.length === 0 ? (
                <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No comparison data yet</Text>
              ) : (
                analytics.categoryTrends
                  .sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange))
                  .map((trend) => {
                    const cat = getCategoryById(trend.categoryID);
                    const changeColor = trend.isIncreasing ? theme.red : theme.green;
                    return (
                      <View key={trend.categoryID} style={styles.trendRow}>
                        <View style={[styles.catBadge, { backgroundColor: cat.colorHex }]}>
                          <Ionicons name={mapIconName(cat.iconName)} size={14} color="#FFFFFF" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.rowTitle, { color: theme.text }]}>{cat.name}</Text>
                          <Text style={[styles.caption, { color: theme.secondaryText }]}>
                            Prev: {formatCurrency(trend.previousAmount, selectedCurrency)}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.rowAmount, { color: theme.text }]}>
                            {formatCurrency(trend.currentAmount, selectedCurrency)}
                          </Text>
                          <Text style={[styles.caption, { color: changeColor, fontWeight: '700' }]}>
                            {trend.percentChange > 0 ? '+' : ''}
                            {Math.round(trend.percentChange)}%
                          </Text>
                        </View>
                      </View>
                    );
                  })
              )}
            </View>

            {/* Monthly Projection */}
            {analytics.projectedMonthlySpend > 0 && (
              <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Monthly Projection</Text>
                <Text style={[styles.bigStat, { color: theme.accent }]}>
                  {formatCurrency(analytics.projectedMonthlySpend, selectedCurrency)}
                </Text>
                <Text style={[styles.caption, { color: theme.secondaryText }]}>
                  Estimated total spending for {getMonthName(selectedMonth)} at your current daily rate.
                </Text>
                {analytics.currentBudget > 0 && (
                  <Text
                    style={[
                      styles.projectionNote,
                      {
                        color:
                          analytics.projectedMonthlySpend > analytics.currentBudget ? theme.red : theme.green,
                      },
                    ]}
                  >
                    {analytics.projectedMonthlySpend > analytics.currentBudget
                      ? `Projected to exceed budget by ${formatCurrency(
                          analytics.projectedMonthlySpend - analytics.currentBudget,
                          selectedCurrency
                        )}`
                      : `On track to stay under budget by ${formatCurrency(
                          analytics.currentBudget - analytics.projectedMonthlySpend,
                          selectedCurrency
                        )}`}
                  </Text>
                )}
              </View>
            )}
          </>
        )}

        {selectedTab === 'insights' && (
          <>
            {/* Key Statistics */}
            <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Key Statistics</Text>
              <View style={styles.statLine}>
                <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Top Category</Text>
                <Text style={[styles.statVal, { color: theme.text }]}>
                  {analytics.biggestExpenseCategory
                    ? `${getCategoryById(analytics.biggestExpenseCategory[0]).name} (${formatCurrency(
                        analytics.biggestExpenseCategory[1],
                        selectedCurrency
                      )})`
                    : '—'}
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <View style={styles.statLine}>
                <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Most Active Day</Text>
                <Text style={[styles.statVal, { color: theme.text }]}>
                  {analytics.mostActiveWeekday ?? '—'}
                </Text>
              </View>
            </View>

            {/* Auto-generated Insights */}
            <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Smart Insights</Text>
              {analytics.insights.length === 0 ? (
                <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
                  Add more transactions or set a budget to unlock personalized insights.
                </Text>
              ) : (
                analytics.insights.map((ins, idx) => (
                  <View
                    key={`${ins.title}-${idx}`}
                    style={[styles.insightRow, { backgroundColor: theme.tertiaryBackground }]}
                  >
                    <View style={[styles.insightIcon, { backgroundColor: `${ins.color}22` }]}>
                      <Ionicons name={mapIconName(ins.icon)} size={18} color={ins.color} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[styles.rowTitle, { color: theme.text }]}>{ins.title}</Text>
                      <Text style={[styles.caption, { color: theme.secondaryText }]}>{ins.description}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Spending Patterns */}
            <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Spending Patterns</Text>
              {!analytics.weekdayVsWeekend && !analytics.monthlyPattern ? (
                <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
                  Not enough data for pattern analysis yet.
                </Text>
              ) : (
                <>
                  {analytics.weekdayVsWeekend && (
                    <View style={[styles.insightRow, { backgroundColor: theme.tertiaryBackground }]}>
                      <View
                        style={[styles.insightIcon, { backgroundColor: `${analytics.weekdayVsWeekend.color}22` }]}
                      >
                        <Ionicons
                          name={mapIconName(analytics.weekdayVsWeekend.icon)}
                          size={18}
                          color={analytics.weekdayVsWeekend.color}
                        />
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[styles.rowTitle, { color: theme.text }]}>
                          {analytics.weekdayVsWeekend.title}
                        </Text>
                        <Text style={[styles.caption, { color: theme.secondaryText }]}>
                          {analytics.weekdayVsWeekend.description}
                        </Text>
                      </View>
                    </View>
                  )}
                  {analytics.monthlyPattern && (
                    <View style={[styles.insightRow, { backgroundColor: theme.tertiaryBackground }]}>
                      <View
                        style={[styles.insightIcon, { backgroundColor: `${analytics.monthlyPattern.color}22` }]}
                      >
                        <Ionicons
                          name={mapIconName(analytics.monthlyPattern.icon)}
                          size={18}
                          color={analytics.monthlyPattern.color}
                        />
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[styles.rowTitle, { color: theme.text }]}>
                          {analytics.monthlyPattern.title}
                        </Text>
                        <Text style={[styles.caption, { color: theme.secondaryText }]}>
                          {analytics.monthlyPattern.description}
                        </Text>
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>
          </>
        )}

        {selectedTab === 'budget' && (
          <>
            {/* Budget Input Card */}
            <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Monthly Budget ({getMonthName(selectedMonth)})
              </Text>
              <View style={[styles.budgetInputRow, { backgroundColor: theme.tertiaryBackground }]}>
                <Text style={[styles.currencyPrefix, { color: theme.accent }]}>
                  {getCurrencySymbol(selectedCurrency)}
                </Text>
                <TextInput
                  value={budgetInput}
                  onChangeText={setBudgetInput}
                  placeholder="Enter monthly budget"
                  placeholderTextColor={theme.secondaryText}
                  keyboardType="decimal-pad"
                  style={[styles.budgetInput, { color: theme.text }]}
                />
              </View>
              <TouchableOpacity
                onPress={handleSaveBudget}
                style={[styles.saveBudgetBtn, { backgroundColor: theme.accent }]}
              >
                <Text style={styles.saveBudgetText}>Save Budget</Text>
              </TouchableOpacity>
            </View>

            {/* Budget Status */}
            {analytics.currentBudget > 0 && (
              <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Budget Status</Text>
                <View style={styles.statLine}>
                  <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Spent</Text>
                  <Text style={[styles.statVal, { color: theme.text }]}>
                    {formatCurrency(analytics.totalSpent, selectedCurrency)} of{' '}
                    {formatCurrency(analytics.currentBudget, selectedCurrency)}
                  </Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: theme.track, height: 10 }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(100, Math.round(budgetUsedPct))}%`,
                        backgroundColor:
                          budgetUsedPct >= 90 ? theme.red : budgetUsedPct >= 75 ? theme.orange : theme.accent,
                      },
                    ]}
                  />
                </View>
                <View style={styles.statLine}>
                  <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Remaining / Day</Text>
                  <Text style={[styles.statVal, { color: theme.green }]}>
                    {formatCurrency(analytics.budgetRemainingPerDay, selectedCurrency)}
                  </Text>
                </View>
                {analytics.suggestedBudget > 0 && (
                  <View style={styles.statLine}>
                    <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Suggested Budget</Text>
                    <TouchableOpacity onPress={() => setBudgetInput(String(analytics.suggestedBudget))}>
                      <Text style={[styles.statVal, { color: theme.accent }]}>
                        {formatCurrency(analytics.suggestedBudget, selectedCurrency)} (Use)
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Historical Compliance */}
            <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Budget History</Text>
              {analytics.budgetCompliance.length === 0 ? (
                <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
                  No historical budget data yet.
                </Text>
              ) : (
                analytics.budgetCompliance.map((item) => (
                  <View key={`${item.year}-${item.month}`} style={styles.breakdownItem}>
                    <View style={styles.breakdownHeader}>
                      <Text style={[styles.rowTitle, { color: theme.text }]}>
                        {item.monthName} {item.year}
                      </Text>
                      <Text style={[styles.rowAmount, { color: item.color }]}>
                        {Math.round(item.compliancePercent)}% used
                      </Text>
                    </View>
                    <View style={[styles.progressTrack, { backgroundColor: theme.track }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(100, Math.round(item.compliancePercent))}%`,
                            backgroundColor: item.color,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SummaryTile({
  title,
  value,
  icon,
  color,
  cardBg,
  textColor,
  subColor,
}: {
  title: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  cardBg: string;
  textColor: string;
  subColor: string;
}) {
  return (
    <View style={[styles.summaryTile, { backgroundColor: cardBg }]}>
      <View style={styles.summaryTileTop}>
        <Ionicons name={icon} size={18} color={color} />
        <Text style={[styles.summaryTitle, { color: subColor }]} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <Text style={[styles.summaryValue, { color: textColor }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 6,
  },
  screenTitle: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  monthSubtitle: { fontSize: 14, fontWeight: '600' },
  tabStrip: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 8,
    borderRadius: 12,
    padding: 4,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabPillText: { fontSize: 13, fontWeight: '700' },
  scrollContent: {
    padding: 16,
    paddingBottom: 28,
    gap: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryTile: {
    width: '48.4%',
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  summaryTileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryTitle: { fontSize: 12, fontWeight: '600', flex: 1 },
  summaryValue: { fontSize: 18, fontWeight: '800' },
  card: {
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  emptyText: { textAlign: 'center', paddingVertical: 16, fontSize: 14 },
  breakdownItem: { gap: 6 },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  catBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: 14, fontWeight: '600' },
  rowAmount: { fontSize: 14, fontWeight: '700' },
  caption: { fontSize: 12 },
  progressTrack: { height: 7, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  bigStat: { fontSize: 30, fontWeight: '800' },
  projectionNote: { fontSize: 13, fontWeight: '600' },
  statLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statLabel: { fontSize: 14 },
  statVal: { fontSize: 14, fontWeight: '700' },
  divider: { height: StyleSheet.hairlineWidth },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  currencyPrefix: { fontSize: 18, fontWeight: '700' },
  budgetInput: { flex: 1, fontSize: 18, fontWeight: '700', padding: 0 },
  saveBudgetBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBudgetText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
