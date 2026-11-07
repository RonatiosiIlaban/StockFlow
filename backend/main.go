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
	"github.com/gofiber/fiber/v3/middleware/cors"
)

func main() {
	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins:  []string{"http://localhost:5173"},
		AllowMethods:  []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:  []string{"Content-Type", "Idempotency-Key"},
		ExposeHeaders: []string{"Idempotent-Replayed"},
	}))

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

	// Repositories
	productsRepository := repository.NewProducts(dbConnection)
	stockMovementsRepository := repository.NewStockMovements(dbConnection)
	salesRepository := repository.NewSales(dbConnection)

	// Services
	productsServices := services.NewProducts(productsRepository, stockMovementsRepository)
	salesServices := services.NewSales(salesRepository)

	// APIs
	api.NewProductsApi(app, productsServices)
	api.NewSalesApi(app, salesServices)

	log.Fatal(app.Listen(conf.Server.Host + ":" + conf.Server.Port))
}

func Welcome(ctx fiber.Ctx) error {
	return ctx.Status(200).JSON("Welcome")
}
