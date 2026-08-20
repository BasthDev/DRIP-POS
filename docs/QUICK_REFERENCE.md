# Quick Reference Guide

## Component Quick Start

### Basic Component Imports
```typescript
import { DripButton } from '@/components/Button';
import { DripChip } from '@/components/Chip';
import { DripInput } from '@/components/Input';
import { DripDropdown } from '@/components/Dropdown';
import { Header } from '@/components/Header';
import { DripBackButton } from '@/components/BackButton';
import { DripContainer } from '@/components/Container';
import { useTheme } from '@/constants/colorTheme';
```

### Theme Usage Pattern
```typescript
const { theme, toggleColorMode, colorMode } = useTheme();

// Use theme colors
<View style={{ backgroundColor: theme.background }}>
  <Text style={{ color: theme.text }}>Hello</Text>
</View>
```

## Common Patterns

### Form with Validation
```typescript
const [email, setEmail] = useState('');
const [emailError, setEmailError] = useState('');

<DripInput 
  label="Email"
  value={email}
  onChangeText={setEmail}
  error={emailError}
/>
<DripButton 
  title="Submit" 
  onPress={handleSubmit}
  disabled={!email}
/>
```

### Dropdown Selection
```typescript
const [selectedCategory, setSelectedCategory] = useState('');

const categories = [
  { label: 'Coffee', value: 'coffee' },
  { label: 'Tea', value: 'tea' },
  { label: 'Pastries', value: 'pastries' },
];

<DripDropdown
  label="Select Category"
  options={categories}
  value={selectedCategory}
  onSelect={setSelectedCategory}
/>
```

### Category Selection
```typescript
const categories = ['All', 'Coffee', 'Pastries'];
const [selected, setSelected] = useState('All');

<View style={{ flexDirection: 'row' }}>
  {categories.map(cat => (
    <DripChip
      key={cat}
      label={cat}
      selected={selected === cat}
      onPress={() => setSelected(cat)}
    />
  ))}
</View>
```

### Navigation Header
```typescript
<Header 
  title="Page Title"
  rightIcon={colorMode === 'dark' ? <Sun /> : <Moon />}
  onRightPress={toggleColorMode}
/>
```

### Responsive Layout
```typescript
const [showSecondary, setShowSecondary] = useState(false);

<DripContainer
  leftPanel={<MainContent />}
  rightPanel={<SecondaryContent />}
  showSecondaryMobile={showSecondary}
  onMobileBack={() => setShowSecondary(false)}
  backButtonTitle="Back"
  childrenPadding={16}
/>
```

## Theme Color Cheat Sheet

### Most Common Colors
- `theme.background` - Main background
- `theme.card` - Card/surface
- `theme.text` - Primary text
- `theme.textSecondary` - Secondary text
- `theme.primary` - Accent color (green)
- `theme.border` - Border color
- `theme.error` - Error state (red)
- `theme.icon` - Icon color

### State Colors
- `theme.success` - Success (green)
- `theme.warning` - Warning (orange)
- `theme.error` - Error (red)
- `theme.info` - Info (blue)

## Component Props Summary

### DripButton
- `title` (required) - Button text
- `onPress` (required) - Press handler
- `variant` - 'primary' | 'secondary' | 'danger'
- `loading` - Show loading spinner
- `disabled` - Disable button

### DripChip
- `label` (required) - Chip text
- `selected` - Selection state
- `onPress` - Press handler
- `icon` - Optional icon

### DripInput
- `label` (required) - Input label
- `value` (required) - Input value
- `onChangeText` (required) - Change handler
- `error` - Error message
- `leftIcon` - Left icon
- `rightIcon` - Right icon
- `onRightIconPress` - Right icon handler

### DripDropdown
- `label` (required) - Dropdown label
- `options` (required) - Array of {label, value} options
- `value` - Currently selected value
- `onSelect` (required) - Selection handler
- `placeholder` - Placeholder text
- `error` - Error message
- `disabled` - Disable dropdown

### Header
- `title` (required) - Header title
- `subtitle` - Optional subtitle
- `leftIcon` - Left icon
- `rightIcon` - Right icon
- `onLeftPress` - Left press handler
- `onRightPress` - Right press handler

### DripBackButton
- `title` - Button text (default: 'Go Back')
- `onPress` - Custom press handler
- `style` - Custom styles

### DripContainer
- `leftPanel` (required) - Left/main content
- `rightPanel` (required) - Right/secondary content
- `showSecondaryMobile` - Mobile view state
- `onMobileBack` - Mobile back handler
- `backButtonTitle` - Back button text
- `showTabletBackButton` - Show tablet back button
- `childrenPadding` - Content padding

## Troubleshooting

### Theme not working
- Ensure `ThemeProvider` wraps app in `_layout.tsx`
- Check `useTheme` is called within provider
- Verify theme colors are being used

### Component not styling correctly
- Check theme colors are applied
- Verify component is using `useTheme` hook
- Test in both dark and light modes

### Layout issues
- Check `childrenPadding` in Container
- Verify responsive behavior
- Test on different screen sizes

## File Locations

```
components/
├── Button.tsx
├── Chip.tsx
├── Input.tsx
├── Dropdown.tsx
├── Header.tsx
├── BackButton.tsx
└── Container.tsx

constants/
└── colorTheme.tsx

app/
├── _layout.tsx (ThemeProvider here)
├── index.tsx
└── panel.tsx

docs/
├── README.md
├── Button.md
├── Chip.md
├── Input.md
├── Header.md
├── BackButton.md
├── Container.md
├── ColorTheme.md
└── QUICK_REFERENCE.md
```