import { useTheme } from '@/constants/colorTheme';
import { FileText } from 'lucide-react-native';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { DripStepper } from './Stepper';

interface DripItemCardProps {
  title: string;
  subtitle?: string;
  note?: string; // POS Item custom note appearing under the card
  price: number;
  quantity?: number;
  onQuantityChange?: (qty: number) => void;
  onPress?: () => void;
  leftIcon?: React.ReactNode;
  style?: ViewStyle;
}

export const DripItemCard: React.FC<DripItemCardProps> = ({
  title,
  subtitle,
  note,
  price,
  quantity,
  onQuantityChange,
  onPress,
  leftIcon,
  style,
}) => {
  const { theme } = useTheme();
  const hasNote = Boolean(note && note.trim().length > 0);

  return (
    <View style={[styles.wrapper, style]}>
      {/* Main Card Body */}
      <TouchableOpacity
        activeOpacity={onPress ? 0.8 : 1}
        onPress={onPress}
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            // If there's a note, flatten bottom borders to connect smoothly; otherwise keep standard rounded corners
            borderBottomLeftRadius: hasNote ? 4 : 14,
            borderBottomRightRadius: hasNote ? 4 : 14,
          },
        ]}
      >
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}

        <View style={styles.detailsContainer}>
          <Text style={[styles.titleText, { color: theme.text }]} numberOfLines={1}>
            {title}
          </Text>

          {subtitle && (
            <Text
              style={[styles.subtitleText, { color: theme.textTertiary }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}

          <Text style={[styles.priceText, { color: theme.primary }]}>
            ${price.toFixed(2)}
          </Text>
        </View>

        {quantity !== undefined && onQuantityChange && (
          <DripStepper
            value={quantity}
            onValueChange={onQuantityChange}
            min={0}
          />
        )}
      </TouchableOpacity>

      {/* Note Section Attached Underneath (Only renders if note is present and not empty) */}
      {hasNote && (
        <View
          style={[
            styles.noteBox,
            {
              backgroundColor: theme.input || 'rgba(0,0,0,0.02)',
              borderColor: theme.border,
            },
          ]}
        >
          <FileText size={12} color={theme.textTertiary} style={styles.noteIcon} />
          <Text
            style={[styles.noteText, { color: theme.textSecondary || theme.textTertiary }]}
            numberOfLines={2}
          >
            {note}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 6,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  leftIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailsContainer: {
    flex: 1,
    marginRight: 12,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitleText: {
    fontSize: 13,
    marginBottom: 4,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderWidth: 1,
    borderTopWidth: 0,
    marginTop: -1, // Seamlessly overlaps the border
  },
  noteIcon: {
    marginRight: 6,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    fontStyle: 'italic',
  },
});