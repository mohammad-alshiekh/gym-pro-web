# GymBro Admin Portal — AI Helper Guide

## Project Overview
This is a **Next.js 16 (App Router)** fullstack admin portal for the GymBro fitness management system.
It supports two roles: **Super Admin** and **Gym Manager**.

## Technology Stack
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL via Drizzle ORM
- **Styling**: Tailwind CSS v4 + CSS custom properties (no Tailwind config file)
- **State Management**: Zustand (`src/store/useAppStore.ts`)
- **HTTP Client**: Axios (`src/lib/api.ts`)
- **Forms**: Native controlled state (to avoid Zod/RHF version conflicts)
- **Charts**: Recharts
- **Toasts**: react-hot-toast
- **Icons**: lucide-react

## Project Structure
```
src/
├── app/
│   ├── page.tsx                    # Root → Login redirect
│   ├── layout.tsx                  # Root layout with Toaster
│   ├── globals.css                 # Theme CSS variables + Tailwind
│   ├── api/health/route.ts         # Health check endpoint
│   ├── admin/                      # Super Admin pages
│   │   ├── dashboard/page.tsx
│   │   ├── gyms/page.tsx
│   │   ├── trainers/page.tsx
│   │   ├── trainees/page.tsx
│   │   ├── exercises/page.tsx
│   │   ├── muscle-groups/page.tsx
│   │   ├── equipment/page.tsx
│   │   ├── exercise-schedules/           # Exercise Schedules (CRUD)
│   │   │   ├── page.tsx                    # List + search + delete
│   │   │   ├── new/page.tsx                # Create (builder)
│   │   │   ├── [id]/page.tsx               # Detail (days/exercises/sets)
│   │   │   └── [id]/edit/page.tsx          # Edit (builder)
│   │   └── transactions/page.tsx
│   └── manager/                    # Gym Manager pages
│       ├── dashboard/page.tsx
│       ├── my-gym/page.tsx
│       ├── plans/page.tsx
│       ├── subscriptions/page.tsx
│       ├── members/page.tsx
│       ├── attendance/page.tsx
│       ├── analytics/page.tsx
│       ├── qr-code/page.tsx
│       └── profile/page.tsx
├── components/
│   ├── auth/LoginPage.tsx          # Login page with role switcher
│   ├── layout/
│   │   ├── Sidebar.tsx             # Collapsible sidebar
│   │   ├── TopBar.tsx              # Header with lang toggle
│   │   └── DashboardLayout.tsx     # Auth-protected wrapper
│   ├── schedules/
│   │   ├── ScheduleBuilder.tsx     # Days → exercises → sets editor (create/edit)
│   │   └── ExercisePicker.tsx      # Searchable exercise selection modal
│   └── ui/
│       ├── StatCard.tsx            # KPI card component
│       ├── DataTable.tsx           # Generic table
│       ├── Modal.tsx               # Dialog/modal
│       ├── Button.tsx              # Multi-variant button
│       ├── Input.tsx               # Dark themed input
│       ├── Select.tsx              # Dark themed select
│       ├── Badge.tsx               # Status badge
│       └── Pagination.tsx          # Page navigation
├── lib/
│   ├── theme.ts                    # 🎨 EDIT THIS to change theme
│   ├── api.ts                      # All API calls (Base: https://gymbro.runasp.net/api)
│   ├── auth.ts                     # Auth utilities (localStorage + getUserId from JWT)
│   ├── schedules.ts                # Exercise schedule types, helpers, form state
│   ├── exercises.ts                # Exercise catalogue cache + client-side filtering
│   ├── gym.ts                      # My Gym types, form state, multipart builders
│   ├── apiError.ts                 # Unwraps API error payloads for toasts
│   ├── utils.ts                    # Helpers (formatDate, labels, cn)
│   └── i18n/
│       ├── en.ts                   # English translations
│       ├── ar.ts                   # Arabic translations
│       └── index.ts                # Translation loader
├── store/
│   └── useAppStore.ts              # Zustand store (locale, sidebar)
├── hooks/
│   ├── useTranslation.ts           # useTranslation() hook
│   └── useExerciseCatalogue.ts     # Session-cached exercise catalogue
└── db/
    ├── index.ts                    # Drizzle DB connection
    └── schema.ts                   # Database schema
```

## Theme Customization
**To change colors**: Edit `src/lib/theme.ts` AND update CSS variables in `src/app/globals.css`.

Key colors:
Palette: **Kinetic Dark v2** — the lime identity kept, the greys de-olived to cool slate.

- `#c8f323` / `#aed500` — Electric Lime (primary CTA, active states)
- `#0f1013` — Background (also input ground)
- `#171a1e` — Card surface
- `#1c2025` — Raised container
- `#23272e` — Elevated elements
- `#2f3742` — Border color
- `#e9ecf1` — Primary text
- `#c3cad6` — Secondary text
- `#8b93a1` — Muted text
- `#4ae176` — Success/Green
- `#ffb4ab` — Error/Red
- `#ffd04a` — Warning · `#adc6ff` — Info

Colours are inline hex literals in components, so a palette change means editing
`globals.css`, `lib/theme.ts` **and** sweeping the hexes across `src/`.

## Adding Translations
1. Add key to `src/lib/i18n/en.ts`
2. Add Arabic translation to `src/lib/i18n/ar.ts` (matching structure)
3. Use in component: `const { t } = useTranslation(); t.section.key`

## Adding a New Page
1. Create file at `src/app/[role]/[page]/page.tsx`
2. Use `<DashboardLayout title="..." requiredRole="super_admin|gym_manager">`
3. Add nav item to `src/components/layout/Sidebar.tsx` in `navItems` array

## Adding a New API Call
Add to `src/lib/api.ts` following existing patterns:
```ts
export const myApi = {
  getAll: (params) => apiClient.get('/endpoint', { params }),
  create: (data) => apiClient.post('/endpoint', data),
};
```

## Auth Flow
- Login → stores `accessToken`, `refreshToken`, `userRole` in localStorage
- All API requests auto-attach Bearer token via axios interceptor
- 401 response → clears auth and redirects to `/`
- Route protection in `DashboardLayout.tsx`

## API Base URL
`https://gymbro.runasp.net/api`

## i18n/RTL
- Language stored in Zustand (persisted to localStorage key `gymbro-app-store`)
- RTL is automatic when locale is `"ar"` — uses `dir="rtl"` on root elements
- `useTranslation()` returns `{ t, locale, isRtl }`

## Exercise Schedules
- Endpoints: `GET/POST /ExerciseSchedule`, `GET/PUT/DELETE /ExerciseSchedule/{id}` → `schedulesApi`
- Shape: schedule → `days[]` → `exercises[]` → `sets[]`; `dayNumber`, `order` and
  `setNumber` are assigned from array position on submit (`toSchedulePayload`)
- `difficultyLevel`: **0 = Beginner, 1 = Intermediate, 2 = Expert** — the API's
  shared `DifficultyLevelEnum` (same values as `Exercise.level`, verified against
  the live catalogue). Single source: `difficultyKey()` in `src/lib/schedules.ts`.
- **POST and PUT take different DTOs**: create carries `createdByAdminId` (no
  `isActive`), update carries `isActive` (no `createdByAdminId`) — hence
  `toSchedulePayload` vs `toScheduleUpdatePayload`.
- `createdByAdminId` comes from `getUserId()`, which decodes the JWT
  (`sub`/`nameid` claim) since login only returns tokens.
- `GET /Exercise` accepts **no filter parameters**, so `ExercisePicker` loads the
  full catalogue once per session (`lib/exercises.ts` + `useExerciseCatalogue`)
  and filters by query/level/muscle/equipment in memory.

## My Gym (Gym Manager)
- `GET /gyms/my-gym` returns the whole profile in one call: `workingPeriods`,
  `images`, `services`, `plans`, `gymManager` — types in `src/lib/gym.ts`
- `PUT /gyms/my-gym` and `POST /gyms/my-gym/images` are declared as
  `x-www-form-urlencoded` in the OpenAPI doc but carry an `IFormFile`, so they
  **must** be sent as multipart/form-data. Urlencoded fails with
  "Form key length limit 2048 exceeded".
- `WorkingPeriods` and `Services` go in the multipart body as JSON strings
  (`buildGymFormData`); times are normalised to `HH:mm:ss`
- `services` may come back empty — the editor always renders all 8 service types
  (`fullServiceList`), otherwise a service could never be switched on
- `POST /gyms/my-gym/images/reorder` takes a plain JSON array of image ids in
  display order (wired to the gallery's move buttons + "Save order")
- API errors arrive in two shapes; `apiErrorMessage()` in `src/lib/apiError.ts`
  unwraps both (`{ message }` and `{ errors: { field: [...] } }`) for toasts

## Request Logging (dev)
- `src/lib/apiLogger.ts` prints every API call — method, full URL, request
  headers, body, and the complete response — cyan for the request, green for
  success, **red for failures**. Uses ANSI escapes so it colours both the
  browser console and the `next dev` terminal.
- `logging.browserToTerminal: true` in `next.config.ts` forwards the browser
  console to the terminal (**restart `next dev` after changing next.config**)
- Flags: `NEXT_PUBLIC_API_LOG=0|1`, `NEXT_PUBLIC_API_LOG_TOKENS=1` (unmask the
  bearer token), `NEXT_PUBLIC_API_LOG_LIMIT=n` (chars per body, 0 = unlimited,
  default 20000)

## Gym Manager Contract
- `src/lib/manager.ts` holds every gym-manager type and enum, transcribed from
  `.claude/GYM_MANAGER_API_DOCUMENTATION.md`; pages import from there rather
  than redeclaring shapes
- **Enum values verified against the live endpoint** (the doc's tables are
  1-based; the server is 0-based for services):
  - `GymServiceTypeEnum`: **0–7** — 0 Personal Trainer, 1 Locker Room, 2 Sauna,
    3 Pool, 4 Parking, 5 WiFi, 6 Protein Bar, 7 Nutritionist. Sending `8`
    returns `"Services[7].ServiceType": ["The value '8' is invalid."]`
  - `GenderTypeEnum`: 1 Male, 2 Female (0 also accepted = Unspecified; 3 rejected)
  - `DayOfWeek`: 0–6, Sunday first
- To probe an enum without mutating data, PUT with one deliberately invalid
  field (e.g. `Latitude=NOT_A_NUMBER`): model validation reports every bad value
  at once and the action never runs.
- `PUT /gyms/my-gym` binds collections as ASP.NET indexed form keys —
  `WorkingPeriods[0].DayOfWeek`, `Services[0].ServiceType`, … — with times as
  `"HH:mm"`. A JSON-string field binds to an empty list and wipes the data.
- Subscription approve/reject applies to **pending cash** requests; card
  payments settle through Stripe with no manager action
- Manager cancellations send `cancellationType: 1` (ByManager)
- Plans: `durationDays` 1–3650, `price >= 0`; DELETE deletes when unused and
  soft-deactivates when already purchased

## Enum References
See `src/lib/utils.ts` for enum label functions:
- `gymTypeLabel(n)` → "Mixed", "Male Only", etc.
- `subscriptionStatusLabel(n)` → "Pending", "Active", etc.
- `serviceTypeLabel(n)` → "Personal Trainer", etc.
- `paymentMethodLabel(n)` → "Cash", "Card"

## Notes
- All pages use `"use client"` directive
- Database is used only for health check (no custom DB tables needed)
- No mock/demo data hardcoded — all data comes from external API
- Charts use Recharts with dark theme styling
