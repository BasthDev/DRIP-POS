import { DripDrawer } from '@/components/drawer';
import { AuthProvider, useAuth } from '@/constants/auth';
import { ThemeProvider, useTheme } from '@/constants/colorTheme';
import { DrawerProvider } from '@/constants/drawerContext';
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';

function NavigationGate({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    const currentRoute = segments[0] as string | undefined;
    const inAuthGroup = currentRoute === 'login' || currentRoute === 'register';

    // Unauthenticated -> Send to login if not already in auth
    if (!user && !inAuthGroup) {
      router.replace('/login');
      return;
    }

    // Authenticated and has store, but currently on auth screens -> Send to Home / POS
    if (user && inAuthGroup) {
      router.replace('/' as any);
    }
  }, [user, authLoading, segments]);

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