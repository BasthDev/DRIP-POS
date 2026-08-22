import { useTheme } from '@/constants/colorTheme';
import { useDrawer } from '@/constants/drawerContext';
import { TextAlignStart } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode | null;
  rightIcon?: React.ReactNode;
  onLeftPress?: () => void;
  onRightPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
}) => {
  const { theme } = useTheme();
  const { openDrawer } = useDrawer();
  const insets = useSafeAreaInsets();

  // If onLeftPress isn't specified, fallback to opening the global drawer
  const handleLeftPress = onLeftPress || openDrawer;

  const renderLeftIcon = () => {
    if (leftIcon === null) return null;
    if (leftIcon !== undefined) return leftIcon;
    return <TextAlignStart size={22} color={theme.text} />;
  };

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: theme.headerBackground,
          borderBottomColor: theme.divider,
          paddingTop: insets.top,
        },
      ]}
    >
      <View style={styles.container}>
        <View style={styles.sideContainer}>
          {leftIcon !== null && (
            <TouchableOpacity onPress={handleLeftPress} style={styles.iconButton} activeOpacity={0.7}>
              {renderLeftIcon()}
            </TouchableOpacity>
          )}
        </View>

        {/* Center Text Container */}
        <View style={styles.centerContainer}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: theme.success }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.sideContainer}>
          {rightIcon ? (
            <TouchableOpacity onPress={onRightPress} style={styles.iconButton} activeOpacity={0.7}>
              {rightIcon}
            </TouchableOpacity>
          ) : (
            <ThemeToggle />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    borderBottomWidth: 1,
  },
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  sideContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 2,
  },
  iconButton: {
    padding: 8,
  },
});