import { DripBackButton } from '@/components/BackButton';
import { useTheme } from '@/constants/colorTheme';
import React, { ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View, ViewStyle } from 'react-native';

interface DripContainerProps {
  // Content for the left panel on tablet, or main screen on mobile
  leftPanel: ReactNode;
  
  // Content for the right panel on tablet, or secondary screen on mobile
  rightPanel: ReactNode;
  
  // Controls whether the mobile view shows the main screen or the secondary screen
  showSecondaryMobile?: boolean;
  
  // Callback for mobile back button to return to main screen
  onMobileBack?: () => void;
  
  // Title for the mobile back button
  backButtonTitle?: string;
  
  // Toggle to show/hide the back button on tablet right panel (forms vs static layout)
  showTabletBackButton?: boolean;
  
  // Optional padding for children content (back button won't be affected)
  childrenPadding?: number;
  
  style?: ViewStyle;
}

export const DripContainer: React.FC<DripContainerProps> = ({
  leftPanel,
  rightPanel,
  showSecondaryMobile = false,
  onMobileBack,
  backButtonTitle = 'Go Back',
  showTabletBackButton = false,
  childrenPadding = 0,
  style,
}) => {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  
  // Tablet breakpoint threshold (e.g., 768px)
  const isTablet = width >= 768;

  if (isTablet) {
    // --- TABLET LAYOUT (Left Panel flex 1, Right Panel flex 2) ---
    return (
      <View style={[styles.tabletContainer, { backgroundColor: theme.background }, style]}>
        {/* Left Panel (Flex 1) */}
        <View style={[styles.leftPanel, { borderColor: theme.border }]}>
          <View style={{ padding: childrenPadding, flex: 1 }}>
            {leftPanel}
          </View>
        </View>

        {/* Right Panel (Flex 2) */}
        <View style={styles.rightPanel}>
          {showTabletBackButton && (
            <DripBackButton title={backButtonTitle} onPress={onMobileBack} />
          )}
          <View style={[styles.rightContent, { padding: childrenPadding }]}>
            {rightPanel}
          </View>
        </View>
      </View>
    );
  }

  // --- MOBILE LAYOUT (Stacked screens controlled by state) ---
  return (
    <View style={[styles.mobileContainer, { backgroundColor: theme.background }, style]}>
      {!showSecondaryMobile ? (
        // Main Screen
        <View style={styles.screenWrapper}>
          <View style={{ padding: childrenPadding, flex: 1 }}>
            {leftPanel}
          </View>
        </View>
      ) : (
        // Secondary / Next Screen on top
        <View style={styles.screenWrapper}>
          <DripBackButton title={backButtonTitle} onPress={onMobileBack} />
          <View style={[styles.mobileSecondaryContent, { padding: childrenPadding }]}>
            {rightPanel}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tabletContainer: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    height: '100%',
  },
  leftPanel: {
    flex: 1,
    borderRightWidth: 1,
    height: '100%',
  },
  rightPanel: {
    flex: 1.5,
    height: '100%',
  },
  rightContent: {
    flex: 1,
  },
  mobileContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  screenWrapper: {
    flex: 1,
  },
  mobileSecondaryContent: {
    flex: 1,
  },
});