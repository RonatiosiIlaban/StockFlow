package domain

import (
	"context"
	"time"
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
	FindAll(ctx context.Context) ([]SalesOrders, error)
	FindById(ctx context.Context, id string) (SalesOrders, error)
	Save(ctx context.Context, c *SalesOrders) error
	Update(ctx context.Context, c *SalesOrders) error
	Delete(ctx context.Context, c *SalesOrders) error
}

type SalesOrderItemsRepository interface {
	FindAll(ctx context.Context) ([]SalesOrderItems, error)
	FindById(ctx context.Context, id string) (SalesOrderItems, error)
	Save(ctx context.Context, c *SalesOrderItems) error
	Update(ctx context.Context, c *SalesOrderItems) error
	Delete(ctx context.Context, c *SalesOrderItems) error
}

type IdempotencyKeysRepository interface {
	FindAll(ctx context.Context) ([]IdempotencyKeys, error)
	FindById(ctx context.Context, key string) (IdempotencyKeys, error)
	Save(ctx context.Context, c *IdempotencyKeys) error
	Update(ctx context.Context, c *IdempotencyKeys) error
	Delete(ctx context.Context, c *IdempotencyKeys) error
}
