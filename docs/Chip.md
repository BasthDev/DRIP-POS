# DripChip Component

## Description
Selectable chip/badge component used for categories, filters, or selection states.

## Import
```typescript
import { DripChip } from '@/components/Chip';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | Required | Chip text |
| `selected` | `boolean` | `false` | Selection state |
| `onPress` | `() => void` | `undefined` | Press handler (makes chip interactive) |
| `icon` | `React.ReactNode` | `undefined` | Optional icon before text |
| `style` | `ViewStyle` | `undefined` | Additional custom styles |

## Theme Colors Used

- `theme.primary` - Selected state background and border
- `theme.card` - Unselected state background
- `theme.borderLight` - Unselected state border
- `theme.background` - Selected state text color
- `theme.textSecondary` - Unselected state text color

## Examples

### Basic Usage
```typescript
<DripChip 
  label="Coffee" 
  selected={selectedCategory === 'Coffee'}
  onPress={() => setSelectedCategory('Coffee')}
/>
```

### With Icons
```typescript
<DripChip 
  label="Coffee" 
  icon={<Coffee size={16} />}
  selected={isSelected}
  onPress={handleSelect}
/>
```

### Non-interactive (Display Only)
```typescript
<DripChip 
  label="Active" 
  selected={true}
/>
```

### Category Filter
```typescript
const categories = ['All', 'Coffee', 'Pastries', 'Merchandise'];

<View style={styles.chipContainer}>
  {categories.map((cat) => (
    <DripChip
      key={cat}
      label={cat}
      selected={selectedCategory === cat}
      onPress={() => setSelectedCategory(cat)}
    />
  ))}
</View>
```

## Styling Notes

- Border radius: 20px (pill shape)
- Horizontal padding: 14px
- Vertical padding: 8px
- Font size: 14px, weight: 600
- Border width: 1px
- Active opacity: 0.7 (when interactive)

## States

### Selected State
- Background: Primary color (green)
- Border: Primary color
- Text: Background color (high contrast)

### Unselected State
- Background: Card color
- Border: Border light color
- Text: Text secondary color

## Maintenance

When updating this component:
1. Ensure selected/unselected states have good contrast
2. Test in both dark/light modes
3. Verify icon alignment with text
4. Check touch target size (minimum 44x44 recommended)