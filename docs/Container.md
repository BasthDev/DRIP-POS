# DripContainer Component

## Description
Responsive container component that adapts layout between mobile (stacked screens) and tablet (side-by-side panels). Perfect for checkout flows, split views, and master-detail interfaces.

## Import
```typescript
import { DripContainer } from '@/components/Container';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `leftPanel` | `ReactNode` | Required | Content for left panel (tablet) or main screen (mobile) |
| `rightPanel` | `ReactNode` | Required | Content for right panel (tablet) or secondary screen (mobile) |
| `showSecondaryMobile` | `boolean` | `false` | Controls mobile view: main vs secondary screen |
| `onMobileBack` | `() => void` | `undefined` | Callback for mobile back button |
| `backButtonTitle` | `string` | `'Go Back'` | Title for mobile back button |
| `showTabletBackButton` | `boolean` | `false` | Show back button in tablet right panel |
| `childrenPadding` | `number` | `0` | Padding for children content (doesn't affect back button) |
| `style` | `ViewStyle` | `undefined` | Additional custom styles |

## Theme Colors Used

- `theme.background` - Container background
- `theme.border` - Panel divider border (tablet)

## Layout Behavior

### Tablet Layout (≥768px width)
```
┌─────────────────┬──────────────────────┐
│                 │                      │
│   Left Panel    │   Right Panel        │
│   (Flex 1)      │   (Flex 1.5)         │
│                 │                      │
└─────────────────┴──────────────────────┘
```

### Mobile Layout (<768px width)
```
Main Screen (showSecondaryMobile=false):
┌─────────────────────────────────────┐
│                                     │
│         Left Panel Content          │
│                                     │
└─────────────────────────────────────┘

Secondary Screen (showSecondaryMobile=true):
┌─────────────────────────────────────┐
│         ← Back Button               │
├─────────────────────────────────────┤
│                                     │
│       Right Panel Content            │
│                                     │
└─────────────────────────────────────┘
```

## Examples

### Basic Usage
```typescript
<DripContainer
  leftPanel={<MainContent />}
  rightPanel={<SecondaryContent />}
/>
```

### Mobile Navigation
```typescript
const [showForm, setShowForm] = useState(false);

<DripContainer
  leftPanel={<ProductList />}
  rightPanel={<CheckoutForm />}
  showSecondaryMobile={showForm}
  onMobileBack={() => setShowForm(false)}
  backButtonTitle="Back to Products"
/>
```

### With Custom Padding
```typescript
<DripContainer
  leftPanel={<MainContent />}
  rightPanel={<FormContent />}
  childrenPadding={16}  // Adds padding to content, not back button
/>
```

### Tablet with Back Button
```typescript
<DripContainer
  leftPanel={<Catalog />}
  rightPanel={<Details />}
  showTabletBackButton={true}
  onMobileBack={() => setSelectedProduct(null)}
  backButtonTitle="Back to Catalog"
/>
```

### Complete Checkout Flow
```typescript
const [showPayment, setShowPayment] = useState(false);

<DripContainer
  leftPanel={
    <View>
      <Text>Shopping Cart</Text>
      <ProductList products={cartItems} />
      <Button onPress={() => setShowPayment(true)}>
        Proceed to Payment
      </Button>
    </View>
  }
  rightPanel={
    <View>
      <Text>Payment Form</Text>
      <PaymentForm />
      <Button onPress={handlePayment}>
        Confirm & Charge
      </Button>
    </View>
  }
  showSecondaryMobile={showPayment}
  onMobileBack={() => setShowPayment(false)}
  backButtonTitle="Back to Cart"
  childrenPadding={8}
/>
```

## Mobile Navigation Pattern

The component handles mobile screen switching automatically:

```typescript
// State management
const [currentScreen, setCurrentScreen] = useState('main');

// Container usage
<DripContainer
  leftPanel={<MainScreen />}
  rightPanel={<DetailScreen />}
  showSecondaryMobile={currentScreen === 'detail'}
  onMobileBack={() => setCurrentScreen('main')}
  backButtonTitle="Back to Main"
/>
```

## Children Padding Feature

The `childrenPadding` prop adds padding to content areas without affecting the back button:

```typescript
// With padding (recommended)
<DripContainer
  leftPanel={<Content />}
  rightPanel={<Content />}
  childrenPadding={16}
/>
// Result: Content gets 16px padding, back button stays at top

// Without padding
<DripContainer
  leftPanel={<Content />}
  rightPanel={<Content />}
/>
// Result: No padding, content touches edges
```

## Tablet Breakpoint

- **Tablet**: Width ≥ 768px
- **Mobile**: Width < 768px
- Uses `useWindowDimensions` hook for responsive detection

## Panel Flex Ratios

- **Left Panel**: Flex 1 (40% width)
- **Right Panel**: Flex 1.5 (60% width)
- Divider: 1px border between panels

## Styling Notes

- Full height and width
- No container padding (use `childrenPadding` for content padding)
- Tablet: Horizontal layout with divider
- Mobile: Vertical stacked layout
- Back button always at top in mobile secondary view

## Common Use Cases

### POS Checkout Flow
```typescript
<DripContainer
  leftPanel={<ProductCatalog />}
  rightPanel={<CheckoutPanel />}
  showSecondaryMobile={showCheckout}
  onMobileBack={() => setShowCheckout(false)}
  backButtonTitle="Back to Products"
/>
```

### Master-Detail View
```typescript
<DripContainer
  leftPanel={<ItemList />}
  rightPanel={<ItemDetail />}
  showSecondaryMobile={selectedItem !== null}
  onMobileBack={() => setSelectedItem(null)}
  backButtonTitle="Back to List"
/>
```

### Settings Navigation
```typescript
<DripContainer
  leftPanel={<SettingsMenu />}
  rightPanel={<SettingsPanel />}
  showSecondaryMobile={selectedSetting !== null}
  onMobileBack={() => setSelectedSetting(null)}
  backButtonTitle="Back to Menu"
/>
```

## Integration with BackButton

The component automatically handles BackButton display:

- **Mobile secondary view**: Always shows back button
- **Tablet right panel**: Shows only if `showTabletBackButton={true}`
- **Mobile main view**: No back button
- **Tablet left panel**: No back button

## Maintenance

When updating this component:
1. Test responsive behavior at different screen sizes
2. Verify back button positioning in mobile view
3. Check divider visibility in tablet view
4. Ensure children padding doesn't affect back button
5. Test panel content overflow handling
6. Verify theme colors apply correctly