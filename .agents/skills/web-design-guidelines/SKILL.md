---
name: web-design-guidelines
description: >-
  Validates frontend code against modern Vercel-style web design standards and UX rules.
  Catches layout shift (CLS), poor touch targets, accessibility flaws (WCAG AA),
  bad responsive breakpoints, and typographic rendering defects before shipping.
---

# Web Design Guidelines: Modern Engineering & Vercel Standards

## Overview
Web Design Guidelines enforces precision, high-performance web engineering standards inspired by Vercel, Next.js, and modern Silicon Valley design systems. It audits and refines web interfaces to eliminate layout instability, mobile UX friction, accessibility violations, and unpolished edge cases.

---

## 1. Ergonomics & Mobile-First Standards

Mobile web experiences must feel as responsive and native as an iOS/Android application:
- **Minimum Tap Targets**:
  - Every interactive button, tab, link, or radio button must have an effective tap target of **at least 44x44px** (WCAG 2.5.5).
  - Even if visual icon is 18px, pad the container: `p-3 min-w-[44px] min-h-[44px] flex items-center justify-center`.
- **iOS Safe Area Insets**:
  - Fixed footers, navigation bars, and sticky modals must account for device home bars:
    ```css
    padding-bottom: max(16px, env(safe-area-inset-bottom));
    ```
  - In Tailwind: `pb-[max(1rem,env(safe-area-inset-bottom))]`
- **Thumb Zone Placement**:
  - Primary actions (Book Now, Confirm, Submit, Next) belong within the lower 40% of the screen on mobile devices.
  - Secondary metadata and filters sit at the top.

---

## 2. Layout Stability & Zero CLS (Cumulative Layout Shift)

Unexpected screen jumps destroy perceived quality:
- **Explicit Dimensions for Images & Icons**:
  - Always provide `width`, `height`, or `aspect-ratio` on images and video containers:
    `aspect-[16/9] w-full object-cover` or `w-6 h-6 shrink-0` for SVG icons.
- **Skeleton Loaders Mirror Exact Geometry**:
  - Skeletons must match the line-height, margin, and padding of the incoming data exactly:
    ```tsx
    // Good: Perfect placeholder footprint
    <div className="h-5 w-3/4 rounded-md bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
    ```
- **Dynamic Content Reserve**:
  - For alerts, toasts, or validation errors, reserve space or use smooth height transitions (`overflow-hidden transition-[max-height] duration-200`) rather than popping into the DOM.

---

## 3. Accessibility & Keyboard Navigation (WCAG 2.1 AA)

- **Contrast Ratios**:
  - Normal text (< 18px): minimum 4.5:1 against its background.
  - Large text (>= 18px bold or 24px regular): minimum 3:1.
  - Never use light gray text `#9CA3AF` on white or dark gray `#4B5563` on black for crucial labels.
- **Focus States (Never `outline: none` without replacement)**:
  ```css
  /* Required pattern for accessible keyboard users */
  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
  ```
- **Semantic HTML Landmarks**:
  - Use `<header>`, `<main>`, `<nav>`, `<aside>`, `<footer>`, `<section>` instead of a soup of `<div>`s.
  - Use native `<button>` for actions and `<a>` for navigational URLs.
- **Screen Reader Clarity**:
  - Icon-only buttons must have an `aria-label` or `<span className="sr-only">Description</span>`.
  - Toggle states must specify `aria-expanded={isOpen}` or `aria-checked={isSelected}`.

---

## 4. Typographic & Font Engineering

- **Font Smoothing**: Always apply clean subpixel rendering:
  ```css
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  ```
- **Tabular Numerals**: Any number that increments, represents money, timestamps, or live counts:
  ```tsx
  <span className="tabular-nums font-mono">12:30 PM</span>
  ```
- **Optimal Line Length**:
  - Paragraphs and articles should never exceed 65 to 75 characters per line (`max-w-prose` or `max-w-xl`).

---

## 5. Responsive Breakpoint Strategy

Never design only for standard desktop:
| Breakpoint | Target Devices | Key Layout Rule |
| :--- | :--- | :--- |
| `< 640px` (Default) | Smartphones | Single column, full-width buttons, bottom action sheets |
| `640px - 1024px` (`sm`, `md`) | Tablets, foldables | 2-column grids, compact sidebars |
| `1024px - 1280px` (`lg`) | Laptops, small desktop | Multi-column, sticky navigation |
| `> 1280px` (`xl`, `2xl`) | Large monitors | Constrained container (`max-w-7xl mx-auto`) |

---

## 6. Pre-Flight Code Audit Checklist
Run this audit before pushing any frontend code:
1. [ ] **Touch**: Do all clickable elements have `>= 44px` touch bounds on touchscreens?
2. [ ] **Contrast**: Does all text pass 4.5:1 contrast in both Light and Dark mode?
3. [ ] **Focus**: Can a user Tab through every form input and button with visible focus rings?
4. [ ] **Images**: Are all images constrained by explicit dimensions or aspect-ratios?
5. [ ] **Mobile Notch**: Are sticky bars padded with `env(safe-area-inset-bottom)`?
