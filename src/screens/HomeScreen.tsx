import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Expense } from '../types/models';
import { computeAnalytics } from '../utils/analytics';
import { formatCurrency, formatShortDate, getMonthName, getWeekdayShort } from '../utils/format';
import { mapIconName } from '../utils/icons';
import { BarChart, BarDatum } from '../components/BarChart';

interface HomeScreenProps {
  onOpenAdd: () => void;
  onEditExpense: (expense: Expense) => void;
  onSwitchToTransactions: () => void;
}

export function HomeScreen({ onOpenAdd, onEditExpense, onSwitchToTransactions }: HomeScreenProps) {
  const {
    theme,
    expenses,
    monthlyBudgets,
    selectedCurrency,
    setSelectedTheme,
    getCategoryById,
  } = useApp();
  const [showRecent, setShowRecent] = useState(true);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const analytics = useMemo(
    () => computeAnalytics(expenses, currentMonth, currentYear, monthlyBudgets, selectedCurrency, getCategoryById),
    [expenses, currentMonth, currentYear, monthlyBudgets, selectedCurrency, getCategoryById]
  );

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
  const budgetBarColor =
    budgetProgress < 0.75 ? '#38BDF8' : budgetProgress < 0.9 ? '#FBBF24' : '#FB7185';

  const toggleQuickTheme = () => {
    setSelectedTheme(theme.isDark ? 'light' : 'dark');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.groupedBackground }]}>
      {/* Branded Premium Header */}
      <View style={styles.topBar}>
        <View style={styles.brandGroup}>
          <LinearGradient
            colors={theme.accentGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.brandMark}
          >
            <Ionicons name="pulse" size={16} color="#FFFFFF" />
          </LinearGradient>
          <View>
            <Text style={[styles.brandTitle, { color: theme.text }]}>TrackMorph</Text>
            <Text style={[styles.brandSub, { color: theme.secondaryText }]}>
              {getMonthName(currentMonth)} {currentYear}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={toggleQuickTheme}
            style={[styles.iconPill, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
            activeOpacity={0.75}
          >
            <Ionicons
              name={theme.isDark ? 'sunny-outline' : 'moon-outline'}
              size={18}
              color={theme.text}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={onOpenAdd} activeOpacity={0.85}>
            <LinearGradient
              colors={theme.accentGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addPill}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addPillText}>New</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Premium Hero Cashflow Card */}
        <LinearGradient
          colors={theme.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroGlowOrb} />
          <View style={styles.heroHeaderRow}>
            <Text style={styles.heroLabel}>MONTHLY NET CASHFLOW</Text>
            <View style={styles.heroBadge}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: analytics.netCashflow >= 0 ? '#34D399' : '#FB7185' },
                ]}
              />
              <Text style={styles.heroBadgeText}>
                {analytics.netCashflow >= 0 ? 'Positive' : 'Deficit'}
              </Text>
            </View>
          </View>

          <Text style={styles.heroBalance} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(analytics.netCashflow, selectedCurrency)}
          </Text>

          {/* Frosted Income / Spent Pills */}
          <View style={styles.heroMetricsRow}>
            <View style={styles.heroMetricPill}>
              <View style={[styles.heroMetricIcon, { backgroundColor: 'rgba(16, 185, 129, 0.22)' }]}>
                <Ionicons name="arrow-down" size={14} color="#34D399" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroMetricLabel}>Income</Text>
                <Text style={[styles.heroMetricValue, { color: '#34D399' }]} numberOfLines={1}>
                  {formatCurrency(analytics.totalIncome, selectedCurrency)}
                </Text>
              </View>
            </View>

            <View style={styles.heroMetricPill}>
              <View style={[styles.heroMetricIcon, { backgroundColor: 'rgba(251, 113, 133, 0.22)' }]}>
                <Ionicons name="arrow-up" size={14} color="#FB7185" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroMetricLabel}>Spent</Text>
                <Text style={styles.heroMetricValue} numberOfLines={1}>
                  {formatCurrency(analytics.totalSpent, selectedCurrency)}
                </Text>
              </View>
            </View>
          </View>

          {analytics.currentBudget > 0 && (
            <View style={styles.heroBudgetWrap}>
              <View style={styles.heroBudgetTrack}>
                <View
                  style={[
                    styles.heroBudgetFill,
                    { width: `${Math.round(budgetProgress * 100)}%`, backgroundColor: budgetBarColor },
                  ]}
                />
              </View>
              <View style={styles.budgetFooter}>
                <Text style={styles.heroBudgetText}>
                  {Math.round(budgetProgress * 100)}% of {formatCurrency(analytics.currentBudget, selectedCurrency)}
                </Text>
                <Text style={styles.heroBudgetText}>{analytics.daysRemainingInMonth}d left</Text>
              </View>
            </View>
          )}
        </LinearGradient>

        {/* Quick Stat Strip */}
        <View style={styles.quickStatsRow}>
          <View style={[styles.quickStatCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <View style={[styles.quickStatIcon, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="flame-outline" size={16} color={theme.accent} />
            </View>
            <Text style={[styles.quickStatLabel, { color: theme.secondaryText }]}>Daily Avg</Text>
            <Text style={[styles.quickStatValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(analytics.averageDailySpend, selectedCurrency)}
            </Text>
          </View>

          <View style={[styles.quickStatCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <View style={[styles.quickStatIcon, { backgroundColor: theme.greenSoft }]}>
              <Ionicons name="wallet-outline" size={16} color={theme.green} />
            </View>
            <Text style={[styles.quickStatLabel, { color: theme.secondaryText }]}>
              {analytics.currentBudget > 0 ? 'Safe / Day' : 'Projected'}
            </Text>
            <Text style={[styles.quickStatValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
              {analytics.currentBudget > 0
                ? formatCurrency(analytics.budgetRemainingPerDay, selectedCurrency)
                : formatCurrency(analytics.projectedMonthlySpend, selectedCurrency)}
            </Text>
          </View>
        </View>

        {/* Recent Spending 7-Day Gradient Bar Chart */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>7-Day Pulse</Text>
            <Text style={[styles.cardBadgeText, { color: theme.secondaryText }]}>
              {formatCurrency(totalRecent7Days, selectedCurrency)}
            </Text>
          </View>
          {totalRecent7Days <= 0 ? (
            <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
              No spending recorded in the last 7 days
            </Text>
          ) : (
            <BarChart data={recent7Days} height={150} averageValue={analytics.averageDailySpend} />
          )}
        </View>

        {/* Spending by Category */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Top Categories</Text>
            <Text style={[styles.cardBadgeText, { color: theme.secondaryText }]}>This month</Text>
          </View>
          {topCategories.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No category data available</Text>
          ) : (
            <View style={styles.listGroup}>
              {topCategories.map(([catId, amount]) => {
                const cat = getCategoryById(catId);
                const pct = analytics.totalSpent > 0 ? Math.round((amount / analytics.totalSpent) * 100) : 0;
                return (
                  <View key={catId} style={styles.catItemWrap}>
                    <View style={styles.row}>
                      <View style={[styles.catSquircle, { backgroundColor: `${cat.colorHex}22` }]}>
                        <Ionicons name={mapIconName(cat.iconName)} size={16} color={cat.colorHex} />
                      </View>
                      <View style={{ flex: 1, gap: 6 }}>
                        <View style={styles.catTopLine}>
                          <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>
                            {cat.name}
                          </Text>
                          <Text style={[styles.rowAmount, { color: theme.text }]}>
                            {formatCurrency(amount, selectedCurrency)}
                          </Text>
                        </View>
                        <View style={styles.catBarRow}>
                          <View style={[styles.miniTrack, { backgroundColor: theme.track }]}>
                            <View
                              style={[
                                styles.miniFill,
                                { width: `${Math.min(100, pct)}%`, backgroundColor: cat.colorHex },
                              ]}
                            />
                          </View>
                          <Text style={[styles.pctText, { color: theme.secondaryText }]}>{pct}%</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Recent Transactions */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Recent Activity</Text>
            <TouchableOpacity onPress={() => setShowRecent((v) => !v)} style={styles.toggleBtn}>
              <Text style={[styles.caption, { color: theme.accent, fontWeight: '600' }]}>
                {showRecent ? 'Hide' : 'Show'}
              </Text>
              <Ionicons
                name={showRecent ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={theme.accent}
              />
            </TouchableOpacity>
          </View>

          {showRecent && (
            recentTransactions.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
                Tap the + button below to log your first transaction
              </Text>
            ) : (
              <View style={styles.listGroup}>
                {recentTransactions.map((tx, idx) => {
                  const cat = getCategoryById(tx.categoryID);
                  const amountStr = formatCurrency(tx.price, selectedCurrency);
                  return (
                    <View key={tx.id}>
                      <TouchableOpacity onPress={() => onEditExpense(tx)} style={styles.row} activeOpacity={0.7}>
                        <View style={[styles.catSquircle, { backgroundColor: `${cat.colorHex}22` }]}>
                          <Ionicons name={mapIconName(cat.iconName)} size={16} color={cat.colorHex} />
                        </View>
                        <View style={styles.txInfo}>
                          <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>
                            {tx.title}
                          </Text>
                          <Text style={[styles.caption, { color: theme.secondaryText }]}>
                            {cat.name} · {formatShortDate(tx.date)}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.rowAmount,
                            { color: tx.type === 'income' ? theme.green : theme.text },
                          ]}
                        >
                          {tx.type === 'income' ? `+${amountStr}` : `-${amountStr}`}
                        </Text>
                      </TouchableOpacity>
                      {idx < recentTransactions.length - 1 && (
                        <View style={[styles.rowDivider, { backgroundColor: theme.border, marginLeft: 50 }]} />
                      )}
                    </View>
                  );
                })}

                <TouchableOpacity
                  onPress={onSwitchToTransactions}
                  style={[styles.viewAllBtn, { backgroundColor: theme.accentSoft }]}
                >
                  <Text style={[styles.viewAllText, { color: theme.accent }]}>View All Transactions</Text>
                  <Ionicons name="arrow-forward" size={15} color={theme.accent} />
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
    paddingTop: 10,
    paddingBottom: 12,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: { fontSize: 21, fontWeight: '800', letterSpacing: -0.4 },
  brandSub: { fontSize: 12, fontWeight: '600', marginTop: -1 },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconPill: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addPillText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    gap: 14,
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    gap: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heroGlowOrb: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLabel: {
    color: 'rgba(226, 232, 240, 0.72)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  heroBadgeText: { color: '#F8FAFC', fontSize: 11, fontWeight: '700' },
  heroBalance: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1,
  },
  heroMetricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroMetricPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroMetricIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMetricLabel: { color: 'rgba(226,232,240,0.68)', fontSize: 11, fontWeight: '600' },
  heroMetricValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', marginTop: 1 },
  heroBudgetWrap: { gap: 6, marginTop: 2 },
  heroBudgetTrack: {
    height: 7,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
  },
  heroBudgetFill: { height: '100%', borderRadius: 5 },
  heroBudgetText: { color: 'rgba(226,232,240,0.75)', fontSize: 11, fontWeight: '600' },
  budgetFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    gap: 6,
  },
  quickStatIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStatLabel: { fontSize: 12, fontWeight: '600' },
  quickStatValue: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  card: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  cardBadgeText: { fontSize: 12, fontWeight: '700' },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 18,
    fontSize: 13,
  },
  listGroup: { gap: 4 },
  catItemWrap: { paddingVertical: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  catSquircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniTrack: { flex: 1, height: 5, borderRadius: 4, overflow: 'hidden' },
  miniFill: { height: '100%', borderRadius: 4 },
  pctText: { fontSize: 11, fontWeight: '700', width: 32, textAlign: 'right' },
  txInfo: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 14, fontWeight: '700' },
  rowAmount: { fontSize: 14, fontWeight: '800' },
  rowDivider: { height: StyleSheet.hairlineWidth },
  caption: { fontSize: 12 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  viewAllBtn: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  viewAllText: { fontSize: 14, fontWeight: '700' },
});
