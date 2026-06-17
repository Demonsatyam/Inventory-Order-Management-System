# Inventory & Order Management System

A full-stack web application to manage **products, customers, orders and inventory**. It provides a clean dashboard to track stock levels, register customers, place orders with automatic stock deduction and total calculation, and get alerted when products run low on stock.

Built with a **FastAPI** backend, a **React (Vite)** frontend, a **PostgreSQL** database, and fully containerized with **Docker Compose**.

---

## 🔗 Live Demo

| Service        | Link |
|----------------|------|
| **Web App (Frontend)** | _add deployed link here_ |
| **API (Backend)**      | _add deployed link here_ |
| **API Docs (Swagger)** | _add deployed link here_ `/docs` |

> Replace the placeholders above with your deployed URLs (e.g. Vercel/Netlify for the frontend, Render/Railway for the backend).

---

## ✨ Features

- **Dashboard** — summary cards (total products, customers, orders, low-stock count), recent orders, and a **low-stock alert** panel.
- **Products** — create, edit, delete, and list products with SKU, price and stock. Validates price > 0, stock ≥ 0, and unique SKU.
- **Customers** — register and manage customers with name, email and phone (email is validated and unique).
- **Orders** — build an order from multiple products with per-line quantities. The backend automatically:
  - validates the customer and products,
  - checks available inventory,
  - calculates the order total from product prices,
  - reduces stock, all inside a single atomic transaction.
- **Low-stock alerts** — products below the stock threshold are flagged on the dashboard and products page.
- **Responsive UI** — SaaS-style sidebar + top navbar, toasts, empty states, loading spinners, and a mobile-friendly layout.

---

## 🧱 Tech Stack

| Layer       | Technology |
|-------------|-----------|
| Frontend    | React 18, Vite, React Router 6 |
| Backend     | FastAPI, SQLAlchemy 2, Pydantic v2, Uvicorn |
| Database    | PostgreSQL 16 |
| Web server  | Nginx (serves the production frontend build) |
| Container   | Docker & Docker Compose |

---

## 🏗️ Architecture

```
┌──────────────┐      HTTP       ┌──────────────┐      SQL       ┌──────────────┐
│   Frontend   │  ───────────▶   │   Backend    │  ───────────▶  │  PostgreSQL  │
│ React + Vite │   (REST API)    │   FastAPI    │  (SQLAlchemy)  │   Database   │
│   (Nginx)    │  ◀───────────   │              │  ◀───────────  │              │
└──────────────┘                 └──────────────┘                └──────────────┘
```

The three services run as separate containers, orchestrated by `docker-compose.yml`. The backend waits for the database to be healthy before starting; the frontend talks to the backend over the REST API.

---

## 📁 Project Structure

```
Inventory-Order-Management-System/
├── docker-compose.yml         # Orchestrates database + backend + frontend
├── Backend/                   # FastAPI application
│   ├── app/
│   │   ├── main.py            # App entry, CORS, routers, table creation
│   │   ├── database.py        # Engine, session, Base, get_db dependency
│   │   ├── models/            # SQLAlchemy ORM models
│   │   ├── schemas/           # Pydantic request/response models
│   │   ├── routers/           # API endpoints
│   │   └── services/          # Order business logic
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── seed_data.sh           # Script to load sample/dummy data
│   └── .env.example
└── Frontend/                  # React (Vite) application
    ├── src/                   # Pages, components, API client, styles
    ├── package.json
    ├── Dockerfile / nginx.conf
    └── .env.example
```

---

## ✅ Prerequisites

To run the project with Docker (recommended), you only need:

- [Docker](https://docs.docker.com/get-docker/) (with Docker Compose v2)

To run it manually (without Docker) you'll need:

- Python 3.12+
- Node.js 20+
- PostgreSQL 16+

---

## 🚀 Installation & Setup (Docker — recommended)

This is the easiest way to run the entire stack (database + backend + frontend) with a single command.

**1. Clone the repository**

```bash
git clone https://github.com/Demonsatyam/Inventory-Order-Management-System.git
cd Inventory-Order-Management-System
```

**2. Build and start all services**

```bash
docker compose up --build -d
```

This starts three containers:

| Service   | Container       | Port |
|-----------|-----------------|------|
| PostgreSQL| `ioms_postgres` | 5432 |
| Backend   | `ioms_backend`  | 8000 |
| Frontend  | `ioms_frontend` | 3000 |

The database tables are created automatically on first start.

**3. (Optional) Load sample data**

```bash
bash Backend/seed_data.sh
```

This seeds the database with example products (with prices in ₹), customers, orders, and some low-stock items to demonstrate the alerts.

**4. Open the app**

Once the containers are running, open the deployed/web link (see **Live Demo** above) in your browser.

---

## 🛠️ Common Commands

```bash
docker compose up -d           # Start (after the first build)
docker compose up --build -d   # Rebuild after code changes
docker compose ps              # Show running services
docker compose logs -f         # Tail logs for all services
docker compose logs -f backend # Tail logs for one service
docker compose down            # Stop (database data is kept)
docker compose down -v         # Stop and DELETE the database volume
```

To inspect the database:

```bash
docker compose exec postgres psql -U postgres -d inventory_db
# then:  \dt   (list tables)   \q  (quit)
```

---

## 🧑‍💻 Running Manually (without Docker)

### Backend

```bash
cd Backend
python -m venv .venv
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env            # set DATABASE_URL for your local PostgreSQL
uvicorn app.main:app --reload
```

### Frontend

```bash
cd Frontend
npm install
cp .env.example .env            # set VITE_API_URL to your backend URL
npm run dev
```

---

## ⚙️ Configuration

The app is configured entirely through environment variables — nothing is hardcoded.

**Backend** (`Backend/.env`)

| Variable       | Description |
|----------------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (SQLAlchemy `postgresql+psycopg2://` format) |
| `PORT`         | Port the API server listens on (default `8000`) |

**Frontend** (`Frontend/.env`)

| Variable       | Description |
|----------------|-------------|
| `VITE_API_URL` | Base URL of the backend API (baked in at build time) |

> When deploying, set these in your hosting platform's environment settings and set `VITE_API_URL` to your **deployed backend URL**.

---

## 📚 API Reference

| Method | Path                                   | Description |
|--------|----------------------------------------|-------------|
| GET    | `/dashboard`                           | Summary counts (products, customers, orders, low stock) |
| GET    | `/products`                            | List products |
| POST   | `/products`                            | Create product |
| GET    | `/products/{id}`                       | Get one product |
| PUT    | `/products/{id}`                       | Update product |
| DELETE | `/products/{id}`                       | Delete product |
| GET    | `/customers`                           | List customers |
| POST   | `/customers`                           | Create customer |
| GET    | `/customers/{id}`                      | Get one customer |
| DELETE | `/customers/{id}`                      | Delete customer |
| GET    | `/orders`                              | List orders |
| POST   | `/orders`                              | Create order (calculates total, reduces stock) |
| GET    | `/orders/{id}`                         | Get full order detail |
| DELETE | `/orders/{id}?restore_inventory=true`  | Delete/cancel order |

Interactive API documentation (Swagger UI) is available at the `/docs` path of the backend (see **Live Demo**).

---

## 📦 Business Rules

- SKU and customer email are **unique** (`409 Conflict` on duplicates).
- Price must be > 0, stock must be ≥ 0 (validated in Pydantic and via DB constraints).
- Orders cannot exceed available inventory (`400 Bad Request`).
- Stock is reduced automatically on order creation and restored on deletion.
- Order totals are computed by the backend — the client never sends the total.
- Order creation runs in a single, all-or-nothing transaction.

---

## 📄 License

This project is provided for educational/demonstration purposes.
