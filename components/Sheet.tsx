import { useTheme } from '@/constants/colorTheme';
import { Circle, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Keyboard,
    KeyboardEvent,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

interface DripSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  headerIcon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: number;
}

export const DripSheet: React.FC<DripSheetProps> = ({
  visible,
  onClose,
  title,
  headerIcon,
  children,
  footer,
  maxWidth = 450,
}) => {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const isWideScreen = screenWidth > 768;

  const slideAnim = useRef(
    new Animated.Value(isWideScreen ? screenWidth : screenHeight)
  ).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Track keyboard height to render a solid blocking view behind transparent keyboards
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e: KeyboardEvent) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Keyboard.dismiss();
      setKeyboardHeight(0);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: isWideScreen ? screenWidth : screenHeight,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, isWideScreen]);

  if (!visible) return null;

  const iconToRender = headerIcon || <Circle size={20} color={theme.iconSecondary || theme.textTertiary} />;

  const handleBackdropPress = () => {
    Keyboard.dismiss();
    onClose();
  };

  const sheetBackgroundColor = theme.card || theme.background;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <Animated.View
            style={[
              styles.backdrop,
              { opacity: fadeAnim },
            ]}
          />
        </TouchableWithoutFeedback>

        {/* Sheet Content Box */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <Animated.View
            style={[
              styles.sheetContainer,
              isWideScreen
                ? [
                    styles.wideSheet,
                    {
                      maxWidth: maxWidth,
                      transform: [{ translateX: slideAnim }],
                      backgroundColor: sheetBackgroundColor,
                      borderColor: theme.border,
                    },
                  ]
                : [
                    styles.mobileSheet,
                    {
                      transform: [{ translateY: slideAnim }],
                      backgroundColor: sheetBackgroundColor,
                      borderColor: theme.border,
                      // Dynamically pad the bottom container when keyboard opens
                      paddingBottom: Math.max(36, keyboardHeight + 10),
                    },
                  ],
            ]}
          >
            {/* Header */}
            {title && (
              <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <View style={styles.headerTitleContainer}>
                  <View style={styles.iconContainer}>{iconToRender}</View>
                  <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={onClose}
                  style={[styles.closeButton, { backgroundColor: theme.input }]}
                >
                  <X size={18} color={theme.iconSecondary || theme.textTertiary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Scrollable Form Body */}
            <ScrollView
              contentContainerStyle={styles.scrollBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>

            {/* Footer Actions (Save button aligned bottom right) */}
            {footer && (
              <View
                style={[
                  styles.footer,
                  {
                    borderTopColor: theme.border,
                    backgroundColor: sheetBackgroundColor,
                  },
                ]}
              >
                <View style={styles.footerActionWrapper}>{footer}</View>
              </View>
            )}

            {/* Plain View Spacer matching sheet background behind the keyboard area on wide/tablet layouts */}
            {isWideScreen && keyboardHeight > 0 && (
              <View
                style={{
                  height: keyboardHeight,
                  backgroundColor: sheetBackgroundColor,
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: -keyboardHeight,
                }}
              />
            )}
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetContainer: {},
  mobileSheet: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    maxHeight: '90%',
  },
  wideSheet: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '100%',
    borderLeftWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    height: '100%',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollBody: {
    paddingBottom: 20,
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
  },
  footerActionWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
});