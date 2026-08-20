import { DripInput } from '@/components/Input';
import { useTheme } from '@/constants/colorTheme';
import { router } from 'expo-router';
import { KeyRound, Mail } from 'lucide-react-native';
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

export default function ForgotPasswordScreen() {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');

  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const isTablet = SCREEN_WIDTH >= 768;

  const handleResetRequest = () => {
    // Trigger password reset email logic
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={[styles.scroll, isTablet && styles.tabletScroll]}>
          <View style={[styles.card, isTablet && styles.tabletCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            
            <View style={styles.header}>
              <View style={[styles.logoBox, { backgroundColor: theme.primary + '15' }]}>
                <KeyRound size={28} color={theme.primary} />
              </View>
              <Text style={[styles.title, { color: theme.text }]}>Reset Password</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Enter your account email to receive reset instructions</Text>
            </View>

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

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                onPress={handleResetRequest}
              >
                <Text style={styles.primaryButtonText}>Send Reset Link</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footerRow}>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 14 }}>Back to Sign In</Text>
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
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  tabletScroll: { alignItems: 'center' },
  card: { width: '100%', borderRadius: 20, padding: 24, borderWidth: 1 },
  tabletCard: { width: 440 },
  header: { marginBottom: 24, alignItems: 'center' },
  logoBox: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 4, textAlign: 'center' },
  form: { gap: 14 },
  primaryButton: { height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  footerRow: { alignItems: 'center', marginTop: 20 },
});