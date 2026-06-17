import math
import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.customer import Customer
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.schemas.order import (
    OrderCreate,
    OrderResponse,
    PaginatedOrderResponse,
)

router = APIRouter(
    prefix="/orders",
    tags=["orders"],
    dependencies=[Depends(get_current_user)],
)


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    body: OrderCreate,
    db: AsyncSession = Depends(get_db),
) -> Order:
    customer = (
        await db.execute(select(Customer).where(Customer.id == body.customer_id))
    ).scalar_one_or_none()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found",
        )

    product_ids = [item.product_id for item in body.items]
    if len(product_ids) != len(set(product_ids)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate product entries in order",
        )

    # Lock product rows in consistent order to prevent deadlocks
    result = await db.execute(
        select(Product)
        .where(Product.id.in_(product_ids))
        .order_by(Product.id)
        .with_for_update()
    )
    products = {p.id: p for p in result.scalars().all()}

    missing = [str(pid) for pid in product_ids if pid not in products]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Products not found: {', '.join(missing)}",
        )

    quantity_map = {item.product_id: item.quantity for item in body.items}

    insufficient = []
    for pid, qty in quantity_map.items():
        product = products[pid]
        if product.quantity < qty:
            insufficient.append(
                f"{product.name} (requested {qty}, available {product.quantity})"
            )
    if insufficient:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Insufficient stock: {'; '.join(insufficient)}",
        )

    total_amount = Decimal(0)
    order_items: list[OrderItem] = []
    for pid, qty in quantity_map.items():
        product = products[pid]
        product.quantity -= qty
        unit_price = Decimal(str(product.price))
        total_amount += unit_price * qty
        order_items.append(
            OrderItem(product_id=pid, quantity=qty, unit_price=float(unit_price))
        )

    order = Order(
        customer_id=body.customer_id,
        total_amount=float(total_amount),
        items=order_items,
    )
    db.add(order)
    await db.commit()
    result = await db.execute(
        select(Order)
        .where(Order.id == order.id)
        .options(
            selectinload(Order.customer),
            selectinload(Order.items).selectinload(OrderItem.product),
        )
    )
    return result.scalar_one()


@router.get("/", response_model=PaginatedOrderResponse)
async def list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    include_cancelled: bool = Query(False),
    db: AsyncSession = Depends(get_db),
) -> dict:
    query = select(Order)
    count_query = select(func.count()).select_from(Order)

    if not include_cancelled:
        query = query.where(Order.cancelled.is_(False))
        count_query = count_query.where(Order.cancelled.is_(False))

    total = (await db.execute(count_query)).scalar_one()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    query = query.order_by(Order.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = list(result.scalars().unique().all())

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Order:
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().unique().one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    return order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().unique().one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    if order.cancelled:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Order is already cancelled",
        )

    # Lock product rows to safely restore stock
    product_ids = sorted(item.product_id for item in order.items)
    result = await db.execute(
        select(Product)
        .where(Product.id.in_(product_ids))
        .order_by(Product.id)
        .with_for_update()
    )
    products = {p.id: p for p in result.scalars().all()}

    for item in order.items:
        product = products.get(item.product_id)
        if product:
            product.quantity += item.quantity

    order.cancelled = True
    await db.commit()
