import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/constants/colorTheme';
import { DripInput } from '@/components/Input';
import { DripButton } from '@/components/Button';
import { DripToast } from '@/components/Toast';
import { Mail, Lock, Store } from 'lucide-react-native';
import { useAuth } from '@/constants/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { login, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('error');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setToastMessage('Please enter your email and password.');
      setToastType('error');
      setToastVisible(true);
      return;
    }

    try {
      setLoading(true);
      const { error } = await login(email.trim(), password);

      if (error) {
        setToastMessage(error.message || 'Login failed. Please check your credentials.');
        setToastType('error');
        setToastVisible(true);
        return;
      }

      router.replace('/' as any);
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
            <Text style={[styles.title, { color: theme.text }]}>Welcome Back</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Sign in to manage your stores and POS terminal
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
              label="Password"
              value={password}
              onChangeText={setPassword}
              leftIcon={<Lock size={18} color={theme.textSecondary} />}
              secureTextEntry
              autoCapitalize="none"
            />

            <DripButton
              title="Sign In"
              onPress={handleLogin}
              loading={loading || authLoading}
              style={styles.submitBtn}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={[styles.registerLink, { color: theme.primary }]}>Sign Up</Text>
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
  registerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});