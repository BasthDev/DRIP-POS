# DripBackButton Component

## Description
Navigation back button component with optional custom title and press handler. Integrates with Expo Router.

## Import
```typescript
import { DripBackButton } from '@/components/BackButton';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `'Go Back'` | Button text |
| `onPress` | `() => void` | `undefined` | Custom press handler |
| `style` | `ViewStyle` | `undefined` | Additional custom styles |

## Theme Colors Used

- `theme.card` - Button background
- `theme.border` - Button border color
- `theme.text` - Icon and text color

## Behavior

- If `onPress` is provided, it executes the custom handler
- If `onPress` is not provided, it calls `router.back()` (Expo Router)
- Integrates automatically with Expo Router navigation

## Examples

### Basic Usage (Default)
```typescript
<DripBackButton />
```

### Custom Title
```typescript
<DripBackButton title="Back to Catalog" />
```

### Custom Press Handler
```typescript
<DripBackButton 
  title="Cancel"
  onPress={() => setShowForm(false)}
/>
```

### With Expo Router
```typescript
// Uses router.back() automatically
<DripBackButton />
```

### Custom Handler
```typescript
<DripBackButton 
  title="Return to Home"
  onPress={() => router.push('/')}
/>
```

### In Mobile Layout
```typescript
<DripBackButton 
  title="Back to Products"
  onPress={() => setShowSecondaryScreen(false)}
/>
```

## Styling Notes

- Fixed height: 56px
- Full width: 100%
- Horizontal padding: 16px
- Icon size: 20px
- Icon margin: 12px (right)
- Font size: 16px, weight: 600
- Active opacity: 0.8

## Layout Structure

```
┌─────────────────────────────────────┐
│ ← Go Back                          │
└─────────────────────────────────────┘
```

- Arrow icon on the left
- Text to the right of icon
- Vertically centered content
- Full width button

## Common Use Cases

### Mobile Navigation
```typescript
// In mobile layout with Container component
<DripContainer
  leftPanel={mainContent}
  rightPanel={secondaryContent}
  showSecondaryMobile={showSecondary}
  onMobileBack={() => setShowSecondary(false)}
  backButtonTitle="Back to Main"
/>
```

### Form Cancellation
```typescript
<DripBackButton 
  title="Cancel Edit"
  onPress={() => {
    resetForm();
    setShowForm(false);
  }}
/>
```

### Custom Navigation
```typescript
<DripBackButton 
  title="Return to Dashboard"
  onPress={() => router.replace('/dashboard')}
/>
```

## Integration with Container Component

The BackButton is designed to work seamlessly with the `DripContainer` component:

```typescript
<DripContainer
  leftPanel={mainContent}
  rightPanel={formContent}
  showSecondaryMobile={showForm}
  onMobileBack={() => setShowForm(false)}
  backButtonTitle="Back to Products"
  // Container automatically handles BackButton display
/>
```

## Maintenance

When updating this component:
1. Ensure icon and text colors have good contrast
2. Test button touch target (full width, 56px height)
3. Verify Expo Router integration
4. Check custom handler behavior
5. Test in both dark/light modes