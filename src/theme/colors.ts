export interface ThemeColors {
  isDark: boolean;
  background: string;
  groupedBackground: string;
  cardBackground: string;
  cardBorder: string;
  tertiaryBackground: string;
  text: string;
  secondaryText: string;
  border: string;
  track: string;
  accent: string;
  accentSoft: string;
  green: string;
  greenSoft: string;
  red: string;
  redSoft: string;
  orange: string;
  purple: string;
  yellow: string;
  gray: string;
  heroGradient: readonly [string, string, string];
  accentGradient: readonly [string, string];
  barGradient: readonly [string, string];
  peakBarGradient: readonly [string, string];
  tabBarBg: string;
  tabBarBorder: string;
}

export const LIGHT_THEME: ThemeColors = {
  isDark: false,
  background: '#FFFFFF',
  groupedBackground: '#F4F6FB',
  cardBackground: '#FFFFFF',
  cardBorder: '#E7ECF4',
  tertiaryBackground: '#EEF2F9',
  text: '#0F172A',
  secondaryText: '#64748B',
  border: '#E2E8F0',
  track: '#E8EDF5',
  accent: '#4F46E5',
  accentSoft: 'rgba(79, 70, 229, 0.12)',
  green: '#10B981',
  greenSoft: 'rgba(16, 185, 129, 0.14)',
  red: '#F43F5E',
  redSoft: 'rgba(244, 63, 94, 0.12)',
  orange: '#F59E0B',
  purple: '#8B5CF6',
  yellow: '#EAB308',
  gray: '#94A3B8',
  heroGradient: ['#0F172A', '#1E1B4B', '#11293B'],
  accentGradient: ['#4F46E5', '#06B6D4'],
  barGradient: ['#6366F1', '#38BDF8'],
  peakBarGradient: ['#10B981', '#06B6D4'],
  tabBarBg: 'rgba(255, 255, 255, 0.96)',
  tabBarBorder: '#E2E8F0',
};

export const DARK_THEME: ThemeColors = {
  isDark: true,
  background: '#07090F',
  groupedBackground: '#07090F',
  cardBackground: '#111623',
  cardBorder: '#1E273B',
  tertiaryBackground: '#192133',
  text: '#F8FAFC',
  secondaryText: '#8B9BB4',
  border: '#1F2A40',
  track: '#1C2538',
  accent: '#6366F1',
  accentSoft: 'rgba(99, 102, 241, 0.18)',
  green: '#10B981',
  greenSoft: 'rgba(16, 185, 129, 0.16)',
  red: '#FB7185',
  redSoft: 'rgba(251, 113, 133, 0.16)',
  orange: '#FBBF24',
  purple: '#A78BFA',
  yellow: '#FACC15',
  gray: '#64748B',
  heroGradient: ['#131B31', '#1A1F3D', '#0D262D'],
  accentGradient: ['#6366F1', '#10B981'],
  barGradient: ['#6366F1', '#38BDF8'],
  peakBarGradient: ['#10B981', '#34D399'],
  tabBarBg: 'rgba(17, 22, 35, 0.96)',
  tabBarBorder: '#1E293B',
};
