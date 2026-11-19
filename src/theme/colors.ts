export interface ThemeColors {
  isDark: boolean;
  background: string;
  groupedBackground: string;
  cardBackground: string;
  tertiaryBackground: string;
  text: string;
  secondaryText: string;
  border: string;
  track: string;
  accent: string;
  green: string;
  red: string;
  orange: string;
  purple: string;
  yellow: string;
  gray: string;
}

export const LIGHT_THEME: ThemeColors = {
  isDark: false,
  background: '#FFFFFF',
  groupedBackground: '#F2F2F7',
  cardBackground: '#FFFFFF',
  tertiaryBackground: '#EFEFF4',
  text: '#000000',
  secondaryText: '#6C6C70',
  border: '#E5E5EA',
  track: '#E5E5EA',
  accent: '#007AFF',
  green: '#34C759',
  red: '#FF3B30',
  orange: '#FF9500',
  purple: '#AF52DE',
  yellow: '#FFCC00',
  gray: '#8E8E93',
};

export const DARK_THEME: ThemeColors = {
  isDark: true,
  background: '#000000',
  groupedBackground: '#000000',
  cardBackground: '#1C1C1E',
  tertiaryBackground: '#2C2C2E',
  text: '#FFFFFF',
  secondaryText: '#98989F',
  border: '#38383A',
  track: '#2C2C2E',
  accent: '#0A84FF',
  green: '#30D158',
  red: '#FF453A',
  orange: '#FF9F0A',
  purple: '#BF5AF2',
  yellow: '#FFD60A',
  gray: '#8E8E93',
};
