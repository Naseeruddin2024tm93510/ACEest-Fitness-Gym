# ACEest Fitness & Gym — Unified DevOps & Orchestration Platform

**Version:** 2.5.0 (Assignment 2) | **Last Updated:** April 2026 | **Classification:** Unified Platform Documentation

---

## 🚀 ASSIGNMENT 2 UPGRADES (NEW)
The platform has been enhanced from basic containerization (Assignment 1) to a production-grade DevOps ecosystem:
- **Primary CI/CD:** Multi-branch Jenkins Pipeline with 7 automated stages.
- **Quality Gate:** Automated SonarQube static code analysis with A-Rating.
- **Orchestration:** Managed Kubernetes (Minikube) cluster with 3-replica self-healing.
- **Release Strategy:** Implementation of Rolling Update, Blue-Green, and Canary deployments.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [User Roles & Access Control](#4-user-roles--access-control)
5. [Application User Flows](#5-application-user-flows)
6. [Database Schema](#6-database-schema)
7. [API Reference](#7-api-reference)
8. [Advanced CI/CD Pipeline (Assignment 2 Upgrade)](#8-advanced-cicd-pipeline-assignment-2-upgrade)
9. [Kubernetes Orchestration & Strategies](#9-kubernetes-orchestration--strategies)
10. [Security Considerations](#10-security-considerations)
11. [Testing Strategy](#11-testing-strategy)
12. [Operational Runbook](#12-operational-runbook)

---

## 1. Executive Summary

**ACEest Fitness & Gym** is a full-stack, containerized corporate gym management platform designed to digitize and streamline all operations of a professional fitness center. It manages three distinct stakeholder roles - **Administrators**, **Trainers**, and **Clients** - through a unified, role-based access control (RBAC) system.

The platform covers the complete lifecycle of gym membership: client onboarding and approval, trainer assignment, personalized workout and nutrition planning, client progress tracking, membership lifecycle management, and internal communication. It is deployed as a production-grade, cloud-hosted application on AWS EC2 with a fully automated CI/CD pipeline managed by Jenkins and GitHub Actions.

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                        Internet                          │
└────────────────────────────┬─────────────────────────────┘
                             │
             ┌───────────────▼───────────────┐
             │    AWS EC2 Instance           │
             │   (16.16.56.150)              │
             │                               │
             │  ┌─────────────────────────┐  │
             │  │  aceest-frontend        │  │ Port 3000
             │  │   (Nginx + React)       │  ◄─ User Browser
             │  └────────────┬────────────┘  │
             │               │ /api/*        │
             │               │ proxy_pass    │
             │  ┌────────────▼────────────┐  │
             │  │  aceest-backend         │  │ Port 5000
             │  │   (Flask REST API)      │  │
             │  └────────────┬────────────┘  │
             │               │               │
             │  ┌────────────▼────────────┐  │
             │  │  SQLite Database        │  │
             │  │  (Docker Volume)        │  │
             │  │  /data/fitness.db       │  │
             │  └─────────────────────────┘  │
             │                               │
             └───────────────────────────────┘
```

### 2.2 Container Architecture

The application is composed of **two decoupled Docker containers** orchestrated by Docker Compose:

| Container | Image | Port | Purpose |
|---|---|---|---|
| `aceest-frontend` | Multi-stage (Node 22 + Nginx Alpine) | `3000:80` | Serves React SPA, proxies API calls |
| `aceest-backend` | Python 3.10-slim | `5000:5000` | Flask REST API, SQLite database |

Both containers communicate over an isolated Docker bridge network (`aceest-network`). Database files are stored in a named Docker volume (`db-data`) mounted to `/data` inside the backend container, ensuring **data persists across container rebuilds**.

### 2.3 Request Flow

```
Client Browser
    │
    │ GET /            Nginx serves React index.html (SPA routing)
    │ GET /static/*    Nginx serves bundled CSS/JS/assets
    │ ANY /api/*       Nginx proxies to aceest-backend:5000
                              │
                              │ Flask routes request to appropriate Blueprint
                                       │
                                       ├─ auth_routes.py
                                       ├─ client_routes.py
                                       ├─ trainer_routes.py
                                       └─ admin_routes.py
```

---

## 3. Technology Stack

### Backend
| Component | Technology | Version |
|---|---|---|
| Runtime | Python | 3.10 |
| Web Framework | Flask | 2.3.2 |
| WSGI Server | Flask dev server | - |
| Database | SQLite | 3.x |
| CORS | Flask-CORS | 4.0.0 |
| Testing | pytest + pytest-cov | 7.4.0 / 4.1.0 |
| Linting | flake8 + autopep8 | 7.3.0 / 2.3.1 |

### Frontend
| Component | Technology | Version |
|---|---|---|
| UI Library | React | 19.x |
| Build Tool | Vite | 8.x |
| Routing | React Router DOM | 7.x |
| Styling | Vanilla CSS (custom) | - |
| HTTP Client | Fetch API | Native |

### Infrastructure (Assignment 1 + 2)
| Component | Technology | Detailed Role |
|---|---|---|
| **Containerization** | Docker + Docker Compose | Service packaging & developer orchestration |
| **Orchestration** | Minikube / Kubernetes | Production-grade cluster management & self-healing |
| **CI Server** | Jenkins (Declarative) | Multi-branch pipeline automation |
| **Reverse Proxy** | Nginx (Alpine) | Edge routing & API proxying |
| **Cloud Provider** | AWS EC2 (Elastic IP) | Underlying host infrastructure (Amazon Linux 2023) |
| **Static Analysis** | SonarQube | Automated code quality assurance & Quality Gate |
| **Registry** | Docker Hub | Centralized versioned container image storage |

---

## 4. User Roles & Access Control

The platform implements strict Role-Based Access Control (RBAC) with three roles stored in the `users` table.

### Role Matrix

| Feature | Admin | Trainer | Client |
|---|:---:|:---:|:---:|
| View all clients | ✓ | ✓ (own only) | ✗ |
| Edit client profile | ✓ | ✓ | ✓ (own only) |
| Admin edit client profile | ✓ | ✓ | ✓ |
| Edit trainer profile | ✓ | ✓ (own only) | ✗ |
| Assign trainer to client | ✓ | ✗ | ✗ |
| Approve/Reject registrations | ✓ | ✗ | ✗ |
| Approve trainer change requests | ✓ | ✗ | ✗ |
| Approve plan change requests | ✓ | ✗ | ✗ |
| Initiate trainer transfer | ✗ | ✓ | ✗ |
| Add workout plan | ✓ | ✓ | ✗ |
| Edit/Delete workout plan | ✓ | ✓ (delete + re-add) | ✗ |
| Add diet plan | ✓ | ✓ | ✗ |
| Edit/Delete diet plan | ✓ | ✓ (delete + re-add) | ✗ |
| Log client progress | ✓ | ✓ | ✓ (own only) |
| View progress | ✓ | ✓ | ✓ (own only) |
| Send feedback | ✓ | ✓ | ✓ |
| Reactivate expired membership | ✓ | ✗ | ✗ |
| View trainer details | ✓ | ✓ | ✓ |

### Membership Status Rules

Client membership is governed by the `status` field and `membership_expiry` date:

```
status = 'pending'     Newly registered, awaiting admin approval
status = 'active'      Approved, membership valid (expiry date in future)
status = 'inactive'    Membership expired (auto-detected by backend)

Rules:
- Trainers CANNOT modify workout/diet plans for 'inactive' clients
- Admin can reactivate by updating the membership_expiry date
- Any API call attempted on an inactive client returns HTTP 403
```

---

## 5. Application User Flows

### 5.1 Client Registration & Onboarding Flow

```
1. CLIENT visits Landing Page
        │
2. Clicks "Register" → Fills form:
   (Name, Age, Email, Phone, Height, Weight, Goal, Plan Type, Username, Password)
        │
3. POST /api/auth/register → Client created with status='pending'
        │
4. ADMIN logs in → Dashboard shows pending registrations
        │
5. ADMIN clicks "Approve" → Selects trainer, sets membership_expiry
   POST /api/admin/assign-trainer
        │
6. Client status → 'active', trainer_id assigned
        │
7. CLIENT logs in → Dashboard shows assigned trainer, empty workout/diet plans
```

### 5.2 Trainer Registration Flow

```
1. TRAINER visits Trainer Register page
        │
2. Fills form:
   (Name, Age, Phone, Experience, Certifications, Username, Password)
        │
3. POST /api/auth/register-trainer → Trainer created
        │
4. TRAINER logs in immediately (no approval required)
        │
5. Dashboard shows greeting + client list
```

### 5.3 Workout & Diet Planning Flow

```
TRAINER logs in
        │
Navigates to Client Management
        │
Clicks on a client → Client Detail View
        │
Active Client?
   ├─ YES → Can add/delete workout plans and diet plans
   │          POST /api/trainers/{tid}/workout-plan
   │          POST /api/trainers/{tid}/diet-plan
   │
   └─ NO (inactive) → 403 Forbidden
                        "Client membership has expired"
        │
CLIENT logs in → Dashboard shows current workout + diet plans (read-only)
ADMIN also sees all plans (full edit access)
```

### 5.4 Client Progress Tracking Flow

```
TRAINER logs in
        │
Opens Client Detail → "Log Progress" section
        │
Enters: Weight, Waist, Body Fat %, Notes
POST /api/trainers/{tid}/log-progress
        │
Progress saved to 'progress' table
        │
ADMIN and CLIENT can both view progress history
```

### 5.5 Trainer Transfer Request Flow

```
CLIENT raises a transfer request from dashboard
POST /api/clients/{cid}/trainer-change
   (reason provided)
        │
ADMIN sees request in dashboard
        │
ADMIN approves → selects new trainer, updates client record
GET /api/admin/trainer-change-requests
POST /api/admin/approve-trainer-change/{id}
        │
Client now assigned to new trainer
```

### 5.6 Plan Upgrade/Change Flow

```
CLIENT clicks "Request Plan Change" in dashboard
        │
Views all available plan details:
- General
- With Trainer
- Advanced Trainer
- Competition
        │
Selects new plan, submits
POST /api/clients/{cid}/plan-change
        │
ADMIN sees request in dashboard
        │
ADMIN approves/rejects
POST /api/admin/approve-plan/{id}
        │
If approved → client.plan_type updated
```

---

## 6. Database Schema

The platform uses **SQLite** with 9 relational tables. The database file is stored at `/data/fitness.db` inside the Docker volume.

### Entity Relationship Overview

```
users (1) ── (1) trainers
users (1) ── (1) clients

trainers (1) ── (N) clients          [trainer_id FK]
clients  (1) ── (N) workout_plans
clients  (1) ── (N) diet_plans
clients  (1) ── (N) progress
clients  (1) ── (N) feedback
clients  (1) ── (N) trainer_change_requests
clients  (1) ── (N) plan_change_requests
```

### Table Reference

#### `users`
| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PK, AUTOINCREMENT |
| username | TEXT | UNIQUE, NOT NULL |
| password | TEXT | NOT NULL |
| role | TEXT | CHECK: Admin/Trainer/Client |
| created_at | TEXT | DEFAULT datetime('now') |

#### `trainers`
| Column | Type | Description |
|---|---|---|
| id | INTEGER | PK |
| user_id | INTEGER | FK ── users.id |
| name | TEXT | Full name |
| age | INTEGER | Age |
| phone | TEXT | Contact number |
| specialization | TEXT | Area of expertise |
| experience_years | INTEGER | Years of experience |
| certifications | TEXT | Qualifications |

#### `clients`
| Column | Type | Description |
|---|---|---|
| id | INTEGER | PK |
| user_id | INTEGER | FK ── users.id |
| name | TEXT | Full name |
| age, phone, email | Various | Contact details |
| height, weight | REAL | Physical stats |
| goal | TEXT | Fitness objective |
| plan_type | TEXT | General / With Trainer / Advanced / Competition |
| trainer_id | INTEGER | FK ── trainers.id |
| membership_expiry | TEXT | ISO date string |
| status | TEXT | pending / active / inactive |

---

## 7. API Reference

**Base URL:** `http://<host>:5000/api`

### Authentication

#### `POST /api/auth/register`
Register a new client.
```json
Request: { "username", "password", "name", "age", "phone", "email", "height", "weight", "goal", "plan_type" }
Response 201: { "message": "Client registered", "client_id": 1 }
```

#### `POST /api/auth/login`
Authenticate any user role.
```json
Request: { "username", "password" }
Response 200: { "role": "Client", "client_id": 1, "name": "Jane" }
```

---

## 8. Advanced CI/CD Pipeline (Assignment 2 Upgrade)

### 8.1 Multi-Environment Isolation
The system supports distinct environments to avoid resource collisions:

| Environment | Branch | Port Mapping | Kubernetes Namespace |
|---|---|---|---|
| **Production** | `main` | 3000 (FE) / 5000 (BE) | `production` |
| **Staging** | `staging` | 3001 (FE) / 5001 (BE) | `staging` |
| **Development** | `develop` | Localhost only | `default` |

### 8.2 Jenkins Pipeline Workflow
Our `Jenkinsfile` implements a 7-stage declarative pipeline:

1. **Initialize:** Dynamic port and namespace assignment based on the current branch.
2. **Checkout:** Pulls source code from GitHub via webhook.
3. **Build & Test:** Executes the full suite of **47 Pytest automated test cases**.
4. **SonarQube Analysis:** Integrated static analysis to enforce code quality standards.
5. **Docker Build & Push:** Packages images and securely pushes to **Docker Hub** with build tags (e.g., `main-15`).
6. **Docker Compose Deploy:** Continuous deployment to the host container engine.
7. **Kubernetes Deploy:** Orchestration using `kubectl` to trigger a **Rolling Update**.

---

## 9. Kubernetes Orchestration & Strategies

### 9.1 Self-Healing Cluster (Minikube)
The system is managed by Kubernetes with a **3-replica desired state**. If a pod fails, K8s automatically spawns a replacement.

### 9.2 Deployment Methodologies
We have implemented and verified five advanced deployment strategies (in `k8s/strategies/`):

*   **Rolling Update (Default):** Zero-downtime sequential updates.
*   **Blue-Green Deployment:** Instant transfer of traffic between environment versions.
*   **Canary Release:** Incremental rollout starting with 10% traffic.
*   **Shadow Deployment:** Production traffic mirroring for risk-free validation.
*   **A/B Testing:** Header-based custom routing for feature testing.

### 9.3 Rollback Mechanism
Every deployment is versioned. If a failure occurs:
- **Auto-Rollback:** Jenkins triggers `kubectl rollout undo` on build failure.
- **Manual Rollback:** `kubectl rollout undo deployment/aceest-fitness-backend -n production`.

---

## 10. Security Considerations
- Role-Based Access Control (RBAC) enforced at API level.
- Database isolation via Docker Volumes.
- Private branch protection on GitHub.

---

## 11. Testing Strategy

### 11.1 Unit Test Coverage
The project maintains **47 automated unit tests** using `pytest`.

| File | Tests | Coverage Area |
|---|---|---|
| `test_auth.py` | 11 | Login, Registration, Roles |
| `test_admin_api.py` | 13 | Approval flows, Assignments |
| `test_client_api.py` | 9 | Profile, Progress, Requests |
| `test_trainer_api.py` | 14 | Planning, Feedback, Metrics |

---

## 12. Operational Runbook

### Accessing Dashboards
- **Jenkins:** `http://<IP>:8080`
- **SonarQube:** `http://<IP>:9000`
- **K8s Dashboard:** `http://<IP>:8001` (via proxy)

### Deployment Verification
```bash
docker ps
kubectl get pods -n production
kubectl describe deploy -n production | grep Image
```

---
*This document covers the complete end-to-end implementation for BOTH Assignment 1 and Assignment 2. All legacy API and Database details are preserved.*
