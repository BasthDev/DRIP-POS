import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState
} from 'react';

export type ColorMode = 'dark' | 'light';

export interface ColorTheme {
  // Background
  background: string;
  card: string;
  input: string;
  inputBorder: string;

  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  textDisabled: string;

  // Brand
  primary: string;
  primaryHover: string;
  primaryPressed: string;
  secondary: string;
  accent: string;

  // Borders
  border: string;
  borderLight: string;

  // Status
  success: string;
  warning: string;
  error: string;
  info: string;

  // Overlay
  overlay: string;
  overlayLight: string;

  // Special
  divider: string;
  headerBackground: string;
  icon: string;
  iconSecondary: string;
}

/*
|--------------------------------------------------------------------------
| DARK THEME
|--------------------------------------------------------------------------
*/

export const darkTheme: ColorTheme = {
  // Background
  background: '#101412',
  card: '#171C19',
  input: '#171C19',
  inputBorder: '#2A332F',

  // Text
  text: '#F5F7F6',
  textSecondary: '#A7B0AC',
  textTertiary: '#747D79',
  textDisabled: '#4E5652',

  // Brand
  primary: '#3D7066',
  primaryHover: '#4A8176',
  primaryPressed: '#315B53',

  secondary: '#8B7CF6',
  accent: '#E97B6F',

  // Borders
  border: '#29312E',
  borderLight: '#39433F',

  // Status
  success: '#43B581',
  warning: '#E6A84A',
  error: '#E56B6F',
  info: '#5BA7D1',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.70)',
  overlayLight: 'rgba(0, 0, 0, 0.35)',

  // Special
  divider: '#252D2A',
  headerBackground: '#101412',
  icon: '#F5F7F6',
  iconSecondary: '#7D8782',
};

/*
|--------------------------------------------------------------------------
| LIGHT THEME
|--------------------------------------------------------------------------
*/

export const lightTheme: ColorTheme = {
  // Background
  background: '#F6F8F7',
  card: '#FFFFFF',
  input: '#FFFFFF',
  inputBorder: '#DCE3E0',

  // Text
  text: '#17201C',
  textSecondary: '#58635E',
  textTertiary: '#7B8580',
  textDisabled: '#AEB7B3',

  // Brand
  primary: '#3D7066',
  primaryHover: '#315F56',
  primaryPressed: '#294F48',

  secondary: '#6D5DD3',
  accent: '#D9655A',

  // Borders
  border: '#DCE3E0',
  borderLight: '#E9EEEC',

  // Status
  success: '#2E9B6F',
  warning: '#D9942F',
  error: '#D9555B',
  info: '#428DB7',

  // Overlay
  overlay: 'rgba(15, 25, 21, 0.45)',
  overlayLight: 'rgba(15, 25, 21, 0.18)',

  // Special
  divider: '#E5EAE8',
  headerBackground: '#F6F8F7',
  icon: '#17201C',
  iconSecondary: '#6E7974',
};

/*
|--------------------------------------------------------------------------
| THEMES
|--------------------------------------------------------------------------
*/

export const themes: Record<ColorMode, ColorTheme> = {
  dark: darkTheme,
  light: lightTheme,
};

export const defaultTheme: ColorMode = 'dark';

export const getTheme = (
  mode: ColorMode = defaultTheme
): ColorTheme => {
  return themes[mode];
};

/*
|--------------------------------------------------------------------------
| CONTEXT
|--------------------------------------------------------------------------
*/

interface ThemeContextType {
  colorMode: ColorMode;
  theme: ColorTheme;
  toggleColorMode: () => void;
  setColorMode: (mode: ColorMode) => void;
}

const ThemeContext =
  createContext<ThemeContextType | undefined>(undefined);

/*
|--------------------------------------------------------------------------
| PROVIDER
|--------------------------------------------------------------------------
*/

export const ThemeProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [colorMode, setColorMode] =
    useState<ColorMode>(defaultTheme);

  const theme = getTheme(colorMode);

  // Load saved theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('colorMode');
        if (savedMode === 'dark' || savedMode === 'light') {
          setColorMode(savedMode);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };
    loadTheme();
  }, []);

  // Save theme preference when it changes
  useEffect(() => {
    const saveTheme = async () => {
      try {
        await AsyncStorage.setItem('colorMode', colorMode);
      } catch (error) {
        console.error('Failed to save theme preference:', error);
      }
    };
    saveTheme();
  }, [colorMode]);

  const toggleColorMode = () => {
    setColorMode((prev) =>
      prev === 'dark' ? 'light' : 'dark'
    );
  };

  return (
    <ThemeContext.Provider
      value={{
        colorMode,
        theme,
        toggleColorMode,
        setColorMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

/*
|--------------------------------------------------------------------------
| HOOK
|--------------------------------------------------------------------------
*/

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useTheme must be used within a ThemeProvider'
    );
  }

  return context;
};

/*
|--------------------------------------------------------------------------
| COLOR UTILITIES
|--------------------------------------------------------------------------
*/

export const withOpacity = (
  color: string,
  opacity: number
): string => {
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  return color;
};