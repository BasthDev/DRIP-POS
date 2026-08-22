import { DripButton } from '@/components/Button';
import { DripInput } from '@/components/Input';
import { DripToast } from '@/components/Toast';
import { useAuth } from '@/constants/auth';
import { useTheme } from '@/constants/colorTheme';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { MapPin, Phone, Store } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function StoreSetupScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [storeName, setStoreName] = useState('Main Branch');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('error');

  const handleCreateStore = async () => {
    if (!storeName.trim()) {
      setToastMessage(t('storeSetup.requireBranchName'));
      setToastType('error');
      setToastVisible(true);
      return;
    }

    try {
      setLoading(true);

      // 1. Get user profile & organization membership
      let orgId: string | null = null;

      if (user?.id) {
        const { data: memberData } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1);

        if (memberData && memberData.length > 0) {
          orgId = memberData[0].organization_id;
        }
      }

      // If no organization found, fallback to creating one
      if (!orgId) {
        const busName = (user as any)?.businessName || user?.name + "'s Business" || 'My Business';
        const slug = lowerSlug(busName) + '-' + Math.floor(Math.random() * 1000);

        const { data: newOrg } = await supabase
          .from('organizations')
          .insert([{ name: busName, slug }])
          .select();

        if (newOrg && newOrg[0]) {
          orgId = newOrg[0].id;
          if (user?.id) {
            await supabase.from('organization_members').insert([{
              organization_id: orgId,
              user_id: user.id,
              role: 'owner',
            }]);
          }
        }
      }

      if (!orgId) {
        throw new Error('Failed to identify or create Organization for store setup.');
      }

      // 2. Create Store branch in Supabase
      const storeSlug = lowerSlug(storeName) + '-' + Math.floor(Math.random() * 1000);
      const { data: newStore, error: storeErr } = await supabase
        .from('stores')
        .insert([{
          organization_id: orgId,
          name: storeName.trim(),
          slug: storeSlug,
          address: address.trim() || null,
          phone: phone.trim() || null,
          is_active: true,
          status: 'active',
        }])
        .select();

      if (storeErr || !newStore || !newStore[0]) {
        throw new Error(storeErr?.message || 'Failed to create store branch.');
      }

      const createdStore = newStore[0];

      // 3. Create default Warehouse for the store
      await supabase.from('warehouses').insert([{
        organization_id: orgId,
        store_id: createdStore.id,
        name: 'Main Warehouse',
        is_default: true,
      }]);

      // 4. Link user in store_members
      if (user?.id) {
        await supabase.from('store_members').insert([{
          store_id: createdStore.id,
          user_id: user.id,
          role: 'owner',
        }]);
      }

      setToastMessage(t('storeSetup.successMessage'));
      setToastType('success');
      setToastVisible(true);

      setTimeout(() => {
        router.replace('/' as any);
      }, 400);
    } catch (err: any) {
      setToastMessage(err.message || t('common.error'));
      setToastType('error');
      setToastVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const lowerSlug = (str: string) => {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
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
            <Text style={[styles.title, { color: theme.text }]}>{t('storeSetup.title')}</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {t('storeSetup.subtitle')}
            </Text>
          </View>

          <View style={styles.form}>
            <DripInput
              label={t('storeSetup.branchName')}
              value={storeName}
              onChangeText={setStoreName}
              leftIcon={<Store size={18} color={theme.textSecondary} />}
              placeholder={t('storeSetup.branchNamePlaceholder')}
            />

            <DripInput
              label={t('storeSetup.storePhone')}
              value={phone}
              onChangeText={setPhone}
              leftIcon={<Phone size={18} color={theme.textSecondary} />}
              keyboardType="phone-pad"
            />

            <DripInput
              label={t('storeSetup.address')}
              value={address}
              onChangeText={setAddress}
              leftIcon={<MapPin size={18} color={theme.textSecondary} />}
            />

            <DripButton
              title={t('storeSetup.submitButton')}
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  form: {
    gap: 16,
  },
  submitBtn: {
    marginTop: 8,
  },
});
