import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/constants/colorTheme';
import { DripInput } from '@/components/Input';
import { DripButton } from '@/components/Button';
import { DripToast } from '@/components/Toast';
import { KeyRound, Mail, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/authContext';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('error');

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setToastMessage('Please enter your email address.');
      setToastType('error');
      setToastVisible(true);
      return;
    }

    try {
      setLoading(true);
      const { error } = await resetPassword(email.trim());

      if (error) {
        setToastMessage(error.message || 'Failed to send password reset instructions.');
        setToastType('error');
        setToastVisible(true);
        return;
      }

      setToastMessage('Reset instructions sent to your email.');
      setToastType('success');
      setToastVisible(true);

      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (err: any) {
      setToastMessage(err.message || 'An error occurred.');
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
          <TouchableOpacity 
            style={[styles.backBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={[styles.iconWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <KeyRound size={32} color={theme.primary} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Reset Password</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Enter your email and we'll send you instructions to reset your password
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

            <DripButton
              title="Send Reset Link"
              onPress={handleResetPassword}
              loading={loading}
              style={styles.submitBtn}
            />
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
});