# NEBULA Frontend

Modern Next.js 14 frontend with Arabic RTL support.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

### 🎨 Design
- Cosmic/Nebula gradient theme
- Glass morphism effects
- Responsive design
- Dark mode support
- Arabic RTL layout

### ⚡ Performance
- Next.js 14 App Router
- Server Components
- Image optimization
- Code splitting

### 🔧 Components
- shadcn/ui components
- Custom NEBULA theme
- Toast notifications
- Form validation
- Loading states

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Landing page
│   ├── layout.tsx         # Root layout (RTL)
│   ├── login/             # Login page
│   ├── register/          # Register page
│   └── dashboard/         # Dashboard pages
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── providers/         # Context providers
│   └── layout/            # Layout components
├── lib/
│   ├── api.ts            # API client
│   └── utils.ts          # Utilities
├── stores/
│   └── auth.store.ts     # Zustand auth store
└── hooks/
    └── use-toast.ts      # Toast hook
```

## Pages

### Public
- `/` - Landing page
- `/login` - Login
- `/register` - Register with role selection
- `/marketplace` - Browse stores
- `/store/:slug` - Public store page
- `/product/:id` - Product page

### Protected
- `/dashboard` - Main dashboard
- `/dashboard/merchant` - Merchant dashboard
- `/dashboard/affiliate` - Affiliate dashboard
- `/dashboard/customer` - Customer dashboard
- `/dashboard/admin` - Admin dashboard

### Onboarding
- `/create-store` - Merchant onboarding
- `/affiliate/setup` - Affiliate onboarding

## Authentication Flow

1. User logs in via `/login`
2. Backend returns tokens + user data
3. Tokens stored in localStorage
4. Zustand store manages auth state
5. Axios interceptor adds token to requests
6. Auto-refresh on token expiry

## API Integration

```typescript
import { authApi, storeApi, productApi } from '@/lib/api';

// Login
const { data } = await authApi.login(email, password);

// Get my store
const { data } = await storeApi.getMyStore();

// List products
const { data } = await productApi.listProducts({ storeId });
```

## Styling

### Tailwind Classes
```
NEBULA Colors:
- bg-nebula-500 / text-nebula-500
- bg-nebula-600 / text-nebula-600

Gradients:
- btn-gradient (primary button)
- text-gradient (gradient text)
- bg-glass (glass morphism)

Animations:
- animate-fade-in
- animate-fade-in-up
- animate-pulse-glow
```

### RTL Support
All components support RTL automatically via:
- `dir="rtl"` on html element
- Tailwind RTL utilities
- Arabic font (Noto Sans Arabic)

## State Management

### Auth Store (Zustand)
```typescript
const { user, login, logout, isAuthenticated } = useAuthStore();
```

Persisted to localStorage with middleware.

## Deployment

### Vercel (Recommended)
```bash
vercel
```

### Environment Variables
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
```

## Development

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build
npm run build
```
