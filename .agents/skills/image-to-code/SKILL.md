---
name: image-to-code
description: >-
  Transforms visual references, Figma mockups, and UI screenshots into pixel-accurate,
  semantic, responsive frontend code without losing details. Systematically deconstructs
  spatial layout, color palettes, typography, icons, interactive states, and component trees.
---

# Image to Code: High-Fidelity Visual Deconstruction & Synthesis

## Overview
Image to Code converts screenshots, visual mockups, Figma exports, or product photos into production-grade frontend code (React, TypeScript, Tailwind CSS, or HTML/CSS). Rather than rough approximation, it employs a rigorous multi-pass deconstruction protocol to guarantee visual fidelity, responsiveness, and clean component architecture.

---

## 1. The 6-Phase Deconstruction Protocol

When presented with an image or reference screenshot, execute these phases in sequence:

```
[Phase 1: Spatial Grid] ──> [Phase 2: Palette & Light] ──> [Phase 3: Typography]
         │                              │                           │
         ▼                              ▼                           ▼
[Phase 4: Assets & Icons] ─> [Phase 5: State Modeling] ──> [Phase 6: Synthesis]
```

### Phase 1: Spatial Layout & Hierarchy
- Identify the root container: Is it centered (`max-w-6xl mx-auto`), full bleed, or split screen?
- Determine layout primitives:
  - Header / Hero / Main Grid / Sticky Footer.
  - Direction: `flex flex-col` vs `grid grid-cols-1 md:grid-cols-3`.
  - Spacing rhythm: Measure gutters and card padding (e.g. 16px mobile, 24px desktop).

### Phase 2: Color Palette & Materials
- Extract exact hex or HSL values from the reference:
  - Surface backgrounds (light canvas `#F8FAFC`, dark canvas `#0F172A`).
  - Primary accents (e.g. emerald `#059669`, indigo `#4F46E5`).
  - Border nuances (e.g. `border-neutral-200/80` or `border-white/10`).
  - Shadows & blurs: Note whether cards have diffuse elevation (`shadow-lg shadow-black/5`) or frosted glass (`backdrop-blur-md bg-white/70`).

### Phase 3: Typography & Text Metrics
- Identify font classification:
  - Sans-serif (Inter, Geist, SF Pro, Roboto).
  - Serif (Playfair, New York, Instrument Serif).
  - Monospace (Geist Mono, JetBrains Mono, Fira Code).
- Capture relative weight hierarchy:
  - Main titles: `font-bold` or `font-semibold` with compact tracking (`-tracking-tight`).
  - Body text: `font-normal text-sm leading-relaxed text-neutral-600`.
  - Micro-tags: `text-[10px] font-bold uppercase tracking-wider`.

### Phase 4: Iconography & Media Assets
- Map every visual icon to standard icon sets (Lucide React or Heroicons):
  - Calendar -> `<Calendar className="w-4 h-4" />`
  - User -> `<User className="w-4 h-4" />`
  - Check -> `<CheckCircle2 className="w-4 h-4 text-emerald-500" />`
- Use high-quality placeholders for avatars (`https://images.unsplash.com/...`) with explicit `aspect-square rounded-full object-cover`.

### Phase 5: Interactive States & Motion
Even if the image is static, infer the missing interaction design:
- Buttons must have `:hover`, `:active`, and `:focus-visible` styles.
- Cards must have hover elevation (`hover:translate-y-[-2px] hover:shadow-md transition-all`).
- Active items (selected tab, active filter) must be visibly distinct from inactive peers.

### Phase 6: Semantic Code Synthesis
Assemble into clean, maintainable React components using Tailwind CSS:
- Extract repeated items into typed maps or mock data arrays.
- Never write monolithic 1000-line single files; split into `<ComponentHeader />`, `<ServiceCard />`, `<BookingModal />`.

---

## 2. Common Anti-Patterns to Avoid

| What Amateurs Do | What Elite Engineers Do |
| :--- | :--- |
| Hardcode fixed widths (`w-[385px]`) | Use fluid containers (`w-full max-w-sm mx-auto`) |
| Guess generic colors (`bg-blue-500`) | Sample exact hex codes or map to semantic tokens |
| Drop all text in standard weight `400` | Match exact bold/semibold/medium weights from reference |
| Ignore dark mode contrast | Test colors against both light and dark backgrounds |
| Use low-res bitmaps for icons | Replace with scalable SVGs / Lucide icons |

---

## 3. High-Fidelity Code Template Example

Converting a sleek service card reference:

```tsx
import { ArrowRight, Clock, Star } from 'lucide-react';

interface ServiceItem {
  id: string;
  title: string;
  category: string;
  duration: string;
  rating: number;
  price: string;
}

export function HighFidelityServiceCard({ service }: { service: ServiceItem }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-5 
      shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-500/40 hover:shadow-md 
      dark:border-neutral-800 dark:bg-neutral-900/90">
      
      {/* Accent glow on hover */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-teal-500/10 blur-2xl transition-opacity group-hover:opacity-100 opacity-0" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-teal-700 dark:bg-teal-950/50 dark:text-teal-400">
            {service.category}
          </span>
          <h3 className="mt-2 text-base font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
            {service.title}
          </h3>
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-amber-500">
          <Star className="w-3.5 h-3.5 fill-current" />
          <span>{service.rating}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
        <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
          <Clock className="w-3.5 h-3.5" />
          <span>{service.duration}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
            {service.price}
          </span>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 transition-colors group-hover:bg-teal-600 group-hover:text-white dark:bg-neutral-800 dark:text-neutral-300">
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 4. Visual Verification Checklist
After rendering code from an image reference:
1. [ ] **Margins & Spacing**: Do edge paddings match the visual reference within 2-4px?
2. [ ] **Typography Scale**: Are heading-to-body font ratios identical to the reference?
3. [ ] **Border Radii**: Do outer card corners match inner button corners proportionally?
4. [ ] **Colors & Contrast**: Did you preserve exact brand tints rather than defaulting to generic blue/gray?
5. [ ] **Responsiveness**: Does the layout scale gracefully when viewport shrinks to 375px?
