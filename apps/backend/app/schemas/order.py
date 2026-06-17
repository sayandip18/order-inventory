import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.customer import CustomerResponse
from app.schemas.product import ProductResponse


class OrderItemRequest(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(gt=0)


class OrderCreate(BaseModel):
    customer_id: uuid.UUID
    items: list[OrderItemRequest] = Field(min_length=1)


class OrderItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    quantity: int
    unit_price: float
    product: ProductResponse

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: uuid.UUID
    customer_id: uuid.UUID
    total_amount: float
    cancelled: bool
    created_at: datetime
    updated_at: datetime
    customer: CustomerResponse
    items: list[OrderItemResponse]

    model_config = {"from_attributes": True}


class OrderSummaryResponse(BaseModel):
    id: uuid.UUID
    customer_id: uuid.UUID
    total_amount: float
    cancelled: bool
    created_at: datetime
    updated_at: datetime
    customer: CustomerResponse

    model_config = {"from_attributes": True}


class PaginatedOrderResponse(BaseModel):
    items: list[OrderSummaryResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
