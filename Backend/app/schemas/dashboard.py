"""Pydantic schema for the dashboard summary."""
from pydantic import BaseModel


class DashboardOut(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_products: int
