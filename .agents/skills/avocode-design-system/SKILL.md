---
name: avocode-design-system
description: >-
  Comprehensive design system specification extracted from top-tier digital products.
  Supplies complete tokens for colors, typography scales, spacing grids, elevation levels,
  and production-ready component recipes for buttons, inputs, cards, modals, and tabs.
---

# Avocode Design System: Production Token & Component Architecture

## Overview
Avocode Design System provides an enterprise-grade token taxonomy and component library modeled after industry-leading design systems (Shadcn/UI, Radix, Tailwind UI, and Carbon). It ensures visual consistency, zero guesswork for spacing, and instant access to accessible, styled UI primitives.

---

## 1. Design Token Architecture

### Semantic Color Tokens (CSS Variables)
Use semantic aliases rather than hard-coded hex colors:

```css
:root {
  /* Canvas & Surface */
  --bg-canvas: #F8FAFC;
  --bg-surface: #FFFFFF;
  --bg-subtle: #F1F5F9;
  --bg-elevated: #FFFFFF;

  /* Borders & Dividers */
  --border-subtle: rgba(15, 23, 42, 0.08);
  --border-strong: rgba(15, 23, 42, 0.16);

  /* Typography */
  --text-primary: #0F172A;
  --text-secondary: #475569;
  --text-muted: #94A3B8;

  /* Brand Accents */
  --brand-primary: #0D9488;
  --brand-primary-hover: #0F766E;
  --brand-primary-fg: #FFFFFF;
  --brand-tint: #F0FDFA;

  /* Feedback */
  --state-error: #EF4444;
  --state-warning: #F59E0B;
  --state-success: #10B981;
}

.dark {
  --bg-canvas: #09090B;
  --bg-surface: #121215;
  --bg-subtle: #18181B;
  --bg-elevated: #27272A;

  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-strong: rgba(255, 255, 255, 0.16);

  --text-primary: #F8FAFC;
  --text-secondary: #94A3B8;
  --text-muted: #64748B;

  --brand-primary: #14B8A6;
  --brand-primary-hover: #2DD4BF;
  --brand-primary-fg: #042F2E;
  --brand-tint: rgba(20, 184, 166, 0.12);

  --state-error: #F87171;
  --state-warning: #FBBF24;
  --state-success: #34D399;
}
```

### 4px / 8px Spacing Grid
Avoid arbitrary numbers (`p-[13px]`, `gap-[17px]`). Adhere strictly to the standard scale:
- `2px` (0.5) - Micro-offsets, border indicators
- `4px` (1) - Tight icon-to-text gap
- `8px` (2) - Compact item padding, badge spacing
- `12px` (3) - Input field padding (Y-axis), button padding
- `16px` (4) - Standard container padding, input field padding (X-axis)
- `24px` (6) - Card internal padding, grid gutters
- `32px` (8) - Section spacing, modal padding
- `48px` (12) - Major layout blocks
- `64px` (16) - Hero section padding

### Radius Hierarchy
- `rounded-md` (`6px`): Small badges, micro-tooltips, checkboxes
- `rounded-xl` (`12px`): Input fields, buttons, segmented tabs
- `rounded-2xl` (`16px`): Cards, dropdown popovers
- `rounded-3xl` (`24px`): Dialog modals, major floating panels
- `rounded-full` (`9999px`): Avatars, toggle pills, status dots

---

## 2. Component Blueprint Recipes

### Universal Button Hierarchy
```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base = "relative inline-flex items-center justify-center font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 select-none";

  const sizes = {
    sm: "h-9 px-3 text-xs rounded-lg gap-1.5",
    md: "h-11 px-4 text-sm rounded-xl gap-2",
    lg: "h-13 px-6 text-base rounded-xl gap-2.5",
  };

  const variants = {
    primary: "bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-700/20 focus-visible:ring-teal-500",
    secondary: "bg-neutral-100 hover:bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-100 focus-visible:ring-neutral-400",
    outline: "border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 focus-visible:ring-neutral-400",
    ghost: "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 focus-visible:ring-neutral-400",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-700/20 focus-visible:ring-red-500",
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : null}
      {children}
    </button>
  );
}
```

### Production Form Input
```tsx
export function InputField({
  label,
  error,
  icon: Icon,
  ...props
}: { label: string; error?: string; icon?: any } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5 w-full text-left">
      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 tracking-tight">
        {label}
      </label>
      <div className="relative">
        {Icon ? (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
            <Icon className="w-4 h-4" />
          </div>
        ) : null}
        <input
          className={`w-full rounded-xl border bg-white dark:bg-neutral-900 px-3.5 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 
            transition-all duration-150 focus:outline-none focus:ring-2 
            ${Icon ? 'pl-9' : ''}
            ${error 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
              : 'border-neutral-200 dark:border-neutral-800 focus:border-teal-600 focus:ring-teal-600/20'}`}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-xs text-red-500 flex items-center gap-1 font-medium">
          <span>⚠️</span> {error}
        </p>
      ) : null}
    </div>
  );
}
```

### Segmented Control (Pill Tabs)
```tsx
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (val: T) => void;
}) {
  return (
    <div className="inline-flex p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800">
      {options.map((opt) => {
        const isActive = opt.id === value;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
              isActive
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
```
