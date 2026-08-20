import { useTheme } from '@/constants/colorTheme';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface DripSwitchProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export const DripSwitch: React.FC<DripSwitchProps> = ({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const animValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  const backgroundColor = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.inputBorder || '#ccc', theme.primary],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={[styles.container, disabled && styles.disabled]}
    >
      <View style={styles.textContainer}>
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
        {description && (
          <Text style={[styles.description, { color: theme.textTertiary }]}>
            {description}
          </Text>
        )}
      </View>

      <Animated.View
        style={[
          styles.track,
          { backgroundColor },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              transform: [{ translateX }],
              backgroundColor: theme.background,
            },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginVertical: 4,
  },
  disabled: {
    opacity: 0.5,
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    marginTop: 2,
  },
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});