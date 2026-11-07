package repository

import (
	"backend/domain"
	"backend/domain/dto"
	"context"

	"gorm.io/gorm"
)

type productsRepository struct {
	db *gorm.DB
}

type stockMovementsRepository struct {
	db *gorm.DB
}

func NewProducts(db *gorm.DB) domain.ProductsRepository {
	return &productsRepository{db: db}
}

func NewStockMovements(db *gorm.DB) domain.StockMovementsRepository {
	return &stockMovementsRepository{db: db}
}

func (r *productsRepository) FindAll(ctx context.Context, f dto.ProductFilter) ([]domain.Products, dto.Pagination, error) {
	var products []domain.Products
	var total int64

	q := r.db.WithContext(ctx).Model(&domain.Products{})

	if f.Search != "" {
		like := "%" + f.Search + "%"
		q = q.Where("name ILIKE ? OR sku ILIKE ?", like, like)
	}
	if f.IsActive != nil {
		q = q.Where("is_active = ?", *f.IsActive)
	}

	if err := q.Count(&total).Error; err != nil {
		return nil, dto.Pagination{}, err
	}

	sortMap := map[string]string{
		"name": "name ASC", "-name": "name DESC",
		"price": "price ASC", "-price": "price DESC",
		"stock": "stock ASC", "-stock": "stock DESC",
	}
	order, ok := sortMap[f.Sort]
	if !ok {
		order = "created_at DESC"
	}

	if err := q.Order(order).
		Limit(f.Limit).
		Offset((f.Page - 1) * f.Limit).
		Find(&products).Error; err != nil {
		return nil, dto.Pagination{}, err
	}

	meta := dto.Pagination{
		Page:      f.Page,
		Limit:     f.Limit,
		Total:     total,
		TotalPage: int((total + int64(f.Limit) - 1) / int64(f.Limit)),
	}
	return products, meta, nil
}

func (r *productsRepository) FindById(ctx context.Context, id uint) (domain.Products, error) {
	var product domain.Products
	err := r.db.WithContext(ctx).First(&product, "id = ?", id).Error
	return product, err
}

func (r *productsRepository) FindBySku(ctx context.Context, sku string) (domain.Products, error) {
	var product domain.Products
	err := r.db.WithContext(ctx).Where("sku = ?", sku).First(&product).Error
	return product, err
}

func (r *productsRepository) Save(ctx context.Context, p *domain.Products) error {
	return r.db.WithContext(ctx).Create(p).Error
}

func (r *productsRepository) Update(ctx context.Context, p *domain.Products) error {
	return r.db.WithContext(ctx).Save(p).Error
}

func (r *productsRepository) Delete(ctx context.Context, p *domain.Products) error {
	return r.db.WithContext(ctx).Delete(p).Error
}

func (r *stockMovementsRepository) FindByProductId(ctx context.Context, productId uint) ([]domain.StockMovements, error) {
	var movements []domain.StockMovements
	err := r.db.WithContext(ctx).
		Where("product_id = ?", productId).
		Order("created_at DESC").
		Find(&movements).Error
	return movements, err
}

func (r *stockMovementsRepository) Save(ctx context.Context, movement *domain.StockMovements) error {
	return r.db.WithContext(ctx).Create(movement).Error
}
