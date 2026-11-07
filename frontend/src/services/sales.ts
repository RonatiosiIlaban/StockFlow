import { api, type ApiResponse } from "../config";
import type { Meta } from "../components/tabel";

export type SalesOrderStatus = 'CREATED' | 'CANCELLED';

export type SalesOrderItem = {
  id: number;
  sku: string;
  qty: number;
  unit_price: number;
  subtotal: number;
};

export type SalesOrder = {
  id: number;
  customer: string;
  status: SalesOrderStatus;
  total: number;
  created_at: string;
  cancelled_at?: string | null;
  items: SalesOrderItem[];
};

export type SalesOrderFilter = {
  search?: string;
  status?: SalesOrderStatus;
  sort?: 'created_at' | '-created_at' | 'total' | '-total';
  page?: number;
  limit?: number;
};

export type CreateSalesOrderPayload = {
  customer: string;
  items: { sku: string; qty: number; unit_price: number }[];
};

export const getSalesOrders = async (filter: SalesOrderFilter): Promise<ApiResponse<SalesOrder[], Meta>> => {
  const response = await api.get<ApiResponse<SalesOrder[], Meta>>('/sales-orders', { params: filter });
  return response.data;
}

export const getSalesOrderById = async (id: number | string): Promise<ApiResponse<SalesOrder>> => {
  const response = await api.get<ApiResponse<SalesOrder>>(`/sales-orders/${id}`);
  return response.data;
}

export const createSalesOrder = async (payload: CreateSalesOrderPayload, idempotencyKey: string): Promise<ApiResponse<SalesOrder>> => {
  const response = await api.post<ApiResponse<SalesOrder>>('/sales-orders', payload, {
    headers: { 'Idempotency-Key': idempotencyKey },
  });
  return response.data;
}

export const cancelSalesOrder = async (id: number): Promise<ApiResponse<string>> => {
  const response = await api.post<ApiResponse<string>>(`/sales-orders/${id}/cancel`);
  return response.data;
}
