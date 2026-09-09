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



![Host Dashboard](./assets/screenshots/host-dashboard.png)

*Host dashboard showing the registered GPU node and its current status/telemetry.*

### Started GPU Session

<img width="1892" height="1044" alt="Screenshot 2026-09-06 212745" src="https://github.com/user-attachments/assets/afa20d7a-9d89-4df0-aabf-8d3c8b0b28da" />


![Started GPU Session](./assets/screenshots/started-session.png)

*Started rental session demonstrating the implemented session provisioning workflow.*

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

# 📁 Project Structure

```text
GPU-Renting-System/
│
├── backend/
│   └── ...
│
├── frontend/
│   └── ...
│
├── host-agent/
│   └── ...
│
├── docker/
│   └── ...
│
├── assets/
│   ├── screenshots/
│   │   ├── host-dashboard.png
│   │   └── started-session.png
│   │
│   ├── architecture/
│   │   └── system-architecture.png
│   │
│   └── demos/
│       └── gpu-session-demo.gif
│
└── README.md
```

---

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
