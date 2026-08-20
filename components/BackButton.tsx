import { useTheme } from '@/constants/colorTheme';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

interface DripBackButtonProps {
  title?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export const DripBackButton: React.FC<DripBackButtonProps> = ({
  title = 'Go Back',
  onPress,
  style,
}) => {
  const router = useRouter();
  const { theme } = useTheme();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
        style,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        style={styles.touchableContent}
      >
        <ArrowLeft size={20} color={theme.text} style={styles.icon} />
        <Text style={[styles.text, { color: theme.text }]}>{title}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  touchableContent: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start', // Restricts the touch area precisely to the text and icon size
  },
  icon: {
    marginRight: 12,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});