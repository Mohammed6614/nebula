# NEBULA Backend

Production-ready Node.js backend for NEBULA SaaS platform.

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment
# .env file is already configured with your credentials

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database with admin/supervisor
npm run db:seed

# Start development server
npm run dev
```

## Available Scripts

- `npm run dev` - Start with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:migrate` - Run migrations
- `npm run db:seed` - Seed database
- `npm run db:studio` - Open Prisma Studio

## API Endpoints

### Auth
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login
- POST `/api/auth/logout` - Logout
- POST `/api/auth/refresh` - Refresh token
- GET `/api/auth/me` - Get current user
- GET `/api/auth/verify-email` - Verify email
- POST `/api/auth/resend-verification` - Resend verification
- POST `/api/auth/forgot-password` - Request password reset
- POST `/api/auth/reset-password` - Reset password
- POST `/api/auth/change-password` - Change password

### Subscriptions
- GET `/api/subscriptions/plans` - Get subscription plans
- GET `/api/subscriptions/my-subscription` - Get user subscription
- POST `/api/subscriptions` - Create subscription
- POST `/api/subscriptions/:id/cancel` - Cancel subscription

### Stores
- POST `/api/stores` - Create store (merchant only)
- GET `/api/stores/my-store` - Get my store
- GET `/api/stores/public/:slug` - Get public store
- PATCH `/api/stores/:id` - Update store
- GET `/api/stores/:id/stats` - Get store stats

### Products
- GET `/api/products` - List products
- POST `/api/products` - Create product
- GET `/api/products/:id` - Get product
- PATCH `/api/products/:id` - Update product
- DELETE `/api/products/:id` - Delete product

### Orders
- POST `/api/orders` - Create order
- GET `/api/orders/my-orders` - Get my orders
- GET `/api/orders/:id` - Get order details
- GET `/api/orders/:id/verify` - Verify order via QR

### Webhooks
- POST `/api/webhooks/paypal` - PayPal webhooks
- POST `/api/webhooks/tabby` - Tabby webhooks
- POST `/api/webhooks/tamara` - Tamara webhooks

## Architecture

### Multi-Tenancy
- Every store has a unique `tenantId`
- All store-related data includes `tenantId`
- Middleware ensures tenant isolation

### Authentication Flow
1. User registers/logs in
2. Server returns accessToken + refreshToken
3. Access token stored in memory/localStorage
4. Refresh token used to get new access token
5. Both tokens revoked on logout

### Subscription Flow
1. User selects plan
2. Server creates PayPal subscription
3. User approves payment on PayPal
4. PayPal sends webhook to server
5. Server activates subscription
6. First month charged at discounted price
7. Subsequent months charged at full price

## Environment Variables

See `.env` file for all required variables.

## Database Schema

See `prisma/schema.prisma` for complete schema.

Key tables:
- `users` - All user accounts
- `stores` - Merchant stores
- `products` - Store products
- `orders` - Customer orders
- `subscriptions` - User subscriptions
- `payments` - Payment records
- `affiliates` - Affiliate tracking
