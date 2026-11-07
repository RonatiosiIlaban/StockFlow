package dto

import "time"

type ProductFilter struct {
	Search   string `query:"search"`
	IsActive *bool  `query:"is_active"`
	Sort     string `query:"sort"`
	Page     int    `query:"page"`
	Limit    int    `query:"limit"`
}

type ProductsData struct {
	ID             uint       `json:"id"`
	Sku            string     `json:"sku"`
	Name           string     `json:"name"`
	Price          int        `json:"price"`
	Stock          int        `json:"stock"`
	IsActive       bool       `json:"is_active"`
	LastMovementAt *time.Time `json:"last_movement_at"`
}

type Pagination struct {
	Page      int   `json:"page"`
	Limit     int   `json:"limit"`
	Total     int64 `json:"total"`
	TotalPage int   `json:"total_page"`
}

type CreateProductRequest struct {
	Sku      string `json:"sku" validate:"required,max=100"`
	Name     string `json:"name" validate:"required,min=3"`
	Price    int    `json:"price" validate:"gte=0"`
	Stock    int    `json:"stock" validate:"gte=0"`
	IsActive bool   `gorm:"not null;default:true"`
}

type CreateStockMovementRequest struct {
	Type string `json:"type" validate:"required,oneof=in out"`
	Qty  int    `json:"qty" validate:"required,gte=1"`
	Note string `json:"note"`
}
