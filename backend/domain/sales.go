package domain

import (
	"backend/domain/dto"
	"context"
	"errors"
	"time"
)

var (
	ErrIdempotencyKeyMismatch     = errors.New("Idempotency-Key sudah dipakai untuk request yang berbeda")
	ErrProductNotFound            = errors.New("produk tidak ditemukan atau tidak aktif")
	ErrInsufficientStock          = errors.New("stok tidak cukup")
	ErrSalesOrderAlreadyCancelled = errors.New("sales order sudah dibatalkan")
	ErrSalesOrderNotFound         = errors.New("sales order tidak ditemukan")
)

type SalesOrders struct {
	ID             uint              `gorm:"primaryKey"`
	Customer       string            `gorm:"type:text;not null"`
	Status         string            `gorm:"type:text;not null;default:'CREATED';check:status IN ('CREATED','CANCELLED')"`
	Total          int               `gorm:"not null;default:0"`
	CreatedAt      time.Time         `gorm:"type:timestamptz;autoCreateTime"`
	CancelledAt    *time.Time        `gorm:"type:timestamptz"`
	Items          []SalesOrderItems `gorm:"foreignKey:OrderId;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
	IdempotencyKey *IdempotencyKeys  `gorm:"foreignKey:OrderId;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
}

type SalesOrderItems struct {
	ID        uint   `gorm:"primaryKey"`
	OrderId   uint   `gorm:"not null;index"`
	Sku       string `gorm:"type:text;not null;index"`
	Qty       int    `gorm:"not null;check:qty > 0"`
	UnitPrice int    `gorm:"not null"`
}

type IdempotencyKeys struct {
	Key       string    `gorm:"type:text;primaryKey"`
	OrderId   uint      `gorm:"not null;uniqueIndex"`
	CreatedAt time.Time `gorm:"type:timestamptz;autoCreateTime"`
}

type SalesOrdersRepository interface {
	CreateSalesOrderWithIdempotency(ctx context.Context, order *SalesOrders, key string) (replayed bool, err error)
	CancelSalesOrder(ctx context.Context, id string) error
	FindAll(ctx context.Context, filter dto.SalesOrderFilter) ([]SalesOrders, dto.Pagination, error)
}

type SalesServices interface {
	CreateSalesOrderWithIdempotency(ctx context.Context, req dto.CreateSalesOrderRequest, key string) (dto.SalesOrderData, bool, error)
	CancelSalesOrder(ctx context.Context, id string) error
	GetSalesOrders(ctx context.Context, filter dto.SalesOrderFilter) ([]dto.SalesOrderData, dto.Pagination, error)
}
