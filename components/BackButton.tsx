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
          borderBottomColor: theme.border,
        },
        style,
      ]}
    >
      <View style={styles.innerRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handlePress}
          style={styles.touchableContent}
        >
          <ArrowLeft size={20} color={theme.text} style={styles.icon} />
          <Text style={[styles.text, { color: theme.text }]}>{title}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  innerRow: {
    height: 44,
    justifyContent: 'center',
  },
  touchableContent: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 12,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});