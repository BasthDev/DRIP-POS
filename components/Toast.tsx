import { useTheme } from '@/constants/colorTheme';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export type ToastType = 'success' | 'error' | 'info';

interface DripToastProps {
  visible: boolean;
  title?: string;       // Optional bold header title
  message: string;      // Subtitle / Main message
  type?: ToastType;
  icon?: React.ReactNode;     // Optional custom icon
  iconColor?: string;         // Optional custom icon color override
  onClose: () => void;
  duration?: number;          // Auto close duration in ms (default: 3000)
}

export const DripToast: React.FC<DripToastProps> = ({
  visible,
  title,
  message,
  type = 'success',
  icon,
  iconColor,
  onClose,
  duration = 3000,
}) => {
  const { theme } = useTheme();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  // Resolve accent color and soft background tint based on toast type
  const getToastColors = () => {
    switch (type) {
      case 'success':
        return {
          color: theme.success || '#10B981',
          bg: (theme.success || '#10B981') + '15',
        };
      case 'error':
        return {
          color: theme.error || '#EF4444',
          bg: (theme.error || '#EF4444') + '15',
        };
      case 'info':
      default:
        return {
          color: theme.primary,
          bg: theme.primary + '15',
        };
    }
  };

  const { color: defaultAccentColor, bg: backgroundColorTint } = getToastColors();
  const finalIconColor = iconColor || defaultAccentColor;

  // Render default icon if no custom icon is provided
  const renderDefaultIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} color={finalIconColor} />;
      case 'error':
        return <AlertCircle size={18} color={finalIconColor} />;
      case 'info':
      default:
        return <Info size={18} color={finalIconColor} />;
    }
  };

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          backgroundColor: theme.card || theme.background,
          borderColor: theme.border,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      {/* Icon Container */}
      <View style={[styles.iconContainer, { backgroundColor: backgroundColorTint }]}>
        {icon || renderDefaultIcon()}
      </View>

      {/* Text Container (Title + Subtitle) */}
      <View style={styles.textContainer}>
        {title && (
          <Text style={[styles.titleText, { color: theme.text }]} numberOfLines={1}>
            {title}
          </Text>
        )}
        <Text
          style={[
            styles.messageText,
            { color: title ? theme.textTertiary : theme.text },
          ]}
          numberOfLines={2}
        >
          {message}
        </Text>
      </View>

      <TouchableOpacity onPress={hideToast} style={styles.closeButton} activeOpacity={0.7}>
        <X size={16} color={theme.textTertiary} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 13,
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
  },
});