import { DripDrawer } from '@/components/drawer';
import { AuthProvider, useAuth } from '@/constants/auth';
import { ThemeProvider, useTheme } from '@/constants/colorTheme';
import { DrawerProvider } from '@/constants/drawerContext';
import { supabase } from '@/lib/supabase';
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';

function NavigationGate({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [storeChecked, setStoreChecked] = useState(false);
  const [hasStore, setHasStore] = useState<boolean | null>(null);

  const currentRoute = segments[0] as string | undefined;

  // 1. Check store existence whenever user changes OR when on store-setup
  useEffect(() => {
    let isMounted = true;

    if (!user) {
      setHasStore(null);
      setStoreChecked(true);
      return;
    }

    const checkStore = async () => {
      try {
        const { data: storeData } = await supabase
          .from('stores')
          .select('id')
          .limit(1);

        if (isMounted) {
          const storeExists = storeData !== null && storeData.length > 0;
          setHasStore(storeExists);
          setStoreChecked(true);
        }
      } catch (err) {
        if (isMounted) {
          setHasStore(true); // Fallback to avoid infinite block
          setStoreChecked(true);
        }
      }
    };

    checkStore();

    return () => {
      isMounted = false;
    };
  }, [user, currentRoute]);

  // 2. Perform route guards without unmounting navigation stack
  useEffect(() => {
    if (authLoading || !storeChecked) return;

    const inAuthGroup = currentRoute === 'login' || currentRoute === 'register';

    if (!user) {
      if (!inAuthGroup) {
        router.replace('/login');
      }
      return;
    }

    if (hasStore === false) {
      if (currentRoute !== 'store-setup') {
        router.replace('/store-setup' as any);
      }
      return;
    }

    if (hasStore === true) {
      if (inAuthGroup || currentRoute === 'store-setup') {
        router.replace('/' as any);
      }
    }
  }, [user, authLoading, storeChecked, hasStore, currentRoute]);

  if (authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#065F46" />
      </View>
    );
  }

  return <>{children}</>;
}

function MainLayout() {
  const { theme } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background,
      }}
    >
      <StatusBar
        backgroundColor={theme.background}
        barStyle={
          theme.background === '#121214' || theme.background === '#101412'
            ? 'light-content'
            : 'dark-content'
        }
      />

      <NavigationGate>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
        <DripDrawer position="left" />
      </NavigationGate>
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DrawerProvider>
          <MainLayout />
        </DrawerProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}