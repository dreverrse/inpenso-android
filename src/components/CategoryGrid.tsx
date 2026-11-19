import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FinanceCategory } from '../types/models';
import { useApp } from '../context/AppContext';
import { mapIconName } from '../utils/icons';

interface CategoryGridProps {
  categories: FinanceCategory[];
  selectedCategoryID: string;
  onSelect: (categoryID: string) => void;
}

export function CategoryGrid({ categories, selectedCategoryID, onSelect }: CategoryGridProps) {
  const { theme } = useApp();

  return (
    <View style={styles.grid}>
      {categories.map((cat) => {
        const selected = cat.id === selectedCategoryID;
        return (
          <TouchableOpacity
            key={cat.id}
            activeOpacity={0.75}
            onPress={() => onSelect(cat.id)}
            style={[
              styles.tile,
              {
                backgroundColor: selected ? `${cat.colorHex}22` : theme.tertiaryBackground,
                borderColor: selected ? cat.colorHex : 'transparent',
              },
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: cat.colorHex }]}>
              <Ionicons name={mapIconName(cat.iconName)} size={18} color="#FFFFFF" />
            </View>
            <Text style={[styles.label, { color: theme.text }]} numberOfLines={1}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    width: '31%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 2,
    gap: 6,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
