package api

import (
	"backend/domain"
	"backend/domain/dto"
	"backend/internal/utility"
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gofiber/fiber/v3"
)

type salesApi struct {
	salesServices domain.SalesServices
}

func NewSalesApi(app *fiber.App, salesServices domain.SalesServices) {
	ca := salesApi{
		salesServices: salesServices,
	}

	app.Post("/api/sales-orders", ca.CREATE)
	app.Post("/api/sales-orders/:id/cancel", ca.Cancel)
}

func (ca *salesApi) CREATE(ctx fiber.Ctx) error {
	// 1. Cek header dulu
	idempotencyKey := strings.TrimSpace(ctx.Get("Idempotency-Key"))
	if idempotencyKey == "" {
		return ctx.Status(http.StatusBadRequest).JSON(dto.ResponseError("Idempotency-Key header is required", http.StatusBadRequest))
	}
	if len(idempotencyKey) > 255 {
		return ctx.Status(http.StatusBadRequest).JSON(dto.ResponseError("Idempotency-Key maksimal 255 karakter", http.StatusBadRequest))
	}

	// 2. Bind + validasi body
	var req dto.CreateSalesOrderRequest
	if err := ctx.Bind().Body(&req); err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(dto.ResponseError("Invalid request body: "+err.Error(), http.StatusBadRequest))
	}
	if fails := utility.Validate(req); len(fails) > 0 {
		return ctx.Status(http.StatusBadRequest).JSON(dto.ResponseErrorWithData("request body tidak valid", fails, http.StatusBadRequest))
	}

	// 3. Panggil service
	c, cancel := context.WithTimeout(ctx.Context(), 10*time.Second)
	defer cancel()

	order, replayed, err := ca.salesServices.CreateSalesOrderWithIdempotency(c, req, idempotencyKey)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrIdempotencyKeyMismatch):
			return ctx.Status(http.StatusUnprocessableEntity).JSON(dto.ResponseError(err.Error(), http.StatusUnprocessableEntity))
		case errors.Is(err, domain.ErrProductNotFound):
			return ctx.Status(http.StatusNotFound).JSON(dto.ResponseError(err.Error(), http.StatusNotFound))
		case errors.Is(err, domain.ErrInsufficientStock):
			return ctx.Status(http.StatusConflict).JSON(dto.ResponseError(err.Error(), http.StatusConflict))
		default:
			return ctx.Status(http.StatusInternalServerError).JSON(dto.ResponseError(err.Error(), http.StatusInternalServerError))
		}
	}

	// 4. Response
	if replayed {
		ctx.Set("Idempotent-Replayed", "true")
		return ctx.Status(http.StatusOK).JSON(dto.CreateResponseSuccess(order, "Sales order already created", http.StatusOK))
	}
	return ctx.Status(http.StatusCreated).JSON(dto.CreateResponseSuccess(order, "Sales order created successfully", http.StatusCreated))
}

func (ca *salesApi) Cancel(ctx fiber.Ctx) error {
	idParam := ctx.Params("id")
	if idParam == "" {
		return ctx.Status(http.StatusBadRequest).JSON(dto.ResponseError("id parameter is required", http.StatusBadRequest))
	}

	c, cancel := context.WithTimeout(ctx.Context(), 10*time.Second)
	defer cancel()

	err := ca.salesServices.CancelSalesOrder(c, idParam)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrProductNotFound):
			return ctx.Status(http.StatusNotFound).JSON(dto.ResponseError(err.Error(), http.StatusNotFound))
		default:
			return ctx.Status(http.StatusInternalServerError).JSON(dto.ResponseError(err.Error(), http.StatusInternalServerError))
		}
	}

	return ctx.JSON(dto.CreateResponseSuccess("", "Sales order cancelled successfully", http.StatusOK))
}
