# myCite - Frontend PWA (React + Vite)

A mobile-first Progressive Web Application for exploring community pandals, melas, local deals, and shop inaugurations.

---

## Key Features

1. **Twitter/X-Style Account Drawer ([`AccountDrawer.jsx`](src/components/AccountDrawer.jsx))**:
   - Slide-in panel from the left edge (covers ~82% of phone width; 360px on tablet/desktop).
   - Triggered by tapping the top-left avatar/hamburger button or swiping right from the left screen edge (`clientX <= 30`).
   - Closes via backdrop tap, swipe left (> 50px delta), Escape key, or close button.
   - Accessible: `role="dialog"`, `aria-modal="true"`, focus trap with Tab/Shift+Tab, return focus to trigger on close, body scroll lock, and safe-area inset padding.
   - Smooth 250ms slide-in animation with `prefers-reduced-motion` support.
   - Role-based menu items generated from a single configuration array (`MENU_CONFIG` with `roles: ['USER', 'CLIENT', 'ADMIN']`).
   - Role-specific dynamic stats row with adaptive skeleton loaders.

2. **Client Request & Upgrade Workflow**:
   - **`USER` flow ([`BecomeClientModal.jsx`](src/components/BecomeClientModal.jsx))**: Selects client type (`STORE`, `COMPANY`, `INDIVIDUAL`), fills business name, contact phone (`+91`), and optional note.
   - **Status Info Sheet ([`ClientRequestDeclineSheet.jsx`](src/components/ClientRequestDeclineSheet.jsx))**:
     - `PENDING`: Shows applicant summary, pending review status, and admin contact link.
     - `DECLINED`: Displays official admin review feedback reason and one-click "Submit New Application" button.
   - **Admin Moderation Queue ([`AdminClientRequestsQueue.jsx`](src/components/AdminClientRequestsQueue.jsx))**: Sub-tabs for Pending, Approved, and Declined requests, instant approval, and decline with mandatory 10+ character explanation.

3. **Admin User Management ([`AdminUsersManager.jsx`](src/components/AdminUsersManager.jsx))**:
   - Filter users by role (`ALL`, `USER`, `CLIENT`, `ADMIN`) and status (`ALL`, `ACTIVE`, `SUSPENDED`).
   - Real-time search by name, email, or phone.
   - Account suspension and reactivation with confirmation modals and self/admin account protection.

4. **Category Notification Preferences & Web Push ([`NotificationCenterModal.jsx`](src/components/NotificationCenterModal.jsx))**:
   - Category toggles for **Pandal & Puja**, **Melas & Fairs**, **Offers & Deals**, and **Inaugurations**.
   - Master push notification toggle with VAPID registration and browser permission checks.
   - Automatic local filtering of in-app popup toasts and system push alerts based on active preferences.

5. **App Settings ([`SettingsModal.jsx`](src/components/SettingsModal.jsx))**:
   - Light / Dark mode theme toggle.
   - Language selector placeholder (English, Bengali, Odia, Hindi).
   - Account deletion request flow via `mailto:admin@mycite.com`.

6. **Route Guards & Access Protection**:
   - Guards protected paths (`/admin`, `/admin/users`, `/admin/client-requests`, `/account/posts`, `/posts`, `/campaigns`).
   - Unauthorized attempts open a friendly [`AccessDeniedModal.jsx`](src/components/AccessDeniedModal.jsx) with a direct button to apply for Client status or return Home.
   - Listens to both `hashchange` and `popstate` events for browser navigation safety.

---

## Responsive Breakpoints & Design Tokens

- **Breakpoints Tested**:
  - `320px` (Compact mobile - e.g. iPhone SE / small Androids)
  - `360px` (Standard Android viewport)
  - `390px` (iPhone 12/13/14/15)
  - `430px` (Large phones / Pro Max)
  - `768px` (Tablets / iPad)
  - `1280px` (Desktop / Laptop)
- **Palette & Tokens**:
  - Sky Blue Gradient: `#cfe7ff` → `#e2efff` → `#eaf4ff`
  - Accent Color: `#2f7bff` (City Blue)
  - Dark Theme: `dark:bg-slate-900`, `dark:border-slate-800`, `dark:text-slate-100`
  - Touch targets: Minimum 44px (`min-h-[44px]`), menu rows minimum 52px (`min-h-[52px]`).

---

## Available Scripts

In the `frontend` directory:

```bash
# Run local dev server with Hot Module Replacement (HMR)
npm run dev

# Run Oxlint linting pass
npm run lint

# Compile production bundle with Vite and PWA Workbox Service Worker
npm run build

# Preview the production build locally
npm run preview
```
