package main

import (
	"backend/domain"
	"backend/internal/api"
	"backend/internal/config"
	"backend/internal/connection"
	"backend/internal/repository"
	"backend/internal/services"
	"log"

	"github.com/gofiber/fiber/v3"
)

func main() {
	app := fiber.New()
	conf := config.Load()
	dbConnection := connection.GetDB(conf.DB)

	if err := dbConnection.AutoMigrate(
		&domain.Products{},
		&domain.StockMovements{},
		&domain.SalesOrders{},
		&domain.SalesOrderItems{},
		&domain.IdempotencyKeys{},
	); err != nil {
		log.Fatal("Failed to migrate: ", err)
	}

	app.Get("/welcome", Welcome)

	productsRepository := repository.NewProducts(dbConnection)
	productsServices := services.NewProducts(productsRepository)
	api.NewProductsApi(app, productsServices)

	log.Fatal(app.Listen(conf.Server.Host + ":" + conf.Server.Port))
}

func Welcome(ctx fiber.Ctx) error {
	return ctx.Status(200).JSON("Welcome")
}
