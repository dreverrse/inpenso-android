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
                backgroundColor: selected ? `${cat.colorHex}20` : theme.tertiaryBackground,
                borderColor: selected ? cat.colorHex : theme.cardBorder,
              },
            ]}
          >
            <View
              style={[
                styles.iconSquircle,
                { backgroundColor: selected ? cat.colorHex : `${cat.colorHex}24` },
              ]}
            >
              <Ionicons
                name={mapIconName(cat.iconName)}
                size={18}
                color={selected ? '#FFFFFF' : cat.colorHex}
              />
            </View>
            <Text
              style={[
                styles.label,
                { color: selected ? theme.text : theme.secondaryText, fontWeight: selected ? '700' : '600' },
              ]}
              numberOfLines={1}
            >
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
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 7,
  },
  iconSquircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    textAlign: 'center',
  },
});
