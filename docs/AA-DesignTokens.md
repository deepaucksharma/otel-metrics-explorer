# Design Tokens and Accessibility Guidelines

## Overview

This document defines the design tokens and accessibility guidelines for the OTLP Process Metrics Explorer. These standards ensure visual consistency, brand alignment, and accessibility compliance throughout the application.

## 1. Color System

### 1.1 Primary Colors

| Token Name | Value (Light) | Value (Dark) | Usage |
|------------|---------------|--------------|-------|
| `--color-primary-50` | `#f0f9ff` | `#082f49` | Background, subtle accents |
| `--color-primary-100` | `#e0f2fe` | `#0c4a6e` | Backgrounds, hover states |
| `--color-primary-200` | `#bae6fd` | `#075985` | Backgrounds, secondary elements |
| `--color-primary-300` | `#7dd3fc` | `#0369a1` | UI elements, borders |
| `--color-primary-400` | `#38bdf8` | `#0284c7` | Secondary UI elements |
| `--color-primary-500` | `#0ea5e9` | `#0ea5e9` | Primary buttons, focus states |
| `--color-primary-600` | `#0284c7` | `#38bdf8` | Primary actions, links |
| `--color-primary-700` | `#0369a1` | `#7dd3fc` | Focused interactive elements |
| `--color-primary-800` | `#075985` | `#bae6fd` | Text on dark backgrounds |
| `--color-primary-900` | `#0c4a6e` | `#e0f2fe` | High contrast text |
| `--color-primary-950` | `#082f49` | `#f0f9ff` | High emphasis text |

### 1.2 Neutral Colors

| Token Name | Value (Light) | Value (Dark) | Usage |
|------------|---------------|--------------|-------|
| `--color-neutral-50` | `#f8fafc` | `#0f172a` | Page background |
| `--color-neutral-100` | `#f1f5f9` | `#1e293b` | Card background, UI elements |
| `--color-neutral-200` | `#e2e8f0` | `#334155` | UI element backgrounds |
| `--color-neutral-300` | `#cbd5e1` | `#475569` | Borders, dividers |
| `--color-neutral-400` | `#94a3b8` | `#64748b` | Disabled text, secondary icons |
| `--color-neutral-500` | `#64748b` | `#94a3b8` | Placeholder text |
| `--color-neutral-600` | `#475569` | `#cbd5e1` | Secondary text |
| `--color-neutral-700` | `#334155` | `#e2e8f0` | Primary text (dark mode) |
| `--color-neutral-800` | `#1e293b` | `#f1f5f9` | Headings (dark mode) |
| `--color-neutral-900` | `#0f172a` | `#f8fafc` | High contrast text (dark mode) |
| `--color-neutral-950` | `#020617` | `#ffffff` | Highest contrast text (dark mode) |

### 1.3 Semantic Colors

| Token Name | Value (Light) | Value (Dark) | Usage |
|------------|---------------|--------------|-------|
| `--color-success-100` | `#dcfce7` | `#022c22` | Success background |
| `--color-success-500` | `#22c55e` | `#4ade80` | Success text, icons |
| `--color-success-700` | `#15803d` | `#86efac` | Success emphasis |
| `--color-warning-100` | `#fef9c3` | `#422006` | Warning background |
| `--color-warning-500` | `#eab308` | `#facc15` | Warning text, icons |
| `--color-warning-700` | `#a16207` | `#fde047` | Warning emphasis |
| `--color-error-100` | `#fee2e2` | `#450a0a` | Error background |
| `--color-error-500` | `#ef4444` | `#f87171` | Error text, icons |
| `--color-error-700` | `#b91c1c` | `#fca5a5` | Error emphasis |
| `--color-info-100` | `#e0f2fe` | `#082f49` | Info background |
| `--color-info-500` | `#0ea5e9` | `#38bdf8` | Info text, icons |
| `--color-info-700` | `#0369a1` | `#7dd3fc` | Info emphasis |

### 1.4 Visualization Colors

| Token Name | Value | Usage |
|------------|-------|-------|
| `--color-viz-blue` | `#2563eb` | Primary data series |
| `--color-viz-purple` | `#9333ea` | Secondary data series |
| `--color-viz-teal` | `#0d9488` | Tertiary data series |
| `--color-viz-orange` | `#ea580c` | Quaternary data series |
| `--color-viz-red` | `#dc2626` | Error indicators, warnings |
| `--color-viz-green` | `#16a34a` | Success indicators |
| `--color-viz-yellow` | `#ca8a04` | Warning indicators |
| `--color-viz-indigo` | `#4f46e5` | Additional data series |
| `--color-viz-pink` | `#db2777` | Additional data series |
| `--color-viz-sky` | `#0284c7` | Additional data series |

#### Color Sequences for Charts

For charts with multiple series, use the following sequence for consistency:

1. `--color-viz-blue`
2. `--color-viz-purple`
3. `--color-viz-teal`
4. `--color-viz-orange`
5. `--color-viz-indigo`
6. `--color-viz-pink`
7. `--color-viz-sky`
8. `--color-viz-green`

## 2. Typography

### 2.1 Font Families

| Token Name | Value | Usage |
|------------|-------|-------|
| `--font-family-sans` | `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif` | Primary body text |
| `--font-family-mono` | `'JetBrains Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace` | Code, technical data |
| `--font-family-display` | `'Inter Display', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` | Headings, large display text |

### 2.2 Font Sizes

| Token Name | Value | Usage |
|------------|-------|-------|
| `--font-size-xs` | `0.75rem` | Small labels, captions |
| `--font-size-sm` | `0.875rem` | Secondary text, UI elements |
| `--font-size-base` | `1rem` | Body text |
| `--font-size-lg` | `1.125rem` | Emphasized body text |
| `--font-size-xl` | `1.25rem` | Small headings |
| `--font-size-2xl` | `1.5rem` | Medium headings |
| `--font-size-3xl` | `1.875rem` | Large headings |
| `--font-size-4xl` | `2.25rem` | Primary headings |
| `--font-size-5xl` | `3rem` | Display headings |

### 2.3 Font Weights

| Token Name | Value | Usage |
|------------|-------|-------|
| `--font-weight-normal` | `400` | Body text |
| `--font-weight-medium` | `500` | Slightly emphasized text |
| `--font-weight-semibold` | `600` | UI elements, subheadings |
| `--font-weight-bold` | `700` | Headings, emphasis |

### 2.4 Line Heights

| Token Name | Value | Usage |
|------------|-------|-------|
| `--line-height-none` | `1` | Headings, tightly packed UI elements |
| `--line-height-tight` | `1.25` | Short text blocks |
| `--line-height-snug` | `1.375` | Card text, compact paragraphs |
| `--line-height-normal` | `1.5` | Body text |
| `--line-height-relaxed` | `1.625` | Larger body text |
| `--line-height-loose` | `2` | Spacious body text |

## 3. Spacing

### 3.1 Space Scale

| Token Name | Value | Usage |
|------------|-------|-------|
| `--space-0` | `0px` | Reset spacing |
| `--space-px` | `1px` | Pixel-perfect adjustments |
| `--space-0.5` | `0.125rem` | Tiny spacing |
| `--space-1` | `0.25rem` | Very small spacing |
| `--space-1.5` | `0.375rem` | Small spacing |
| `--space-2` | `0.5rem` | Common small spacing |
| `--space-2.5` | `0.625rem` | Medium-small spacing |
| `--space-3` | `0.75rem` | Default small spacing |
| `--space-3.5` | `0.875rem` | Medium spacing |
| `--space-4` | `1rem` | Default spacing |
| `--space-5` | `1.25rem` | Medium-large spacing |
| `--space-6` | `1.5rem` | Large spacing |
| `--space-7` | `1.75rem` | Larger spacing |
| `--space-8` | `2rem` | Very large spacing |
| `--space-9` | `2.25rem` | Container padding |
| `--space-10` | `2.5rem` | Section spacing |
| `--space-11` | `2.75rem` | Large section spacing |
| `--space-12` | `3rem` | Extra large spacing |
| `--space-14` | `3.5rem` | Component separation |
| `--space-16` | `4rem` | Major component separation |
| `--space-20` | `5rem` | Page section spacing |
| `--space-24` | `6rem` | Large page section spacing |
| `--space-28` | `7rem` | Very large page section spacing |
| `--space-32` | `8rem` | Extreme page section spacing |
| `--space-36` | `9rem` | Layout spacing |
| `--space-40` | `10rem` | Large layout spacing |
| `--space-44` | `11rem` | Very large layout spacing |
| `--space-48` | `12rem` | Extreme layout spacing |
| `--space-52` | `13rem` | Super extreme layout spacing |
| `--space-56` | `14rem` | Ultra extreme layout spacing |
| `--space-60` | `15rem` | Maximum layout spacing |
| `--space-64` | `16rem` | Maximum component size |
| `--space-72` | `18rem` | Large maximum component size |
| `--space-80` | `20rem` | Very large maximum component size |
| `--space-96` | `24rem` | Extreme maximum component size |

## 4. Borders and Outlines

### 4.1 Border Widths

| Token Name | Value | Usage |
|------------|-------|-------|
| `--border-width-0` | `0px` | No border |
| `--border-width-1` | `1px` | Default border |
| `--border-width-2` | `2px` | Emphasized border |
| `--border-width-4` | `4px` | Heavy border |
| `--border-width-8` | `8px` | Extra heavy border |

### 4.2 Border Radii

| Token Name | Value | Usage |
|------------|-------|-------|
| `--border-radius-none` | `0px` | No rounding |
| `--border-radius-sm` | `0.125rem` | Subtle rounding |
| `--border-radius-md` | `0.25rem` | Lightly rounded elements |
| `--border-radius-lg` | `0.5rem` | Buttons, cards, larger elements |
| `--border-radius-xl` | `0.75rem` | Prominently rounded elements |
| `--border-radius-2xl` | `1rem` | Very rounded elements |
| `--border-radius-3xl` | `1.5rem` | Extremely rounded elements |
| `--border-radius-full` | `9999px` | Pills, circles |

## 5. Shadows and Depth

### 5.1 Box Shadows

| Token Name | Value (Light) | Value (Dark) | Usage |
|------------|---------------|--------------|-------|
| `--shadow-sm` | `0 1px 2px 0 rgba(0, 0, 0, 0.05)` | `0 1px 2px 0 rgba(0, 0, 0, 0.25)` | Subtle shadow |
| `--shadow-md` | `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)` | `0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.26)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)` | `0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.25)` | Floating elements |
| `--shadow-xl` | `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)` | `0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.24)` | Popovers, dropdowns |
| `--shadow-2xl` | `0 25px 50px -12px rgba(0, 0, 0, 0.25)` | `0 25px 50px -12px rgba(0, 0, 0, 0.45)` | Modals |
| `--shadow-inner` | `inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)` | `inset 0 2px 4px 0 rgba(0, 0, 0, 0.26)` | Inset elements |
| `--shadow-none` | `none` | `none` | No shadow |

## 6. Animation and Transitions

### 6.1 Transition Durations

| Token Name | Value | Usage |
|------------|-------|-------|
| `--transition-75` | `75ms` | Instantaneous feedback |
| `--transition-100` | `100ms` | Fast interactions |
| `--transition-150` | `150ms` | Quick transitions |
| `--transition-200` | `200ms` | Standard transitions |
| `--transition-300` | `300ms` | Expressive transitions |
| `--transition-500` | `500ms` | Elaborate transitions |
| `--transition-700` | `700ms` | Dramatic transitions |
| `--transition-1000` | `1000ms` | Full animations |

### 6.2 Easing Functions

| Token Name | Value | Usage |
|------------|-------|-------|
| `--ease-linear` | `linear` | Continuous motion |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Acceleration |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Deceleration |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Natural motion |

## 7. Accessibility Guidelines

### 7.1 Color Contrast Requirements

- **Text**: All text must maintain a minimum contrast ratio of 4.5:1 against its background (WCAG AA)
- **Large Text**: Text larger than 18pt (or 14pt bold) must maintain a minimum contrast ratio of 3:1
- **UI Components**: Interactive elements and graphical objects must maintain a minimum contrast ratio of 3:1
- **Focus Indicators**: Focus states must have a 3:1 contrast ratio with adjacent colors

#### Contrast Testing

All color combinations must be tested using:
1. WebAIM Contrast Checker
2. Stark Contrast Checker
3. Color blind simulation tools

### 7.2 Interactive Elements

- **Target Size**: Interactive elements must have a minimum touch target size of 44x44 pixels
- **Focus States**: All interactive elements must have a visible focus state
- **Hover States**: Elements should provide visual feedback on hover
- **Active States**: Elements should provide visual feedback when activated
- **Disabled States**: Disabled elements should be visually distinct but not rely solely on color

### 7.3 Motion and Animation

- **Reduced Motion**: All animations must respect the `prefers-reduced-motion` media query
- **Animation Duration**: Animations should not exceed 5 seconds
- **Flashing Content**: No content should flash more than 3 times per second
- **Auto-playing Motion**: Auto-playing animations that last more than 5 seconds must have pause/stop controls

### 7.4 Keyboard Navigation

- **Focus Order**: Tab order must follow logical reading order
- **Focus Trapping**: Modals and dialogs must trap focus until dismissed
- **Keyboard Shortcuts**: All functionality must be accessible via keyboard alone
- **Skip Links**: Skip links must be provided for navigation

### 7.5 Screen Reader Support

- **Semantic HTML**: Use appropriate semantic HTML elements
- **ARIA Labels**: Provide ARIA labels where native semantics are insufficient
- **Alternative Text**: All non-decorative images must have descriptive alt text
- **SVG Accessibility**: All SVGs must include appropriate roles and ARIA attributes
- **Live Regions**: Dynamic content updates must use ARIA live regions

### 7.6 Data Visualization Accessibility

- **Color Independence**: Data should be distinguishable without relying solely on color
- **Pattern Use**: Use patterns in addition to colors for charts and graphs
- **Text Alternatives**: Provide text summaries for all charts and visualizations
- **Data Tables**: Complex visualizations should have accompanying data tables
- **Tooltips**: Interactive data points should have accessible tooltips

### 7.7 Content Structure

- **Headings**: Use proper heading hierarchy (H1-H6)
- **Lists**: Use proper list elements (UL, OL, DL)
- **Tables**: Use proper table structures with headers
- **Form Labels**: All form elements must have associated labels
- **Error Messages**: Form errors must be clearly identified and explained

## 8. Implementation Guidelines

### 8.1 CSS Custom Properties

All design tokens should be implemented as CSS custom properties in the `:root` selector:

```css
:root {
  /* Colors */
  --color-primary-500: #0ea5e9;
  --color-neutral-100: #f1f5f9;
  
  /* Typography */
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-size-base: 1rem;
  
  /* Spacing */
  --space-4: 1rem;
  
  /* ... additional tokens ... */
}
```

### 8.2 Dark Mode Implementation

Dark mode should be implemented using a `data-theme="dark"` attribute on the HTML element:

```css
:root {
  --color-primary-500: #0ea5e9;
  --color-neutral-100: #f1f5f9;
}

[data-theme="dark"] {
  --color-primary-500: #0ea5e9; /* Same value in both modes */
  --color-neutral-100: #1e293b; /* Different in dark mode */
}
```

### 8.3 Responsive Design

All components should be designed with a mobile-first approach, using the following breakpoints:

| Breakpoint Name | Value | Description |
|-----------------|-------|-------------|
| `--breakpoint-sm` | `640px` | Small devices (mobile landscape) |
| `--breakpoint-md` | `768px` | Medium devices (tablets) |
| `--breakpoint-lg` | `1024px` | Large devices (desktops) |
| `--breakpoint-xl` | `1280px` | Extra large devices (large desktops) |
| `--breakpoint-2xl` | `1536px` | 2X large devices (extra large desktops) |

### 8.4 Visual Documentation

All design tokens and components should be documented in a living style guide using Storybook or a similar tool, featuring:

- Visual examples of each token
- Color contrast compliance testing
- Responsive design preview
- Accessibility checklist
- Dark mode preview
- Implementation code samples

## 9. Quality Assurance

### 9.1 Automated Testing

- Contrast ratio testing
- Keyboard navigation testing
- Screen reader announcement testing
- Color blindness simulation
- Responsive design testing

### 9.2 Manual Testing

- VoiceOver (macOS/iOS) testing
- NVDA (Windows) testing
- JAWS (Windows) testing
- TalkBack (Android) testing
- Keyboard-only navigation testing
- High-contrast mode testing

These design tokens and accessibility guidelines form the foundation of the OTLP Process Metrics Explorer's visual language and ensure a consistent, accessible experience for all users.
