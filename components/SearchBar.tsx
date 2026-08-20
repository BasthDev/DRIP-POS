import { useTheme } from '@/constants/colorTheme';
import { Search, X } from 'lucide-react-native';
import React from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

interface DripSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  style?: ViewStyle;
}

export const DripSearchBar: React.FC<DripSearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
  rightIcon,
  onRightIconPress,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.input,
          borderColor: theme.inputBorder,
        },
        style,
      ]}
    >
      <Search size={20} color={theme.iconSecondary || theme.textTertiary} style={styles.leftIcon} />

      <TextInput
        style={[styles.input, { color: theme.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textTertiary}
      />

      {value.length > 0 && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          style={styles.clearButton}
        >
          <X size={16} color={theme.iconSecondary || theme.textTertiary} />
        </TouchableOpacity>
      )}

      {rightIcon && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onRightIconPress}
          style={styles.rightIconButton}
        >
          {rightIcon}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  leftIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    fontWeight: '500',
    padding: 0,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  rightIconButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});