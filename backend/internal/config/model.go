package config

type Config struct {
	Server ServerConnection
	DB     DBConnection
}

type ServerConnection struct {
	Host string
	Port string
}

type DBConnection struct {
	Host     string
	Port     string
	Name     string
	User     string
	Password string
	Tz       string
}
