import { DripInput } from '@/components/Input';
import { useTheme } from '@/constants/colorTheme';
import { router } from 'expo-router';
import { Lock, Mail, User } from 'lucide-react-native';
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

export default function RegisterScreen() {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const isTablet = SCREEN_WIDTH >= 768;

  const handleRegister = () => {
    // After successful credential generation, navigate to OTP verification screen
    router.push('/verify-otp');
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
              <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Set up your Drip POS credentials</Text>
            </View>

            <View style={styles.form}>
              <DripInput
                label="Full Name"
                placeholder="Alex Morgan"
                value={name}
                onChangeText={setName}
                leftIcon={<User size={18} color={theme.textTertiary} />}
              />

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
                onPress={handleRegister}
              >
                <Text style={styles.primaryButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footerRow}>
              <Text style={{ color: theme.textSecondary, fontSize: 14 }}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 14 }}>Sign In</Text>
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
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 4 },
  form: { gap: 14 },
  primaryButton: { height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
});