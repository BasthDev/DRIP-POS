# DripInput Component

## Description
Text input component with floating label animation, left/right icons, and error state support.

## Import
```typescript
import { DripInput } from '@/components/Input';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | Required | Input label/placeholder |
| `value` | `string` | Required | Input value |
| `onChangeText` | `(text: string) => void` | Required | Text change handler |
| `error` | `string` | `undefined` | Error message (shows error state) |
| `leftIcon` | `React.ReactNode` | `undefined` | Icon on left side |
| `rightIcon` | `React.ReactNode` | `undefined` | Icon on right side |
| `onRightIconPress` | `() => void` | `undefined` | Right icon press handler |
| ...props | `TextInputProps` | - | All standard TextInput props |

## Theme Colors Used

- `theme.input` - Input background
- `theme.inputBorder` - Default border color
- `theme.primary` - Focused border color
- `theme.error` - Error state border and text color
- `theme.text` - Input text color
- `theme.textTertiary` - Default label color

## Examples

### Basic Usage
```typescript
<DripInput 
  label="Enter your name"
  value={name}
  onChangeText={setName}
/>
```

### With Left Icon
```typescript
<DripInput 
  label="Search items..."
  value={searchQuery}
  onChangeText={setSearchQuery}
  leftIcon={<Search size={20} color={theme.iconSecondary} />}
/>
```

### With Toggleable Right Icon (Password)
```typescript
const [showPassword, setShowPassword] = useState(false);

<DripInput 
  label="Password"
  value={password}
  onChangeText={setPassword}
  secureTextEntry={!showPassword}
  leftIcon={<Lock size={20} color={theme.iconSecondary} />}
  rightIcon={
    showPassword ? (
      <EyeOff size={20} color={theme.iconSecondary} />
    ) : (
      <Eye size={20} color={theme.iconSecondary} />
    )
  }
  onRightIconPress={() => setShowPassword(!showPassword)}
/>
```

### With Error State
```typescript
<DripInput 
  label="Email"
  value={email}
  onChangeText={setEmail}
  error={emailError}
/>
```

### Standard TextInput Props
```typescript
<DripInput 
  label="Phone Number"
  value={phone}
  onChangeText={setPhone}
  keyboardType="phone-pad"
  maxLength={10}
  autoCapitalize="none"
/>
```

## Animation Behavior

- Label floats up when input is focused or has value
- Animation duration: 200ms
- Label shrinks to 90% scale when floating
- Label moves up 38px when floating

## States

### Default State
- Border: Input border color
- Label: Text tertiary color
- Background: Input color

### Focused State
- Border: Primary color (green)
- Border width: 1.5px
- Label: Primary color

### Error State
- Border: Error color (red)
- Label: Error color
- Error message appears below input

## Styling Notes

- Fixed height: 56px
- Border radius: 12px
- Font size: 16px for input, 15px for label
- Icon containers: 24x24 (left), 32x32 (right)
- Error text: 12px, 500 weight

## Icon Spacing

- Left icon adds 48px to label position
- Left icon container: 24x24, 8px right margin
- Right icon container: 32x32, 8px left margin
- Input padding adjusts based on icon presence

## Maintenance

When updating this component:
1. Test label animation in both dark/light modes
2. Verify error state visibility
3. Check icon alignment and spacing
4. Ensure touch targets are adequate
5. Test with different text lengths and languages