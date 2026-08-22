# 🛑 STOP — AGENT INSTRUCTIONS & PROJECT GUIDELINES
> **MANDATORY READING FOR ALL AI AGENTS & DEVELOPERS:** Read this entire file before making any changes, writing code, or generating screens for the  POS system.

---

## 1. Core Architecture & Design Philosophy
* **Tech Stack:** React Native, Expo Router (`expo-router`), `lucide-react-native` for icons.
* **Styling Philosophy:** Strictly **flat UI design**. NO gradients, NO gloss effects, and NO heavy drop shadows. Colors must use solid values bound to the global `ThemeProvider` (`constants/colorTheme.tsx`).
* **Responsive Layout:** Must support mobile and tablet views seamlessly (using breakpoints like `768px`).

---

## 2. Mandatory Component Usage (NO RAW PRIMITIVES)
AI agents and developers **must never** use raw React Native components (`SafeAreaView`, `ScrollView`, `TextInput`, `Button`, `Modal`) when a shared custom component exists. Always use the following design system primitives:

* **Screens Construction:** Every screen in `app/` MUST be wrapped inside **`Container`** (`components/Container.tsx`) to guarantee uniform padding, keyboard management, and safe-area handling.
* **Inputs & Forms:** Always use **`Input`** (`components/Input.tsx`) for text entry, search fields, and credential forms.
* **Buttons:** Always use **`Button`** (`components/Button.tsx`) for primary and secondary actions.
* **Headers:** Always use **`Header`** (`components/Header.tsx`), which automatically binds to the global navigation drawer.
* **Navigation Drawer:** Always use the global **`Drawer`** context (`constants/drawerContext.tsx`) for menu routing and user role management.

---

## 3. Strict Rules for AI Code Generation
1. **Never write raw `TextInput` or `Button` elements.** Use `Input` and `Button`.
2. **Never create manual screen padding or safe-area wrappers.** Use `Container`.
3. **Avoid duplicate navigation triggers:** If a user taps a drawer menu item matching their current pathname, close the drawer without re-navigating.
4. **Theme Awareness:** All text, background, and border properties must reference `theme.*` values dynamically to support light and dark mode toggling.