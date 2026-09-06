# 🖥️ GPU Resource Provisioning & Rental Platform — Backend

This is the backend server for the **P2P GPU Resource Provisioning and Allocation System**. It is built with **Python**, **Django 5.x**, **Django REST Framework (DRF)**, **Simple JWT** (JSON Web Tokens), **PostgreSQL**, and production-ready WSGI/Static tools (**Gunicorn** & **WhiteNoise**).

The backend handles user authentication, host node management, GPU listing, SSH session provisioning, automated billing & hold management, wallet transactions, in-app notifications, user reviews, customizable dashboards, platform analytics, and a comprehensive administration panel.

---

## 🚀 Live Deployment & API Documentation

- 🌐 **Live API Base URL**: `https://gpu-rental-backend.onrender.com`
- 📑 **Interactive Swagger UI**: [https://gpu-rental-backend.onrender.com/api/schema/swagger-ui/](https://gpu-rental-backend.onrender.com/api/schema/swagger-ui/)
- 📖 **Redoc API Reference**: [https://gpu-rental-backend.onrender.com/api/schema/redoc/](https://gpu-rental-backend.onrender.com/api/schema/redoc/)
- ⚙️ **Admin Panel**: `https://gpu-rental-backend.onrender.com/admin/`

---

## 🔌 Frontend & Host Daemon Integration

### 1. Frontend Integration (Next.js / React / Vue)
Set your frontend environment variable:
```env
NEXT_PUBLIC_API_URL=https://gpu-rental-backend.onrender.com/api
```

#### Authentication Header Format
For all protected user endpoints, attach the JWT access token:
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

### 2. Host Node / Daemon Integration (API Key Auth)
For background host worker nodes and GPU agents:
1. **Generate API Key**: `POST https://gpu-rental-backend.onrender.com/api/auth/host/api-key/` (with host JWT token).
2. **Validate Key**: `POST https://gpu-rental-backend.onrender.com/api/auth/host/api-key/validate/`
3. **Heartbeat & Telemetry**: Send heartbeats every 60 seconds to `POST https://gpu-rental-backend.onrender.com/api/gpus/heartbeat/`.

---

## 📋 Table of Contents

- [Live Deployment & API Documentation](#-live-deployment--api-documentation)
- [Frontend & Host Daemon Integration](#-frontend--host-daemon-integration)
- [Core Modules & Apps](#-core-modules--apps)
- [Prerequisites](#-prerequisites)
- [Local Setup & Installation](#-local-setup--installation)
- [Running the Server](#-running-the-server)
- [Running Tests](#-running-tests)
- [Endpoints Overview](#-endpoints-overview)
- [Production & Free Tier Deployment](#-production--free-tier-deployment)

---

## 🏗️ Core Modules & Apps

| App | Description |
|---|---|
| **`users`** | Authentication (JWT), user roles (`renter`, `host`, `both`, `admin`), host profiles, password resets, email verification, and host API key generation. |
| **`gpus`** | GPU registration, hardware specs (VRAM, CUDA cores), pricing, availability tracking, heartbeat monitoring, and rating filters. |
| **`wallets`** | User wallet balances, deposit handling, hold amounts, withdrawal workflows, Stripe webhooks, and transaction ledgers. |
| **`sessions`** | SSH session lifecycle (`pending` ➔ `active` ➔ `completed` / `failed`), automated billing, hold & release, earnings split (90/10), and host command telemetry. |
| **`notifications`**| Real-time in-app alerts (sessions, payments, refunds, offline hosts, reviews), unread counters, and mark-as-read actions. |
| **`reviews`** | Verified session ratings (overall, communication, reliability, GPU performance), host replies, and dynamic host summary scores. |
| **`dashboard`** | Tailored dashboards for renters, hosts, and admins; daily platform analytics, revenue trends, activity audit logging, and customizable widgets. |
| **`admin_panel`** | System-wide moderation, user/host deactivation, session termination, rental transaction refunds, system settings, and system logs. |

---

## 🛠️ Prerequisites

Ensure you have the following installed on your machine:
- **Python 3.10+**
- **PostgreSQL** database (Local instance, or cloud providers like Supabase / Neon)
- **Git** and **Pip**

---

## 🚀 Local Setup & Installation

### 1. Clone and Navigate
```bash
git clone https://github.com/Mandipgit/SSH-Based-GPU-Resource-Provisioning-and-Allocation-System.git
cd SSH-Based-GPU-Resource-Provisioning-and-Allocation-System/server
```

### 2. Virtual Environment Setup
- **Windows (PowerShell):**
  ```powershell
  python -m venv venv
  .\venv\Scripts\activate
  ```
- **macOS / Linux:**
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

### 3. Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Copy the sample environment file and configure your settings:
- **Windows (PowerShell):** `Copy-Item .env.example .env`
- **macOS / Linux:** `cp .env.example .env`

Key `.env` variables:
```ini
SECRET_KEY=your-secure-secret-key
DEBUG=True
ALLOWED_HOSTS=*
DATABASE_URL=postgresql://postgres:password@localhost:5432/gpu_db
# Or individual DB credentials:
# DB_NAME=postgres
# DB_USER=postgres
# DB_PASSWORD=yourpassword
# DB_HOST=localhost
# DB_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:3000
PLATFORM_NAME="GPU Resource Provisioning & Rental Platform"
```

### 5. Apply Database Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Create Admin Superuser
```bash
python manage.py createsuperuser
```

---

## ⚡ Running the Server

Start the local development server:
```bash
python manage.py runserver
```

The server runs locally on `port 8000`.

---

## 🧪 Running Tests

Execute the full automated test suite (covering all 8 apps):
```bash
python manage.py test
```

To run tests for an individual app:
```bash
python manage.py test users
python manage.py test wallets
python manage.py test gpus
python manage.py test sessions
python manage.py test notifications
python manage.py test reviews
python manage.py test dashboard
python manage.py test admin_panel
```

---

## 📖 API Documentation & Admin Access

When the server is running, the interactive OpenAPI documentation and admin panels are available at the following paths:

- **Swagger UI**: `/api/schema/swagger-ui/`
- **Redoc UI**: `/api/schema/redoc/`
- **OpenAPI Schema (JSON)**: `/api/schema/`
- **Django Admin Interface**: `/admin/`

---

## 🔑 Endpoints Overview

### Authentication & Users (`/api/auth/`)
- `POST /api/auth/register/` — Register a new renter/host account
- `POST /api/auth/login/` — Authenticate and receive JWT tokens
- `POST /api/auth/logout/` — Invalidate JWT session
- `POST /api/auth/refresh/` — Refresh access token
- `GET /api/auth/me/` — Retrieve authenticated user profile
- `POST /api/auth/forgot-password/` & `POST /api/auth/reset-password/` — Password recovery workflow
- `POST /api/auth/host/api-key/` — Generate host daemon API key

### GPUs (`/api/gpus/`)
- `GET /api/gpus/` — Browse & search available GPUs (filter by VRAM, price, rating)
- `POST /api/gpus/register/` — Register host GPU hardware
- `GET /api/gpus/<id>/` — View GPU specs & pricing
- `POST /api/gpus/heartbeat/` — Host hardware status heartbeat

### Wallets & Billing (`/api/wallets/`)
- `GET /api/wallets/balance/` — Retrieve wallet balance and hold amounts
- `POST /api/wallets/deposit/` — Deposit funds (Stripe checkout session)
- `POST /api/wallets/withdraw/` — Request payout/withdrawal
- `GET /api/wallets/transactions/` — User transaction history

### Sessions (`/api/sessions/`)
- `POST /api/sessions/create/` — Request GPU rental session & hold funds
- `GET /api/sessions/<id>/status/` — Check session connectivity & status
- `POST /api/sessions/<id>/stop/` — Terminate session & finalize billing
- `GET /api/host/pending/` & `POST /api/host/status-update/` — Host session allocation & telemetry

### Reviews (`/api/reviews/`)
- `POST /api/reviews/` — Submit review for a completed session
- `GET /api/reviews/` — List reviews (filter by host, GPU, rating)
- `GET /api/reviews/host/<id>/summary/` — Aggregated ratings summary for a host
- `POST /api/reviews/<id>/respond/` — Host response to a review

### Dashboard & Analytics (`/api/dashboard/`)
- `GET /api/dashboard/summary/` — Role-aware dashboard summary (renter / host / admin)
- `GET /api/dashboard/renter/` — Renter spending, active rentals, history
- `GET /api/dashboard/host/` — Host earnings, uptime, reliability, GPU inventory
- `GET /api/dashboard/analytics/` — Platform usage analytics (admin)
- `GET /api/dashboard/revenue/` — Platform commission & host payout breakdowns (admin)
- `GET, POST /api/dashboard/widgets/` — Customizable user widgets

### Admin Panel (`/api/admin/`)
- `GET /api/admin/dashboard/` — System-wide operations dashboard
- `GET, PATCH, DELETE /api/admin/users/<id>/` — Manage & deactivate users
- `GET, PATCH /api/admin/hosts/<id>/` — Manage host status & penalties
- `GET, DELETE /api/admin/sessions/<id>/` — Inspect & cancel rental sessions
- `POST /api/admin/transactions/<id>/refund/` — Process transaction refunds with wallet credits
- `PATCH /api/admin/reviews/<id>/moderate/` — Verify, unverify, or remove reviews
- `GET, POST /api/admin/settings/` — Manage system settings
- `GET, DELETE /api/admin/logs/` — System audit logs & log clearing

---

## 🌐 Production & Free Tier Deployment

The server is pre-configured with `Procfile`, `build.sh`, `render.yaml`, `gunicorn`, and `whitenoise`.

### Free Tier Deployment on Render / Railway:
1. **Database**: Create a free PostgreSQL instance on **Supabase** or **Neon.tech** and copy the connection URI.
2. **Web Service**: Connect your GitHub repository to **Render** or **Railway**.
3. **Build Command**: `./build.sh`
4. **Start Command**: `gunicorn config.wsgi:application`
5. **Environment Variables**:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `SECRET_KEY`: Random production secret string
   - `DEBUG`: `False`
   - `ALLOWED_HOSTS`: `*` (or your production domain)
   - `CORS_ALLOWED_ORIGINS`: Your frontend URL(s)
   - `PLATFORM_NAME`: `GPU Resource Provisioning & Rental Platform`
