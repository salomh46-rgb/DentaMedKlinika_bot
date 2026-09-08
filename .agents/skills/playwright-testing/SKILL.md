---
name: playwright-testing
description: >-
  Automated headless browser testing, visual regression verification, and screenshot QA.
  Automates browser verification, multi-device viewport audits, user interaction flows,
  DOM layout validation, and intercepts console/network errors before shipping.
---

# Playwright Testing: Automated Browser QA & Visual Verification

## Overview
Playwright Testing equips the agent with autonomous browser testing capabilities. It launches headless browser sessions, navigates web applications across mobile, tablet, and desktop viewports, executes critical user flows, captures screenshots, and intercepts console or network errors to ensure zero defects before code reaches the user.

---

## 1. Multi-Viewport Testing Matrix

Never verify UI on a single window size. Always test these three standard viewports:

| Device Category | Dimensions | User Agent / Characteristics |
| :--- | :--- | :--- |
| **Mobile (iPhone 14/15)** | `375 x 812` | Touch enabled, bottom navigation, mobile drawer |
| **Tablet (iPad Mini/Air)** | `768 x 1024` | 2-column grids, hybrid navigation |
| **Desktop (MacBook / PC)** | `1440 x 900` | Mouse hover states, expanded sidebar/header |

---

## 2. Core QA Workflows

### Workflow 1: Console & Network Error Sniffer
Every automated test run must listen for and fail on unhandled errors:
```typescript
import { test, expect } from '@playwright/test';

test('verify zero runtime errors during navigation', async ({ page }) => {
  const errors: string[] = [];
  const failedRequests: string[] = [];

  // Intercept uncaught JavaScript exceptions
  page.on('pageerror', (err) => errors.push(`[Runtime Error] ${err.message}`));

  // Intercept console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`[Console Error] ${msg.text()}`);
  });

  // Intercept 4xx/5xx network responses
  page.on('response', (res) => {
    if (res.status() >= 400 && !res.url().includes('favicon')) {
      failedRequests.push(`${res.status()} ${res.url()}`);
    }
  });

  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');

  expect(errors).toEqual([]);
  expect(failedRequests).toEqual([]);
});
```

### Workflow 2: Automated End-to-End User Flow (Booking Simulation)
```typescript
test('complete booking flow and verify confirmation modal', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:5173');

  // 1. Select service category
  const serviceCard = page.locator('text=Tish tozalash').first();
  await serviceCard.scrollIntoViewIfNeeded();
  await serviceCard.click();

  // 2. Select date and time slot
  const timeSlot = page.locator('button:has-text("10:00")').first();
  await timeSlot.click();

  // 3. Fill patient details
  await page.fill('input[name="fullName"], input[placeholder*="ism"]', 'Azizbek Rahimov');
  await page.fill('input[type="tel"], input[placeholder*="998"]', '+998901234567');

  // 4. Submit booking
  const submitBtn = page.locator('button:has-text("Tasdiqlash"), button:has-text("Yozilish")').first();
  await submitBtn.click();

  // 5. Assert success state
  const successBadge = page.locator('text=Qabul muvaffaqiyatli band qilindi');
  await expect(successBadge).toBeVisible({ timeout: 5000 });

  // 6. Capture proof screenshot
  await page.screenshot({ path: 'booking_success_mobile.png', fullPage: true });
});
```

### Workflow 3: Visual Screenshot Capture for Proof
When making UI modifications, capture high-resolution visual proof:
```typescript
test('capture dark mode and light mode screenshots', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Light Mode snapshot
  await page.screenshot({ path: 'ui_light_mode.png', fullPage: true });

  // Toggle Dark Mode
  const themeToggle = page.locator('button[aria-label*="Kun"], button[aria-label*="Tun"], button:has-text("Tun")').first();
  if (await themeToggle.isVisible()) {
    await themeToggle.click();
    await page.waitForTimeout(300); // Wait for CSS transition
    await page.screenshot({ path: 'ui_dark_mode.png', fullPage: true });
  }
});
```

---

## 3. Integration with Antigravity Tools

In Antigravity, you can execute headless browser QA in two complementary ways:

1. **Via `chrome-devtools-mcp` tools**:
   - `navigate_page`: Navigate to `http://localhost:5173`.
   - `resize_page`: Switch between `375x812` and `1440x900`.
   - `take_screenshot`: Capture full-page or element screenshot artifacts.
   - `list_console_messages`: Inspect console warnings and exceptions.
   - `evaluate_script`: Query DOM elements and trigger actions.

2. **Via Command Line (`run_command`)**:
   - Run standalone Playwright / Node verification script:
     ```bash
     npx playwright test
     ```
   - Or run custom Node snapshot runner:
     ```bash
     node scripts/verify_ui.js
     ```

---

## 4. Pre-Release QA Protocol
Always confirm these 4 checks before delivering UI:
1. [ ] **No Console Errors**: Zero red messages or unhandled rejections in the browser console.
2. [ ] **No Visual Overlap**: Modals, tooltips, and fixed navigation bars do not occlude buttons or text.
3. [ ] **Mobile Touch Flows**: User can start and finish the key task on a 375px mobile viewport.
4. [ ] **Theme Switching**: Dark/Light mode transitions without flash of unstyled content (FOUC).
