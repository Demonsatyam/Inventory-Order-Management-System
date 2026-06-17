"""Business logic for creating and deleting orders.

The order creation flow follows the documented steps:
  1. Validate customer exists
  2. Validate products exist
  3. Check inventory
  4. Calculate total amount
  5. Reduce inventory
  6. Save order
  7. Save order items
  8. Commit transaction
"""
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Customer, Order, OrderItem, Product
from app.schemas.order import OrderCreate


def create_order(db: Session, payload: OrderCreate) -> Order:
    # Step 1: validate customer exists
    customer = db.get(Customer, payload.customer_id)
    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer {payload.customer_id} not found",
        )

    # Merge duplicate product lines so inventory checks use the true total.
    requested: dict[int, int] = {}
    for item in payload.items:
        requested[item.product_id] = requested.get(item.product_id, 0) + item.quantity

    # Step 2: validate products exist + Step 3: check inventory
    products: dict[int, Product] = {}
    for product_id, quantity in requested.items():
        product = db.get(Product, product_id)
        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {product_id} not found",
            )
        if quantity > product.stock_quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Insufficient inventory for product '{product.name}' "
                    f"(SKU {product.sku}): available {product.stock_quantity}, "
                    f"requested {quantity}"
                ),
            )
        products[product_id] = product

    # Step 4: calculate total amount + Step 5: reduce inventory
    total_amount = Decimal("0")
    order = Order(customer_id=customer.id, total_amount=Decimal("0"))
    db.add(order)

    for product_id, quantity in requested.items():
        product = products[product_id]
        unit_price = Decimal(str(product.price))
        subtotal = unit_price * quantity
        total_amount += subtotal

        # Step 5: reduce inventory
        product.stock_quantity -= quantity

        # Step 7: prepare order items
        order.items.append(
            OrderItem(
                product_id=product.id,
                quantity=quantity,
                unit_price=unit_price,
                subtotal=subtotal,
            )
        )

    # Step 6: save order total
    order.total_amount = total_amount

    # Step 8: commit transaction (atomic — rolls back on any error)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(order)
    return order


def delete_order(db: Session, order_id: int, restore_inventory: bool = True) -> None:
    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {order_id} not found",
        )

    # Optional: restore inventory when deleting/cancelling an order.
    if restore_inventory:
        for item in order.items:
            product = db.get(Product, item.product_id)
            if product is not None:
                product.stock_quantity += item.quantity

    db.delete(order)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
