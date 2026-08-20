import { useTheme } from '@/constants/colorTheme';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

interface DripProgressBarProps {
  current: number;
  max: number;
  label?: string;
  showValues?: boolean;
  style?: ViewStyle;
}

export const DripProgressBar: React.FC<DripProgressBarProps> = ({
  current,
  max,
  label,
  showValues = true,
  style,
}) => {
  const { theme } = useTheme();

  // Prevent division by zero and clamp values
  const safeMax = max > 0 ? max : 1;
  const clampedCurrent = Math.max(0, Math.min(current, safeMax));
  const percentage = (clampedCurrent / safeMax) * 100;

  // Dynamic color selection based on your milestones (Red <= 25%, Yellow <= 50%, Green >= 75%)
  const getProgressColor = () => {
    if (percentage <= 25) {
      return '#EF4444'; // Red
    }
    if (percentage <= 50) {
      return '#F59E0B'; // Yellow / Amber
    }
    return '#10B981'; // Green
  };

  const dynamicColor = getProgressColor();

  return (
    <View style={[styles.container, style]}>
      {(label || showValues) && (
        <View style={styles.headerRow}>
          {label && (
            <Text style={[styles.labelText, { color: theme.text }]} numberOfLines={1}>
              {label}
            </Text>
          )}
          {showValues && (
            <View style={[styles.badge, { backgroundColor: dynamicColor + '15' }]}>
              <Text style={[styles.valueText, { color: dynamicColor }]}>
                {clampedCurrent} / {safeMax} ({Math.round(percentage)}%)
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Clean Flat Track */}
      <View
        style={[
          styles.track,
          { backgroundColor: theme.input, borderColor: theme.border },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${percentage}%`,
              backgroundColor: dynamicColor,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  valueText: {
    fontSize: 12,
    fontWeight: '700',
  },
  track: {
    height: 10,
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
});