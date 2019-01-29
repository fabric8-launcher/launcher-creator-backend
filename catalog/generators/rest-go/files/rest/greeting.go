package rest

import (
	"fmt"
	"net/http"
)

func RegisterEndpoints() {
	http.HandleFunc("/greeting", greeting)
}

func greeting(w http.ResponseWriter, r *http.Request) {
	message := "World"
	if m := r.FormValue("name"); m != "" {
		message = m
	}
	fmt.Fprintf(w, "Hello %s!", message)
}
