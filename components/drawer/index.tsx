import { useAuth } from '@/constants/auth';
import { useTheme } from '@/constants/colorTheme';
import { useDrawer } from '@/constants/drawerContext';
import { DRAWER_MENU_ITEMS } from '@/constants/menu';
import { router, usePathname } from 'expo-router';
import {
  ChevronDown,
  ChevronUp,
  Layers,
  LogOut,
  Moon,
  Package,
  Store,
  Sun
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type DrawerItemProps = {
  label: string;
  icon: any;
  route: string;
  pathname: string;
  onNavigate: (route: string) => void;
  nested?: boolean;
  isLast?: boolean;
  badge?: number | string;
  theme: any;
  primaryColor: string;
};

function DrawerItem({
  label,
  icon: IconComponent,
  route,
  pathname,
  onNavigate,
  nested = false,
  isLast = false,
  badge,
  theme,
  primaryColor,
}: DrawerItemProps) {
  const active = pathname === route;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[
        styles.menuItem,
        nested && styles.nestedMenuItem,
        active && !nested && [styles.activeMenuItem, { backgroundColor: theme.input + '40' }],
      ]}
      onPress={() => onNavigate(route)}
    >
      {nested && (
        <>
          <View style={styles.nestedIndicator} />
          {!isLast && <View style={styles.nestedVerticalLine} />}
        </>
      )}

      {IconComponent && (
        <IconComponent
          size={20}
          color={active ? primaryColor : theme.textSecondary}
          style={nested ? styles.nestedIcon : {}}
        />
      )}

      <Text
        style={[
          styles.menuText,
          { color: theme.textSecondary },
          active && [styles.activeText, { color: primaryColor }],
          nested && styles.nestedText,
        ]}
      >
        {label}
      </Text>

      {badge !== undefined && Number(badge) > 0 && (
        <View style={styles.menuItemBadge}>
          <Text style={styles.menuItemBadgeText}>{badge}</Text>
        </View>
      )}

      {active && !nested && <View style={[styles.activeIndicator, { backgroundColor: primaryColor }]} />}
    </TouchableOpacity>
  );
}

interface DripDrawerProps {
  position?: 'left' | 'right';
  style?: ViewStyle;
}

export const DripDrawer: React.FC<DripDrawerProps> = ({ position = 'left', style }) => {
  const { theme, colorMode, toggleColorMode } = useTheme();
  const { isDrawerOpen, closeDrawer } = useDrawer();
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const PRIMARY = theme.primary || '#065F46';

  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const DRAWER_WIDTH = SCREEN_WIDTH >= 768 ? SCREEN_WIDTH / 3 : SCREEN_WIDTH * 0.8;

  const [modalVisible, setModalVisible] = useState(isDrawerOpen);
  const slideAnim = useRef(new Animated.Value(position === 'left' ? -DRAWER_WIDTH : DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Submenu states
  const [masterOpen, setMasterOpen] = useState(false);

  // Group route mappings
  const masterRoutes = ['/tables', '/ingredients', '/recipes', '/category-parents', '/categories', '/products'];
  const isMasterActive = masterRoutes.includes(pathname);

  useEffect(() => {
    if (isMasterActive) setMasterOpen(true);
  }, [isMasterActive]);

  useEffect(() => {
    if (isDrawerOpen) {
      setModalVisible(true);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: position === 'left' ? -DRAWER_WIDTH : DRAWER_WIDTH, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [isDrawerOpen, position, DRAWER_WIDTH]);

  if (!modalVisible) return null;

  const handleNavigation = (path: string) => {
    if (pathname === path) {
      closeDrawer();
      return;
    }
    closeDrawer();
    router.push(path as any);
  };

  const handleLogout = async () => {
    closeDrawer();
    await signOut();
    router.replace('/login');
  };

  const effectiveRole = user?.role || 'Staff';
  const allowedMenuItems = DRAWER_MENU_ITEMS.filter((item) => 
    item.roles.includes(effectiveRole)
  );

  const displayName = user?.name || 'Staff Member';
  const displayOrg = 'DRIP POS';
  const displayStore = 'Main Branch';
  const avatarLetter = (displayName[0] || 'U').toUpperCase();

  return (
    <Modal transparent visible={modalVisible} animationType="none" onRequestClose={closeDrawer}>
      {/* Tap outside backdrop to dismiss */}
      <TouchableWithoutFeedback onPress={closeDrawer}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      <View style={[styles.container, position === 'right' ? styles.alignRight : styles.alignLeft]}>
        <Animated.View
          style={[
            styles.drawerContent,
            {
              width: DRAWER_WIDTH,
              backgroundColor: theme.card,
              borderColor: theme.border,
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
              transform: [{ translateX: slideAnim }],
            },
            style,
          ]}
        >
          {/* TOP STORE HEADER SECTION WITH THEME TOGGLE */}
          <View style={[styles.storeHeader, { borderBottomColor: theme.border }]}>
            <View style={styles.storeHeaderLeft}>
              <View style={[styles.storeLogoBox, { backgroundColor: PRIMARY + '15' }]}>
                <Store size={22} color={PRIMARY} />
              </View>
              <View style={styles.storeHeaderText}>
                <Text style={[styles.storeTitle, { color: theme.text }]} numberOfLines={1}>
                  {displayOrg}
                </Text>
                <Text style={[styles.storeSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                  {displayStore}
                </Text>
              </View>
            </View>

            {/* Theme Toggle Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={toggleColorMode}
              style={[styles.themeToggleButton, { backgroundColor: theme.input }]}
            >
              {colorMode === 'dark' ? (
                <Sun size={18} color="#F59E0B" />
              ) : (
                <Moon size={18} color={theme.textSecondary} />
              )}
            </TouchableOpacity>
          </View>

          {/* SCROLLABLE MENU ITEMS */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.menuContainer}>
              {allowedMenuItems.map((item, index) => (
                <DrawerItem
                  key={index}
                  label={item.title}
                  icon={item.icon}
                  route={item.path}
                  pathname={pathname}
                  onNavigate={handleNavigation}
                  theme={theme}
                  primaryColor={PRIMARY}
                />
              ))}

              {/* Management Dropdown Section Example */}
              <TouchableOpacity
                style={styles.groupHeader}
                activeOpacity={0.8}
                onPress={() => setMasterOpen(!masterOpen)}
              >
                <View style={styles.groupLeft}>
                  <Layers size={20} color={isMasterActive ? PRIMARY : theme.textSecondary} />
                  <Text style={[styles.groupTitle, { color: theme.textSecondary }, isMasterActive && { color: PRIMARY }]}>
                    Management
                  </Text>
                </View>
                {masterOpen ? (
                  <ChevronUp size={18} color={theme.textSecondary} />
                ) : (
                  <ChevronDown size={18} color={theme.textSecondary} />
                )}
                {isMasterActive && <View style={[styles.activeIndicator, { backgroundColor: PRIMARY }]} />}
              </TouchableOpacity>

              {masterOpen && (
                <View style={styles.subMenuContainer}>
                  <DrawerItem label="Products" icon={Package} route="/products" pathname={pathname} onNavigate={handleNavigation} nested theme={theme} primaryColor={PRIMARY} />
                  <DrawerItem label="Ingredients" icon={Package} route="/ingredients" pathname={pathname} onNavigate={handleNavigation} nested isLast theme={theme} primaryColor={PRIMARY} />
                </View>
              )}
            </View>
          </ScrollView>

          {/* USER FOOTER SECTION */}
          <View style={[styles.userSection, { borderTopColor: theme.border }]}>
            <View style={styles.userInfo}>
              <View style={[styles.avatar, { backgroundColor: PRIMARY }]}>
                <Text style={styles.avatarText}>{avatarLetter}</Text>
              </View>

              <View style={styles.userDetails}>
                <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>{displayName}</Text>
                <View style={styles.statusContainer}>
                  <View style={styles.statusDot} />
                  <Text style={[styles.statusText, { color: theme.textSecondary }]}>{(effectiveRole || 'STAFF').toUpperCase()}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.logoutButtonRow}
                activeOpacity={0.8}
                onPress={handleLogout}
              >
                <LogOut size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  alignLeft: {
    justifyContent: 'flex-start',
  },
  alignRight: {
    justifyContent: 'flex-end',
    flexDirection: 'row-reverse',
  },
  drawerContent: {
    height: '100%',
    borderRightWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    display: 'flex',
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  storeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  storeLogoBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  storeHeaderText: {
    flex: 1,
  },
  storeTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  storeSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  themeToggleButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 12,
  },
  menuContainer: {
    paddingHorizontal: 12,
  },
  groupHeader: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 6,
    position: 'relative',
  },
  groupLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  subMenuContainer: {
    marginBottom: 10,
    position: 'relative',
  },
  menuItem: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    position: 'relative',
    gap: 14,
  },
  nestedMenuItem: {
    height: 48,
    paddingLeft: 56,
  },
  nestedIndicator: {
    position: 'absolute',
    left: 27,
    top: -15,
    bottom: 24,
    width: 20,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#CBD5E1',
    borderBottomLeftRadius: 15,
  },
  nestedVerticalLine: {
    position: 'absolute',
    left: 27,
    top: 30,
    bottom: -8,
    borderLeftWidth: 2,
    borderColor: '#CBD5E1',
  },
  nestedIcon: {},
  nestedText: {},
  activeMenuItem: {},
  menuText: {
    fontSize: 15,
    fontWeight: '600',
  },
  activeText: {},
  activeIndicator: {
    position: 'absolute',
    right: 0,
    top: 12,
    bottom: 12,
    width: 4,
    borderRadius: 999,
  },
  menuItemBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 'auto',
    marginRight: 6,
  },
  menuItemBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  userSection: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  logoutButtonRow: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
});