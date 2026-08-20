# DripDropdown Component

## Description
Dropdown selection component with the same UI design as DripInput, featuring floating label animation, error states, and smooth dropdown animation.

## Import
```typescript
import { DripDropdown } from '@/components/Dropdown';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | Required | Dropdown label/placeholder |
| `options` | `DropdownOption[]` | Required | Array of dropdown options |
| `value` | `string` | `undefined` | Currently selected value |
| `onSelect` | `(value: string) => void` | Required | Selection handler |
| `placeholder` | `string` | `'Select an option'` | Placeholder text when nothing selected |
| `error` | `string` | `undefined` | Error message (shows error state) |
| `disabled` | `boolean` | `false` | Disable dropdown |

## DropdownOption Interface

```typescript
interface DropdownOption {
  label: string;  // Display text
  value: string;  // Selection value
}
```

## Theme Colors Used

- `theme.input` - Dropdown background
- `theme.inputBorder` - Default border color
- `theme.primary` - Focused/selected border color
- `theme.error` - Error state border and text color
- `theme.text` - Selected text color
- `theme.textTertiary` - Placeholder/unselected text color
- `theme.card` - Dropdown list background
- `theme.border` - Dropdown list border
- `theme.background` - Selected option text color
- `theme.iconSecondary` - Chevron icon color

## Examples

### Basic Usage
```typescript
const categories = [
  { label: 'Coffee', value: 'coffee' },
  { label: 'Tea', value: 'tea' },
  { label: 'Pastries', value: 'pastries' },
];

const [selectedCategory, setSelectedCategory] = useState('');

<DripDropdown
  label="Select Category"
  options={categories}
  value={selectedCategory}
  onSelect={setSelectedCategory}
/>
```

### With Placeholder
```typescript
<DripDropdown
  label="Choose Your Drink"
  options={drinkOptions}
  value={selectedDrink}
  onSelect={setSelectedDrink}
  placeholder="Select a drink..."
/>
```

### With Error State
```typescript
const [categoryError, setCategoryError] = useState('');

<DripDropdown
  label="Category"
  options={categories}
  value={selectedCategory}
  onSelect={(value) => {
    setSelectedCategory(value);
    setCategoryError('');
  }}
  error={categoryError}
/>
```

### Disabled State
```typescript
<DripDropdown
  label="Category"
  options={categories}
  value={selectedCategory}
  onSelect={setSelectedCategory}
  disabled={true}
/>
```

### Controlled Component
```typescript
const [selectedSize, setSelectedSize] = useState('medium');

const sizes = [
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
];

<DripDropdown
  label="Size"
  options={sizes}
  value={selectedSize}
  onSelect={setSelectedSize}
/>
```

### Dynamic Options
```typescript
const [productCategories, setProductCategories] = useState([]);

useEffect(() => {
  // Fetch categories from API
  fetchCategories().then(data => {
    const options = data.map(cat => ({
      label: cat.name,
      value: cat.id
    }));
    setProductCategories(options);
  });
}, []);

<DripDropdown
  label="Product Category"
  options={productCategories}
  value={selectedCategory}
  onSelect={setSelectedCategory}
/>
```

## Animation Behavior

### Label Animation
- Label floats up when dropdown is focused or has value
- Animation duration: 200ms
- Label shrinks to 90% scale when floating
- Label moves up 38px when floating

### Dropdown Animation
- Smooth fade-in/out animation
- Animation duration: 200ms
- Uses React Native Animated API
- Modal backdrop with opacity animation

## States

### Default State
- Border: Input border color
- Label: Text tertiary color
- Background: Input color
- Chevron: Down icon

### Open State
- Border: Primary color (green)
- Border width: 1.5px
- Label: Primary color
- Chevron: Up icon
- Dropdown list appears with animation

### Selected State
- Label stays in floating position
- Display value shows selected option label
- Chevron shows down icon (dropdown closed)

### Error State
- Border: Error color (red)
- Label: Error color
- Error message appears below dropdown

### Disabled State
- Opacity: 50%
- Not interactive
- Chevron icon still visible but dimmed

## Styling Notes

- Fixed height: 56px (same as Input)
- Border radius: 12px (same as Input)
- Font size: 16px for value, 15px for label (same as Input)
- Icon size: 20px (same as Input icons)
- Dropdown list: 80% width, max 300px height
- Option item height: Auto with 16px padding
- Modal backdrop: 50% opacity black

## Dropdown List Styling

- Width: 80% of screen
- Max height: 300px
- Border radius: 12px
- Border: 1px
- Overflow: hidden (for rounded corners)
- Scrollable if options exceed max height

## Selected Option Styling

- Background: Primary color (green)
- Text: Background color (high contrast)
- Visual feedback for current selection

## Common Use Cases

### Form Selection
```typescript
const [formData, setFormData] = useState({
  category: '',
  size: '',
  temperature: '',
});

<DripDropdown
  label="Category"
  options={categoryOptions}
  value={formData.category}
  onSelect={(value) => setFormData({...formData, category: value})}
/>
```

### Filter Selection
```typescript
const [filters, setFilters] = useState({
  status: 'all',
  priority: 'medium',
});

<DripDropdown
  label="Status Filter"
  options={[
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Completed', value: 'completed' },
  ]}
  value={filters.status}
  onSelect={(value) => setFilters({...filters, status: value})}
/>
```

### Settings Selection
```typescript
const [settings, setSettings] = useState({
  language: 'en',
  theme: 'dark',
});

<DripDropdown
  label="Language"
  options={[
    { label: 'English', value: 'en' },
    { label: 'Spanish', value: 'es' },
    { label: 'French', value: 'fr' },
  ]}
  value={settings.language}
  onSelect={(value) => setSettings({...settings, language: value})}
/>
```

## Consistency with DripInput

The Dropdown component maintains UI consistency with DripInput:
- Same height (56px)
- Same border radius (12px)
- Same label animation behavior
- Same error state styling
- Same focus state styling
- Same font sizes and weights
- Similar icon positioning

## Keyboard Navigation

Currently the dropdown uses touch interaction. For keyboard accessibility in the future, consider:
- Keyboard focus handling
- Arrow key navigation
- Enter/Escape key support
- Screen reader announcements

## Maintenance

When updating this component:
1. Ensure label animation matches DripInput behavior
2. Test error state visibility in both themes
3. Verify dropdown list positioning on different screen sizes
4. Check selected option contrast and visibility
5. Test with long option text (truncation)
6. Verify modal backdrop interaction
7. Ensure smooth animations on both opening and closing
8. Test with many options (scrolling behavior)