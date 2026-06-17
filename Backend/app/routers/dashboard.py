"""Dashboard summary endpoint."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Customer, Order, Product
from app.schemas.dashboard import DashboardOut

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

LOW_STOCK_THRESHOLD = 10


@router.get("", response_model=DashboardOut)
def get_dashboard(db: Session = Depends(get_db)):
    return DashboardOut(
        total_products=db.query(Product).count(),
        total_customers=db.query(Customer).count(),
        total_orders=db.query(Order).count(),
        low_stock_products=db.query(Product)
        .filter(Product.stock_quantity < LOW_STOCK_THRESHOLD)
        .count(),
    )
