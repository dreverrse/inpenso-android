import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Expense } from '../types/models';
import { budgetKey, formatCurrency, formatTransactionDate, getMonthName, getShortMonthName } from '../utils/format';
import { mapIconName } from '../utils/icons';
import { MonthYearPicker } from '../components/MonthYearPicker';

type SortOption = 'dateDesc' | 'dateAsc' | 'amountDesc' | 'amountAsc' | 'titleAsc';
type TypeFilter = 'all' | 'expenses' | 'incomes';

const SORT_LABELS: Record<SortOption, string> = {
  dateDesc: 'Newest First',
  dateAsc: 'Oldest First',
  amountDesc: 'Highest Amount',
  amountAsc: 'Lowest Amount',
  titleAsc: 'Title A-Z',
};

interface TransactionsScreenProps {
  onOpenAdd: () => void;
  onEditExpense: (expense: Expense) => void;
}

export function TransactionsScreen({ onOpenAdd, onEditExpense }: TransactionsScreenProps) {
  const {
    theme,
    expenses,
    monthlyBudgets,
    selectedCurrency,
    getCategoryById,
    categoriesForFilter,
    orderedCategoryIDsFor,
    deleteExpense,
    restoreExpenses,
  } = useApp();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [searchText, setSearchText] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('dateDesc');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [selectedCategoryIDs, setSelectedCategoryIDs] = useState<string[] | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  // Undo snackbar state
  const [deletedBackup, setDeletedBackup] = useState<Expense | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  const allFilterCategories = useMemo(
    () => categoriesForFilter(new Set(expenses.map((e) => e.categoryID))),
    [categoriesForFilter, expenses]
  );

  const activeCategorySet = useMemo(() => {
    if (!selectedCategoryIDs) return new Set(allFilterCategories.map((c) => c.id));
    return new Set(selectedCategoryIDs);
  }, [selectedCategoryIDs, allFilterCategories]);

  const filteredExpenses = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const list = expenses.filter((e) => {
      const d = new Date(e.date);
      if (d.getMonth() + 1 !== selectedMonth || d.getFullYear() !== selectedYear) return false;
      if (typeFilter === 'expenses' && e.type !== 'expense') return false;
      if (typeFilter === 'incomes' && e.type !== 'income') return false;
      if (selectedCategoryIDs && !activeCategorySet.has(e.categoryID)) return false;
      if (query) {
        const catName = getCategoryById(e.categoryID).name.toLowerCase();
        const matches =
          e.title.toLowerCase().includes(query) ||
          catName.includes(query) ||
          (e.notes?.toLowerCase().includes(query) ?? false);
        if (!matches) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      switch (sortOption) {
        case 'dateDesc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'dateAsc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'amountDesc':
          return b.price - a.price;
        case 'amountAsc':
          return a.price - b.price;
        case 'titleAsc':
          return a.title.localeCompare(b.title);
      }
    });

    return list;
  }, [
    expenses,
    selectedMonth,
    selectedYear,
    typeFilter,
    selectedCategoryIDs,
    activeCategorySet,
    searchText,
    sortOption,
    getCategoryById,
  ]);

  const totalSpent = useMemo(
    () => filteredExpenses.filter((e) => e.type === 'expense').reduce((s, e) => s + e.price, 0),
    [filteredExpenses]
  );
  const totalIncome = useMemo(
    () => filteredExpenses.filter((e) => e.type === 'income').reduce((s, e) => s + e.price, 0),
    [filteredExpenses]
  );
  const netCashflow = totalIncome - totalSpent;
  const currentBudget = monthlyBudgets[budgetKey(selectedMonth, selectedYear)] ?? 0;

  const grouped = useMemo(() => {
    const map: Record<string, Expense[]> = {};
    for (const e of filteredExpenses) {
      if (!map[e.categoryID]) map[e.categoryID] = [];
      map[e.categoryID].push(e);
    }
    const orderedKeys = orderedCategoryIDsFor(new Set(Object.keys(map)));
    return orderedKeys.map((categoryID) => ({
      category: getCategoryById(categoryID),
      items: map[categoryID],
    }));
  }, [filteredExpenses, orderedCategoryIDsFor, getCategoryById]);

  const handleDeleteWithUndo = (expense: Expense) => {
    deleteExpense(expense.id);
    setDeletedBackup(expense);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => {
      setDeletedBackup(null);
    }, 3500);
  };

  const handleUndo = () => {
    if (deletedBackup) {
      restoreExpenses([deletedBackup]);
      setDeletedBackup(null);
    }
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  };

  const toggleFilterCategory = (id: string) => {
    const current = new Set(selectedCategoryIDs ?? allFilterCategories.map((c) => c.id));
    if (current.has(id)) {
      if (current.size > 1) current.delete(id);
    } else {
      current.add(id);
    }
    setSelectedCategoryIDs(Array.from(current));
  };

  const isFilteredByCategory =
    selectedCategoryIDs !== null && selectedCategoryIDs.length < allFilterCategories.length;

  return (
    <View style={[styles.container, { backgroundColor: theme.groupedBackground }]}>
      <View style={styles.topBar}>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Transactions</Text>
        <TouchableOpacity
          onPress={onOpenAdd}
          style={[styles.iconCircleBtn, { backgroundColor: theme.accent }]}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search & Controls */}
      <View style={styles.controlsWrap}>
        <View style={[styles.searchBox, { backgroundColor: theme.cardBackground }]}>
          <Ionicons name="search" size={16} color={theme.secondaryText} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search transactions"
            placeholderTextColor={theme.secondaryText}
            style={[styles.searchInput, { color: theme.text }]}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={16} color={theme.secondaryText} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterChipsRow}>
          {(['all', 'expenses', 'incomes'] as TypeFilter[]).map((tf) => {
            const active = typeFilter === tf;
            return (
              <TouchableOpacity
                key={tf}
                onPress={() => setTypeFilter(tf)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? theme.accent : theme.cardBackground,
                    borderColor: active ? theme.accent : theme.border,
                  },
                ]}
              >
                <Text style={[styles.filterChipText, { color: active ? '#FFFFFF' : theme.text }]}>
                  {tf === 'all' ? 'All' : tf === 'expenses' ? 'Expenses' : 'Incomes'}
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            onPress={() => setShowSortModal(true)}
            style={[styles.filterChip, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
          >
            <Ionicons name="swap-vertical" size={13} color={theme.accent} />
            <Text style={[styles.filterChipText, { color: theme.text }]}>Sort</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowFilterModal(true)}
            style={[
              styles.filterChip,
              {
                backgroundColor: isFilteredByCategory ? `${theme.accent}22` : theme.cardBackground,
                borderColor: isFilteredByCategory ? theme.accent : theme.border,
              },
            ]}
          >
            <Ionicons name="funnel-outline" size={13} color={theme.accent} />
            <Text style={[styles.filterChipText, { color: theme.text }]}>Filter</Text>
          </TouchableOpacity>
        </View>
      </View>

      <MonthYearPicker
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onChange={(m, y) => {
          setSelectedMonth(m);
          setSelectedYear(y);
        }}
        monthsToShow={24}
      />

      {filteredExpenses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color={theme.gray} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No Transactions Found</Text>
          <Text style={[styles.emptySub, { color: theme.secondaryText }]}>
            {searchText
              ? 'Try adjusting your search or filters'
              : isFilteredByCategory
              ? 'Try selecting more categories in the filter'
              : `Add your first transaction for ${getMonthName(selectedMonth)} ${selectedYear}`}
          </Text>
          {isFilteredByCategory ? (
            <TouchableOpacity
              onPress={() => setSelectedCategoryIDs(null)}
              style={[styles.emptyBtn, { borderColor: theme.accent, borderWidth: 1.5 }]}
            >
              <Text style={{ color: theme.accent, fontWeight: '700' }}>Reset Filters</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={onOpenAdd} style={[styles.emptyBtn, { backgroundColor: theme.accent }]}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Add Transaction</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Summary Card */}
          <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCol}>
                <Text style={[styles.caption, { color: theme.secondaryText }]}>Income</Text>
                <Text style={[styles.summaryNum, { color: theme.green }]} numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency(totalIncome, selectedCurrency)}
                </Text>
              </View>
              <View style={styles.summaryCol}>
                <Text style={[styles.caption, { color: theme.secondaryText }]}>Spent</Text>
                <Text style={[styles.summaryNum, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency(totalSpent, selectedCurrency)}
                </Text>
              </View>
              <View style={styles.summaryCol}>
                <Text style={[styles.caption, { color: theme.secondaryText }]}>Net</Text>
                <Text
                  style={[styles.summaryNum, { color: netCashflow >= 0 ? theme.green : theme.red }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatCurrency(netCashflow, selectedCurrency)}
                </Text>
              </View>
              <View style={styles.summaryColSmall}>
                <Text style={[styles.caption, { color: theme.secondaryText }]}>Items</Text>
                <Text style={[styles.summaryNum, { color: theme.text }]}>{filteredExpenses.length}</Text>
              </View>
            </View>

            {currentBudget > 0 && (
              <View style={{ gap: 6, marginTop: 8 }}>
                <View style={styles.budgetHeaderRow}>
                  <Text style={[styles.caption, { color: theme.secondaryText }]}>Monthly Budget</Text>
                  <Text style={[styles.caption, { color: theme.secondaryText }]}>
                    {formatCurrency(totalSpent, selectedCurrency)} of {formatCurrency(currentBudget, selectedCurrency)}
                  </Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: theme.track }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(100, Math.round((totalSpent / currentBudget) * 100))}%`,
                        backgroundColor:
                          totalSpent / currentBudget >= 0.9
                            ? theme.red
                            : totalSpent / currentBudget >= 0.75
                            ? theme.orange
                            : theme.accent,
                      },
                    ]}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Grouped by Category */}
          {grouped.map(({ category, items }) => {
            const groupTotal = items.reduce((s, t) => s + (t.type === 'income' ? t.price : -t.price), 0);
            return (
              <View key={category.id} style={styles.groupSection}>
                <View style={styles.groupHeader}>
                  <View style={styles.groupHeaderLeft}>
                    <View style={[styles.groupIcon, { backgroundColor: category.colorHex }]}>
                      <Ionicons name={mapIconName(category.iconName)} size={14} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.groupTitle, { color: theme.text }]}>{category.name}</Text>
                  </View>
                  <Text
                    style={[
                      styles.groupTotal,
                      { color: groupTotal >= 0 ? theme.green : theme.secondaryText },
                    ]}
                  >
                    {formatCurrency(groupTotal, selectedCurrency)}
                  </Text>
                </View>

                <View style={[styles.groupCard, { backgroundColor: theme.cardBackground }]}>
                  {items.map((tx, idx) => {
                    const d = new Date(tx.date);
                    const amountStr = formatCurrency(tx.price, selectedCurrency);
                    return (
                      <View key={tx.id}>
                        <TouchableOpacity
                          onPress={() => onEditExpense(tx)}
                          activeOpacity={0.7}
                          style={styles.txRow}
                        >
                          <View style={[styles.dateBadge, { backgroundColor: theme.tertiaryBackground }]}>
                            <Text style={[styles.dateDay, { color: theme.text }]}>{d.getDate()}</Text>
                            <Text style={[styles.dateMonth, { color: theme.secondaryText }]}>
                              {getShortMonthName(d.getMonth() + 1).toUpperCase()}
                            </Text>
                          </View>

                          <View style={{ flex: 1, gap: 2 }}>
                            <Text style={[styles.txTitle, { color: theme.text }]} numberOfLines={1}>
                              {tx.title}
                            </Text>
                            <Text style={[styles.caption, { color: theme.secondaryText }]} numberOfLines={1}>
                              {formatTransactionDate(tx.date)}
                            </Text>
                          </View>

                          <Text
                            style={[
                              styles.txAmount,
                              { color: tx.type === 'income' ? theme.green : theme.text },
                            ]}
                          >
                            {tx.type === 'income' ? `+${amountStr}` : amountStr}
                          </Text>

                          <TouchableOpacity
                            onPress={() => handleDeleteWithUndo(tx)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={styles.deleteBtn}
                          >
                            <Ionicons name="trash-outline" size={16} color={theme.red} />
                          </TouchableOpacity>
                        </TouchableOpacity>
                        {idx < items.length - 1 && (
                          <View style={[styles.divider, { backgroundColor: theme.border, marginLeft: 56 }]} />
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Undo Snackbar */}
      {deletedBackup && (
        <View style={styles.snackbar}>
          <Ionicons name="checkmark-circle" size={18} color="#34C759" />
          <Text style={styles.snackbarText}>Transaction deleted</Text>
          <TouchableOpacity onPress={handleUndo}>
            <Text style={styles.snackbarUndo}>Undo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sort Modal */}
      <Modal visible={showSortModal} transparent animationType="fade" onRequestClose={() => setShowSortModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSortModal(false)}>
          <View style={[styles.sheetBox, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>Sort By</Text>
            {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
              <TouchableOpacity
                key={opt}
                onPress={() => {
                  setSortOption(opt);
                  setShowSortModal(false);
                }}
                style={styles.sheetOption}
              >
                <Text style={[styles.sheetOptionText, { color: theme.text }]}>{SORT_LABELS[opt]}</Text>
                {sortOption === opt && <Ionicons name="checkmark" size={18} color={theme.accent} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Category Filter Modal */}
      <Modal visible={showFilterModal} transparent animationType="slide" onRequestClose={() => setShowFilterModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.sheetBox, { backgroundColor: theme.cardBackground, maxHeight: '75%' }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: theme.text, marginBottom: 0 }]}>Filter Categories</Text>
              <TouchableOpacity onPress={() => setSelectedCategoryIDs(null)}>
                <Text style={{ color: theme.accent, fontWeight: '600' }}>Select All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ marginVertical: 10 }}>
              {allFilterCategories.map((cat) => {
                const checked = activeCategorySet.has(cat.id);
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => toggleFilterCategory(cat.id)}
                    style={styles.sheetOption}
                  >
                    <View style={styles.groupHeaderLeft}>
                      <View style={[styles.groupIcon, { backgroundColor: cat.colorHex }]}>
                        <Ionicons name={mapIconName(cat.iconName)} size={14} color="#FFFFFF" />
                      </View>
                      <Text style={[styles.sheetOptionText, { color: theme.text }]}>{cat.name}</Text>
                    </View>
                    {checked && <Ionicons name="checkmark-circle" size={20} color={theme.accent} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowFilterModal(false)}
              style={[styles.applyBtn, { backgroundColor: theme.accent }]}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 8,
  },
  screenTitle: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  iconCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsWrap: { paddingHorizontal: 16, gap: 8, marginBottom: 4 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  filterChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 12, fontWeight: '600' },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
    gap: 14,
  },
  card: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryCol: { flex: 1, gap: 2 },
  summaryColSmall: { width: 42, alignItems: 'flex-end', gap: 2 },
  summaryNum: { fontSize: 15, fontWeight: '800' },
  budgetHeaderRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressTrack: { height: 6, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  groupSection: { gap: 8 },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  groupHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  groupIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupTitle: { fontSize: 15, fontWeight: '700' },
  groupTotal: { fontSize: 14, fontWeight: '700' },
  groupCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  dateBadge: {
    width: 40,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  dateDay: { fontSize: 16, fontWeight: '700' },
  dateMonth: { fontSize: 10, fontWeight: '600' },
  txTitle: { fontSize: 15, fontWeight: '600' },
  txAmount: { fontSize: 15, fontWeight: '700' },
  deleteBtn: { padding: 4 },
  divider: { height: StyleSheet.hairlineWidth },
  caption: { fontSize: 12 },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptySub: { fontSize: 14, textAlign: 'center' },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 6,
  },
  snackbar: {
    position: 'absolute',
    bottom: 92,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(15,23,42,0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  snackbarText: { flex: 1, color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  snackbarUndo: { color: '#FFD60A', fontSize: 14, fontWeight: '800' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetBox: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 32,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  sheetOptionText: { fontSize: 15, fontWeight: '500' },
  applyBtn: {
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
});
