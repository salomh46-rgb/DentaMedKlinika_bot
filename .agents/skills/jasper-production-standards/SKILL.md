---
name: jasper-production-standards
description: >-
  Comprehensive zero-regression engineering and design standards for SaaS platforms,
  elite portfolios, responsive websites, Telegram Mini Apps, and Fintech/payments.
  Distilled directly from Javohirbek Asqarov's (Jasper) real-world projects and fixes.
---

# Jasper Production Standards: Zero-Regression Engineering & Design Bible

## Overview
This skill crystallizes the hard-learned lessons, architectural breakthroughs, bug fixes, and UX standards established through hands-on development with **Javohirbek Asqarov (Jasper)** across his entire production portfolio:
- **SaaS Platforms**: Jasper AI Workspace, PulseAPI Monitoring, HireAI Interviewer, InstaShop AI, Davomat Pro.
- **Portfolios & High-Conversion Websites**: Javohirbek Portfolio, BestPortfolio Showcase, CollabFlow AI Canvas.
- **Telegram Mini Apps & Bots**: DentaMed Ekotizimi, Smart Kotib, Telegram Scam Guard, Business Bots.
- **Fintech & Payments**: UzPayment SDK, Payme, Click, and Uzum integrations.

Every rule below was forged through real-world bugs, user testing, and performance calibrations. Adhering to these standards ensures that any code written by Antigravity or its subagents is clean, resilient, and enterprise-grade.

---

## Pillar 1: SaaS Architecture & Cloud Deployment Resilience

### 1.1. Relative API Base URLs in Production
- **The Mistake**: Hardcoding `http://localhost:8000` or absolute URLs in Axios/Fetch inside frontend code. When deployed to Vercel, Railway, or Render, requests fail with CORS or network errors.
- **The Jasper Standard**: Always use environment-aware relative URLs with a fallback to `/api`:
  ```typescript
  // ✅ CORRECT PATTERN: Relative in prod, configurable in dev
  export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
  ```
- In Vite config (`vite.config.ts`), configure local development proxy so `/api` maps cleanly to `http://localhost:8000`:
  ```typescript
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
  ```

### 1.2. Strict Server-Side Tier & Plan Limit Enforcement
- **The Mistake**: Enforcing subscription limits (e.g. max bots, token quotas, voice minutes) only in the frontend UI by hiding buttons or disabling forms.
- **The Jasper Standard**: Treat all client requests as untrusted.
  - The frontend provides instant feedback and upgrade modals.
  - The backend FastAPI/Node router MUST check subscription tier, current usage counters, and active plan expiration before processing:
  ```python
  # ✅ CORRECT PATTERN: Server-side limit verification
  if user.plan == "free" and user.bot_count >= 1:
      raise HTTPException(
          status_code=403, 
          detail={"error": "LIMIT_REACHED", "message": "Starter rejada faqat 1 ta bot mumkin. VIP rejaga o'ting."}
      )
  ```

### 1.3. Timezone Calculations (`Asia/Tashkent` vs UTC)
- **The Mistake**: Using naive `datetime.now()` or browser UTC dates for subscription expiration, resulting in subscriptions expiring 5 hours too early or late for Uzbekistan users.
- **The Jasper Standard**: Store UTC in database columns, but always calculate daily quota resets and subscription expiry relative to `Asia/Tashkent` (UTC+5):
  ```python
  from datetime import datetime, timezone, timedelta
  UZB_TZ = timezone(timedelta(hours=5))
  now_uzb = datetime.now(UZB_TZ)
  ```

### 1.4. Telegram InitData HMAC-SHA256 Authentication
- **The Mistake**: Trusting user IDs passed in plain query params (`?user_id=12345`) from Telegram Mini Apps.
- **The Jasper Standard**: Always validate `window.Telegram.WebApp.initData` cryptographically on the backend using the bot token and HMAC-SHA256 hash validation before granting access to tenant workspaces.

---

## Pillar 2: Elite Portfolios & High-Conversion Web Design

### 2.1. Glassmorphism & Atmospheric Lighting (No Generic Flat AI Themes)
- **The Mistake**: Generating bland, sterile white-and-gray bootstrap layouts with no personality or visual hierarchy.
- **The Jasper Standard**: Deliver designer-grade aesthetic depth:
  - Dark luxury backgrounds: `#090a0f` or `#0b0f19` with subtle radial mesh gradients.
  - Glass cards: `bg-neutral-900/60 backdrop-blur-xl border border-white/10 shadow-2xl hover:border-cyan-500/40 transition-all duration-300`.
  - Atmospheric glow accents: Cyan (`#06b6d4`), Emerald (`#10b981`), or Violet (`#8b5cf6`) with soft `blur-3xl` ambient backdrops.

### 2.2. Interactive Live Simulators (Recruiter & Client Magnet)
- **The Mistake**: Describing complex projects with only static text and bullet points.
- **The Jasper Standard**: Every showcase project card in a portfolio should include an **Interactive Live Simulator or Sandbox**:
  - Example: For an AI voice agent, include an interactive audio waveform visualizer and sample prompt triggers.
  - Example: For a fintech bot, include a live demo payment checkout calculator with real-time conversion.
  - Live playgrounds build immediate trust and dramatically increase conversion.

### 2.3. Multi-Language Localization Engine (Zero Cumulative Layout Shift)
- **The Mistake**: Swapping text in a way that causes buttons to jump or layout to break between Uzbek (Latin), Russian, and English.
- **The Jasper Standard**:
  - Pre-allocate UI container widths or use flexible flex/grid wrapping.
  - Never reload the page on language switch; use an in-memory dictionary or `i18n` context.
  - Ensure correct typography characters for Uzbek (o‘, g‘, sh, ch) and clean Cyrillic rendering.

### 2.4. Multi-Channel Lead Generation & Instant Dispatch
- **The Mistake**: Portfolios with dead contact forms or mailto links that get lost.
- **The Jasper Standard**: Implement multi-channel real-time lead capture:
  1. **Primary**: Instant Telegram Bot dispatch with lead details (name, contact, project budget, time).
  2. **Secondary**: Formspree or EmailJS delivery.
  3. **Third**: Google Sheets / CRM webhook integration.
  4. **Fallback**: Graceful fallback notification if network fails, ensuring no client message is lost.

### 2.5. Audio Engines & User Gesture Compliance
- **The Mistake**: Auto-playing sound effects on page load, triggering browser policy errors (`AudioContext was not allowed to start`).
- **The Jasper Standard**: Audio cues (clicks, whooshes, ambient synthesizer) must remain silent until the user's first physical interaction (click/tap), after which the `AudioContext` is safely resumed.

---

## Pillar 3: Telegram Mini Apps & WebApps (Zero-Regression)

### 3.1. SVG & DOM Stacking Context (Z-Index / Tooltip Bug)
- **The Mistake**: Placing tooltips, modal popups, or action cards *inside* an SVG `<g>` loop. SVG elements render in strict document order, ignoring CSS `z-index`, causing tooltips to be clipped or trapped behind other graphics.
- **The Jasper Standard**:
  - The `<svg>` element is strictly for vector geometry.
  - All interactive tooltips, floating badges, and popovers MUST be rendered in an HTML layer **outside the SVG** with `z-50` and absolute/fixed positioning.

### 3.2. Asynchronous Button Resilience (Eliminating the Frozen Button)
- **The Mistake**: Triggering async API calls without loading states or timeouts, permanently disabling the button if the server errors or network hangs.
- **The Jasper Standard**: Every async button must include:
  1. Instant haptic feedback (`Telegram.WebApp.HapticFeedback.impactOccurred('medium')`).
  2. Visual spinner/loading state (`isSubmitting`).
  3. Strict 8-second `AbortController` timeout.
  4. Guaranteed unlock in a `finally` block (`setIsSubmitting(false)`).
  5. Clear user alert on failure, never silent abandonment.

### 3.3. Telegram WebApp Native Immersion
- **The Mistake**: Using generic browser `alert()` or `confirm()` modals inside Telegram WebApps.
- **The Jasper Standard**: Always use native Telegram SDK methods:
  - `Telegram.WebApp.showConfirm(message, callback)`
  - `Telegram.WebApp.showAlert(message, callback)`
  - `Telegram.WebApp.HapticFeedback.notificationOccurred('success' | 'error')`
  - Safe-area bottom padding for iPhone home indicator: `pb-[max(1rem,env(safe-area-inset-bottom))]`.

### 3.4. Dynamic Data Architecture (No Hardcoded MockData)
- **The Mistake**: Hardcoding services, prices, and doctor/staff lists in frontend TSX files, forcing code redeployments for simple price updates.
- **The Jasper Standard**:
  - Store dynamic business data in server-side JSON files (`backend/data/services.json`) or database tables with REST endpoints.
  - Frontend loads data dynamically with a reliable local fallback if offline.

---

## Pillar 4: Fintech & Payment Processing (UzPayment / Payme / Click / Uzum)

### 4.1. Tiyin vs. So'm Precision (The 100x Factor)
- **The Mistake**: Sending Uzbek So'm directly to Payme or Click API without multiplying by 100, causing 10,000 UZS to be processed as 100 UZS.
- **The Jasper Standard**:
  - Always convert to tiyin at the API boundary: `amount_in_tiyin = int(amount_in_uzs * 100)`.
  - When parsing callbacks, divide by 100: `amount_in_uzs = amount_in_tiyin / 100`.
  - Store amounts as integers in tiyin to avoid floating-point rounding errors.

### 4.2. Idempotency & Transaction Locking
- **The Mistake**: Processing duplicate payment notifications when the user double-clicks or the gateway retries its webhook.
- **The Jasper Standard**:
  - Use database unique constraints or Redis atomic locks on `transaction_id`.
  - If a transaction is already marked `PAID`, return HTTP 200 immediately without re-crediting the balance.

### 4.3. Cryptographic Signature Verification
- **The Mistake**: Accepting payment webhooks without verifying HMAC-SHA1 or Base64 auth headers.
- **The Jasper Standard**:
  - Validate Payme HTTP Basic Authentication header (`Paycom:secret_key`).
  - Validate Click `sign_string` MD5 hash against `service_id`, `secret_key`, and `click_trans_id`.

---

## Pillar 5: Windows & Cross-Platform Tooling Hygiene

### 5.1. UTF-8 Without BOM Enforcement
- **The Mistake**: Saving JSON or config files (`railway.json`, `package.json`, `.env`) with UTF-8 BOM in Windows PowerShell, which breaks Linux Docker builds and JSON parsers.
- **The Jasper Standard**: Always ensure clean UTF-8 encoding without Byte Order Mark (BOM). In PowerShell, use `[System.IO.File]::WriteAllText($path, $content, (New-Object System.Text.UTF8Encoding($false)))`.

### 5.2. Python 3.11 Backward Compatibility (No Backslashes in f-strings)
- **The Mistake**: Using backslashes inside f-string curly braces (`f"{text.replace('\n', ' ')}"`) which is allowed in Python 3.12+ but causes fatal syntax errors in Python 3.11 and earlier production servers.
- **The Jasper Standard**: Pre-calculate variable transforms outside the f-string:
  ```python
  # ✅ CORRECT PATTERN
  clean_text = text.replace('\n', ' ')
  msg = f"Result: {clean_text}"
  ```

### 5.3. Windows Port Zombies & Process Hygiene
- **The Mistake**: Trying to start FastAPI on port 8000 when an older orphaned background task still holds the socket, triggering `[WinError 10048]`.
- **The Jasper Standard**: Before launching servers, find and cleanly kill the holding PID:
  ```powershell
  $p = (Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue).OwningProcess | Select-Object -Unique
  if ($p) { Stop-Process -Id $p -Force }
  ```

---

## Pillar 6: Complete Deliverable Standard

Every project, whether SaaS, bot, or portfolio, MUST be delivered with:
1. **Root `README.md`**:
   - Modern technology shields/badges.
   - Clear system architecture diagram (Mermaid).
   - Features summary with screenshots.
   - Quickstart commands for local dev and Docker/production.
   - Commercial pricing proposal & ROI calculation.
   - Author attribution: **Javohirbek Asqarov (Jasper)**.
2. **Client Pitch Deck & Documentation**:
   - Standalone printable presentation for investors or clinic/business owners.
   - 5-minute pitch script addressing common objections.
