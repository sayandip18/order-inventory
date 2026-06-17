import { client } from "@/lib/api";

export interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedCustomers {
  items: Customer[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CustomerFormData {
  full_name: string;
  email: string;
  phone: string;
}

export async function fetchCustomers(
  page: number,
  pageSize: number,
  search?: string,
): Promise<PaginatedCustomers> {
  const params: Record<string, string | number> = { page, page_size: pageSize };
  if (search) params.search = search;
  const { data } = await client.get<PaginatedCustomers>("/customers/", {
    params,
  });
  return data;
}

export async function createCustomer(
  payload: CustomerFormData,
): Promise<Customer> {
  const { data } = await client.post<Customer>("/customers/", payload);
  return data;
}

export async function deleteCustomer(id: string): Promise<void> {
  await client.delete(`/customers/${id}`);
}
