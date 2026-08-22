import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/constants/colorTheme';
import { DripInput } from '@/components/Input';
import { DripButton } from '@/components/Button';
import { DripToast } from '@/components/Toast';
import { Mail, Lock, User, Store } from 'lucide-react-native';
import { useAuth } from '@/contexts/authContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('error');

  const handleRegister = async () => {
    if (!fullName.trim() || !businessName.trim() || !email.trim() || !password.trim()) {
      setToastMessage('Please fill in all fields.');
      setToastType('error');
      setToastVisible(true);
      return;
    }

    if (password.length < 6) {
      setToastMessage('Password must be at least 6 characters.');
      setToastType('error');
      setToastVisible(true);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await signUp(email.trim(), password, fullName.trim(), businessName.trim());

      if (error) {
        setToastMessage(error.message || 'Registration failed');
        setToastType('error');
        setToastVisible(true);
        return;
      }

      // If session exists immediately (e.g. email confirmations disabled on project)
      if (data?.session) {
        router.replace('/store-setup');
      } else {
        // Navigate to OTP verification passing the email
        router.push({
          pathname: '/verify-otp',
          params: { email: email.trim() },
        });
      }
    } catch (err: any) {
      setToastMessage(err.message || 'An unexpected error occurred');
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
              <Store size={32} color={theme.primary} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Get Started</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Create your business account to start selling
            </Text>
          </View>

          <View style={styles.form}>
            <DripInput
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              leftIcon={<User size={18} color={theme.textSecondary} />}
              autoCapitalize="words"
            />

            <DripInput
              label="Business Name"
              value={businessName}
              onChangeText={setBusinessName}
              leftIcon={<Store size={18} color={theme.textSecondary} />}
              autoCapitalize="words"
            />

            <DripInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              leftIcon={<Mail size={18} color={theme.textSecondary} />}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <DripInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              leftIcon={<Lock size={18} color={theme.textSecondary} />}
              secureTextEntry
              autoCapitalize="none"
            />

            <DripButton
              title="Continue"
              onPress={handleRegister}
              loading={loading}
              style={styles.submitBtn}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={[styles.loginLink, { color: theme.primary }]}>Sign In</Text>
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
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});