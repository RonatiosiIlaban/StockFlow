package api

import (
	"backend/domain"
	"backend/domain/dto"
	"backend/internal/utility"
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gofiber/fiber/v3"
)

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
}

func (ca *productsApi) GET(ctx fiber.Ctx) error {
	var filter dto.ProductFilter

	if err := ctx.Bind().Query(&filter); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(dto.ResponseError("query tidak valid: " + err.Error()))
	}

	c, cancel := context.WithTimeout(ctx.Context(), 10*time.Second)
	defer cancel()

	res, meta, err := ca.productServices.GetProducts(c, filter)

	fmt.Println("GET /products called with filter:", filter)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(dto.ResponseError(err.Error()))
	}

	return ctx.JSON(dto.ResponseSuccess(res, meta))
}

func (ca *productsApi) GETBYID(ctx fiber.Ctx) error {
	idParam := ctx.Params("id")
	if idParam == "" {
		return ctx.Status(http.StatusBadRequest).JSON(dto.ResponseError("id parameter is required"))
	}

	var id uint
	_, err := fmt.Sscan(idParam, &id)
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(dto.ResponseError("invalid id parameter"))
	}

	c, cancel := context.WithTimeout(ctx.Context(), 10*time.Second)
	defer cancel()

	product, err := ca.productServices.GetProductById(c, id)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(dto.ResponseError(err.Error()))
	}

	return ctx.JSON(dto.CreateResponseSuccess[dto.ProductsData](product))
}

func (ca *productsApi) CREATE(ctx fiber.Ctx) error {
	c, cancel := context.WithTimeout(ctx.Context(), 10*time.Second)
	defer cancel()
	var req dto.CreateProductRequest

	if err := ctx.Bind().Body(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(
			dto.ResponseError("request body tidak valid: " + err.Error()),
		)
	}
	fails := utility.Validate(req)
	if len(fails) > 0 {
		return ctx.Status(http.StatusBadRequest).JSON(dto.ResponseErrorWithData("request body tidak valid", fails))
	}
	val, fail := ca.productServices.FindBySku(c, req.Sku)
	if fail != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(dto.ResponseError(fail.Error()))
	}
	if val != nil {
		return ctx.Status(http.StatusBadRequest).JSON(dto.ResponseError("sku sudah digunakan"))
	}

	err := ca.productServices.CreateProduct(c, req)
	if err != nil {
		return ctx.Status(http.StatusInternalServerError).JSON(dto.ResponseError(err.Error()))
	}

	return ctx.Status(http.StatusCreated).JSON(dto.CreateResponseSuccess(""))
}
