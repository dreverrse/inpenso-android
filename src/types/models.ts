export type TransactionType = 'expense' | 'income';

export type BuiltInCategoryKey =
  | 'food'
  | 'eatingOut'
  | 'rent'
  | 'shopping'
  | 'entertainment'
  | 'transportation'
  | 'utilities'
  | 'subscriptions'
  | 'healthcare'
  | 'education'
  | 'others';

export interface Expense {
  id: string;
  title: string;
  price: number;
  date: string; // ISO 8601 date string
  category: BuiltInCategoryKey;
  type: TransactionType;
  categoryID: string;
  notes?: string;
}

export interface FinanceCategory {
  id: string;
  name: string;
  iconName: string;
  colorHex: string;
  isCustom: boolean;
}

export interface CategoryCatalogState {
  orderedCategoryIDs: string[];
  customCategories: FinanceCategory[];
  builtInOverrides: Record<string, FinanceCategory>;
  hiddenCategoryIDs: string[];
}

export type AppTheme = 'light' | 'dark' | 'system';

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
}

export const AVAILABLE_CURRENCIES: CurrencyOption[] = [
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'MDL', symbol: 'L', name: 'Moldovan Leu' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
];

export const BUILT_IN_CATEGORIES: FinanceCategory[] = [
  { id: 'builtin-food', name: 'Food', iconName: 'cart.fill', colorHex: '#34C759', isCustom: false },
  { id: 'builtin-eatingOut', name: 'Eating Out', iconName: 'fork.knife', colorHex: '#00C7BE', isCustom: false },
  { id: 'builtin-rent', name: 'Rent', iconName: 'house.fill', colorHex: '#AF52DE', isCustom: false },
  { id: 'builtin-shopping', name: 'Shopping', iconName: 'bag.fill', colorHex: '#FF9500', isCustom: false },
  { id: 'builtin-entertainment', name: 'Entertainment', iconName: 'tv.fill', colorHex: '#FF2D55', isCustom: false },
  { id: 'builtin-transportation', name: 'Transportation', iconName: 'car.fill', colorHex: '#007AFF', isCustom: false },
  { id: 'builtin-utilities', name: 'Utilities', iconName: 'bolt.fill', colorHex: '#FFCC00', isCustom: false },
  { id: 'builtin-subscriptions', name: 'Subscriptions', iconName: 'repeat', colorHex: '#30B0C7', isCustom: false },
  { id: 'builtin-healthcare', name: 'Healthcare', iconName: 'heart.fill', colorHex: '#FF3B30', isCustom: false },
  { id: 'builtin-education', name: 'Education', iconName: 'book.fill', colorHex: '#5856D6', isCustom: false },
  { id: 'builtin-others', name: 'Others', iconName: 'ellipsis', colorHex: '#8E8E93', isCustom: false },
];

export const FALLBACK_CATEGORY: FinanceCategory = BUILT_IN_CATEGORIES[BUILT_IN_CATEGORIES.length - 1];

export const BUILT_IN_CATEGORY_IDS = new Set(BUILT_IN_CATEGORIES.map((c) => c.id));

export function builtInKeyFromCategoryID(id: string): BuiltInCategoryKey {
  if (id.startsWith('builtin-')) {
    const key = id.slice('builtin-'.length) as BuiltInCategoryKey;
    if (BUILT_IN_CATEGORIES.some((c) => c.id === id)) {
      return key;
    }
  }
  return 'others';
}

export const EDITOR_ICONS = [
  'tag.fill',
  'briefcase.fill',
  'banknote.fill',
  'creditcard.fill',
  'gift.fill',
  'cart.fill',
  'fork.knife',
  'house.fill',
  'car.fill',
  'tram.fill',
  'airplane',
  'heart.fill',
  'cross.case.fill',
  'book.fill',
  'graduationcap.fill',
  'gamecontroller.fill',
  'music.note',
  'pawprint.fill',
  'leaf.fill',
  'hammer.fill',
];

export const EDITOR_COLORS = [
  '#007AFF',
  '#34C759',
  '#FF9500',
  '#FF3B30',
  '#AF52DE',
  '#FF2D55',
  '#5856D6',
  '#00C7BE',
  '#30B0C7',
  '#FFCC00',
  '#8E8E93',
  '#A2845E',
];
