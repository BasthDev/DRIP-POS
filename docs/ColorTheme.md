# ColorTheme System

## Description
Centralized theme management system supporting dark and light modes with React Context for dynamic theme switching.

## Import
```typescript
import { useTheme, ThemeProvider } from '@/constants/colorTheme';
```

## Theme Structure

### Color Categories

#### Background Colors
- `background` - Main app background
- `card` - Card/surface background
- `input` - Input field background
- `inputBorder` - Input field border

#### Text Colors
- `text` - Primary text color
- `textSecondary` - Secondary text color
- `textTertiary` - Tertiary text color
- `textDisabled` - Disabled text color

#### Accent Colors
- `primary` - Primary accent color (green)
- `primaryHover` - Primary hover state
- `primaryPressed` - Primary pressed state
- `secondary` - Secondary accent color (purple)
- `accent` - General accent color (red)

#### Border Colors
- `border` - Primary border color
- `borderLight` - Light border color

#### Status Colors
- `success` - Success state (green)
- `warning` - Warning state (orange)
- `error` - Error state (red)
- `info` - Info state (blue)

#### Overlay Colors
- `overlay` - Heavy overlay (75% opacity)
- `overlayLight` - Light overlay (50% opacity)

#### Special Colors
- `divider` - Divider/separator color
- `headerBackground` - Header background
- `icon` - Primary icon color
- `iconSecondary` - Secondary icon color

## Theme Modes

### Dark Mode (Default)
```typescript
{
  background: '#121214',
  card: '#1C1C1E',
  input: '#1C1C1E',
  inputBorder: '#26262B',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',
  textDisabled: '#52525B',
  primary: '#00E676',
  // ... more colors
}
```

### Light Mode
```typescript
{
  background: '#FFFFFF',
  card: '#F5F5F5',
  input: '#FFFFFF',
  inputBorder: '#E0E0E0',
  text: '#121214',
  textSecondary: '#52525B',
  textTertiary: '#71717A',
  textDisabled: '#A1A1AA',
  primary: '#00C853',
  // ... more colors
}
```

## Usage

### Setting Up ThemeProvider

Wrap your app with `ThemeProvider` in the root layout:

```typescript
// app/_layout.tsx
import { ThemeProvider } from '@/constants/colorTheme';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
```

### Using Theme in Components

```typescript
import { useTheme } from '@/constants/colorTheme';

export default function MyComponent() {
  const { theme, colorMode, toggleColorMode, setColorMode } = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.background }}>
      <Text style={{ color: theme.text }}>
        Current mode: {colorMode}
      </Text>
    </View>
  );
}
```

### Theme Toggle Button

```typescript
import { useTheme } from '@/constants/colorTheme';
import { Sun, Moon } from 'lucide-react-native';

export default function ThemeToggle() {
  const { theme, toggleColorMode, colorMode } = useTheme();
  
  return (
    <TouchableOpacity onPress={toggleColorMode}>
      {colorMode === 'dark' ? (
        <Sun size={20} color={theme.icon} />
      ) : (
        <Moon size={20} color={theme.icon} />
      )}
    </TouchableOpacity>
  );
}
```

### Manual Theme Switching

```typescript
const { setColorMode } = useTheme();

// Switch to dark mode
setColorMode('dark');

// Switch to light mode
setColorMode('light');
```

## useTheme Hook

Returns an object with:

```typescript
{
  colorMode: 'dark' | 'light',    // Current theme mode
  theme: ColorTheme,               // Current theme colors
  toggleColorMode: () => void,    // Toggle between modes
  setColorMode: (mode) => void     // Set specific mode
}
```

## Utility Functions

### withOpacity

Create transparent versions of colors:

```typescript
import { withOpacity } from '@/constants/colorTheme';

const transparentBackground = withOpacity(theme.background, 0.5);
const semiTransparentBorder = withOpacity(theme.border, 0.3);
```

## Best Practices

### Component Styling

Always use theme colors instead of hardcoded values:

```typescript
// ❌ Bad
<View style={{ backgroundColor: '#121214' }}>
  <Text style={{ color: '#FFFFFF' }}>Hello</Text>
</View>

// ✅ Good
<View style={{ backgroundColor: theme.background }}>
  <Text style={{ color: theme.text }}>Hello</Text>
</View>
```

### Conditional Styling

Use theme colors for states:

```typescript
<View style={[
  styles.container,
  isFocused && { borderColor: theme.primary },
  hasError && { borderColor: theme.error }
]}>
```

### Text Contrast

Ensure text has proper contrast with background:

```typescript
// High contrast combinations
theme.text on theme.background
theme.text on theme.card
theme.background on theme.primary (buttons)
```

## Extending the Theme

### Adding New Colors

1. Add to `ColorTheme` interface:
```typescript
export interface ColorTheme {
  // ... existing colors
  myNewColor: string;
}
```

2. Add to both theme objects:
```typescript
export const darkTheme: ColorTheme = {
  // ... existing colors
  myNewColor: '#FF0000',
};

export const lightTheme: ColorTheme = {
  // ... existing colors
  myNewColor: '#CC0000',
};
```

### Adding New Modes

1. Update ColorMode type:
```typescript
export type ColorMode = 'dark' | 'light' | 'custom';
```

2. Add new theme object:
```typescript
export const customTheme: ColorTheme = {
  // color definitions
};
```

3. Update themes record:
```typescript
export const themes: Record<ColorMode, ColorTheme> = {
  dark: darkTheme,
  light: lightTheme,
  custom: customTheme,
};
```

## Theme Persistence

To persist theme preference, add to your app:

```typescript
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [colorMode, setColorMode] = useState<ColorMode>('dark');
  
  useEffect(() => {
    // Load saved theme
    AsyncStorage.getItem('theme').then(saved => {
      if (saved === 'dark' || saved === 'light') {
        setColorMode(saved);
      }
    });
  }, []);
  
  const toggleColorMode = () => {
    const newMode = colorMode === 'dark' ? 'light' : 'dark';
    setColorMode(newMode);
    AsyncStorage.setItem('theme', newMode);
  };
  
  // ... rest of provider
};
```

## Accessibility Considerations

### Color Contrast

Ensure your theme colors meet WCAG AA standards:
- Normal text: 4.5:1 contrast ratio
- Large text: 3:1 contrast ratio
- UI components: 3:1 contrast ratio

### Testing

Test your theme in both modes:
```typescript
// Use Expo's device simulation to test
// Both dark and light system preferences
```

## Common Issues

### Theme Not Updating

- Ensure component is wrapped in `ThemeProvider`
- Check that `useTheme` is called within the provider
- Verify theme context is properly set up

### Colors Not Applying

- Make sure to use `theme.colorName` syntax
- Check that color exists in theme interface
- Verify component is re-rendering on theme change

### Type Errors

- Ensure all colors are defined in both theme objects
- Check that ColorTheme interface matches theme objects
- Verify useTheme return type matches your usage

## Maintenance

When updating the theme system:

1. **Test all components** in both dark and light modes
2. **Check color contrast** for accessibility
3. **Update documentation** for any new colors
4. **Verify existing components** still work correctly
5. **Test theme switching** performance
6. **Check for breaking changes** in color names