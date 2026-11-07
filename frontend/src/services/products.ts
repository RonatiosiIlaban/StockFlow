import { api } from "../config";

export type Product = {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  is_active: boolean;
  last_movement_at?: string | null;
};

export type ProductFilter = {
  search?: string;
  page?: number;
  limit?: number;
};

export type ProductListResponse = {
    message?: string,
    code?: string,
    data?: Product[],
    meta?: {
        page: number,
        limit: number,
        total: number,
        total_page: number,
    }
}

export const getProducts = async (filter: ProductFilter): Promise<ProductListResponse> => {
  const response = await api.get<ProductListResponse>('/products', { params: filter });
  return response.data;
}

export const createProduct = async (product: Omit<Product, 'id'>): Promise<Product> => {
  const response = await api.post<Product>('/products', product);
  return response.data;
}

export const getProductById = async (id: number): Promise<Product> => {
  const response = await api.get<Product>(`/products/${id}`);
  return response.data;
}

export const updateProduct = async (id: number, product: Omit<Product, 'id'>): Promise<Product> => {
  const response = await api.put<Product>(`/products/${id}`, product);
  return response.data;
}

export const deleteProduct = async (id: number): Promise<void> => {
  await api.delete(`/products/${id}`);
}

export const createStockMovement = async (productId: number, quantity: number): Promise<void> => {
  await api.post(`/products/${productId}/stock-movements`, { quantity });
}

export const getStockMovementsByProductId = async (productId: number): Promise<any[]> => {
  const response = await api.get<any[]>(`/products/${productId}/stock-movements`);
  return response.data;
}   


