package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

func Load() *Config {
	err := godotenv.Load()

	if err != nil {
		log.Fatal("Failed to load env file: ", err.Error())
	}

	return &Config{
		Server: ServerConnection{
			Host: os.Getenv("SERVER_HOST"),
			Port: os.Getenv("SERVER_PORT"),
		},
		DB: DBConnection{
			Host:     os.Getenv("DB_HOST"),
			Port:     os.Getenv("DB_PORT"),
			Name:     os.Getenv("DB_NAME"),
			User:     os.Getenv("DB_USER"),
			Password: os.Getenv("DB_PASSWORD"),
			Tz:       os.Getenv("DB_TZ"),
		},
	}
}
