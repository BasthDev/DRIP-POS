import { DripDrawer } from '@/components/drawer';
import { ThemeProvider, useTheme } from '@/constants/colorTheme';
import { DrawerProvider } from '@/constants/drawerContext';
import { Stack } from 'expo-router';
import React from 'react';
import { StatusBar, View } from 'react-native';

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
          theme.background === '#121214'
            ? 'light-content'
            : 'dark-content'
        }
      />

      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />

      <DripDrawer position="left" />
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <DrawerProvider>
        <MainLayout />
      </DrawerProvider>
    </ThemeProvider>
  );
}