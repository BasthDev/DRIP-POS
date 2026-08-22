import { useTheme } from '@/constants/colorTheme';
import { Pen } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

interface DripInputProps extends TextInputProps {
  label: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

export const DripInput: React.FC<DripInputProps> = ({
  label,
  value,
  onChangeText,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  ...props
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  const active = isFocused || !!value;

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleContainerPress = () => {
    textInputRef.current?.focus();
  };

  // Base left offset for floating label when an icon is present
  const baseLeft = 48;

  const labelColor = error
    ? theme.error
    : isFocused
      ? theme.primary
      : theme.textTertiary;

  // Render default raw Pen icon if no custom leftIcon is provided
  const iconToRender = leftIcon || <Pen size={20} color={theme.iconSecondary || theme.textTertiary} />;

  return (
    <View style={styles.container}>
      {/* Label / Placeholder (Tanpa Animasi, langsung lompat ke atas jika active) */}
      <Text
        pointerEvents="none"
        style={[
          styles.label,
          {
            left: baseLeft,
            color: labelColor,
          },
          active && styles.labelActive,
        ]}
      >
        {label}
      </Text>

      {/* Input Container */}
      <TouchableWithoutFeedback onPress={handleContainerPress}>
        <View
          style={[
            styles.inputContainer,
            { 
              backgroundColor: theme.input,
              borderColor: error 
                ? theme.error 
                : isFocused 
                  ? theme.primary 
                  : theme.inputBorder 
            },
            isFocused && { borderWidth: 1.5 },
          ]}
        >
          {/* Left Icon */}
          <View style={styles.iconContainerLeft}>{iconToRender}</View>

          <TextInput
            ref={textInputRef}
            style={[
              styles.input,
              { 
                color: theme.text,
                paddingLeft: 8, 
                paddingRight: rightIcon ? 8 : 0 
              },
            ]}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholderTextColor="transparent"
            placeholder=""
            {...props}
          />

          {/* Right Icon */}
          {rightIcon && (
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => {
                textInputRef.current?.blur();
                Keyboard.dismiss();
                onRightIconPress?.();
              }} 
              style={styles.iconContainerRight}
            >
              {rightIcon}
            </TouchableOpacity>
          )}
        </View>
      </TouchableWithoutFeedback>

      {/* Error */}
      {error && (
        <Text style={[styles.errorText, { color: theme.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },

  label: {
    position: 'absolute',
    top: 18,
    fontSize: 15,
    fontWeight: '500',
    zIndex: 10,
  },

  // Style tambahan saat label berada di posisi atas (aktif / ada isi)
  labelActive: {
    top: -20,
    fontSize: 13,
    transform: [{ scale: 0.9 }],
  },

  inputContainer: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  input: {
    flex: 1,
    height: 56,
    padding: 0,
    fontSize: 16,
    fontWeight: '500',
  },

  iconContainerLeft: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  iconContainerRight: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  errorText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 5,
    marginLeft: 4,
  },
});