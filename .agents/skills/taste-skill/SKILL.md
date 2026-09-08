---
name: taste-skill
description: >-
  Elevates frontend UI aesthetics from generic/vibe-coder AI output to premium designer-grade interfaces.
  Applies aesthetic heuristics from top-tier design references (Linear, Stripe, Apple, Vercel, Raycast).
  Enforces curated typography pairings, micro-contrast, atmospheric depth, restrained color palettes,
  tactile micro-interactions, and eliminates cliché AI design patterns.
---

# Taste Skill: Designer Aesthetics & Polish Engine

## Overview
Taste Skill elevates standard AI-generated frontend interfaces into high-end, bespoke software experiences that feel designed by world-class product designers. It systematically eliminates generic "vibe-coder" templates, oversized radii, muddy gradients, and uninspired layouts, replacing them with intentional typography, atmospheric elevation, micro-contrast, and tactile interaction physics.

---

## 1. Cliché AI Anti-Patterns (Banned)

Never generate or accept these hallmarks of unrefined AI design:
- ❌ **The Purple Haze**: Neon purple-to-cyan diagonal gradients on dark cards.
- ❌ **The Pill Overdose**: Indiscriminate `rounded-full` or `rounded-3xl` on small widgets, buttons, and tables without structural hierarchy.
- ❌ **The Muddy Shadow**: Single-layer heavy black shadows (`box-shadow: 0 10px 30px rgba(0,0,0,0.5)`).
- ❌ **Low Contrast Ghosting**: Using faint gray text (`#666` or `text-zinc-500`) on dark backgrounds that fails WCAG readability.
- ❌ **Equal Sizing Syndrome**: Titles, labels, and badges all using roughly the same 14px-16px font size with no dominant visual focal point.
- ❌ **Static Clickables**: Buttons or cards with zero hover, active, or focus state feedback.

---

## 2. The 5 Pillars of Tasteful UI

### Pillar 1: Surface Elevation & Micro-Borders
Modern luxury software relies on subtle micro-borders rather than heavy outlines:
- **Hairline Alpha Borders**:
  - Light mode: `border border-black/[0.07]` or `border-neutral-200/80`
  - Dark mode: `border border-white/[0.08]` or `border-neutral-800`
- **Ambient Multi-Layer Shadows**:
  ```css
  /* Crisp edge definition + soft ambient floor spread */
  box-shadow: 
    0 1px 2px 0 rgba(0, 0, 0, 0.05),
    0 4px 12px 0 rgba(0, 0, 0, 0.08);
  ```
- **Inner Light Rim**: In dark mode, add a 1px top highlight to cards and buttons:
  `shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]`

### Pillar 2: Restrained Color Palettes
- **Dominant Base**: 90% neutral foundation (Crisp slates, zincs, or warm sands).
- **Surface Layering**:
  - Light Mode: Background `#F9FAFB` -> Card `#FFFFFF` -> Elevated Popover `#FFFFFF` (with shadow).
  - Dark Mode: Background `#09090B` -> Card `#121215` -> Elevated Surface `#18181B`.
- **Single Intentional Accent**: Choose one brand hue (e.g. Deep Emerald `#059669`, Medical Teal `#0D9488`, or Electric Cobalt `#2563EB`) and use it sparingly for primary calls to action, badges, and active tabs.

### Pillar 3: Typographic Hierarchy & Tracking
- **Large Headings**: Use tight letter-spacing:
  - `text-2xl` to `text-5xl` with `-tracking-[0.02em]` or `-tracking-tight`.
  - Leading: compact `leading-[1.15]`.
- **Micro-Labels & Badges**:
  - `text-[11px]` or `text-xs`, font-medium or font-semibold, `tracking-wider` or `uppercase tracking-widest`.
- **Monospace Precision**:
  - For dates, times, currencies, status codes, and counts, use `font-mono tabular-nums` to eliminate layout jitter.

### Pillar 4: Tactile Feedback & Micro-Interactions
Every interactive element must physically acknowledge the user's intent:
- **Hover Transitions**: Restrained easing: `transition-all duration-150 ease-out`.
- **Active Press**: Always scale down slightly on click:
  `active:scale-[0.98] transition-transform`
- **Focus Rings**: Dual-ring technique for high visibility and zero clipping:
  `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:ring-offset-2`
- **Subtle Glow**: On hover or active tabs, use ambient light rather than harsh borders:
  `hover:shadow-[0_0_20px_-3px_rgba(13,148,136,0.25)]`

### Pillar 5: Generous Breathing Room & Visual Rhythm
- Minimum page padding: `px-4 sm:px-6 lg:px-8`.
- Section gaps: `space-y-6 sm:space-y-8`.
- Group related items closely (4-8px) and separate unrelated blocks generously (24-32px).

---

## 3. Reference Component Recipes

### The "Linear-Style" Premium Card
```tsx
<div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-neutral-900/80 p-5 
  border border-neutral-200/80 dark:border-neutral-800 
  shadow-sm hover:shadow-md 
  shadow-black/[0.03] dark:shadow-none
  backdrop-blur-md transition-all duration-200 hover:border-neutral-300 dark:hover:border-neutral-700">
  
  {/* Subtle top glare in dark mode */}
  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
  
  <div className="flex items-center justify-between gap-4">
    <div className="space-y-1">
      <span className="text-[11px] font-semibold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
        Xizmat Turi
      </span>
      <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
        Ortodontik Tekshiruv
      </h3>
    </div>
    <span className="font-mono text-sm font-semibold tabular-nums text-neutral-800 dark:text-neutral-200">
      150,000 UZS
    </span>
  </div>
</div>
```

### The "Apple-Style" Tactile Button
```tsx
<button className="relative inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 
  bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 
  text-sm font-medium tracking-tight
  shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] 
  hover:bg-neutral-800 dark:hover:bg-neutral-200 
  active:scale-[0.98] 
  transition-all duration-150 ease-out 
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/50">
  <span>Qabulni Tasdiqlash</span>
</button>
```

---

## 4. Pre-Ship Taste Checklist
Before presenting any UI to the user, run this 5-point mental audit:
1. [ ] **Hierarchy**: Is there one clear focal point per screen/card?
2. [ ] **Contrast**: Is all secondary and tertiary text effortlessly readable?
3. [ ] **Edges**: Are borders hairline-subtle (alpha channels) rather than thick solid strokes?
4. [ ] **Tactility**: Does every button, tab, and card animate smoothly on hover and press?
5. [ ] **Numbers**: Are prices, times, and counts using `tabular-nums`?
