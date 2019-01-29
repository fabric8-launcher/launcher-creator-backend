package crud

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	errs "github.com/pkg/errors"
)

// FruitController is used to group the controller actions. The DB object is
// used to access the repository layer (aka database)
type FruitController struct {
	DB FruitRepository
}

// NewFruitController returns a new fruit controller
func NewFruitController(db *DB) FruitController {
	return FruitController{
		DB: db,
	}
}

// List actions returns a json list of fruits in the database.
func (fc FruitController) List(w http.ResponseWriter, r *http.Request) {
	fruitList, err := fc.DB.ListFruits()
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(fruitList)
}

// Show action returns a json representation of fruit with 'id' in the database.
func (fc FruitController) Show(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	fruitID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Failed to convert fruit ID from string to int", 500)
		return
	}
	fruit, err := fc.DB.ShowFruit(fruitID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(fruit)
}

// Create action creates a new fruit object.
func (fc FruitController) Create(w http.ResponseWriter, r *http.Request) {
	decoder := json.NewDecoder(r.Body)
	var fruitPayload Fruit
	err := decoder.Decode(&fruitPayload)
	if err != nil {
		http.Error(w, errs.Wrapf(err, "failed to decode payload into fruit object").Error(), 500)
		return
	}
	fruit, err := fc.DB.CreateFruit(fruitPayload)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(fruit)
}

// Update action updates the fruit object represented by the 'id'.
func (fc FruitController) Update(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	fruitID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, errs.Wrapf(err, "Failed to convert fruit ID from string to int").Error(), 500)
		return
	}

	decoder := json.NewDecoder(r.Body)
	var fruitPayload Fruit
	err = decoder.Decode(&fruitPayload)
	if err != nil {
		http.Error(w, errs.Wrapf(err, "Failed to decode payload into fruit object").Error(), 500)
		return
	}
	fruit, err := fc.DB.UpdateFruit(fruitID, fruitPayload)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(fruit)
}

// Delete action soft deleted the fruit object represented by the 'id'.
func (fc FruitController) Delete(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	fruitID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, errs.Wrapf(err, "Failed to convert fruit ID from string to int").Error(), 500)
		return
	}
	fruit, err := fc.DB.DeleteFruit(fruitID)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(fruit)
}
