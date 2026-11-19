import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppTheme,
  BUILT_IN_CATEGORIES,
  BUILT_IN_CATEGORY_IDS,
  builtInKeyFromCategoryID,
  CategoryCatalogState,
  Expense,
  FALLBACK_CATEGORY,
  FinanceCategory,
  TransactionType,
} from '../types/models';
import { DARK_THEME, LIGHT_THEME, ThemeColors } from '../theme/colors';
import { budgetKey, generateId } from '../utils/format';

const STORAGE_KEYS = {
  EXPENSES: '@inpenso/expenses',
  BUDGETS: '@inpenso/budgets',
  CATEGORIES: '@inpenso/category_catalog',
  SETTINGS: '@inpenso/settings',
};

interface PersistedSettings {
  selectedCurrency: string;
  selectedTheme: AppTheme;
  defaultCategoryID: string;
}

const DEFAULT_SETTINGS: PersistedSettings = {
  selectedCurrency: 'IDR',
  selectedTheme: 'dark',
  defaultCategoryID: 'builtin-food',
};

const INITIAL_CATALOG: CategoryCatalogState = {
  orderedCategoryIDs: BUILT_IN_CATEGORIES.map((c) => c.id),
  customCategories: [],
  builtInOverrides: {},
  hiddenCategoryIDs: [],
};

function normalizeCatalog(state: CategoryCatalogState): CategoryCatalogState {
  const seenCustom = new Set<string>();
  const customCategories = (state.customCategories ?? [])
    .filter((c) => {
      if (BUILT_IN_CATEGORY_IDS.has(c.id) || seenCustom.has(c.id)) return false;
      seenCustom.add(c.id);
      return true;
    })
    .map((c) => ({ ...c, isCustom: true }));

  const builtInOverrides: Record<string, FinanceCategory> = {};
  for (const [key, val] of Object.entries(state.builtInOverrides ?? {})) {
    if (BUILT_IN_CATEGORY_IDS.has(key)) {
      builtInOverrides[key] = { ...val, id: key, isCustom: false };
    }
  }

  const knownIDs = [...BUILT_IN_CATEGORIES.map((c) => c.id), ...customCategories.map((c) => c.id)];
  const knownSet = new Set(knownIDs);
  const orderedCategoryIDs: string[] = [];
  const seenOrdered = new Set<string>();

  for (const id of state.orderedCategoryIDs ?? []) {
    if (knownSet.has(id) && !seenOrdered.has(id)) {
      orderedCategoryIDs.push(id);
      seenOrdered.add(id);
    }
  }
  for (const id of knownIDs) {
    if (!seenOrdered.has(id)) {
      orderedCategoryIDs.push(id);
    }
  }

  const hiddenCategoryIDs = Array.from(new Set((state.hiddenCategoryIDs ?? []).filter((id) => knownSet.has(id))));

  return {
    orderedCategoryIDs,
    customCategories,
    builtInOverrides,
    hiddenCategoryIDs,
  };
}

interface AppContextValue {
  isReady: boolean;
  theme: ThemeColors;
  // Settings
  selectedCurrency: string;
  selectedTheme: AppTheme;
  defaultCategoryID: string;
  setSelectedCurrency: (code: string) => void;
  setSelectedTheme: (theme: AppTheme) => void;
  setDefaultCategoryID: (id: string) => void;
  // Expenses
  expenses: Expense[];
  addExpense: (input: {
    title: string;
    price: number;
    date: string;
    categoryID: string;
    type: TransactionType;
    notes?: string;
  }) => Expense;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  restoreExpenses: (items: Expense[]) => void;
  replaceAllExpenses: (items: Expense[]) => void;
  // Budgets
  monthlyBudgets: Record<string, number>;
  setMonthlyBudget: (month: number, year: number, amount: number) => void;
  // Categories
  visibleCategories: FinanceCategory[];
  hiddenCategories: FinanceCategory[];
  getCategoryById: (id: string) => FinanceCategory;
  categoriesForPicker: (includingId?: string) => FinanceCategory[];
  categoriesForFilter: (usedIds: Set<string>) => FinanceCategory[];
  orderedCategoryIDsFor: (ids: Set<string>) => string[];
  preferredCategoryID: (id?: string) => string;
  addCategory: (name: string, iconName: string, colorHex: string) => void;
  updateCategory: (category: FinanceCategory) => void;
  hideCategory: (category: FinanceCategory) => void;
  restoreCategory: (category: FinanceCategory) => void;
  moveCategory: (sourceID: string, direction: 'left' | 'right') => void;
  resetBuiltInOverride: (id: string) => void;
  isCategoryHidden: (id: string) => boolean;
  hasBuiltInOverride: (id: string) => boolean;
  // Global actions
  resetAllData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlyBudgets, setMonthlyBudgets] = useState<Record<string, number>>({});
  const [catalog, setCatalog] = useState<CategoryCatalogState>(INITIAL_CATALOG);
  const [settings, setSettings] = useState<PersistedSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    (async () => {
      try {
        const [rawExpenses, rawBudgets, rawCategories, rawSettings] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.EXPENSES),
          AsyncStorage.getItem(STORAGE_KEYS.BUDGETS),
          AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES),
          AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
        ]);

        if (rawExpenses) {
          const parsed = JSON.parse(rawExpenses);
          if (Array.isArray(parsed)) setExpenses(parsed);
        }
        if (rawBudgets) {
          const parsed = JSON.parse(rawBudgets);
          if (parsed && typeof parsed === 'object') setMonthlyBudgets(parsed);
        }
        if (rawCategories) {
          const parsed = JSON.parse(rawCategories);
          if (parsed && typeof parsed === 'object') setCatalog(normalizeCatalog(parsed));
        }
        if (rawSettings) {
          const parsed = JSON.parse(rawSettings);
          if (parsed && typeof parsed === 'object') {
            setSettings({ ...DEFAULT_SETTINGS, ...parsed });
          }
        }
      } catch {
        // Keep defaults on storage error
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  const persistExpenses = useCallback((next: Expense[]) => {
    AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(next)).catch(() => {});
  }, []);

  const persistBudgets = useCallback((next: Record<string, number>) => {
    AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(next)).catch(() => {});
  }, []);

  const persistCatalog = useCallback((next: CategoryCatalogState) => {
    AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(next)).catch(() => {});
  }, []);

  const persistSettings = useCallback((next: PersistedSettings) => {
    AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(next)).catch(() => {});
  }, []);

  const theme: ThemeColors = useMemo(() => {
    const dark = settings.selectedTheme === 'dark' || (settings.selectedTheme === 'system' && systemScheme === 'dark');
    return dark ? DARK_THEME : LIGHT_THEME;
  }, [settings.selectedTheme, systemScheme]);

  // Category helpers
  const categoryMap = useMemo(() => {
    const map: Record<string, FinanceCategory> = {};
    for (const c of BUILT_IN_CATEGORIES) {
      map[c.id] = catalog.builtInOverrides[c.id] ?? c;
    }
    for (const c of catalog.customCategories) {
      map[c.id] = c;
    }
    return map;
  }, [catalog]);

  const hiddenSet = useMemo(() => new Set(catalog.hiddenCategoryIDs), [catalog.hiddenCategoryIDs]);

  const visibleCategories = useMemo(
    () => catalog.orderedCategoryIDs.filter((id) => !hiddenSet.has(id)).map((id) => categoryMap[id]).filter(Boolean),
    [catalog.orderedCategoryIDs, hiddenSet, categoryMap]
  );

  const hiddenCategories = useMemo(
    () => catalog.orderedCategoryIDs.filter((id) => hiddenSet.has(id)).map((id) => categoryMap[id]).filter(Boolean),
    [catalog.orderedCategoryIDs, hiddenSet, categoryMap]
  );

  const getCategoryById = useCallback(
    (id: string): FinanceCategory => categoryMap[id] ?? FALLBACK_CATEGORY,
    [categoryMap]
  );

  const categoriesForPicker = useCallback(
    (includingId?: string): FinanceCategory[] => {
      const list = [...visibleCategories];
      if (includingId && !list.some((c) => c.id === includingId) && categoryMap[includingId]) {
        list.push(categoryMap[includingId]);
      }
      return list;
    },
    [visibleCategories, categoryMap]
  );

  const orderedCategoryIDsFor = useCallback(
    (ids: Set<string>): string[] => {
      const ordered = catalog.orderedCategoryIDs.filter((id) => ids.has(id));
      const known = new Set(ordered);
      const rest = Array.from(ids)
        .filter((id) => !known.has(id))
        .sort((a, b) => getCategoryById(a).name.localeCompare(getCategoryById(b).name));
      return [...ordered, ...rest];
    },
    [catalog.orderedCategoryIDs, getCategoryById]
  );

  const categoriesForFilter = useCallback(
    (usedIds: Set<string>): FinanceCategory[] => {
      const visibleIds = new Set(visibleCategories.map((c) => c.id));
      const extraIds = new Set(Array.from(usedIds).filter((id) => !visibleIds.has(id)));
      const extras = orderedCategoryIDsFor(extraIds).map((id) => categoryMap[id]).filter(Boolean);
      return [...visibleCategories, ...extras];
    },
    [visibleCategories, orderedCategoryIDsFor, categoryMap]
  );

  const preferredCategoryID = useCallback(
    (id?: string): string => {
      if (id && !hiddenSet.has(id) && categoryMap[id]) return id;
      return visibleCategories[0]?.id ?? FALLBACK_CATEGORY.id;
    },
    [hiddenSet, categoryMap, visibleCategories]
  );

  // Settings mutations
  const setSelectedCurrency = useCallback(
    (selectedCurrency: string) => {
      setSettings((prev) => {
        const next = { ...prev, selectedCurrency };
        persistSettings(next);
        return next;
      });
    },
    [persistSettings]
  );

  const setSelectedTheme = useCallback(
    (selectedTheme: AppTheme) => {
      setSettings((prev) => {
        const next = { ...prev, selectedTheme };
        persistSettings(next);
        return next;
      });
    },
    [persistSettings]
  );

  const setDefaultCategoryID = useCallback(
    (defaultCategoryID: string) => {
      setSettings((prev) => {
        const next = { ...prev, defaultCategoryID };
        persistSettings(next);
        return next;
      });
    },
    [persistSettings]
  );

  // Expense mutations
  const addExpense = useCallback(
    (input: {
      title: string;
      price: number;
      date: string;
      categoryID: string;
      type: TransactionType;
      notes?: string;
    }): Expense => {
      const created: Expense = {
        id: generateId('tx'),
        title: input.title.trim(),
        price: input.price,
        date: input.date,
        category: builtInKeyFromCategoryID(input.categoryID),
        type: input.type,
        categoryID: input.categoryID,
        notes: input.notes?.trim() ? input.notes.trim() : undefined,
      };
      setExpenses((prev) => {
        const next = [...prev, created];
        persistExpenses(next);
        return next;
      });
      return created;
    },
    [persistExpenses]
  );

  const updateExpense = useCallback(
    (updated: Expense) => {
      setExpenses((prev) => {
        const next = prev.map((e) =>
          e.id === updated.id
            ? {
                ...updated,
                category: builtInKeyFromCategoryID(updated.categoryID),
                notes: updated.notes?.trim() ? updated.notes.trim() : undefined,
              }
            : e
        );
        persistExpenses(next);
        return next;
      });
    },
    [persistExpenses]
  );

  const deleteExpense = useCallback(
    (id: string) => {
      setExpenses((prev) => {
        const next = prev.filter((e) => e.id !== id);
        persistExpenses(next);
        return next;
      });
    },
    [persistExpenses]
  );

  const restoreExpenses = useCallback(
    (items: Expense[]) => {
      setExpenses((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const toAdd = items.filter((e) => !existingIds.has(e.id));
        const next = [...prev, ...toAdd];
        persistExpenses(next);
        return next;
      });
    },
    [persistExpenses]
  );

  const replaceAllExpenses = useCallback(
    (items: Expense[]) => {
      const normalized = items.map((item) => {
        const categoryID = item.categoryID || (item.category ? `builtin-${item.category}` : 'builtin-others');
        return {
          id: item.id || generateId('tx'),
          title: String(item.title ?? 'Untitled'),
          price: Number(item.price) || 0,
          date: item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
          category: builtInKeyFromCategoryID(categoryID),
          type: item.type === 'income' ? ('income' as TransactionType) : ('expense' as TransactionType),
          categoryID,
          notes: item.notes || undefined,
        };
      });
      setExpenses(normalized);
      persistExpenses(normalized);
    },
    [persistExpenses]
  );

  // Budgets
  const setMonthlyBudget = useCallback(
    (month: number, year: number, amount: number) => {
      const key = budgetKey(month, year);
      setMonthlyBudgets((prev) => {
        const next = { ...prev, [key]: Math.max(0, amount) };
        persistBudgets(next);
        return next;
      });
    },
    [persistBudgets]
  );

  // Category mutations
  const addCategory = useCallback(
    (name: string, iconName: string, colorHex: string) => {
      const created: FinanceCategory = {
        id: generateId('custom'),
        name: name.trim(),
        iconName,
        colorHex,
        isCustom: true,
      };
      setCatalog((prev) => {
        const next = normalizeCatalog({
          ...prev,
          customCategories: [...prev.customCategories, created],
          orderedCategoryIDs: [...prev.orderedCategoryIDs, created.id],
        });
        persistCatalog(next);
        return next;
      });
    },
    [persistCatalog]
  );

  const updateCategory = useCallback(
    (category: FinanceCategory) => {
      setCatalog((prev) => {
        let next: CategoryCatalogState;
        if (category.isCustom) {
          next = normalizeCatalog({
            ...prev,
            customCategories: prev.customCategories.map((c) => (c.id === category.id ? { ...category, isCustom: true } : c)),
          });
        } else if (BUILT_IN_CATEGORY_IDS.has(category.id)) {
          next = normalizeCatalog({
            ...prev,
            builtInOverrides: {
              ...prev.builtInOverrides,
              [category.id]: { ...category, isCustom: false },
            },
          });
        } else {
          return prev;
        }
        persistCatalog(next);
        return next;
      });
    },
    [persistCatalog]
  );

  const hideCategory = useCallback(
    (category: FinanceCategory) => {
      if (visibleCategories.length <= 1) return;
      setCatalog((prev) => {
        if (prev.hiddenCategoryIDs.includes(category.id)) return prev;
        const next = normalizeCatalog({
          ...prev,
          hiddenCategoryIDs: [...prev.hiddenCategoryIDs, category.id],
        });
        persistCatalog(next);
        return next;
      });
    },
    [visibleCategories.length, persistCatalog]
  );

  const restoreCategory = useCallback(
    (category: FinanceCategory) => {
      setCatalog((prev) => {
        const next = normalizeCatalog({
          ...prev,
          hiddenCategoryIDs: prev.hiddenCategoryIDs.filter((id) => id !== category.id),
        });
        persistCatalog(next);
        return next;
      });
    },
    [persistCatalog]
  );

  const moveCategory = useCallback(
    (sourceID: string, direction: 'left' | 'right') => {
      setCatalog((prev) => {
        const visibleIds = prev.orderedCategoryIDs.filter((id) => !prev.hiddenCategoryIDs.includes(id));
        const idx = visibleIds.indexOf(sourceID);
        if (idx === -1) return prev;
        const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= visibleIds.length) return prev;

        const targetID = visibleIds[targetIdx];
        const ordered = [...prev.orderedCategoryIDs];
        const a = ordered.indexOf(sourceID);
        const b = ordered.indexOf(targetID);
        if (a === -1 || b === -1) return prev;
        [ordered[a], ordered[b]] = [ordered[b], ordered[a]];

        const next = normalizeCatalog({ ...prev, orderedCategoryIDs: ordered });
        persistCatalog(next);
        return next;
      });
    },
    [persistCatalog]
  );

  const resetBuiltInOverride = useCallback(
    (id: string) => {
      setCatalog((prev) => {
        const copy = { ...prev.builtInOverrides };
        delete copy[id];
        const next = normalizeCatalog({ ...prev, builtInOverrides: copy });
        persistCatalog(next);
        return next;
      });
    },
    [persistCatalog]
  );

  const isCategoryHidden = useCallback((id: string) => hiddenSet.has(id), [hiddenSet]);
  const hasBuiltInOverride = useCallback((id: string) => Boolean(catalog.builtInOverrides[id]), [catalog.builtInOverrides]);

  const resetAllData = useCallback(() => {
    setExpenses([]);
    setMonthlyBudgets({});
    persistExpenses([]);
    persistBudgets({});
  }, [persistExpenses, persistBudgets]);

  const value: AppContextValue = {
    isReady,
    theme,
    selectedCurrency: settings.selectedCurrency,
    selectedTheme: settings.selectedTheme,
    defaultCategoryID: settings.defaultCategoryID,
    setSelectedCurrency,
    setSelectedTheme,
    setDefaultCategoryID,
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    restoreExpenses,
    replaceAllExpenses,
    monthlyBudgets,
    setMonthlyBudget,
    visibleCategories,
    hiddenCategories,
    getCategoryById,
    categoriesForPicker,
    categoriesForFilter,
    orderedCategoryIDsFor,
    preferredCategoryID,
    addCategory,
    updateCategory,
    hideCategory,
    restoreCategory,
    moveCategory,
    resetBuiltInOverride,
    isCategoryHidden,
    hasBuiltInOverride,
    resetAllData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
