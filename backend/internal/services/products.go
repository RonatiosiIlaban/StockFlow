package services

import (
	"backend/domain"
	"backend/domain/dto"
	"backend/internal/api"
	"context"
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"
)

type productServices struct {
	productsRepository  domain.ProductsRepository
	movementsRepository domain.StockMovementsRepository
}

func NewProducts(productsRepository domain.ProductsRepository, movementsRepository domain.StockMovementsRepository) domain.ProductServices {
	return &productServices{
		productsRepository:  productsRepository,
		movementsRepository: movementsRepository,
	}
}

func (s *productServices) GetProducts(ctx context.Context, filter dto.ProductFilter) ([]dto.ProductsData, dto.Pagination, error) {
	products, meta, err := s.productsRepository.FindAll(ctx, filter)
	if err != nil {
		return nil, dto.Pagination{}, err
	}
	fmt.Println("GetProducts service called with meta:", meta)

	result := make([]dto.ProductsData, 0, len(products))
	for _, p := range products {
		result = append(result, dto.ProductsData{
			ID:             p.ID,
			Sku:            p.Sku,
			Name:           p.Name,
			Price:          p.Price,
			Stock:          p.Stock,
			IsActive:       p.IsActive,
			LastMovementAt: p.LastMovementAt,
		})
	}
	return result, meta, nil
}

func (s *productServices) CreateProduct(ctx context.Context, req dto.CreateProductRequest) error {
	product := domain.Products{
		Sku:      req.Sku,
		Name:     req.Name,
		Price:    req.Price,
		Stock:    req.Stock,
		IsActive: req.IsActive,
	}
	return s.productsRepository.Save(ctx, &product)
}

func (s *productServices) GetProductById(ctx context.Context, id uint) (dto.ProductsData, error) {
	product, err := s.productsRepository.FindById(ctx, id)
	if err != nil {
		return dto.ProductsData{}, err
	}

	return dto.ProductsData{
		ID:             product.ID,
		Sku:            product.Sku,
		Name:           product.Name,
		Price:          product.Price,
		Stock:          product.Stock,
		IsActive:       product.IsActive,
		LastMovementAt: product.LastMovementAt,
	}, nil
}

func (s *productServices) FindBySku(ctx context.Context, sku string) (*domain.Products, error) {
	product, err := s.productsRepository.FindBySku(ctx, sku)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (s *productServices) UpdateProduct(ctx context.Context, id uint, req dto.CreateProductRequest) error {
	product, err := s.productsRepository.FindById(ctx, id)
	if err != nil {
		return err
	}

	product.Sku = req.Sku
	product.Name = req.Name
	product.Price = req.Price
	product.Stock = req.Stock
	product.IsActive = req.IsActive

	return s.productsRepository.Update(ctx, &product)
}

func (s *productServices) DeleteProduct(ctx context.Context, id uint) error {
	product, err := s.productsRepository.FindById(ctx, id)
	if err != nil {
		return err
	}

	return s.productsRepository.Delete(ctx, &product)
}

func (s *productServices) CreateStockMovement(ctx context.Context, productId uint, req dto.CreateStockMovementRequest) error {
	product, err := s.productsRepository.FindById(ctx, productId)
	if err != nil {
		return err
	}

	if req.Type == "out" && product.Stock < req.Qty {
		return api.ErrInsufficientStock
	}

	if req.Type == "in" {
		product.Stock += req.Qty
	} else if req.Type == "out" {
		product.Stock -= req.Qty
	}

	now := time.Now()
	product.LastMovementAt = &now

	if err = s.productsRepository.Update(ctx, &product); err != nil {
		return err
	}

	stockMovement := domain.StockMovements{
		ProductId: product.ID,
		Type:      req.Type,
		Qty:       req.Qty,
		Note:      req.Note,
	}

	return s.movementsRepository.Save(ctx, &stockMovement)
}

func (s *productServices) FindByProductIdStockMovement(ctx context.Context, productId uint) ([]domain.StockMovements, error) {
	stockMovements, err := s.movementsRepository.FindByProductId(ctx, productId)
	if err != nil {
		return []domain.StockMovements{}, err
	}

	return stockMovements, nil
}
