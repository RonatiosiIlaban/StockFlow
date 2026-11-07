import { api, type ApiResponse } from "../config";

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
  is_active?: boolean;
  page?: number;
  limit?: number;
};

export type ProductDetailResponse = {
    message?: string,
    code?: string,
    data: Product,
}


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

export const createProduct = async (product: ProductPayload): Promise<ApiResponse<string>> => {
  const response = await api.post<ApiResponse<string>>('/products', product);
  return response.data;
}

export const getProductById = async (id: string): Promise<ProductDetailResponse> => {
  const response = await api.get<ProductDetailResponse>(`/products/${id}`);
  return response.data;
}


export type ProductPayload = {
  sku: string;
  name: string;
  price: number;
  stock: number;
  is_active: boolean;
};

export const updateProduct = async (id: number, product: ProductPayload): Promise<ApiResponse<string>> => {
  const response = await api.put<ApiResponse<string>>(`/products/${id}`, product);
  return response.data;
}

export const deleteProduct = async (id: number): Promise<void> => {
  await api.delete(`/products/${id}`);
}

export type StockMovementType = 'in' | 'out';

export type StockMovementPayload = {
  type: StockMovementType;
  qty: number;
  note?: string;
};

export const createStockMovement = async (productId: number, payload: StockMovementPayload): Promise<ApiResponse<string>> => {
  const response = await api.post<ApiResponse<string>>(`/products/${productId}/stock-movements`, payload);
  return response.data;
}

export type StockMovement = {
  id: number;
  type: StockMovementType;
  qty: number;
  note: string;
  created_at: string;
};

type StockMovementRaw = {
  ID: number;
  ProductId: number;
  Type: StockMovementType;
  Qty: number;
  Note: string;
  CreatedAt: string;
};

export const getStockMovementsByProductId = async (productId: number | string): Promise<StockMovement[]> => {
  const response = await api.get<ApiResponse<StockMovementRaw[] | null>>(`/products/${productId}/stock-movements`);
  return (response.data.data ?? []).map((m) => ({
    id: m.ID,
    type: m.Type,
    qty: m.Qty,
    note: m.Note,
    created_at: m.CreatedAt,
  }));
}
