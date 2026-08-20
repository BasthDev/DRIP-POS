# DRIP POS Component Documentation

This directory contains documentation for all DRIP POS components to help with maintenance and development.

## Quick Start

- **[Quick Reference](./QUICK_REFERENCE.md)** - Fast lookup for common patterns and props
- **[ColorTheme](./ColorTheme.md)** - Theme system usage and color reference

## Component Documentation

- **[Button](./Button.md)** - Primary action button component with variants
- **[Chip](./Chip.md)** - Selectable chip/badge component for categories/filters
- **[Input](./Input.md)** - Text input with floating label and icon support
- **[Dropdown](./Dropdown.md)** - Dropdown selection with floating label (same UI as Input)
- **[Header](./Header.md)** - App header with title and optional icons
- **[BackButton](./BackButton.md)** - Navigation back button with Expo Router integration
- **[Container](./Container.md)** - Responsive container for mobile/tablet layouts

## Theme System

All components use the centralized theme system via the `useTheme` hook. See [ColorTheme.md](./ColorTheme.md) for details on:
- Available colors and their purposes
- Dark/Light mode switching
- How to extend the theme
- Best practices for theme usage

## Usage Pattern

All components follow these patterns:
1. Import from `@/components/ComponentName`
2. Use the `useTheme` hook for theme colors
3. Pass optional props for customization
4. All components are theme-responsive

## Development Guidelines

When adding new components:
1. Create a component file in `components/`
2. Use the `useTheme` hook for all colors
3. Create documentation in `docs/`
4. Update this README with the new component
5. Follow existing naming conventions
6. Test in both dark and light modes

## File Structure

```
DRIP_POS/
├── components/           # React components
│   ├── Button.tsx
│   ├── Chip.tsx
│   ├── Input.tsx
│   ├── Header.tsx
│   ├── BackButton.tsx
│   └── Container.tsx
├── constants/           # Theme configuration
│   └── colorTheme.tsx
├── app/                # Expo Router pages
│   ├── _layout.tsx
│   ├── index.tsx
│   └── panel.tsx
└── docs/               # Component documentation
    ├── README.md
    ├── QUICK_REFERENCE.md
    ├── Button.md
    ├── Chip.md
    ├── Input.md
    ├── Header.md
    ├── BackButton.md
    ├── Container.md
    └── ColorTheme.md
```

## Component Dependencies

- **Button** - Standalone, only needs theme
- **Chip** - Standalone, only needs theme
- **Input** - Standalone, only needs theme
- **Header** - Standalone, only needs theme
- **BackButton** - Requires Expo Router, needs theme
- **Container** - Requires BackButton, needs theme

## Theme Dependencies

All components depend on:
- `useTheme` hook from `@/constants/colorTheme`
- `ThemeProvider` must wrap the app (setup in `app/_layout.tsx`)

## Maintenance Checklist

When updating components:
- [ ] Test in both dark and light modes
- [ ] Verify color contrast and accessibility
- [ ] Check responsive behavior (for Container)
- [ ] Update documentation if props change
- [ ] Test with different content sizes
- [ ] Verify error states (for Input)
- [ ] Check loading states (for Button)