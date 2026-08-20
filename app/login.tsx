import { DripInput } from '@/components/Input';
import { useTheme } from '@/constants/colorTheme';
import { router } from 'expo-router';
import { Lock, Mail, Store } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const isTablet = SCREEN_WIDTH >= 768;

  const handleLogin = () => {
    // Perform authentication logic here
    router.replace('/');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={[styles.scroll, isTablet && styles.tabletScroll]}>
          <View style={[styles.card, isTablet && styles.tabletCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            
            {/* Header Branding */}
            <View style={styles.header}>
              <View style={[styles.logoBox, { backgroundColor: theme.primary + '15' }]}>
                <Store size={28} color={theme.primary} />
              </View>
              <Text style={[styles.title, { color: theme.text }]}>Welcome Back to Drip</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Sign in to manage your POS terminal</Text>
            </View>

            {/* Google Auth Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.googleButton, { backgroundColor: theme.input, borderColor: theme.border }]}
              onPress={() => {}}
            >
              <Text style={[styles.googleText, { color: theme.text }]}>Continue with Google</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={[styles.line, { backgroundColor: theme.border }]} />
              <Text style={[styles.dividerText, { color: theme.textTertiary }]}>OR EMAIL</Text>
              <View style={[styles.line, { backgroundColor: theme.border }]} />
            </View>

            {/* Form Inputs */}
            <View style={styles.form}>
              <DripInput
                label="Email Address"
                placeholder="cashier@drip.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Mail size={18} color={theme.textTertiary} />}
              />

              <DripInput
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                leftIcon={<Lock size={18} color={theme.textTertiary} />}
              />

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                onPress={handleLogin}
              >
                <Text style={styles.primaryButtonText}>Sign In</Text>
              </TouchableOpacity>
            </View>

            {/* Footer Navigation to Register */}
            <View style={styles.footerRow}>
              <Text style={{ color: theme.textSecondary, fontSize: 14 }}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 14 }}>Register</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  tabletScroll: {
    alignItems: 'center',
  },
  card: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  tabletCard: {
    width: 440,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  googleButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  googleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  line: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    marginHorizontal: 10,
    letterSpacing: 0.5,
  },
  form: {
    gap: 14,
  },
  primaryButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
});