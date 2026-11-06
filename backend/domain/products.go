package domain

import (
	"backend/domain/dto"
	"context"
	"time"
)

type Products struct {
	ID              uint              `gorm:"primaryKey"`
	Sku             string            `gorm:"type:text;uniqueIndex;not null"`
	Name            string            `gorm:"type:text;not null"`
	Price           int               `gorm:"not null;default:0;check:price >= 0"`
	Stock           int               `gorm:"not null;default:0;check:stock >= 0"`
	IsActive        bool              `gorm:"not null;default:true"`
	CreatedAt       time.Time         `gorm:"type:timestamptz;autoCreateTime"`
	LastMovementAt  *time.Time        `gorm:"type:timestamptz"`
	StockMovements  []StockMovements  `gorm:"foreignKey:ProductId;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT"`
	SalesOrderItems []SalesOrderItems `gorm:"foreignKey:Sku;references:Sku;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT"`
}

type StockMovements struct {
	ID        uint      `gorm:"primaryKey"`
	ProductId uint      `gorm:"not null;index"`
	Type      string    `gorm:"type:text;not null;check:type IN ('in','out')"`
	Qty       int       `gorm:"not null;check:qty > 0"`
	Note      string    `gorm:"type:text"`
	CreatedAt time.Time `gorm:"type:timestamptz;autoCreateTime"`
}

type ProductsRepository interface {
	FindAll(ctx context.Context, filter dto.ProductFilter) ([]Products, dto.Pagination, error)
	FindById(ctx context.Context, id uint) (Products, error)
	Save(ctx context.Context, c *Products) error
	Update(ctx context.Context, c *Products) error
	Delete(ctx context.Context, c *Products) error
	FindBySku(ctx context.Context, sku string) (Products, error)
}

type StockMovementsRepository interface {
	FindAll(ctx context.Context) ([]StockMovements, error)
	FindById(ctx context.Context, id string) (StockMovements, error)
	Save(ctx context.Context, c *StockMovements) error
	Update(ctx context.Context, c *StockMovements) error
	Delete(ctx context.Context, c *StockMovements) error
}

type ProductServices interface {
	GetProducts(ctx context.Context, filter dto.ProductFilter) ([]dto.ProductsData, dto.Pagination, error)
	CreateProduct(ctx context.Context, req dto.CreateProductRequest) error
	GetProductById(ctx context.Context, id uint) (dto.ProductsData, error)
	FindBySku(ctx context.Context, sku string) (*Products, error)
}
