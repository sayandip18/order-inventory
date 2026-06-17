import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.auth import router as auth_router
from app.routers.customers import router as customers_router
from app.routers.orders import router as orders_router
from app.routers.products import router as products_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(customers_router)
app.include_router(orders_router)
app.include_router(products_router)


@app.get("/")
async def read_root():
    return {"message": "Hello from FastAPI"}
