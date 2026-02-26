# 🇳🇬 Concierge Services API

A production-ready Node.js/Express REST API powering a **Nigerian concierge services marketplace** — connecting customers with restaurant reservations, club bookings, car rentals, and boat rentals across Nigeria.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Running the Server](#running-the-server)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Overview

The Concierge Services API supports three user roles:

| Role | Capabilities |
|------|-------------|
| **Customer** | Browse vendors & listings, make bookings, pay, leave reviews |
| **Vendor** | Manage profile, listings, confirm/complete bookings, request payouts |
| **Admin** | Full platform oversight, vendor verification, commission management |

**Key Features:**
- JWT authentication with refresh tokens
- Paystack payment gateway integration (NGN)
- Cloudinary image uploads
- Commission-based revenue model
- Dual booking types: **Reservations** (restaurants/clubs) and **Rentals** (cars/boats)
- Availability checking for rental listings
- Vendor payout management
- Rate limiting and security headers

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js ≥ 18 |
| Framework | Express.js 4 |
| ORM | Prisma 5 |
| Database | PostgreSQL 15 |
| Auth | JSON Web Tokens (jsonwebtoken) |
| Payments | Paystack |
| Storage | Cloudinary |
| Validation | Joi |
| Security | Helmet, express-rate-limit, bcryptjs |
| Logging | Winston, Morgan |

---

## Prerequisites

- **Node.js** ≥ 18.0.0
- **npm** ≥ 9.0.0
- **PostgreSQL** 15+ (or Docker)
- A **Cloudinary** account (free tier works)
- A **Paystack** account (test keys for development)

---

## Installation

```bash
# Clone the repository
git clone https://github.com/your-org/concierge-services-api.git
cd concierge-services-api

# Install dependencies
npm install
```

---

## Environment Setup

```bash
# Copy the example env file
cp .env.example .env
```

Edit `.env` with your actual values:

```env
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/concierge_db

JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=replace-with-another-long-random-string
JWT_REFRESH_EXPIRES_IN=30d

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxx
PAYSTACK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx

APP_NAME=Concierge Services
APP_URL=http://localhost:3000
```

---

## Database Setup

### Option A – Docker (recommended)

```bash
# Start PostgreSQL via Docker Compose
docker-compose up -d

# Verify it is running
docker-compose ps
```

### Option B – Local PostgreSQL

Create the database manually:
```sql
CREATE DATABASE concierge_db;
```

### Run Migrations & Generate Client

```bash
# Generate Prisma client
npm run db:generate

# Apply migrations
npm run db:migrate

# (Optional) Seed with sample data
npm run db:seed
```

### Prisma Studio (GUI)

```bash
npm run db:studio
```

---

## Running the Server

```bash
# Development (with hot-reload)
npm run dev

# Production
npm start
```

The API will be available at: `http://localhost:3000`

Health check: `GET http://localhost:3000/health`

---

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | — | Register a new user |
| POST | `/auth/login` | — | Login and receive tokens |
| POST | `/auth/refresh-token` | — | Refresh access token |
| POST | `/auth/forgot-password` | — | Request password reset |
| POST | `/auth/reset-password` | — | Reset password with token |
| POST | `/auth/verify-otp` | — | Verify phone with OTP |
| GET | `/auth/me` | ✅ | Get current user profile |

#### Register Example
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!",
    "firstName": "Amaka",
    "lastName": "Eze",
    "userType": "CUSTOMER"
  }'
```

#### Login Example
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "Password123!"}'
```

---

### Vendors

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/vendors` | — | List vendors (filter by type, city) |
| GET | `/vendors/:id` | — | Get vendor details |
| GET | `/vendors/:id/listings` | — | Get vendor's listings |
| GET | `/vendors/:id/reviews` | — | Get vendor's reviews |
| POST | `/vendors` | VENDOR | Create vendor profile |
| PUT | `/vendors/me` | VENDOR | Update vendor profile |
| PUT | `/vendors/me/hours` | VENDOR | Update operating hours |

#### List Vendors with Filters
```bash
curl "http://localhost:3000/api/v1/vendors?type=RESTAURANT&city=Lagos&page=1&limit=10"
```

---

### Listings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/listings` | — | Search listings |
| GET | `/listings/:id` | — | Get listing details |
| GET | `/listings/:id/availability` | — | Check availability |
| POST | `/listings` | VENDOR | Create listing |
| PUT | `/listings/:id` | VENDOR | Update listing |
| DELETE | `/listings/:id` | VENDOR | Delete listing |
| POST | `/listings/:id/images` | VENDOR | Upload listing images |
| DELETE | `/listings/:id/images/:imageId` | VENDOR | Remove image |

#### Search Listings
```bash
curl "http://localhost:3000/api/v1/listings?type=CAR_RENTAL&priceMin=20000&priceMax=100000&city=Lagos"
```

#### Check Availability
```bash
curl "http://localhost:3000/api/v1/listings/:id/availability?startDate=2025-03-01&endDate=2025-03-05"
```

---

### Bookings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/bookings` | CUSTOMER | Create a booking |
| GET | `/bookings` | ✅ | List my bookings |
| GET | `/bookings/:id` | ✅ | Get booking details |
| POST | `/bookings/:id/confirm` | VENDOR | Confirm booking |
| POST | `/bookings/:id/cancel` | ✅ | Cancel booking |
| POST | `/bookings/:id/complete` | VENDOR/ADMIN | Complete booking |
| POST | `/bookings/:id/report-bill` | VENDOR | Report final bill (reservations) |

#### Create a Car Rental Booking
```bash
curl -X POST http://localhost:3000/api/v1/bookings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "listingId": "listing-cuid",
    "bookingType": "RENTAL",
    "startDate": "2025-03-01T08:00:00Z",
    "endDate": "2025-03-03T08:00:00Z",
    "specialRequests": "Please ensure full fuel tank"
  }'
```

#### Create a Restaurant Reservation
```bash
curl -X POST http://localhost:3000/api/v1/bookings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "listingId": "listing-cuid",
    "bookingType": "RESERVATION",
    "startDate": "2025-03-01T19:00:00Z",
    "startTime": "19:00",
    "endTime": "21:00",
    "guestCount": 4
  }'
```

---

### Payments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/payments/initialize` | CUSTOMER | Initialize Paystack payment |
| GET | `/payments/verify/:reference` | ✅ | Verify payment status |
| POST | `/payments/webhook` | — | Paystack webhook handler |
| GET | `/payments/history` | ✅ | Get payment history |

#### Initialize Payment
```bash
curl -X POST http://localhost:3000/api/v1/payments/initialize \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"bookingId": "booking-cuid"}'
```

---

### Payouts (Vendor only)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/payouts` | VENDOR | List my payouts |
| GET | `/payouts/balance` | VENDOR | Get available balance |
| POST | `/payouts/request` | VENDOR | Request a payout |
| POST | `/payouts/bank-accounts` | VENDOR | Add a bank account |

---

### Reviews

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/reviews/vendor/:vendorId` | — | List vendor reviews |
| POST | `/reviews` | CUSTOMER | Submit a review |
| POST | `/reviews/:id/respond` | VENDOR | Respond to a review |

---

### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/dashboard` | ADMIN | Platform statistics |
| GET | `/admin/vendors` | ADMIN | List all vendors |
| PATCH | `/admin/vendors/:id/verify` | ADMIN | Verify a vendor |
| PATCH | `/admin/vendors/:id/commission` | ADMIN | Set vendor commission |
| GET | `/admin/bookings` | ADMIN | List all bookings |
| GET | `/admin/transactions` | ADMIN | List all transactions |
| GET | `/admin/payouts` | ADMIN | List all payout requests |

---

## Authentication

The API uses **Bearer JWT tokens**. Include the token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- **Access Token**: expires in 7 days (configurable via `JWT_EXPIRES_IN`)
- **Refresh Token**: expires in 30 days (configurable via `JWT_REFRESH_EXPIRES_IN`)

Use `POST /api/v1/auth/refresh-token` with `{ "refreshToken": "..." }` to obtain a new access token.

---

## Booking Flow

### Rental (Car / Boat)
1. Customer creates booking → status: `PENDING`, paymentStatus: `PENDING`
2. Customer initializes payment via Paystack → redirected to checkout
3. Paystack webhook fires `charge.success` → status: `CONFIRMED`, paymentStatus: `PAID`
4. Vendor marks booking as `COMPLETED`

### Reservation (Restaurant / Club)
1. Customer creates booking → status: `PENDING`, no upfront payment
2. Vendor confirms booking → status: `CONFIRMED`
3. After the visit, vendor reports the bill → commission calculated, status: `COMPLETED`

---

## Deployment

### Environment Variables

Ensure all variables in `.env.example` are set in your production environment. Never commit `.env` to source control.

### Using Docker

```bash
# Start PostgreSQL with Docker Compose
docker-compose up -d
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use a strong, random `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Enable HTTPS / TLS termination (via nginx or a load balancer)
- [ ] Set `ALLOWED_ORIGINS` to your frontend domain
- [ ] Configure Paystack live keys
- [ ] Set up database connection pooling (e.g., PgBouncer)
- [ ] Enable database SSL: append `?sslmode=require` to `DATABASE_URL`
- [ ] Configure a process manager (PM2 or systemd)

---

## Seed Data

After seeding (`npm run db:seed`), the following test accounts are available (password: `Password123!`):

| Role | Email |
|------|-------|
| Admin | admin@concierge.ng |
| Vendor (Restaurant) | restaurant@concierge.ng |
| Vendor (Car Rental) | carrental@concierge.ng |
| Customer | customer1@concierge.ng |
| Customer | customer2@concierge.ng |

---

## Project Structure

```
.
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.js             # Sample data seeder
├── src/
│   ├── app.js              # Express app entry point
│   ├── config/             # Database, Cloudinary, Paystack config
│   ├── controllers/        # Route handlers (thin layer)
│   ├── middleware/         # Auth, error handling, validation, upload
│   ├── routes/             # Express routers
│   ├── services/           # Business logic
│   ├── utils/              # Helpers, constants, logger, errors
│   └── validators/         # Joi validation schemas
├── .env.example
├── docker-compose.yml
└── package.json
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

Please follow the existing code style (CommonJS, JSDoc comments on key functions, try/catch in all controllers).

---

## License

MIT
