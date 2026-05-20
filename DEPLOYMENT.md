# Textile ERP — Deployment Guide

## Quick Start (Local Development)

```bash
# 1. Clone and configure
cp .env.example .env
# Edit .env with your values (at minimum change DJANGO_SECRET_KEY)

# 2. Start all services
docker-compose up --build

# 3. Seed initial data (first run only)
docker-compose exec backend python manage.py seed_initial_data
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/v1/
- Swagger UI: http://localhost:8000/swagger/
- Django Admin: http://localhost:8000/admin/

Default admin credentials (from .env):
- Email: admin@textile.uz  |  Password: Admin1234!

---

## Production Deployment

### 1. Environment
```bash
cp .env.example .env
# Set production values:
#   DJANGO_DEBUG=False
#   DJANGO_SECRET_KEY=<64+ char random string>
#   POSTGRES_PASSWORD=<strong password>
#   REDIS_PASSWORD=<strong password>
#   DJANGO_SETTINGS_MODULE=config.settings.production
```

### 2. Build & launch
```bash
docker-compose -f docker-compose.prod.yml up --build -d
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py collectstatic --noinput
docker-compose exec backend python manage.py seed_initial_data
```

### 3. SSL (production only)
Place your SSL certificate at `nginx/certs/` and update `nginx/nginx.prod.conf`.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Nginx (port 80/443)               │
│        Routes: /api/ → backend, / → frontend        │
└──────────────┬───────────────────────┬──────────────┘
               │                       │
       ┌───────▼──────┐       ┌────────▼───────┐
       │   Django +   │       │    Next.js     │
       │   Daphne     │       │  (port 3000)   │
       │  (port 8000) │       └────────────────┘
       └──────┬───────┘
              │
    ┌─────────┼─────────┐
    │         │         │
 ┌──▼──┐  ┌──▼──┐  ┌───▼──┐
 │ PG  │  │Redis│  │Celery│
 └─────┘  └─────┘  └──────┘
```

---

## Module Summary

| Module               | Purpose                                        |
|----------------------|------------------------------------------------|
| `authentication`     | JWT login/logout/refresh                       |
| `users`              | RBAC user management + activity logs           |
| `warehouse`          | Stock ledger, movements, weighted-avg costing  |
| `cotton_production`  | Stage 1: Cotton → Fiber batch management       |
| `yarn_production`    | Stage 2: Fiber → Yarn batch management         |
| `costing_engine`     | Cost snapshots, trends, KPI aggregations       |
| `finance`            | General ledger, budget lines                   |
| `dashboard`          | Aggregated KPI endpoint for frontend           |
| `reporting`          | Excel/JSON report generators                   |
| `analytics`          | Machine efficiency, operator, cost comparisons |
| `notifications`      | WebSocket real-time push + DB notifications    |

---

## Key API Endpoints

```
POST   /api/v1/auth/login/
POST   /api/v1/auth/logout/
GET    /api/v1/dashboard/overview/
GET    /api/v1/warehouse/ledger/
POST   /api/v1/warehouse/warehouses/receive/
POST   /api/v1/warehouse/warehouses/transfer/
POST   /api/v1/cotton-production/batches/{id}/complete/
POST   /api/v1/yarn-production/batches/{id}/complete/
GET    /api/v1/costing/current-yarn-costs/
GET    /api/v1/costing/cost-trend/
GET    /api/v1/reports/yarn-cost/?format=excel
WS     ws://host/ws/notifications/?token=<JWT>
```

---

## Costing Formulas

**Fiber Cost (Stage 1)**
```
fiber_cost_per_kg = (cotton_cost + Σ expenses - byproduct_credits) / fiber_output_kg
```

**Yarn Cost (Stage 2)**
```
yarn_cost_per_kg = (fiber_cost_total + Σ spinning_expenses) / yarn_output_kg
```

Inventory valuation uses **Moving Weighted Average** — recalculated on every inbound movement.

---

## Database Migrations

```bash
# After editing any model
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate
```

---

## Celery Tasks

Currently async via Celery:
- Report generation (Excel, PDF)
- Cost snapshot recording after batch completion
- Notification delivery

Beat scheduler handles future recurring tasks (e.g. daily KPI digest).
