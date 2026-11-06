package connection

import (
	"backend/internal/config"
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func GetDB(conf config.DBConnection) *gorm.DB {
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=%s",
		conf.Host, conf.Port, conf.User, conf.Password, conf.Name, conf.Tz)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info), // menampilkan query SQL di terminal
	})
	if err != nil {
		log.Fatal("Failed to connect database: ", err.Error())
	}

	return db
}
