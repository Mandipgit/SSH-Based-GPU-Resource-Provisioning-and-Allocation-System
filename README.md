# ⚡ SSH-Based GPU Resource Provisioning and Allocation System

> A production-oriented platform for GPU resource allocation, automated provisioning, and secure SSH-based remote access.

## 📌 Project Status

**Development Paused — Core System Implemented**

The core platform has been implemented, including GPU node management, resource allocation, rental/session lifecycle management, telemetry, wallet and escrow billing, host management, Docker-based GPU provisioning, and the renter web dashboard.

Development is currently paused due to infrastructure and environment constraints around **production-grade relay/reverse-tunneling infrastructure and distributed deployment**.

The project is **paused rather than abandoned** and can be continued once the required infrastructure becomes available.

### ✅ Implemented

* 🔐 User authentication with JWT and role-based access
* 👤 Renter, Provider/Host, and Admin roles
* 🖥️ GPU node registration and discovery
* 📊 GPU specifications and telemetry
* ⚙️ GPU resource allocation
* 🔄 Rental/session lifecycle management
* 💰 Wallet, escrow, and usage-based billing
* 💳 Stripe wallet top-ups
* 🖥️ Host desktop agent
* 🟢 NVIDIA GPU detection using `nvidia-smi`
* 🐳 GPU-enabled Docker sandbox provisioning
* 🔑 SSH user and public-key provisioning
* 📦 Container CPU, memory, SHM, and process limits
* 🌐 Renter marketplace and dashboard
* 📖 Swagger/OpenAPI API documentation

### 🚧 Remaining / Blocked

* Production relay server
* Reliable SSH reverse tunneling across NAT
* Production-grade external routing
* Relay port allocation and cleanup
* Background workers for automated session expiry and cleanup
* In-browser SSH terminal
* Full distributed production deployment
* Extended multi-node GPU testing

### 🧪 Provisioning Evidence

The system successfully reached the GPU session provisioning stage, including resource allocation and creation of an isolated GPU-enabled Docker environment.

The following screenshots demonstrate the implemented system:

### Host Dashboard
<img width="1917" height="1076" alt="Screenshot 2026-09-04 233438" src="https://github.com/user-attachments/assets/76176220-e6f1-4a96-9a5a-a25250230625" />




*Host dashboard showing the registered GPU node and its current status/telemetry.*

### Started GPU Session

<img width="1892" height="1044" alt="Screenshot 2026-09-06 212745" src="https://github.com/user-attachments/assets/afa20d7a-9d89-4df0-aabf-8d3c8b0b28da" />



*Started rental session demonstrating the implemented session.*

> **Note:** The screenshots above are included as implementation evidence. The remaining production blocker was the reliable external connection through the relay/reverse-tunneling layer.

---

# 🎯 Problem Statement

Modern GPUs are expensive resources that are often underutilized.

At the same time, developers, researchers, and students frequently need temporary access to GPUs for machine learning, AI workloads, rendering, simulations, and other compute-intensive tasks.

This project aims to provide a platform that connects:

**GPU Providers → GPU Renters**

Providers can register their GPU machines and make their resources available, while renters can discover available GPUs, start rental sessions, and access isolated GPU environments remotely.

---

# 🏗️ System Architecture

```text
                         ┌──────────────────────┐
                         │      RENTER          │
                         │                      │
                         │  Web Dashboard       │
                         │  SSH Client          │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    Backend API       │
                         │                      │
                         │ Authentication       │
                         │ GPU Management       │
                         │ Allocation            │
                         │ Rental Management     │
                         │ Billing               │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┼────────────────┐
                    │               │                │
                    ▼               ▼                ▼
              PostgreSQL       GPU Manager      Wallet/Escrow
                    │
                    │
                    ▼
          ┌──────────────────────┐
          │     GPU HOST         │
          │                      │
          │ Host Desktop Agent   │
          │ NVIDIA GPU            │
          │ NVIDIA Driver         │
          │ Docker                │
          │ OpenSSH               │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │   GPU Sandbox        │
          │                      │
          │ NVIDIA CUDA          │
          │ Python / Dev Tools   │
          │ Renter SSH User      │
          └──────────────────────┘
```

---

# 🔄 Core Workflow

### 1. Provider Registers a GPU Node

A provider installs the host agent on their machine.

The host agent detects information such as:

* GPU model
* VRAM
* CUDA version
* NVIDIA driver version
* GPU utilization
* GPU temperature
* GPU power usage
* CPU and RAM information
* Network information

The node is then registered with the backend.

### 2. GPU Discovery

Renters can browse available GPU nodes through the marketplace.

They can view GPU specifications and other available resource information before starting a rental.

### 3. Resource Allocation

When a renter starts a rental:

```text
Renter Request
      ↓
GPU Availability Check
      ↓
Resource Allocation
      ↓
Rental Session Created
```

The system manages the rental through a defined session lifecycle:

```text
PENDING
   ↓
STARTING
   ↓
CONTAINER_RUNNING
   ↓
TUNNEL_CONNECTING
   ↓
ACTIVE
   ↓
STOPPING
   ↓
COMPLETED / FAILED
```

### 4. GPU Sandbox Provisioning

The host agent provisions an isolated Docker environment using NVIDIA GPU support.

The sandbox includes:

* NVIDIA CUDA runtime
* Python
* pip
* OpenSSH
* Basic developer tools
* Dedicated non-root renter user

GPU access is provided through NVIDIA Container Toolkit.

### 5. SSH Access

The renter's public SSH key is injected into the provisioned environment.

The intended workflow is:

```text
Renter
   │
   │ SSH
   ▼
Relay / Reverse Tunnel
   │
   ▼
Host Machine
   │
   ▼
GPU Docker Container
```

The production relay/reverse-tunneling layer remains the primary infrastructure blocker.

### 6. Rental Completion

When a session ends, the system tracks the rental lifecycle and calculates usage-based cost based on elapsed rental duration.

The wallet/escrow system handles:

* Balance
* Fund reservation
* Usage cost
* Host earnings
* Host penalties
* Refund/work protection logic

---

# 🔐 Security

Security was considered throughout the system design.

### Authentication

* JWT-based authentication
* Access and refresh tokens
* Role-based access control

### SSH Security

* SSH public-key authentication
* No renter passwords
* Dedicated renter users
* Dynamic public-key injection
* Credential cleanup during session lifecycle

### Container Isolation

GPU workloads run inside Docker containers with resource limits including:

* CPU
* Memory
* Shared memory
* Process count

Containers run with a non-root renter user.

---

# 🧩 Core Components

## 🔐 Authentication & Authorization

Supports:

* Renters
* Providers/Hosts
* Administrators

Provides JWT authentication and role-based authorization.

---

## 🖥️ GPU Node Management

The system maintains information about registered GPU nodes including:

* GPU model
* VRAM
* CUDA version
* Driver version
* Pricing
* Health/status
* Telemetry

---

## ⚙️ Resource Allocation Engine

Responsible for:

* GPU availability
* Resource allocation
* Rental creation
* Session state management

---

## 🐳 Provisioning Engine

Responsible for creating GPU-enabled Docker environments.

The system uses:

```text
NVIDIA GPU
     ↓
NVIDIA Driver
     ↓
NVIDIA Container Toolkit
     ↓
Docker
     ↓
CUDA Container
```

---

## 📊 Telemetry

The host agent periodically reports:

* GPU temperature
* GPU utilization
* VRAM usage
* GPU power
* CPU usage
* RAM usage

The host heartbeat runs every **30 seconds**.

---

## 💰 Wallet & Escrow Billing

The platform includes:

* Wallet balance
* Fund holding at session start
* Usage-based billing
* Host earnings
* Host penalties
* Refund/work protection
* Stripe wallet top-ups
* Transaction history

---

# 🗃️ Data Model

The core system manages entities including:

```text
User
 ├── Renter
 ├── Provider / Host
 └── Admin

GPUNode
 └── GPU

Rental / Session
 ├── Renter
 ├── GPUNode
 └── Billing

SSHCredential
 └── Rental / Session
```

---

# 🛠️ Tech Stack

### Backend

* Python
* Django REST Framework
* PostgreSQL
* JWT Authentication
* drf-spectacular / OpenAPI

### Frontend

* Next.js
* TypeScript
* Zustand
* Axios
* Sonner

### Host Agent

* Flutter
* `nvidia-smi`
* NVIDIA GPU monitoring
* Remote command polling

### GPU Infrastructure

* Docker
* NVIDIA Container Toolkit
* NVIDIA CUDA
* NVIDIA Drivers
* OpenSSH
* Linux

### Payments

* Stripe

### Development

* Git
* GitHub
* Swagger / OpenAPI

---

# 📁 Project Structure (High Level Architecture Overview)

```text
GPU Renting System/
├── server/               # Central Django REST Framework backend (APIs, DB, Auth, Billing)
├── client/               # Next.js 16 (React 19) Web Frontend for renters
├── host/                 # Host desktop agent (Flutter) & Docker GPU sandbox runtime
│   ├── docker/session/   # Ubuntu + CUDA Dockerfile & SSH configuration for GPU workloads
│   └── flutter_agent/    # Flutter desktop application (hardware telemetry, tunnel manager)
├── docker/               # Nginx reverse proxy configuration
└── docker-compose.yml    # Root multi-container orchestration (DB, backend, frontend, gateway)

---
---

# 📁 Project Structure (High Level Architecture Overview)

```text

f:\GPU Renting System\
│
├── 📁 server/                                 # --- BACKEND (Django REST Framework) ---
│   ├── 📁 admin_panel/                        # Admin dashboard APIs & metrics aggregation
│   │   ├── urls.py
│   │   └── views.py
│   ├── 📁 config/                             # Core Django settings, WSGI/ASGI, URLs
│   │   ├── settings.py                        # Database, JWT, Stripe, Relay port settings
│   │   ├── urls.py                            # Central routing table (/api/auth/, /api/gpus/, etc.)
│   │   └── wsgi.py
│   ├── 📁 dashboard/                          # Renter & host summary analytics
│   │   ├── urls.py
│   │   └── views.py
│   ├── 📁 gpus/                               # GPU registry & node specification management
│   │   ├── models.py                          # GPU model (VRAM, CUDA, price/hr, availability)
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── views.py                           # Marketplace search, filter, and registration
│   ├── 📁 notifications/                      # Session event & alert system
│   │   ├── models.py                          # In-app notifications
│   │   ├── services.py                        # Email/alert dispatcher
│   │   ├── urls.py
│   │   └── views.py
│   ├── 📁 reviews/                            # Renter rating & review system for GPU hosts
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── 📁 sessions/                           # Rental lifecycle, SSH keys & relay management
│   │   ├── 📁 services/
│   │   │   ├── billing.py                     # Escrow hold, duration cost calculation
│   │   │   └── relay.py                       # Port leasing (40000-50000) & SSH keypair generation
│   │   ├── host_urls.py                       # Host-facing agent routes (/api/host/sessions/pending/)
│   │   ├── host_views.py                      # Host session pickup & heartbeat ingestion
│   │   ├── models.py                          # Session, SessionMetric, RelayPort, HostEarning
│   │   ├── serializers.py
│   │   ├── urls.py                            # Renter routes (/sessions/, /sessions/<id>/stop/)
│   │   └── views.py                           # Session creation, state machine transitions
│   ├── 📁 users/                              # Custom User & Profile management
│   │   ├── models.py                          # CustomUser (Renter, Provider, Admin), HostProfile
│   │   ├── serializers.py
│   │   ├── urls.py                            # Auth endpoints (/login/, /register/, /refresh/)
│   │   └── views.py
│   ├── 📁 wallets/                            # Payment escrow, wallet balances & Stripe
│   │   ├── 📁 services/
│   │   │   └── stripe_service.py              # Stripe PaymentIntent & webhook processing
│   │   ├── models.py                          # Wallet, Transaction, PaymentLog
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── views.py                           # Top-up, deposit callback, balance checks
│   ├── .env.example                           # Sample backend environment variables
│   ├── Dockerfile                             # Python 3.12 slim container definition
│   ├── docker-entrypoint.sh                   # DB wait check, migrations, superuser seeding
│   ├── manage.py                              # Django CLI entrypoint
│   ├── requirements.txt                       # Python dependencies
│   └── render.yaml                            # Cloud deployment blueprint
│
├── 📁 client/                                 # --- FRONTEND (Next.js 16 + React 19) ---
│   ├── 📁 app/                                # Next.js App Router
│   │   ├── 📁 (auth)/login/                   # Sign-in page
│   │   ├── 📁 register/                       # Sign-up page with role selection
│   │   ├── 📁 marketplace/                    # Public GPU browse catalog
│   │   │   └── 📁 gpu/[id]/                   # Individual GPU spec & rental booking page
│   │   ├── 📁 (dashboard)/                    # Authenticated renter dashboard
│   │   │   ├── 📁 sessions/                   # Session history table & active rental cards
│   │   │   │   └── 📁 [id]/                   # Real-time session detail & SSH access view
│   │   │   ├── 📁 wallet/                     # Deposit modal & transaction history
│   │   │   ├── 📁 settings/                   # Security, notifications, compute preferences
│   │   │   └── 📁 profile/                    # User profile & credentials
│   │   ├── globals.css                        # Tailwind CSS design tokens & theme variables
│   │   ├── layout.tsx                         # Root layout with ThemeProvider & Toaster
│   │   └── page.tsx                           # Marketing landing page (Hero, features, pricing)
│   ├── 📁 components/                         # Modular UI component library
│   │   ├── 📁 ui/                             # Base primitives (Card, Button, Badge, Skeleton, Sonner)
│   │   ├── 📁 sessions/                       # ActiveSessionCard, StopSessionDialog, Badges
│   │   ├── 📁 marketplace/                    # GpuCard, MarketplaceFilters, GpuSpecifications
│   │   ├── 📁 wallet/                         # WalletBalanceCard, DepositDialog, TransactionList
│   │   ├── 📁 landing/                        # Hero, TechnicalSecurity, MarketplacePreview
│   │   └── 📁 layouts/                        # Header, Sidebar, Navigation
│   ├── 📁 services/                           # Client HTTP integration layer
│   │   ├── api.ts                             # Axios instance with auto-refresh JWT interceptor
│   │   ├── sessions.ts                        # Session CRUD API calls
│   │   ├── wallet.ts                          # Wallet & payment API calls
│   │   └── mockData.ts                        # Local fallback fixtures
│   ├── 📁 stores/                             # Zustand state stores (auth-store.ts)
│   ├── 📁 types/                              # TypeScript interfaces (gpu.ts, session.ts, wallet.ts)
│   ├── Dockerfile                             # Next.js standalone production build image
│   ├── package.json                           # Node.js dependencies & scripts
│   └── tsconfig.json                          # TypeScript compiler configuration
│
├── 📁 host/                                   # --- HOST RUNTIME & AGENT ---
│   ├── 📁 docker/session/                     # GPU Session Container Environment
│   │   ├── Dockerfile                         # Ubuntu 24.04 + CUDA 12.9.1 runtime image
│   │   ├── entrypoint.sh                      # SSH daemon startup & container initialization
│   │   └── sshd_config                        # Hardened SSH configuration (pubkey only)
│   └── 📁 flutter_agent/                      # Flutter Desktop Host Application
│       ├── 📁 lib/
│       │   ├── 📁 controllers/
│       │   │   └── session_controller.dart    # Manages container lifecycle, tunnels & heartbeats
│       │   ├── 📁 models/
│       │   │   ├── gpu_info.dart              # Local GPU specifications model
│       │   │   └── session.dart               # Active host session model
│       │   ├── 📁 services/
│       │   │   ├── api_service.dart           # Communicates with central Django backend
│       │   │   ├── docker_service.dart        # Spawns & quotas Docker container (--gpus all)
│       │   │   ├── gpu_service.dart           # Executes `nvidia-smi` to parse live telemetry
│       │   │   └── ssh_service.dart           # Initiates reverse SSH tunnel (`ssh -R`)
│       │   ├── 📁 ui/                         # Flutter screens & telemetry widgets
│       │   │   └── screens/home_screen.dart
│       │   └── main.dart                      # Flutter app bootstrap
│       └── pubspec.yaml                       # Flutter dependencies & desktop assets
│
├── 📁 docker/                                 # --- INFRASTRUCTURE CONFIG ---
│   ├── nginx.conf                             # Standard production Nginx reverse proxy
│   └── nginx-host.conf                        # Host-mode Nginx routing ports (frontend, API, static)
│
├── .gitignore                                 # Git ignore patterns
├── docker-compose.yml                         # Multi-service stack (db, backend, frontend, gateway)
├── README.md                                  # Architectural specification & product documentation
└── SSH-Based GPU Resource Provisioning API.yaml # OpenAPI / Swagger specification


# 🚧 Future Development

The following components are planned for continuation:

* Production relay server
* Reliable SSH reverse tunneling
* NAT traversal
* Automated background workers
* Session timeout and cleanup
* Dead-host detection
* Automatic refund handling
* Relay port lifecycle management
* In-browser terminal using WebSockets
* Distributed GPU node deployment
* Multi-host production testing
* Production deployment

---

# 📌 Current State

The project demonstrates the implementation of the **core GPU rental platform**, including backend services, renter interface, host management, GPU detection, Docker-based GPU provisioning, session lifecycle management, telemetry, and billing.

The project is currently **paused due to infrastructure constraints surrounding the production relay and reverse-tunneling layer**.

This repository is being preserved as a record of the implemented system and will serve as the foundation for continuing development when the required infrastructure becomes available.

---

# 👨‍💻 Author

**Mandeep Pokharel**

BSc CSIT Student | Software Developer | Aviation & ML Enthusiast

---

# ⭐ Project Note

This project was developed as a practical exploration of:

* GPU resource sharing
* Cloud infrastructure
* Linux networking
* Docker GPU isolation
* SSH-based remote access
* Resource allocation
* Usage-based billing
* Distributed systems

The project is **paused, not abandoned**.
