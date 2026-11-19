import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Expense } from '../types/models';
import { computeAnalytics } from '../utils/analytics';
import { formatCurrency, formatShortDate, getWeekdayShort } from '../utils/format';
import { mapIconName } from '../utils/icons';
import { BarChart, BarDatum } from '../components/BarChart';

interface HomeScreenProps {
  onOpenAdd: () => void;
  onEditExpense: (expense: Expense) => void;
  onSwitchToTransactions: () => void;
}

export function HomeScreen({ onOpenAdd, onEditExpense, onSwitchToTransactions }: HomeScreenProps) {
  const { theme, expenses, monthlyBudgets, selectedCurrency, getCategoryById } = useApp();
  const [showRecent, setShowRecent] = useState(true);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const analytics = useMemo(
    () => computeAnalytics(expenses, currentMonth, currentYear, monthlyBudgets, selectedCurrency, getCategoryById),
    [expenses, currentMonth, currentYear, monthlyBudgets, selectedCurrency, getCategoryById]
  );

  // Last 7 days spending bar data
  const recent7Days: BarDatum[] = useMemo(() => {
    const today = new Date();
    const list: BarDatum[] = [];
    for (let i = 6; i >= 0; i--) {
      const target = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const total = expenses
        .filter((e) => {
          if (e.type !== 'expense') return false;
          const d = new Date(e.date);
          return (
            d.getFullYear() === target.getFullYear() &&
            d.getMonth() === target.getMonth() &&
            d.getDate() === target.getDate()
          );
        })
        .reduce((sum, e) => sum + e.price, 0);

      list.push({
        key: `${target.getFullYear()}-${target.getMonth()}-${target.getDate()}`,
        label: getWeekdayShort(target),
        value: total,
      });
    }
    return list;
  }, [expenses]);

  const totalRecent7Days = recent7Days.reduce((sum, d) => sum + d.value, 0);

  const topCategories = useMemo(
    () => Object.entries(analytics.spendingByCategory).sort((a, b) => b[1] - a[1]).slice(0, 5),
    [analytics.spendingByCategory]
  );

  const recentTransactions = useMemo(
    () => [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
    [expenses]
  );

  const budgetProgress =
    analytics.currentBudget > 0 ? Math.min(1, analytics.totalSpent / analytics.currentBudget) : 0;
  const budgetColor =
    budgetProgress < 0.75 ? theme.accent : budgetProgress < 0.9 ? theme.orange : theme.red;

  return (
    <View style={[styles.container, { backgroundColor: theme.groupedBackground }]}>
      <View style={styles.topBar}>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Home</Text>
        <TouchableOpacity
          onPress={onOpenAdd}
          style={[styles.addPill, { backgroundColor: theme.accent }]}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addPillText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Monthly Cashflow Header Card */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.cashflowSubtitle, { color: theme.secondaryText }]}>Monthly Cashflow</Text>
          <Text
            style={[
              styles.cashflowValue,
              { color: analytics.netCashflow >= 0 ? theme.green : theme.red },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatCurrency(analytics.netCashflow, selectedCurrency)}
          </Text>

          <View style={styles.metricsRow}>
            <View style={styles.metricCol}>
              <Text style={[styles.metricLabel, { color: theme.secondaryText }]}>Income</Text>
              <Text style={[styles.metricValue, { color: theme.green }]} numberOfLines={1}>
                {formatCurrency(analytics.totalIncome, selectedCurrency)}
              </Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />
            <View style={styles.metricCol}>
              <Text style={[styles.metricLabel, { color: theme.secondaryText }]}>Spent</Text>
              <Text style={[styles.metricValue, { color: theme.text }]} numberOfLines={1}>
                {formatCurrency(analytics.totalSpent, selectedCurrency)}
              </Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />
            <View style={styles.metricCol}>
              <Text style={[styles.metricLabel, { color: theme.secondaryText }]}>Net</Text>
              <Text
                style={[
                  styles.metricValue,
                  { color: analytics.netCashflow >= 0 ? theme.green : theme.red },
                ]}
                numberOfLines={1}
              >
                {formatCurrency(analytics.netCashflow, selectedCurrency)}
              </Text>
            </View>
          </View>

          {analytics.currentBudget > 0 && (
            <View style={styles.budgetSection}>
              <View style={[styles.progressTrack, { backgroundColor: theme.track }]}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.round(budgetProgress * 100)}%`, backgroundColor: budgetColor },
                  ]}
                />
              </View>
              <View style={styles.budgetFooter}>
                <Text style={[styles.caption, { color: theme.secondaryText }]}>
                  {Math.round(budgetProgress * 100)}% of budget
                </Text>
                <Text style={[styles.caption, { color: theme.secondaryText }]}>
                  {analytics.daysRemainingInMonth} days left
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Recent Spending 7-Day Bar Chart */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Recent Spending</Text>
          {totalRecent7Days <= 0 ? (
            <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
              No spending in the last 7 days
            </Text>
          ) : (
            <>
              <BarChart
                data={recent7Days}
                height={150}
                averageValue={analytics.averageDailySpend}
                barColor={theme.accent}
              />
              <Text style={[styles.chartNote, { color: theme.secondaryText }]}>
                Showing spending for the last 7 days
              </Text>
            </>
          )}
        </View>

        {/* Spending by Category */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Spending by Category</Text>
          {topCategories.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No category data available</Text>
          ) : (
            <View style={styles.listGroup}>
              {topCategories.map(([catId, amount], idx) => {
                const cat = getCategoryById(catId);
                const pct = analytics.totalSpent > 0 ? Math.round((amount / analytics.totalSpent) * 100) : 0;
                return (
                  <View key={catId}>
                    <View style={styles.row}>
                      <View style={[styles.catBadge, { backgroundColor: cat.colorHex }]}>
                        <Ionicons name={mapIconName(cat.iconName)} size={15} color="#FFFFFF" />
                      </View>
                      <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>
                        {cat.name}
                      </Text>
                      <View style={styles.rowRight}>
                        <Text style={[styles.rowAmount, { color: theme.text }]}>
                          {formatCurrency(amount, selectedCurrency)}
                        </Text>
                        <Text style={[styles.caption, { color: theme.secondaryText }]}>{pct}%</Text>
                      </View>
                    </View>
                    {idx < topCategories.length - 1 && (
                      <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Recent Transactions */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 0 }]}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => setShowRecent((v) => !v)} style={styles.toggleBtn}>
              <Text style={[styles.caption, { color: theme.secondaryText }]}>
                {showRecent ? 'Hide' : 'Show'}
              </Text>
              <Ionicons
                name={showRecent ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={theme.secondaryText}
              />
            </TouchableOpacity>
          </View>

          {showRecent && (
            recentTransactions.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No transactions yet</Text>
            ) : (
              <View style={styles.listGroup}>
                {recentTransactions.map((tx, idx) => {
                  const cat = getCategoryById(tx.categoryID);
                  const amountStr = formatCurrency(tx.price, selectedCurrency);
                  return (
                    <View key={tx.id}>
                      <TouchableOpacity onPress={() => onEditExpense(tx)} style={styles.row} activeOpacity={0.7}>
                        <View style={[styles.catBadgeSmall, { backgroundColor: cat.colorHex }]}>
                          <Ionicons name={mapIconName(cat.iconName)} size={14} color="#FFFFFF" />
                        </View>
                        <View style={styles.txInfo}>
                          <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>
                            {tx.title}
                          </Text>
                          <Text style={[styles.caption, { color: theme.secondaryText }]}>
                            {formatShortDate(tx.date)}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.rowAmount,
                            { color: tx.type === 'income' ? theme.green : theme.text },
                          ]}
                        >
                          {tx.type === 'income' ? `+${amountStr}` : amountStr}
                        </Text>
                      </TouchableOpacity>
                      {idx < recentTransactions.length - 1 && (
                        <View style={[styles.rowDivider, { backgroundColor: theme.border, marginLeft: 40 }]} />
                      )}
                    </View>
                  );
                })}

                <TouchableOpacity
                  onPress={onSwitchToTransactions}
                  style={[styles.viewAllBtn, { borderColor: theme.accent }]}
                >
                  <Text style={[styles.viewAllText, { color: theme.accent }]}>View All Transactions</Text>
                </TouchableOpacity>
              </View>
            )
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
  },
  screenTitle: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  addPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addPillText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 16,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  cashflowSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  cashflowValue: {
    fontSize: 38,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.8,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  metricDivider: {
    width: StyleSheet.hairlineWidth,
    height: 30,
  },
  metricLabel: { fontSize: 12, fontWeight: '500' },
  metricValue: { fontSize: 14, fontWeight: '700' },
  budgetSection: { gap: 6, marginTop: 4 },
  progressTrack: { height: 8, borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 6 },
  budgetFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  caption: { fontSize: 12 },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 18,
    fontSize: 14,
  },
  chartNote: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 4,
  },
  listGroup: { gap: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    gap: 12,
  },
  catBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catBadgeSmall: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: { flex: 1, gap: 2 },
  rowTitle: { flex: 1, fontSize: 15, fontWeight: '600' },
  rowRight: { alignItems: 'flex-end', gap: 2 },
  rowAmount: { fontSize: 15, fontWeight: '700' },
  rowDivider: { height: StyleSheet.hairlineWidth },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllBtn: {
    marginTop: 10,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
