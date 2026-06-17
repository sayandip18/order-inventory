import { client } from "@/lib/api";

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedProducts {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ProductFormData {
  name: string;
  sku: string;
  price: number;
  quantity: number;
}

export async function fetchProducts(
  page: number,
  pageSize: number,
  search?: string,
): Promise<PaginatedProducts> {
  const params: Record<string, string | number> = { page, page_size: pageSize };
  if (search) params.search = search;
  const { data } = await client.get<PaginatedProducts>("/products/", {
    params,
  });
  return data;
}

export async function createProduct(
  payload: ProductFormData,
): Promise<Product> {
  const { data } = await client.post<Product>("/products/", payload);
  return data;
}

export async function updateProduct(
  id: string,
  payload: Partial<ProductFormData>,
): Promise<Product> {
  const { data } = await client.put<Product>(`/products/${id}`, payload);
  return data;
}

export async function deleteProduct(id: string): Promise<void> {
  await client.delete(`/products/${id}`);
}
