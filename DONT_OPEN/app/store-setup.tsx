import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/constants/colorTheme';
import { DripInput } from '@/components/Input';
import { DripButton } from '@/components/Button';
import { DripToast } from '@/components/Toast';
import { Store, MapPin, Phone } from 'lucide-react-native';
import { useStore } from '@/contexts/storeContext';
import { useOrganization } from '@/contexts/organizationContext';

export default function StoreSetupScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { stores, loading: storeLoading, createStore } = useStore();
  const { currentOrganization, loading: orgLoading } = useOrganization();

  // If stores already exist, immediately skip setup and go to POS
  useEffect(() => {
    if (!storeLoading && stores.length > 0) {
      router.replace('/' as any);
    }
  }, [stores, storeLoading]);

  const [storeName, setStoreName] = useState(
    currentOrganization ? `${currentOrganization.name} Main Branch` : ''
  );
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('error');

  const handleCreateStore = async () => {
    if (!storeName.trim()) {
      setToastMessage('Please provide a store name.');
      setToastType('error');
      setToastVisible(true);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await createStore({
        name: storeName.trim(),
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
      });

      if (error) {
        setToastMessage(error.message || 'Failed to create store branch.');
        setToastType('error');
        setToastVisible(true);
        return;
      }

      setToastMessage('Store created successfully!');
      setToastType('success');
      setToastVisible(true);

      setTimeout(() => {
        router.replace('/' as any);
      }, 1000);
    } catch (err: any) {
      setToastMessage(err.message || 'An error occurred during store creation.');
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
            <Text style={[styles.title, { color: theme.text }]}>Setup Your First Store</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Configure your primary store branch to launch the POS terminal
            </Text>
            {currentOrganization && (
              <View style={[styles.orgBadge, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.orgBadgeText, { color: theme.primary }]}>
                  Business: {currentOrganization.name}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.form}>
            <DripInput
              label="Store Branch Name"
              value={storeName}
              onChangeText={setStoreName}
              leftIcon={<Store size={18} color={theme.textSecondary} />}
              placeholder="e.g. Drip Coffee Medan"
            />

            <DripInput
              label="Store Phone (Optional)"
              value={phone}
              onChangeText={setPhone}
              leftIcon={<Phone size={18} color={theme.textSecondary} />}
              keyboardType="phone-pad"
            />

            <DripInput
              label="Physical Address (Optional)"
              value={address}
              onChangeText={setAddress}
              leftIcon={<MapPin size={18} color={theme.textSecondary} />}
            />

            <DripButton
              title="Launch POS Terminal"
              onPress={handleCreateStore}
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
  header: {
    alignItems: 'center',
    marginBottom: 28,
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
    marginBottom: 12,
  },
  orgBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  orgBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  form: {
    gap: 16,
  },
  submitBtn: {
    marginTop: 8,
  },
});