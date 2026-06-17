# Inventory & Order Management System — Backend

FastAPI + SQLAlchemy + PostgreSQL backend.

## Project structure

```
Backend/
├── app/
│   ├── main.py            # FastAPI app, CORS, router registration, table creation
│   ├── database.py        # engine, session, Base, get_db dependency
│   ├── models/            # SQLAlchemy ORM models
│   │   ├── product.py
│   │   ├── customer.py
│   │   └── order.py       # Order + OrderItem
│   ├── schemas/           # Pydantic request/response models
│   │   ├── product.py
│   │   ├── customer.py
│   │   ├── order.py
│   │   └── dashboard.py
│   ├── routers/           # API endpoints
│   │   ├── products.py
│   │   ├── customers.py
│   │   ├── orders.py
│   │   └── dashboard.py
│   └── services/
│       └── order_service.py   # order creation/deletion business logic
├── requirements.txt
├── Dockerfile
├── .env.example
└── .env
```

## Configuration

`DATABASE_URL` is read from the environment (never hardcoded).

| Environment              | Value |
|--------------------------|-------|
| Local with Docker Compose| `postgresql+psycopg2://postgres:Baymax%408600@postgres:5432/inventory_db` |
| Local without Docker     | `postgresql+psycopg2://postgres:Baymax%408600@localhost:5432/inventory_db` |
| Deployed                 | the connection string from Render / Railway / Supabase / Neon |

> `%40` is the URL-encoded `@` in the password `Baymax@8600`.

## Run with Docker Compose (recommended)

From the **project root** (where `docker-compose.yml` lives):

```bash
docker compose up --build
```

- API:        http://localhost:8000
- Swagger UI:  http://localhost:8000/docs
- Postgres:    localhost:5432

## Run locally without Docker

```bash
cd Backend
python -m venv .venv
. .venv/Scripts/activate        # Windows (PowerShell: .venv\Scripts\Activate.ps1)
pip install -r requirements.txt
cp .env.example .env            # then set the localhost DATABASE_URL
uvicorn app.main:app --reload
```

## API endpoints

| Method | Path               | Description                       |
|--------|--------------------|-----------------------------------|
| POST   | `/products`        | Create product                    |
| GET    | `/products`        | List products                     |
| GET    | `/products/{id}`   | Get one product                   |
| PUT    | `/products/{id}`   | Update product                    |
| DELETE | `/products/{id}`   | Delete product                    |
| POST   | `/customers`       | Create customer                   |
| GET    | `/customers`       | List customers                    |
| GET    | `/customers/{id}`  | Get one customer                  |
| DELETE | `/customers/{id}`  | Delete customer                   |
| POST   | `/orders`          | Create order (calculates total, reduces stock) |
| GET    | `/orders`          | List orders                       |
| GET    | `/orders/{id}`     | Get full order detail             |
| DELETE | `/orders/{id}?restore_inventory=true` | Delete/cancel order |
| GET    | `/dashboard`       | Summary counts                    |

## Business rules enforced

- SKU and customer email are unique (`409 Conflict` on duplicates).
- Price > 0, stock ≥ 0 (validated in Pydantic + DB check constraints).
- Orders cannot exceed available inventory (`400 Bad Request`).
- Stock is reduced automatically on order creation and restored on deletion.
- Order totals are computed by the backend — the client never sends `total_amount`.
- Order creation runs in a single transaction (all-or-nothing).

## HTTP status codes

`200` OK · `201` Created · `204` No Content (deletes) · `400` business-rule
violation · `404` not found · `409` duplicate SKU/email · `422` validation
error · `500` server error.
