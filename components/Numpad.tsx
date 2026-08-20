import { useTheme } from '@/constants/colorTheme';
import { Delete } from 'lucide-react-native';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

interface DripNumpadProps {
  onPress: (value: string) => void;
  onDelete: () => void;
  style?: ViewStyle;
}

export const DripNumpad: React.FC<DripNumpadProps> = ({
  onPress,
  onDelete,
  style,
}) => {
  const { theme } = useTheme();

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];

  return (
    <View style={[styles.container, style]}>
      {keys.map((key, index) => {
        if (key === 'del') {
          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.7}
              onPress={onDelete}
              style={[
                styles.key,
                { backgroundColor: theme.input, borderColor: theme.border },
              ]}
            >
              <Delete size={20} color={theme.text} />
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={index}
            activeOpacity={0.7}
            onPress={() => onPress(key)}
            style={[
              styles.key,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.keyText, { color: theme.text }]}>{key}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 300,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    alignSelf: 'center',
  },
  key: {
    width: '31%',
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  keyText: {
    fontSize: 22,
    fontWeight: '600',
  },
});