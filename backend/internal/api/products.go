package api

import (
	"backend/domain"
	"backend/domain/dto"
	"backend/internal/utility"
	"context"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/gofiber/fiber/v3"
)

var ErrInsufficientStock = errors.New("Stok tidak cukup")

type productsApi struct {
	productServices domain.ProductServices
}

func NewProductsApi(app *fiber.App, productServices domain.ProductServices) {
	ca := productsApi{
		productServices: productServices,
	}

	app.Get("/products", ca.GET)
	app.Post("/products", ca.CREATE)
	app.Get("/products/:id", ca.GETBYID)
	app.Put("/products/:id", ca.UPDATE)
	app.Delete("/products/:id", ca.DELETE)
	app.Post("/products/:id/stock-movements", ca.CreateStockMovement)
	app.Get("/products/:id/stock-movements", ca.FindByProductIdStockMovement)
}

func (ca *productsApi) GET(ctx fiber.Ctx) error {
	var filter dto.ProductFilter

	if err := ctx.Bind().Query(&filter); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(dto.ResponseError("query tidak valid: "+err.Error(), http.StatusBadRequest))
	}

	c, cancel := context.WithTimeout(ctx.Context(), 10*time.Second)
	defer cancel()

	res, meta, err := ca.productServices.GetProducts(c, filter)

	fmt.Println("GET /products called with filter:", filter)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(dto.ResponseError(err.Error(), http.StatusInternalServerError))
	}

	return ctx.JSON(dto.ResponseSuccess(res, meta, http.StatusOK))
}

func (ca *productsApi) GETBYID(ctx fiber.Ctx) error {
	idParam := ctx.Params("id")
	if idParam == "" {
		return ctx.Status(http.StatusBadRequest).JSON(dto.ResponseError("id parameter is required", http.StatusBadRequest))
	}

	var id uint
	_, err := fmt.Sscan(idParam, &id)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(dto.ResponseError("invalid id parameter", http.StatusBadRequest))
	}

	c, cancel := context.WithTimeout(ctx.Context(), 10*time.Second)
	defer cancel()

	product, err := ca.productServices.GetProductById(c, id)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(dto.ResponseError(err.Error(), http.StatusInternalServerError))
	}

	return ctx.JSON(dto.CreateResponseSuccess[dto.ProductsData](product, "Product found successfully", http.StatusOK))
}

func (ca *productsApi) CREATE(ctx fiber.Ctx) error {
	c, cancel := context.WithTimeout(ctx.Context(), 10*time.Second)
	defer cancel()
	var req dto.CreateProductRequest

	if err := ctx.Bind().Body(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(
			dto.ResponseError("request body tidak valid: "+err.Error(), http.StatusBadRequest),
		)
	}
	fails := utility.Validate(req)
	if len(fails) > 0 {
		return ctx.Status(http.StatusBadRequest).JSON(dto.ResponseErrorWithData("request body tidak valid", fails, http.StatusBadRequest))
	}
	val, fail := ca.productServices.FindBySku(c, req.Sku)
	if fail != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(dto.ResponseError(fail.Error(), http.StatusInternalServerError))
	}
	if val != nil {
		return ctx.Status(http.StatusBadRequest).JSON(dto.ResponseError("sku sudah digunakan", http.StatusBadRequest))
	}

	err := ca.productServices.CreateProduct(c, req)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(dto.ResponseError(err.Error(), http.StatusInternalServerError))
	}

	return ctx.Status(http.StatusCreated).JSON(dto.CreateResponseSuccess("", "Product created successfully", http.StatusCreated))
}

func (ca *productsApi) UPDATE(ctx fiber.Ctx) error {
	idParam := ctx.Params("id")
	if idParam == "" {
		return ctx.Status(http.StatusBadRequest).JSON(dto.ResponseError("id parameter is required", http.StatusBadRequest))
	}

	var id uint
	_, err := fmt.Sscan(idParam, &id)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(dto.ResponseError("invalid id parameter", http.StatusBadRequest))
	}

	c, cancel := context.WithTimeout(ctx.Context(), 10*time.Second)
	defer cancel()

	var req dto.CreateProductRequest
	if err := ctx.Bind().Body(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(
			dto.ResponseError("request body tidak valid: "+err.Error(), http.StatusBadRequest),
		)
	}
	fails := utility.Validate(req)
	if len(fails) > 0 {
		return ctx.Status(http.StatusBadRequest).JSON(dto.ResponseErrorWithData("request body tidak valid", fails, http.StatusBadRequest))
	}

	err = ca.productServices.UpdateProduct(c, id, req)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(dto.ResponseError(err.Error(), http.StatusInternalServerError))
	}

	return ctx.JSON(dto.CreateResponseSuccess("", "Product updated successfully", http.StatusOK))
}

func (ca *productsApi) DELETE(ctx fiber.Ctx) error {
	idParam := ctx.Params("id")
	if idParam == "" {
		return ctx.Status(http.StatusBadRequest).JSON(dto.ResponseError("id parameter is required", http.StatusBadRequest))
	}

	var id uint
	_, err := fmt.Sscan(idParam, &id)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(dto.ResponseError("invalid id parameter", http.StatusBadRequest))
	}

	c, cancel := context.WithTimeout(ctx.Context(), 10*time.Second)
	defer cancel()

	product, err := ca.productServices.GetProductById(c, id)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(dto.ResponseError(err.Error(), http.StatusInternalServerError))
	}

	err = ca.productServices.DeleteProduct(c, product.ID)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(dto.ResponseError(err.Error(), http.StatusInternalServerError))
	}

	return ctx.JSON(dto.CreateResponseSuccess("", "Product deleted successfully", http.StatusOK))
}

func (ca *productsApi) CreateStockMovement(ctx fiber.Ctx) error {
	idParam := ctx.Params("id")
	if idParam == "" {
		return ctx.Status(http.StatusBadRequest).JSON(dto.ResponseError("id parameter is required", http.StatusBadRequest))
	}

	var id uint
	_, err := fmt.Sscan(idParam, &id)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(dto.ResponseError("invalid id parameter", http.StatusBadRequest))
	}

	c, cancel := context.WithTimeout(ctx.Context(), 10*time.Second)
	defer cancel()

	var req dto.CreateStockMovementRequest
	if err := ctx.Bind().Body(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(
			dto.ResponseError("request body tidak valid: "+err.Error(), http.StatusBadRequest),
		)
	}
	fails := utility.Validate(req)
	if len(fails) > 0 {
		return ctx.Status(http.StatusBadRequest).JSON(dto.ResponseErrorWithData("request body tidak valid", fails, http.StatusBadRequest))
	}

	err = ca.productServices.CreateStockMovement(c, id, req)
	// if err != nil {

	// 	return ctx.Status(http.StatusInternalServerError).JSON(dto.ResponseError(err.Error(), http.StatusInternalServerError))
	// }
	if err != nil {
		fmt.Println("Error creating stock movement:", err)
		switch {
		case errors.Is(err, ErrInsufficientStock):
			return ctx.Status(http.StatusConflict).JSON(dto.ResponseError(err.Error(), http.StatusConflict)) // 409
		default:
			return ctx.Status(http.StatusInternalServerError).JSON(dto.ResponseError(err.Error(), http.StatusInternalServerError)) // 500
		}
	}

	return ctx.JSON(dto.CreateResponseSuccess("", "Stock movement created successfully", http.StatusOK))
}

func (ca *productsApi) FindByProductIdStockMovement(ctx fiber.Ctx) error {
	idParam := ctx.Params("id")
	if idParam == "" {
		return ctx.Status(http.StatusBadRequest).JSON(dto.ResponseError("id parameter is required", http.StatusBadRequest))
	}

	var id uint
	_, err := fmt.Sscan(idParam, &id)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(dto.ResponseError("invalid id parameter", http.StatusBadRequest))
	}

	c, cancel := context.WithTimeout(ctx.Context(), 10*time.Second)
	defer cancel()

	stockMovement, err := ca.productServices.FindByProductIdStockMovement(c, id)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(dto.ResponseError(err.Error(), http.StatusInternalServerError))
	}

	return ctx.JSON(dto.CreateResponseSuccess(stockMovement, "Stock movement found successfully", http.StatusOK))
}
