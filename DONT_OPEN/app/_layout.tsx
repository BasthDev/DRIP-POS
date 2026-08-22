import { DripDrawer } from '@/components/drawer';
import { ThemeProvider, useTheme } from '@/constants/colorTheme';
import { DrawerProvider } from '@/constants/drawerContext';
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { AuthProvider, useAuth } from '@/contexts/authContext';
import { OrganizationProvider, useOrganization } from '@/contexts/organizationContext';
import { StoreProvider, useStore } from '@/contexts/storeContext';
import { CatalogProvider } from '@/contexts/catalogContext';
import { RecipeProvider } from '@/contexts/recipeContext';
import { InventoryProvider } from '@/contexts/inventoryContext';
import { CartProvider } from '@/contexts/cartContext';

function NavigationGate({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { organizations, loading: orgLoading } = useOrganization();
  const { stores, loading: storeLoading } = useStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (authLoading || orgLoading || storeLoading) return;

    const currentRoute = segments[0] as string | undefined;
    const inAuthGroup = currentRoute === 'login' || currentRoute === 'register' || currentRoute === 'verify-otp' || currentRoute === 'forgot-password';

    // 1. Unauthenticated -> Send to login if not already in auth
    if (!user) {
      if (!inAuthGroup) {
        router.replace('/login');
      }
      return;
    }

    // 2. Authenticated but has no organizations -> Wait or go to register/setup
    // In our architecture, onboarding auto-creates org. If user has org but no stores -> redirect to store-setup
    if (user && organizations.length > 0 && stores.length === 0 && currentRoute !== 'store-setup') {
      router.replace('/store-setup');
      return;
    }

    // 3. Authenticated and has store, but currently on auth screens -> Send to Home / POS
    if (user && inAuthGroup && stores.length > 0) {
      router.replace('/' as any);
    }
  }, [user, authLoading, orgLoading, storeLoading, segments, organizations, stores]);

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
        <OrganizationProvider>
          <StoreProvider>
            <CatalogProvider>
              <RecipeProvider>
                <InventoryProvider>
                  <CartProvider>
                    <DrawerProvider>
                      <MainLayout />
                    </DrawerProvider>
                  </CartProvider>
                </InventoryProvider>
              </RecipeProvider>
            </CatalogProvider>
          </StoreProvider>
        </OrganizationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}