import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { getShortMonthName } from '../utils/format';

interface MonthYearPickerProps {
  selectedMonth: number;
  selectedYear: number;
  onChange: (month: number, year: number) => void;
  monthsToShow?: number;
}

export function MonthYearPicker({
  selectedMonth,
  selectedYear,
  onChange,
  monthsToShow = 18,
}: MonthYearPickerProps) {
  const { theme } = useApp();

  const items = useMemo(() => {
    const now = new Date();
    const list: { month: number; year: number; key: string; label: string }[] = [];
    for (let i = 0; i < monthsToShow; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const label = y === now.getFullYear() ? getShortMonthName(m) : `${getShortMonthName(m)} ${String(y).slice(-2)}`;
      list.push({ month: m, year: y, key: `${y}-${m}`, label });
    }
    return list;
  }, [monthsToShow]);

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {items.map((item) => {
          const isSelected = item.month === selectedMonth && item.year === selectedYear;
          return (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.75}
              onPress={() => onChange(item.month, item.year)}
              style={[
                styles.pill,
                {
                  backgroundColor: isSelected ? theme.accent : theme.cardBackground,
                  borderColor: isSelected ? theme.accent : theme.border,
                },
              ]}
            >
              <Text style={[styles.pillText, { color: isSelected ? '#FFFFFF' : theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
