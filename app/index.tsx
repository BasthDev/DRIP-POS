import { DripButton } from '@/components/Button';
import { Header } from '@/components/Header';
import { useTheme } from '@/constants/colorTheme';
import { useDrawer } from '@/constants/drawerContext';
import { router } from 'expo-router';
import {
  Compass,
  KeyRound,
  LogIn,
  Menu,
  ShieldCheck,
  Store,
  UserPlus
} from 'lucide-react-native';
import React from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UIIndexShowcase() {
  const { theme, colorMode, toggleColorMode } = useTheme();
  const { openDrawer } = useDrawer();

  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const isTablet = SCREEN_WIDTH >= 768;

  const navigateTo = (path: string) => {
    router.push(path as any);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <Header
        title="Drip UI Showcase"
        subtitle="Design System & Navigation Hub"
        onLeftPress={openDrawer}
        rightIcon={<Compass size={20} color={theme.text} />}
        onRightPress={toggleColorMode}
      />

      <ScrollView contentContainerStyle={[styles.container, isTablet && styles.tabletContainer]}>
        
        {/* Intro Card */}
        <View style={[styles.welcomeCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.welcomeTitle, { color: theme.text }]}>Welcome to Drip POS Design System</Text>
          <Text style={[styles.welcomeSub, { color: theme.textSecondary }]}>
            Tap any button below to instantly navigate and test the screen layouts across your mobile and tablet views.
          </Text>
        </View>

        {/* Section: Authentication & Onboarding Flows */}
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>AUTHENTICATION & ONBOARDING</Text>
        
        <View style={styles.grid}>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
              <LogIn size={20} color={theme.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Login Screen</Text>
            <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>Google & email auth entry.</Text>
            <DripButton title="View Login" onPress={() => navigateTo('/login')} variant="secondary" style={styles.btn} />
          </View>

          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
              <UserPlus size={20} color={theme.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Register Screen</Text>
            <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>New account credential setup.</Text>
            <DripButton title="View Register" onPress={() => navigateTo('/register')} variant="secondary" style={styles.btn} />
          </View>

          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
              <ShieldCheck size={20} color={theme.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Verify OTP</Text>
            <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>6-digit verification code pin.</Text>
            <DripButton title="View OTP" onPress={() => navigateTo('/verify-otp')} variant="secondary" style={styles.btn} />
          </View>

          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
              <Store size={20} color={theme.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Store Setup</Text>
            <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>Branch location & info form.</Text>
            <DripButton title="View Store Setup" onPress={() => navigateTo('/store-setup')} variant="secondary" style={styles.btn} />
          </View>

          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
              <KeyRound size={20} color={theme.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Forgot Password</Text>
            <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>Pin recovery & reset link.</Text>
            <DripButton title="View Reset" onPress={() => navigateTo('/forgot-password')} variant="secondary" style={styles.btn} />
          </View>
        </View>

        {/* Section: Drawer & Navigation Test */}
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>GLOBAL COMPONENTS</Text>
        
        <View style={[styles.cardWide, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.wideRow}>
            <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
              <Menu size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Role-Based Navigation Drawer</Text>
              <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
                Tap the top-left menu icon in the header above to test the slide-in drawer with live dark mode toggle and role filtering.
              </Text>
            </View>
          </View>
          <DripButton title="Open Drawer Directly" onPress={openDrawer} variant="primary" style={{ marginTop: 14 }} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 16, gap: 16, paddingBottom: 40 },
  tabletContainer: { paddingHorizontal: 40 },
  welcomeCard: { padding: 20, borderRadius: 16, borderWidth: 1 },
  welcomeTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  welcomeSub: { fontSize: 13, lineHeight: 18 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 8, marginLeft: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '48%', flexGrow: 1, padding: 16, borderRadius: 16, borderWidth: 1, justifyContent: 'space-between' },
  cardWide: { width: '100%', padding: 16, borderRadius: 16, borderWidth: 1 },
  wideRow: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  cardDesc: { fontSize: 12, marginBottom: 14 },
  btn: { marginTop: 'auto' },
});