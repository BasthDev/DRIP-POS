import { DripInput } from '@/components/Input';
import { useTheme } from '@/constants/colorTheme';
import { router } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
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

export default function VerifyOtpScreen() {
  const { theme } = useTheme();
  const [otp, setOtp] = useState('');

  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const isTablet = SCREEN_WIDTH >= 768;

  const handleVerify = () => {
    // After OTP verification succeeds, navigate to Store Setup
    router.push('/store-setup');
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
                <ShieldCheck size={28} color={theme.primary} />
              </View>
              <Text style={[styles.title, { color: theme.text }]}>Verify Your Email</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Enter the 6-digit code sent to your inbox</Text>
            </View>

            <View style={styles.form}>
              <DripInput
                label="Verification Code"
                placeholder="123456"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                onPress={handleVerify}
              >
                <Text style={styles.primaryButtonText}>Verify & Proceed</Text>
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
});