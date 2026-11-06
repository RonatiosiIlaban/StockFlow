package main

import "github.com/gofiber/fiber/v3"

func main() {
	app := fiber.New()

	app.Get("/welcome", Welcome)
	app.Listen(":8080")
}

func Welcome(ctx fiber.Ctx) error {
	return ctx.Status(200).JSON("Welcome")
}
