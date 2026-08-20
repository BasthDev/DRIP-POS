# DripButton Component

## Description
Primary action button component with support for different variants, loading states, and disabled states.

## Import
```typescript
import { DripButton } from '@/components/Button';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | Required | Button text |
| `onPress` | `() => void` | Required | Button press handler |
| `icon` | `React.ReactNode` | `undefined` | Optional icon to display before text |
| `variant` | `'primary' \| 'secondary' \| 'danger'` | `'primary'` | Button style variant |
| `loading` | `boolean` | `false` | Show loading spinner |
| `disabled` | `boolean` | `false` | Disable button |
| `style` | `ViewStyle` | `undefined` | Additional custom styles |

## Variants

- **primary**: Green accent color (main action)
- **secondary**: Gray background (secondary action)  
- **danger**: Red color (destructive actions)

## Theme Colors Used

- `theme.primary` - Primary button background
- `theme.error` - Danger button background
- `theme.card` - Secondary button background
- `theme.textDisabled` - Disabled button background
- `theme.text` - Text color for most variants
- `theme.background` - Text color for primary variant
- `theme.textTertiary` - Text color for disabled state

## Examples

### Basic Usage
```typescript
<DripButton 
  title="Submit" 
  onPress={() => console.log('pressed')} 
/>
```

### With Icon
```typescript
<DripButton 
  title="Add to Cart" 
  icon={<ShoppingCart size={20} />}
  onPress={handleAddToCart}
/>
```

### Loading State
```typescript
<DripButton 
  title="Processing..." 
  onPress={handleSubmit}
  loading={isSubmitting}
/>
```

### Different Variants
```typescript
<DripButton 
  title="Save" 
  variant="primary" 
  onPress={handleSave}
/>
<DripButton 
  title="Cancel" 
  variant="secondary" 
  onPress={handleCancel}
/>
<DripButton 
  title="Delete" 
  variant="danger" 
  onPress={handleDelete}
/>
```

### Disabled State
```typescript
<DripButton 
  title="Submit" 
  onPress={handleSubmit}
  disabled={!isValid}
/>
```

## Styling Notes

- Fixed height: 52px
- Border radius: 12px
- Horizontal padding: 16px
- Font size: 16px, weight: 700
- Active opacity: 0.8

## Maintenance

When updating this component:
1. Ensure all colors use `theme.*` values
2. Test all variants in both dark/light modes
3. Verify loading spinner color contrast
4. Check disabled state visibility