# Header Component

## Description
App header component with title, optional subtitle, and left/right icon buttons.

## Import
```typescript
import { Header } from '@/components/Header';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | Required | Main header title |
| `subtitle` | `string` | `undefined` | Optional subtitle text |
| `leftIcon` | `React.ReactNode` | `undefined` | Left side icon/button |
| `rightIcon` | `React.ReactNode` | `undefined` | Right side icon/button |
| `onLeftPress` | `() => void` | `undefined` | Left icon press handler |
| `onRightPress` | `() => void` | `undefined` | Right icon press handler |

## Theme Colors Used

- `theme.headerBackground` - Header background
- `theme.divider` - Bottom border color
- `theme.text` - Title text color
- `theme.success` - Subtitle text color (green accent)

## Examples

### Basic Usage
```typescript
<Header title="DRIP POS Cashier" />
```

### With Theme Toggle
```typescript
const { theme, toggleColorMode, colorMode } = useTheme();

<Header 
  title="DRIP POS Cashier" 
  rightIcon={colorMode === 'dark' ? <Sun size={20} color={theme.icon} /> : <Moon size={20} color={theme.icon} />}
  onRightPress={toggleColorMode}
/>
```

### With Back Button
```typescript
<Header 
  title="Settings"
  leftIcon={<ArrowLeft size={20} color={theme.icon} />}
  onLeftPress={() => router.back()}
/>
```

### With Subtitle
```typescript
<Header 
  title="Register #1"
  subtitle="Online"
/>
```

### With Both Icons
```typescript
<Header 
  title="Profile"
  leftIcon={<ArrowLeft size={20} color={theme.icon} />}
  rightIcon={<Settings size={20} color={theme.icon} />}
  onLeftPress={() => router.back()}
  onRightPress={() => navigateToSettings()}
/>
```

## Layout Structure

```
┌─────────────────────────────────────┐
│ [Left Icon]   Title   [Right Icon] │
│              Subtitle               │
└─────────────────────────────────────┘
```

- Left container: 40px width
- Center container: Flex 1 (centered)
- Right container: 40px width
- Header height: 60px

## Styling Notes

- Fixed height: 60px
- Bottom border: 1px
- Horizontal padding: 16px
- Title font: 16px, 700 weight
- Subtitle font: 12px, normal weight
- Icon button padding: 8px

## Icon Behavior

- Icons only render when provided
- Icons are wrapped in TouchableOpacity
- Icons are centered in their containers
- Press handlers only work when icon is provided

## Subtitle Styling

- Uses green accent color (`theme.success`)
- Positioned below title with 2px margin
- Often used for status indicators (online, register numbers, etc.)
- Truncated with `numberOfLines={1}`

## Common Use Cases

### Navigation Header
```typescript
<Header 
  title="Product Details"
  leftIcon={<ArrowLeft size={20} color={theme.icon} />}
  onLeftPress={() => router.back()}
/>
```

### Action Header
```typescript
<Header 
  title="Settings"
  rightIcon={<Save size={20} color={theme.icon} />}
  onRightPress={handleSave}
/>
```

### Status Header
```typescript
<Header 
  title="Register #1"
  subtitle="Online"
/>
```

### Theme Toggle Header
```typescript
<Header 
  title="App Name"
  rightIcon={colorMode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
  onRightPress={toggleColorMode}
/>
```

## Maintenance

When updating this component:
1. Ensure text truncation works for long titles
2. Test icon touch targets (minimum 44x44)
3. Verify subtitle visibility in both themes
4. Check border visibility and color
5. Test with different icon sizes