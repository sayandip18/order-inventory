import { client } from "@/lib/api";
import type { Customer } from "@/lib/customers";
import type { Product } from "@/lib/products";

export interface OrderItemDetail {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product: Product;
}

export interface OrderSummary {
  id: string;
  customer_id: string;
  total_amount: number;
  cancelled: boolean;
  created_at: string;
  updated_at: string;
  customer: Customer;
}

export interface OrderDetail extends OrderSummary {
  items: OrderItemDetail[];
}

export interface PaginatedOrders {
  items: OrderSummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface OrderCreatePayload {
  customer_id: string;
  items: { product_id: string; quantity: number }[];
}

export async function fetchOrders(
  page: number,
  pageSize: number,
  includeCancelled: boolean,
): Promise<PaginatedOrders> {
  const params: Record<string, string | number | boolean> = {
    page,
    page_size: pageSize,
    include_cancelled: includeCancelled,
  };
  const { data } = await client.get<PaginatedOrders>("/orders/", { params });
  return data;
}

export async function fetchOrder(id: string): Promise<OrderDetail> {
  const { data } = await client.get<OrderDetail>(`/orders/${id}`);
  return data;
}

export async function createOrder(
  payload: OrderCreatePayload,
): Promise<OrderDetail> {
  const { data } = await client.post<OrderDetail>("/orders/", payload);
  return data;
}

export async function cancelOrder(id: string): Promise<void> {
  await client.delete(`/orders/${id}`);
}
