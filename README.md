# ACEest Fitness & Gym — Full-Stack DevOps Implementation

**Version:** 2.5.0 | **Author:** Naseeruddin | **Status:** Production Ready

---

## 📑 Project Structure: Assignment 1 vs Assignment 2

This project has evolved in two distinct phases as per the academic requirements:

### [Phase 1: Application & Containerization (Assignment 1)](#part-1-assignment-1)
- **Foundational Development:** Flask Backend + React Frontend.
- **Data Architecture:** SQLite persistence.
- **Containerization:** Dockerization of frontend and backend.
- **Basic Orchestration:** Docker Compose for local/cloud hosting.

### [Phase 2: Advanced CI/CD & Kubernetes (Assignment 2)](#part-2-assignment-2)
- **CI/CD Pipeline:** Multi-branch Jenkins Declarative Pipeline.
- **Testing:** 47 Pytest automated test cases.
- **Quality Gates:** SonarQube static code analysis.
- **Registry:** Docker Hub versioned image management.
- **Orchestration:** Kubernetes (Minikube) deployment.
- **Advanced Strategies:** Blue-Green, Canary, Shadow, A/B, and Rolling Updates.
- **Self-Healing:** Automated rollbacks and pod recovery.

---

## Part 1: Assignment 1 — Core Platform & Dockerization

### 1.1 Application Architecture
ACEest Fitness is built on a decoupled architecture:
- **Backend:** Flask REST API providing membership management, workout planning, and progress tracking.
- **Frontend:** React SPA providing a responsive dashboard for Admins, Trainers, and Clients.

### 1.2 Containerization
- **Backend Dockerfile:** Optimised Python 3.10-slim image.
- **Frontend Dockerfile:** Multi-stage build using Node 22 for compilation and Nginx-Alpine for serving.
- **Docker Compose:** Orchestrates the services and manages the `db-data` volume for persistence.

### 1.3 Baseline Deployment
Initial deployment was achieved on AWS EC2 using a "Recreate" strategy via Docker Compose on port 3000.

---

## Part 2: Assignment 2 — Advanced DevOps & K8s

### 2.1 Multi-Branch Jenkins Pipeline
The core of Part 2 is the `Jenkinsfile` which automates everything.
- **`develop` branch:** Continuous Integration (Build + Test + SonarQube).
- **`staging` & `main` branches:** Full CI/CD (Build + Test + SonarQube + Docker Push + K8s Deploy).

### 2.2 SonarQube Quality Integration
Integrated SonarQube to ensure code health. 
- **Metrics:** 0 Bugs, 0 Vulnerabilities, 0 Smells.
- **Outcome:** Quality Gate PASSED.

### 2.3 Kubernetes Orchestration (Minikube)
Transitioned from simple containers to a resilient cluster.
- **Resilience:** 3 replicas running in the `production` namespace.
- **Persistence:** K8s PersistentVolumeClaims (PVC) for data safety.
- **Self-Healing:** K8s automatically restarts pods if they crash.

### 2.4 Deployment Methodologies
Implemented in `k8s/strategies/`:
1.  **Rolling Update:** Zero-downtime sequential updates.
2.  **Blue-Green:** Instant traffic switching between two environments.
3.  **Canary:** Testing version 2.0 with 10% of users.
4.  **Shadow:** Mirroring live traffic to a test version.
5.  **A/B Testing:** Header-based feature validation.

### 2.5 Automated Rollback Mechanism
Built-in failure recovery logic:
```bash
# Handled automatically by Jenkins on failure or manually via:
kubectl rollout undo deployment/aceest-fitness-backend -n production
```

---

## 🛠️ Technology Stack Summary

| Requirement | Technology Used |
|---|---|
| **Version Control** | Git + GitHub |
| **Build Server** | Jenkins (Declarative) |
| **Test Framework** | Pytest (47 tests) |
| **Code Quality** | SonarQube |
| **Registry** | Docker Hub |
| **Orchestration** | Minikube / Kubernetes |
| **Deployment** | Docker Compose + K8s Manifests |

---

## 🚀 Access & Verification
- **Production URL:** `http://16.16.56.150:3000`
- **Jenkins Pipeline:** `http://16.16.56.150:8080`
- **SonarQube Dashboard:** `http://16.16.56.150:9000`
- **Docker Hub Images:** `naseeruddin786/aceest-backend`

*Note: For the technical details of Assignment 1 (Schema, API routes), please refer to the history of this README.*
