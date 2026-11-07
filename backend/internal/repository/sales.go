package repository

import (
	"backend/domain"
	"backend/domain/dto"
	"context"
	"fmt"
	"sort"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type salesRepository struct {
	db *gorm.DB
}

func NewSales(db *gorm.DB) domain.SalesOrdersRepository {
	return &salesRepository{db: db}
}

func (r *salesRepository) FindAll(ctx context.Context, f dto.SalesOrderFilter) ([]domain.SalesOrders, dto.Pagination, error) {
	if f.Page < 1 {
		f.Page = 1
	}
	if f.Limit < 1 {
		f.Limit = 10
	}
	if f.Limit > 100 {
		f.Limit = 100
	}

	q := r.db.WithContext(ctx).Model(&domain.SalesOrders{})
	if f.Search != "" {
		q = q.Where("customer ILIKE ?", "%"+f.Search+"%")
	}
	if f.Status != "" {
		q = q.Where("status = ?", f.Status)
	}

	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, dto.Pagination{}, err
	}

	sortMap := map[string]string{
		"created_at": "created_at ASC", "-created_at": "created_at DESC",
		"total": "total ASC", "-total": "total DESC",
	}
	order, ok := sortMap[f.Sort]
	if !ok {
		order = "created_at DESC"
	}

	var orders []domain.SalesOrders
	if err := q.Preload("Items").
		Order(order).Order("id DESC").
		Limit(f.Limit).
		Offset((f.Page - 1) * f.Limit).
		Find(&orders).Error; err != nil {
		return nil, dto.Pagination{}, err
	}

	meta := dto.Pagination{
		Page:      f.Page,
		Limit:     f.Limit,
		Total:     total,
		TotalPage: int((total + int64(f.Limit) - 1) / int64(f.Limit)),
	}
	return orders, meta, nil
}

func (r *salesRepository) FindById(ctx context.Context, id string) (domain.SalesOrders, error) {
	var order domain.SalesOrders
	res := r.db.WithContext(ctx).Preload("Items").Where("id = ?", id).Limit(1).Find(&order)
	if res.Error != nil {
		return domain.SalesOrders{}, res.Error
	}
	if res.RowsAffected == 0 {
		return domain.SalesOrders{}, domain.ErrSalesOrderNotFound
	}
	return order, nil
}

func (r *salesRepository) CreateSalesOrderWithIdempotency(ctx context.Context, order *domain.SalesOrders, idempotencyKey string) (bool, error) {
	replayed := false

	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 1. Lock per key: request lain dengan key yang sama menunggu di sini
		if err := tx.Exec("SELECT pg_advisory_xact_lock(hashtextextended(?, 0))", idempotencyKey).Error; err != nil {
			return err
		}

		// 2. Key sudah ada -> muat order lama (replay)
		var existing domain.IdempotencyKeys
		res := tx.Where("key = ?", idempotencyKey).Limit(1).Find(&existing)
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected > 0 {
			var prev domain.SalesOrders
			if err := tx.Preload("Items").First(&prev, existing.OrderId).Error; err != nil {
				return err
			}
			*order = prev
			replayed = true
			return nil
		}

		// 3. Cek & lock produk SEBELUM insert order (ini yang memperbaiki error FK)
		qtyBySku := map[string]int{}
		for _, it := range order.Items {
			qtyBySku[it.Sku] += it.Qty
		}
		skus := make([]string, 0, len(qtyBySku))
		for sku := range qtyBySku {
			skus = append(skus, sku)
		}
		sort.Strings(skus) // urutan lock konsisten -> cegah deadlock

		products := make([]domain.Products, 0, len(skus))
		for _, sku := range skus {
			var p domain.Products
			res := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
				Where("sku = ? AND is_active = ?", sku, true).
				Limit(1).Find(&p)
			if res.Error != nil {
				return res.Error
			}
			if res.RowsAffected == 0 {
				return fmt.Errorf("%w: %s", domain.ErrProductNotFound, sku)
			}
			if p.Stock < qtyBySku[sku] {
				return fmt.Errorf("%w: %s (tersedia %d, diminta %d)", domain.ErrInsufficientStock, sku, p.Stock, qtyBySku[sku])
			}
			products = append(products, p)
		}

		// 4. Insert order + items
		if err := tx.Create(order).Error; err != nil {
			return err
		}

		// 5. Kurangi stok + catat stock movement
		now := time.Now()
		for _, p := range products {
			qty := qtyBySku[p.Sku]
			if err := tx.Model(&p).Updates(map[string]any{
				"stock":            gorm.Expr("stock - ?", qty),
				"last_movement_at": now,
			}).Error; err != nil {
				return err
			}
			if err := tx.Create(&domain.StockMovements{
				ProductId: p.ID,
				Type:      "out",
				Qty:       qty,
				Note:      fmt.Sprintf("sales order #%d", order.ID),
			}).Error; err != nil {
				return err
			}
		}

		// 6. Simpan key
		return tx.Create(&domain.IdempotencyKeys{
			Key:     idempotencyKey,
			OrderId: order.ID,
		}).Error
	})

	return replayed, err
}

func (r *salesRepository) CancelSalesOrder(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var order domain.SalesOrders
		res := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("id = ?", id).Limit(1).Find(&order)
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return domain.ErrSalesOrderNotFound
		}
		if order.Status == "CANCELLED" {
			return domain.ErrSalesOrderAlreadyCancelled
		}

		var items []domain.SalesOrderItems
		if err := tx.Where("order_id = ?", order.ID).Find(&items).Error; err != nil {
			return err
		}

		qtyBySku := map[string]int{}
		for _, it := range items {
			qtyBySku[it.Sku] += it.Qty
		}
		skus := make([]string, 0, len(qtyBySku))
		for sku := range qtyBySku {
			skus = append(skus, sku)
		}
		sort.Strings(skus)

		now := time.Now()
		for _, sku := range skus {
			var p domain.Products
			res := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
				Where("sku = ?", sku).Limit(1).Find(&p)
			if res.Error != nil {
				return res.Error
			}
			if res.RowsAffected == 0 {
				return fmt.Errorf("%w: %s", domain.ErrProductNotFound, sku)
			}

			qty := qtyBySku[sku]
			if err := tx.Model(&p).Updates(map[string]any{
				"stock":            gorm.Expr("stock + ?", qty),
				"last_movement_at": now,
			}).Error; err != nil {
				return err
			}
			if err := tx.Create(&domain.StockMovements{
				ProductId: p.ID,
				Type:      "in",
				Qty:       qty,
				Note:      fmt.Sprintf("cancel sales order #%d", order.ID),
			}).Error; err != nil {
				return err
			}
		}

		return tx.Model(&order).Updates(map[string]any{
			"status":       "CANCELLED",
			"cancelled_at": now,
		}).Error
	})
}
