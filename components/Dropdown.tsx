import { useTheme } from '@/constants/colorTheme';
import { ChevronDown, ChevronUp, ListEnd } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { DripSheet } from './Sheet';

interface DropdownOption {
  label: string;
  value: string;
}

interface DripDropdownProps {
  label: string;
  options: DropdownOption[];
  value?: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
}

export const DripDropdown: React.FC<DripDropdownProps> = ({
  label,
  options,
  value,
  onSelect,
  error,
  disabled = false,
  leftIcon,
}) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');

  const animation = useRef(new Animated.Value(value ? 1 : 0)).current;

  const active = isOpen || !!value || !!selectedLabel;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: active ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [active]);

  useEffect(() => {
    if (value) {
      const selectedOption = options.find((opt) => opt.value === value);
      if (selectedOption) {
        setSelectedLabel(selectedOption.label);
      }
    } else {
      setSelectedLabel('');
    }
  }, [value, options]);

  const handleSelect = (option: DropdownOption) => {
    setSelectedLabel(option.label);
    onSelect(option.value);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  // Base left offset matching DripInput layout (48px for icon spacing)
  const baseLeft = 48;

  const labelTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -38],
  });

  const labelScale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.9],
  });

  const labelColor = error
    ? theme.error
    : isOpen
      ? theme.primary
      : theme.textTertiary;

  // Default icon on left is ListEnd if no custom leftIcon is supplied
  const iconToRender = leftIcon || <ListEnd size={20} color={theme.iconSecondary || theme.textTertiary} />;

  return (
    <View style={styles.container}>
      {/* Label / Placeholder */}
      <Animated.Text
        pointerEvents="none"
        style={[
          styles.label,
          {
            left: baseLeft,
            color: labelColor,
            transform: [
              { translateY: labelTranslateY },
              { scale: labelScale },
            ],
          },
        ]}
      >
        {label}
      </Animated.Text>

      {/* Dropdown Container */}
      <TouchableWithoutFeedback onPress={toggleDropdown}>
        <View
          style={[
            styles.dropdownContainer,
            {
              backgroundColor: theme.input,
              borderColor: error
                ? theme.error
                : isOpen
                  ? theme.primary
                  : theme.inputBorder,
            },
            isOpen && { borderWidth: 1.5 },
            disabled && styles.disabledContainer,
          ]}
        >
          {/* Left Icon (ListEnd by default) */}
          <View style={styles.iconContainerLeft}>{iconToRender}</View>

          {/* Selected Value Text */}
          <Text
            style={[
              styles.valueText,
              {
                color: selectedLabel ? theme.text : theme.textTertiary,
                paddingLeft: 8,
              },
              disabled && styles.disabledText,
            ]}
            numberOfLines={1}
          >
            {selectedLabel}
          </Text>

          {/* Right Chevron Arrow Icon */}
          <View style={styles.iconContainerRight}>
            {isOpen ? (
              <ChevronUp size={20} color={theme.iconSecondary || theme.textTertiary} />
            ) : (
              <ChevronDown size={20} color={theme.iconSecondary || theme.textTertiary} />
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>

      {/* Error */}
      {error && (
        <Text style={[styles.errorText, { color: theme.error }]}>
          {error}
        </Text>
      )}

      {/* Dropdown Sheet Modal */}
      <DripSheet
        visible={isOpen}
        onClose={() => setIsOpen(false)}
        title={`Select ${label}`}
        maxWidth={400}
      >
        <View style={styles.optionsListContainer}>
          {options.map((item) => {
            const isSelected = item.value === value;
            return (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.optionItem,
                  {
                    backgroundColor: isSelected ? theme.primary : 'transparent',
                    borderBottomColor: theme.border || 'rgba(0, 0, 0, 0.1)',
                  },
                ]}
                onPress={() => handleSelect(item)}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: isSelected ? theme.background : theme.text,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </DripSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 20,
  },

  label: {
    position: 'absolute',
    top: 18,
    fontSize: 15,
    fontWeight: '500',
    zIndex: 10,
    // @ts-ignore
    transformOrigin: 'left center',
  },

  dropdownContainer: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  disabledContainer: {
    opacity: 0.5,
  },

  valueText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },

  disabledText: {
    color: '#999',
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

  optionsListContainer: {
    paddingBottom: 10,
  },

  optionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderRadius: 8,
  },

  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});