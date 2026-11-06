package services

import (
	"backend/domain"
	"backend/domain/dto"
	"context"
	"errors"
	"fmt"

	"gorm.io/gorm"
)

type productServices struct {
	productsRepository domain.ProductsRepository
}

func NewProducts(productsRepository domain.ProductsRepository) domain.ProductServices {
	return &productServices{
		productsRepository: productsRepository,
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
