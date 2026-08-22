import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Sun, Moon } from 'lucide-react-native';
import { useTheme } from '@/constants/colorTheme';

export function ThemeToggle() {
  const { colorMode, toggleColorMode, theme } = useTheme();

  return (
    <TouchableOpacity
      onPress={toggleColorMode}
      style={[styles.container, { backgroundColor: theme.input, borderColor: theme.border }]}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        {colorMode === 'dark' ? (
          <Sun size={20} color={theme.text} />
        ) : (
          <Moon size={20} color={theme.text} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
