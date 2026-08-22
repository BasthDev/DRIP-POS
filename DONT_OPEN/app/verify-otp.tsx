import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/constants/colorTheme';
import { DripInput } from '@/components/Input';
import { DripButton } from '@/components/Button';
import { DripToast } from '@/components/Toast';
import { ShieldCheck, Mail } from 'lucide-react-native';
import { useAuth } from '@/contexts/authContext';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { theme } = useTheme();
  const { verifyOtp } = useAuth();

  const [email, setEmail] = useState(params.email || '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('error');

  const handleVerify = async () => {
    if (!email.trim() || !otp.trim()) {
      setToastMessage('Please enter email and 6-digit OTP code.');
      setToastType('error');
      setToastVisible(true);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await verifyOtp(email.trim(), otp.trim());

      if (error) {
        setToastMessage(error.message || 'Invalid or expired OTP code.');
        setToastType('error');
        setToastVisible(true);
        return;
      }

      setToastMessage('Account verified successfully!');
      setToastType('success');
      setToastVisible(true);

      setTimeout(() => {
        router.replace('/store-setup');
      }, 1000);
    } catch (err: any) {
      setToastMessage(err.message || 'Verification failed');
      setToastType('error');
      setToastVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={[styles.iconWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <ShieldCheck size={32} color={theme.primary} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Verify Your Email</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Enter the 6-digit code sent to your email
            </Text>
          </View>

          <View style={styles.form}>
            <DripInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              leftIcon={<Mail size={18} color={theme.textSecondary} />}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <DripInput
              label="6-Digit Verification Code"
              value={otp}
              onChangeText={setOtp}
              leftIcon={<ShieldCheck size={18} color={theme.textSecondary} />}
              keyboardType="number-pad"
              maxLength={6}
            />

            <DripButton
              title="Verify & Continue"
              onPress={handleVerify}
              loading={loading}
              style={styles.submitBtn}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              Didn't receive the code?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={[styles.resendLink, { color: theme.primary }]}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <DripToast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onClose={() => setToastVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  submitBtn: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});