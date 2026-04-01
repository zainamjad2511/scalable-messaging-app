# Scalable Real-Time Messaging Infrastructure

**Date:** 28/03/2026  
**Course:** Parallel and Distributed Computing (PDC)

---

## 👥 Introduction of Team

Our team consists of members with complementary technical skills:

- **Zain Amjad (Project Lead):** Backend specialist and systems architect with strong experience in building and deploying scalable APIs using Node.js and Express. Proficient in database management (Supabase/PostgreSQL), Python, and server-side operations within Ubuntu environments.
- **Ahmed Ibrahim:** Expertise in Machine Learning, Deep Learning, and data preprocessing using Python-based frameworks. Experienced in developing intelligent agents, automation bots, and backend systems using Node.js, REST APIs, and PostgreSQL. Proficient in data engineering, system design, and building scalable, high-performance applications.
- **Abdul Rafay:** Full-stack developer proficient in React, Next.js, Python, and UI/UX, specializing in building resilient and high-concurrency web architectures.

---

## 📖 Background

Traditional single-server web applications inevitably bottleneck when subjected to high-concurrency, real-time workloads such as instant messaging or live updates. This project addresses the problem of single points of failure and resource exhaustion by architecting a distributed backend capable of handling multiple concurrent WebSocket connections without dropping state or performance. This infrastructure will serve as the foundational architecture for future high-traffic, state-dependent applications.

---

## 🎯 Objectives

1. Design and deploy a stateless backend API capable of dynamically distributing incoming concurrent web traffic across multiple application nodes.
2. Implement a centralized in-memory datastore and message broker to guarantee strict data consistency and real-time state synchronization across all isolated server nodes.
3. Achieve system fault tolerance by ensuring the application remains fully available and functional even if an active backend node goes offline.

---

## 🚀 Plan of Action

To achieve these objectives, we will transition a basic monolithic chat application into a distributed system. We will utilize a modern web stack—a Next.js/React frontend with a Node.js backend—connected to a PostgreSQL database via Supabase. 

To distribute the workload, we will implement a Load Balancer (Nginx) to route incoming connections across multiple isolated Node.js server instances. To synchronize the isolated instances, we will integrate a Redis message broker (Pub/Sub) to handle real-time message broadcasting and cache state, guaranteeing consistency across the network.

---

## 🏗️ Scope

The end result of this project will be a fully functional, web-based messaging interface powered by a fault-tolerant, horizontally scalable distributed backend. The phases of work include:

- **Phase One:** Developing the baseline single-server application and establishing the database schema.
- **Phase Two:** Containerizing the backend, deploying multiple instances, and configuring the load balancer to distribute traffic.
- **Phase Three:** Integrating the message broker for cross-server synchronization, finalizing frontend connectivity, and conducting fault-tolerance testing.

---

## 📅 Timeframe (Tentative Plan)

*Note: All phases will be completed before the second last week of the semester.*


| Description of Work                                                                            | Start and End Dates     |
| ---------------------------------------------------------------------------------------------- | ----------------------- |
| **Phase One:** Baseline development (Frontend UI, basic Node.js API, Supabase DB connection)   | 29/03/2026 – 12/04/2026 |
| **Phase Two:** Horizontal scaling (Dockerizing nodes, Nginx Load Balancer setup)               | 13/04/2026 – 26/04/2026 |
| **Phase Three:** Synchronization and testing (Redis integration, chaos testing, documentation) | 27/04/2026 – 08/05/2026 |


---

## 📊 Monitoring and Evaluation

Progress will be evaluated continuously by load-testing the infrastructure at the end of each development phase. Clear indicators for results include:

- **Concurrency:** The system successfully handles a large number of simulated concurrent WebSocket connections distributed evenly across nodes.
- **Consistency:** A message sent to Node A is verified to be instantly delivered to a client connected to Node B.
- **Fault Tolerance:** The application maintains 100% uptime from the client's perspective during simulated, deliberate crashes of individual backend nodes.

---

## 🛠️ Statement of Contribution

- **Abdul Rafay:** Responsible for the Next.js/React UI, user authentication flow, and implementing Client-side message caching (Consistency) and WebSocket reconnection strategies (Fault Tolerance).
- **Ahmed Ibrahim:** Responsible for the Backend API, Docker containerization (Scalability), and the Nginx load balancer setup including Health check implementation (Fault Tolerance).
- **Zain Amjad:** Responsible for Redis Pub/Sub integration (Consistency), Supabase atomic operations (Concurrency), and overall Fault tolerance testing and monitoring.

---

## 📁 Repository Structure

This repo is organized to support a horizontally scalable messaging system while keeping “deployable apps” separate from “shared code” and “infrastructure config”.

```
.
├─ apps/
│  ├─ api/                 # Node.js/Express API + WebSocket server (scaled replicas)
│  └─ web/                 # Next.js/React frontend
├─ packages/
│  ├─ shared/              # Shared runtime utilities/constants
│  └─ types/               # Shared TypeScript types/events/DTOs
├─ infra/
│  ├─ nginx/               # Load balancer config (Nginx)
│  ├─ redis/               # Redis config/scripts (if needed)
│  ├─ supabase/            # DB schema/migrations/notes (project-specific)
│  └─ docker/              # Docker-related helper files (if needed)
├─ docs/
│  ├─ architecture/        # Diagrams + high-level design notes
│  └─ adr/                 # Architecture Decision Records
├─ scripts/                # Dev/test/load-test automation scripts
└─ docker-compose.yml      # Local infra (Redis + Nginx placeholder)
```

