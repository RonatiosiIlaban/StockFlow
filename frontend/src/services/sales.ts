import { api } from "../config";

export type SaleOrder = {
  id: number;
  productId: number;
  quantity: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type SaleOrderFilter = {
  search?: string;
  page?: number;
  limit?: number;
};

export type SaleOrderListResponse = {
    message?: string,
    code?: string,
    data?: SaleOrder[],
    meta?: {
        page: number,
        limit: number,
        total: number,
    }
}

export const getSaleOrders = async (filter: SaleOrderFilter): Promise<SaleOrderListResponse> => {
  const response = await api.get<SaleOrderListResponse>('/sales-orders', { params: filter });
  return response.data;
}

export const createSaleOrder = async (saleOrder: Omit<SaleOrder, 'id'>): Promise<SaleOrder> => {
  const response = await api.post<SaleOrder>('/sales-orders', saleOrder);
  return response.data;
}

export const cancelSaleOrder = async (id: number): Promise<void> => {
  await api.post(`/sales-orders/${id}/cancel`);
}   