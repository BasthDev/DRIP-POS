import { useTheme } from '@/constants/colorTheme';
import { Minus, Plus } from 'lucide-react-native';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

interface DripStepperProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  style?: ViewStyle;
}

export const DripStepper: React.FC<DripStepperProps> = ({
  value,
  onValueChange,
  min = 1,
  max = 99,
  step = 1,
  disabled = false,
  style,
}) => {
  const { theme } = useTheme();

  const handleDecrement = () => {
    if (value - step >= min) {
      onValueChange(value - step);
    }
  };

  const handleIncrement = () => {
    if (value + step <= max) {
      onValueChange(value + step);
    }
  };

  const isMinReached = value <= min;
  const isMaxReached = value >= max;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.input,
          borderColor: theme.inputBorder,
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={disabled || isMinReached}
        onPress={handleDecrement}
        style={[
          styles.button,
          (disabled || isMinReached) && styles.buttonDisabled,
        ]}
      >
        <Minus
          size={16}
          color={isMinReached ? theme.textTertiary : theme.text}
        />
      </TouchableOpacity>

      <View style={styles.valueContainer}>
        <Text style={[styles.valueText, { color: theme.text }]}>{value}</Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        disabled={disabled || isMaxReached}
        onPress={handleIncrement}
        style={[
          styles.button,
          (disabled || isMaxReached) && styles.buttonDisabled,
        ]}
      >
        <Plus
          size={16}
          color={isMaxReached ? theme.textTertiary : theme.text}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.5,
  },
  button: {
    width: 36,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  valueContainer: {
    minWidth: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 15,
    fontWeight: '600',
  },
});