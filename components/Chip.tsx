import { useTheme } from '@/constants/colorTheme';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

interface DripChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const DripChip: React.FC<DripChipProps> = ({
  label,
  selected = false,
  onPress,
  icon,
  style,
}) => {
  const { theme } = useTheme();
  const isInteractive = typeof onPress === 'function';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!isInteractive}
      activeOpacity={0.7}
      style={[
        styles.chip,
        selected 
          ? { backgroundColor: theme.primary, borderColor: theme.primary }
          : { backgroundColor: theme.card, borderColor: theme.borderLight },
        style,
      ]}
    >
      {icon && icon}
      <Text 
        style={[
          styles.label, 
          selected 
            ? { color: theme.background }
            : { color: theme.textSecondary },
          { marginLeft: icon ? 6 : 0 }
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});