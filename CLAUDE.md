# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Dev server at http://localhost:3000
npm run build      # Production build (output: dist/)
npm run lint       # ESLint (zero warnings policy — max-warnings 0)
npm test           # Run tests once (vitest run)
npm run test:watch # Run tests in watch mode
```

To run a single test file:
```bash
npx vitest run src/components/Login.test.jsx
```

## Environment

Create a `.env` file at the project root for local development:
```
VITE_API_BASE_URL=http://localhost:8080
```

In dev, Vite proxies `/api/*` → `http://localhost:8080` and `/files/*` → `http://localhost:8080` (see [vite.config.js](vite.config.js)). On Netlify, `netlify.toml` handles those same proxy redirects to the Railway backend — no `VITE_API_BASE_URL` is used in production; all API calls go through `/api`.

## Architecture

### API layer (`src/api/api.js`)

All backend communication goes through a single axios instance (`api`) with `baseURL: '/api'`. The auth token is set globally as `api.defaults.headers.common['Authorization']` after login. Named API groups are exported:

- `coursesApi` — CRUD + access control + pricing
- `lessonsApi` — CRUD, reordering, file uploads (multipart FormData for PDF + YouTube URL)
- `usersApi` — registration, current user, admin actions
- `authApi` — login + password reset
- `enrollmentApi` — enroll/unenroll, lesson completion, progress
- `paymentsApi` — Stripe checkout sessions, PayPal orders/capture, pricing updates

### Auth (`src/context/AuthContext.jsx`)

`AuthProvider` wraps the entire app. Auth state (`user`, `loading`, `isAuthenticated`) is stored in React context. On mount it rehydrates from `localStorage` (`auth_data` key stores `{ token, user }`). `useAuth()` hook is the only way components access auth state.

Role-based UI branching is done inline via `user?.role`:
- `STUDENT` — browse, enroll, track progress
- `CREATOR` — all student access + course/lesson management
- `ADMIN` — all creator access + user admin panel

### Routing (`src/App.jsx`)

All routes are defined in `App.jsx`. There is no route guard abstraction — components handle auth redirects themselves. Dark mode preference is also managed in `App.jsx` and persisted to `localStorage` under `'theme'`.

### Payments

Courses can be free or paid. The payment flow branches on provider: Stripe (redirect to `checkoutUrl`) or PayPal (redirect to `approvalUrl`). `PaymentSuccess` and `PaymentCancel` are landing pages for post-payment redirects. `src/utils/pricing.js` has `formatPrice(priceCents, currency)` for display.

### Styling

Tailwind CSS with a custom theme. CSS classes prefixed `branch-` (e.g. `branch-nav`, `branch-heading`, `branch-pill`) are defined in `src/index.css` and represent the design system tokens.

### Testing

Vitest + React Testing Library. Test files colocated with source (`*.test.jsx` / `*.test.js`). `src/setupTests.js` provides a manual `localStorage`/`sessionStorage` mock (jsdom 29 compatibility). Tests run in jsdom environment with globals enabled.
