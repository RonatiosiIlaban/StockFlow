package dto

import "time"

type CreateSalesOrderRequest struct {
	Customer string           `json:"customer" validate:"required"`
	Items    []SalesOrderItem `json:"items" validate:"required,min=1,dive"`
}

type SalesOrderItem struct {
	Sku       string `json:"sku" validate:"required"`
	Qty       int    `json:"qty" validate:"required,gt=0"`
	UnitPrice int    `json:"unit_price" validate:"required,gt=0"`
}

type SalesOrderData struct {
	ID        uint                 `json:"id"`
	Customer  string               `json:"customer"`
	Status    string               `json:"status"`
	Total     int                  `json:"total"`
	CreatedAt time.Time            `json:"created_at"`
	Items     []SalesOrderItemData `json:"items"`
}

type SalesOrderItemData struct {
	ID        uint   `json:"id"`
	Sku       string `json:"sku"`
	Qty       int    `json:"qty"`
	UnitPrice int    `json:"unit_price"`
	Subtotal  int    `json:"subtotal"`
}
