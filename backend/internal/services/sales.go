package services

import (
	"backend/domain"
	"backend/domain/dto"
	"context"
)

type salesServices struct {
	salesOrdersRepository domain.SalesOrdersRepository
}

func NewSales(salesOrdersRepository domain.SalesOrdersRepository) domain.SalesServices {
	return &salesServices{
		salesOrdersRepository: salesOrdersRepository,
	}
}

func sameRequest(req dto.CreateSalesOrderRequest, o domain.SalesOrders) bool {
	if req.Customer != o.Customer {
		return false
	}
	type line struct{ qty, price int }
	a, b := map[string]line{}, map[string]line{}
	for _, it := range req.Items {
		l := a[it.Sku]
		a[it.Sku] = line{l.qty + it.Qty, it.UnitPrice}
	}
	for _, it := range o.Items {
		l := b[it.Sku]
		b[it.Sku] = line{l.qty + it.Qty, it.UnitPrice}
	}
	if len(a) != len(b) {
		return false
	}
	for sku, l := range a {
		if b[sku] != l {
			return false
		}
	}
	return true
}

func toSalesOrderData(o domain.SalesOrders) dto.SalesOrderData {
	items := make([]dto.SalesOrderItemData, 0, len(o.Items))
	for _, it := range o.Items {
		items = append(items, dto.SalesOrderItemData{
			ID:        it.ID,
			Sku:       it.Sku,
			Qty:       it.Qty,
			UnitPrice: it.UnitPrice,
			Subtotal:  it.Qty * it.UnitPrice,
		})
	}
	return dto.SalesOrderData{
		ID:          o.ID,
		Customer:    o.Customer,
		Status:      o.Status,
		Total:       o.Total,
		CreatedAt:   o.CreatedAt,
		CancelledAt: o.CancelledAt,
		Items:       items,
	}
}

func (s *salesServices) CreateSalesOrderWithIdempotency(ctx context.Context, req dto.CreateSalesOrderRequest, idempotencyKey string) (dto.SalesOrderData, bool, error) {
	order := domain.SalesOrders{
		Customer: req.Customer,
		Status:   "CREATED",
		Items:    make([]domain.SalesOrderItems, 0, len(req.Items)),
	}
	for _, item := range req.Items {
		order.Items = append(order.Items, domain.SalesOrderItems{
			Sku:       item.Sku,
			Qty:       item.Qty,
			UnitPrice: item.UnitPrice,
		})
		order.Total += item.Qty * item.UnitPrice
	}

	replayed, err := s.salesOrdersRepository.CreateSalesOrderWithIdempotency(ctx, &order, idempotencyKey)
	if err != nil {
		return dto.SalesOrderData{}, false, err
	}

	if replayed && !sameRequest(req, order) {
		return dto.SalesOrderData{}, false, domain.ErrIdempotencyKeyMismatch
	}

	return toSalesOrderData(order), replayed, nil
}

func (s *salesServices) CancelSalesOrder(ctx context.Context, id string) error {
	return s.salesOrdersRepository.CancelSalesOrder(ctx, id)
}

func (s *salesServices) GetSalesOrders(ctx context.Context, filter dto.SalesOrderFilter) ([]dto.SalesOrderData, dto.Pagination, error) {
	orders, meta, err := s.salesOrdersRepository.FindAll(ctx, filter)
	if err != nil {
		return nil, dto.Pagination{}, err
	}

	result := make([]dto.SalesOrderData, 0, len(orders))
	for _, o := range orders {
		result = append(result, toSalesOrderData(o))
	}
	return result, meta, nil
}

func (s *salesServices) GetSalesOrderById(ctx context.Context, id string) (dto.SalesOrderData, error) {
	order, err := s.salesOrdersRepository.FindById(ctx, id)
	if err != nil {
		return dto.SalesOrderData{}, err
	}
	return toSalesOrderData(order), nil
}
