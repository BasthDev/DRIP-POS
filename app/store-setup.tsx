import { DripInput } from '@/components/Input';
import { useTheme } from '@/constants/colorTheme';
import { router } from 'expo-router';
import { MapPin, Store } from 'lucide-react-native';
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

export default function StoreSetupScreen() {
  const { theme } = useTheme();
  const [storeName, setStoreName] = useState('');
  const [branch, setBranch] = useState('');
  const [address, setAddress] = useState('');

  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const isTablet = SCREEN_WIDTH >= 768;

  const handleCompleteSetup = () => {
    // Complete store initialization and route into the POS dashboard
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
            
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text }]}>Configure Store</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Setup your POS branch details</Text>
            </View>

            <View style={styles.form}>
              <DripInput
                label="Store Name"
                placeholder="Drip Coffee Co."
                value={storeName}
                onChangeText={setStoreName}
                leftIcon={<Store size={18} color={theme.textTertiary} />}
              />

              <DripInput
                label="Branch Location / Title"
                placeholder="Main Street Branch"
                value={branch}
                onChangeText={setBranch}
              />

              <DripInput
                label="Physical Address"
                placeholder="123 Coffee Lane, Suite 4B"
                value={address}
                onChangeText={setAddress}
                leftIcon={<MapPin size={18} color={theme.textTertiary} />}
              />

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                onPress={handleCompleteSetup}
              >
                <Text style={styles.primaryButtonText}>Launch POS Terminal</Text>
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
});