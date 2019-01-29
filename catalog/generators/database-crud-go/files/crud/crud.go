package crud

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

//{{if .databaseType==mysql}}
    _ "github.com/jinzhu/gorm/dialects/mysql"
//{{else if .databaseType==postgresql}}
	_ "github.com/jinzhu/gorm/dialects/postgres"
//{{end}}

	"github.com/gorilla/mux"
)

func RegisterEndpoints() {
//{{if .databaseType==mysql}}
	dbName := getEnv("DB_DBNAME", "my_data")
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "3306")
	dbUser := getEnv("DB_USERNAME", "admin")
	dbPassword := getEnv("DB_PASSWORD", "mysecretpassword")
	connectionString := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8&tls=skip-verify&autocommit=true",
	    dbUser,
	    dbPassword,
	    dbHost,
	    dbPort,
	    dbName)
	db, err := NewFruitsRepository("mysql", connectionString)
//{{else if .databaseType==postgresql}}
	dbName := getEnv("DB_DBNAME", "postgres")
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USERNAME", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "mysecretpassword")
	connectionString := fmt.Sprintf("host=%s port=%s user=%s dbname=%s password=%s sslmode=disable",
		dbHost,
		dbPort,
		dbUser,
		dbName,
		dbPassword)
	db, err := NewFruitsRepository("postgres", connectionString)
//{{end}}
	if err != nil {
		log.Fatal(err)
	}

	db.AutoMigrate(&Fruit{})

	// Delete all data in Fruit table
	db.Delete(&Fruit{})

	// Sample data
	_, err  = db.CreateFruit(Fruit{Name: "Apple", Stock: 10})
	if err != nil {
		log.Fatal(err)
	}
	_, err = db.CreateFruit(Fruit{Name:"Orange", Stock:10 })
	if err != nil {
		log.Fatal(err)
	}
	_, err = db.CreateFruit(Fruit{Name: "Pear", Stock: 10})
	if err != nil {
		log.Fatal(err)
	}

	fruitController := NewFruitController(db)

	r := mux.NewRouter()
	r.HandleFunc("/api/fruits", fruitController.List).Methods("GET")
	r.HandleFunc("/api/fruits/{id:[0-9]+}", fruitController.Show).Methods("GET")
	r.HandleFunc("/api/fruits", fruitController.Create).Methods("POST")
	r.HandleFunc("/api/fruits/{id:[0-9]+}", fruitController.Update).Methods("PUT")
	r.HandleFunc("/api/fruits/{id:[0-9]+}", fruitController.Delete).Methods("DELETE")

	http.Handle("/", r)
	r.Use(loggingMiddleware)
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Printf("\n[%s] %q %q",
			time.Now().Format("02/Jan/2006:15:04:05 -0700"),
			r.Method,
			r.RequestURI)
		next.ServeHTTP(w, r)

	})
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
