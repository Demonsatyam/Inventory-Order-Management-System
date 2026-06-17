"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.models import Customer, Order, OrderItem, Product  # noqa: F401  (register tables)
from app.routers import customers, dashboard, orders, products

# Create tables on startup. For a real project you'd use Alembic migrations,
# but this keeps the assignment self-contained.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory & Order Management System",
    description="REST API for managing products, customers, orders and inventory.",
    version="1.0.0",
)

# Allow the React frontend to call the API. Tighten allow_origins for production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(dashboard.router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "service": "Inventory & Order Management System"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
