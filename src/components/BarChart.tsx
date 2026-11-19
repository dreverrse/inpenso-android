import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  height = 155,
  averageValue,
  barColor,
  showValues = false,
  compact = false,
}: BarChartProps) {
  const { theme } = useApp();
  const peakVal = Math.max(0, ...data.map((d) => d.value));
  const maxVal = Math.max(1, peakVal, averageValue ? averageValue * 1.15 : 0);

  const avgBottom = averageValue && averageValue > 0 ? Math.min(1, averageValue / maxVal) * (height - 16) : null;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.chartArea, { height }]}>
        {/* Subtle horizontal guide lines */}
        <View style={[styles.gridLine, { bottom: '25%', borderColor: theme.border }]} />
        <View style={[styles.gridLine, { bottom: '55%', borderColor: theme.border }]} />
        <View style={[styles.gridLine, { bottom: '85%', borderColor: theme.border }]} />

        {avgBottom !== null && (
          <View style={[styles.avgLineContainer, { bottom: avgBottom }]}>
            <View style={[styles.avgLine, { borderColor: theme.green }]} />
            <View style={[styles.avgBadge, { backgroundColor: theme.greenSoft, borderColor: theme.green }]}>
              <Text style={[styles.avgLabel, { color: theme.green }]}>AVG</Text>
            </View>
          </View>
        )}

        <View style={styles.barsRow}>
          {data.map((item) => {
            const barHeight = Math.max(item.value > 0 ? 6 : 3, (item.value / maxVal) * (height - 18));
            const isPeak = item.value > 0 && item.value === peakVal;
            const gradientColors: readonly [string, string] = item.color
              ? [item.color, item.color]
              : barColor
              ? [barColor, barColor]
              : isPeak
              ? theme.peakBarGradient
              : theme.barGradient;

            return (
              <View key={item.key} style={styles.barColumn}>
                {showValues && item.value > 0 && (
                  <Text style={[styles.valueText, { color: theme.secondaryText }]} numberOfLines={1}>
                    {Math.round(item.value)}
                  </Text>
                )}
                {item.value > 0 ? (
                  <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        width: compact ? 6 : 22,
                        borderRadius: compact ? 3 : 8,
                      },
                    ]}
                  />
                ) : (
                  <View
                    style={[
                      styles.bar,
                      {
                        height: 3,
                        width: compact ? 6 : 22,
                        borderRadius: compact ? 3 : 8,
                        backgroundColor: theme.track,
                      },
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.labelsRow}>
        {data.map((item) => (
          <Text
            key={item.key}
            style={[
              styles.xLabel,
              {
                color: item.value > 0 && item.value === peakVal ? theme.text : theme.secondaryText,
                fontSize: compact ? 9 : 11,
                fontWeight: item.value > 0 && item.value === peakVal ? '700' : '500',
              },
            ]}
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
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    opacity: 0.45,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
    paddingHorizontal: 4,
    zIndex: 1,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    minHeight: 3,
  },
  valueText: {
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 3,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  xLabel: {
    flex: 1,
    textAlign: 'center',
  },
  avgLineContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 3,
  },
  avgLine: {
    flex: 1,
    borderBottomWidth: 1.5,
    borderStyle: 'dashed',
  },
  avgBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 5,
  },
  avgLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
