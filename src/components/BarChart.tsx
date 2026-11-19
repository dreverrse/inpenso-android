import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';

export interface BarDatum {
  key: string;
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarDatum[];
  height?: number;
  averageValue?: number;
  barColor?: string;
  showValues?: boolean;
  compact?: boolean;
}

export function BarChart({
  data,
  height = 150,
  averageValue,
  barColor,
  showValues = false,
  compact = false,
}: BarChartProps) {
  const { theme } = useApp();
  const maxVal = Math.max(
    1,
    ...data.map((d) => d.value),
    averageValue ? averageValue * 1.15 : 0
  );

  const avgBottom = averageValue && averageValue > 0 ? Math.min(1, averageValue / maxVal) * height : null;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.chartArea, { height }]}>
        {avgBottom !== null && (
          <View style={[styles.avgLineContainer, { bottom: avgBottom }]}>
            <View style={[styles.avgLine, { borderColor: theme.green }]} />
            <View style={[styles.avgBadge, { backgroundColor: theme.tertiaryBackground }]}>
              <Text style={[styles.avgLabel, { color: theme.green }]}>Avg</Text>
            </View>
          </View>
        )}

        <View style={styles.barsRow}>
          {data.map((item) => {
            const barHeight = Math.max(item.value > 0 ? 4 : 2, (item.value / maxVal) * (height - 14));
            return (
              <View key={item.key} style={styles.barColumn}>
                {showValues && item.value > 0 && (
                  <Text style={[styles.valueText, { color: theme.secondaryText }]} numberOfLines={1}>
                    {Math.round(item.value)}
                  </Text>
                )}
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      width: compact ? 6 : 20,
                      borderRadius: compact ? 3 : 6,
                      backgroundColor: item.value > 0 ? item.color ?? barColor ?? theme.accent : theme.track,
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.labelsRow}>
        {data.map((item) => (
          <Text
            key={item.key}
            style={[styles.xLabel, { color: theme.secondaryText, fontSize: compact ? 9 : 11 }]}
            numberOfLines={1}
          >
            {item.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  chartArea: {
    position: 'relative',
    justifyContent: 'flex-end',
    width: '100%',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
    paddingHorizontal: 4,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    minHeight: 2,
  },
  valueText: {
    fontSize: 9,
    marginBottom: 2,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  xLabel: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '500',
  },
  avgLineContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  avgLine: {
    flex: 1,
    borderBottomWidth: 1.5,
    borderStyle: 'dashed',
  },
  avgBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 4,
  },
  avgLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
});
