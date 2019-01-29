package crud

import (
	"github.com/jinzhu/gorm"
	errs "github.com/pkg/errors"
)

// FruitRepository interface represents the repository methods
type FruitRepository interface {
	ListFruits() ([]Fruit, error)
	ShowFruit(id int) (*Fruit, error)
	CreateFruit(fruit Fruit) (*Fruit, error)
	UpdateFruit(id int, fruit Fruit) (*Fruit, error)
	DeleteFruit(id int) (*Fruit, error)
}

// DB wraps the gorm.DB struct
type DB struct {
	*gorm.DB
}

// Fruit represents the Fruit table in database
type Fruit struct {
	ID    int `gorm:"AUTO_INCREMENT"`
	Name  string
	Stock int
}

// NewFruitsRepository returns a new DB object after establishing connection to
// the database
func NewFruitsRepository(database string, connectionString string) (*DB, error) {
	db, err := gorm.Open(database, connectionString)
	if err != nil {
		return nil, err
	}
	// Ensure database is reachable
	if err = db.DB().Ping(); err != nil {
		return nil, err
	}
	return &DB{db}, nil
}

// ListFruits returns the list of fruits in the database.
func (db *DB) ListFruits() ([]Fruit, error) {
	var fruits []Fruit
	db.Find(&fruits)
	if db.Error != nil {
		return nil, db.Error
	}
	return fruits, nil
}

// ShowFruit returns the Fruit object with ID 'id' in the database.
func (db *DB) ShowFruit(id int) (*Fruit, error) {
	var fruit Fruit
	db.First(&fruit, id)
	if db.Error != nil {
		return nil, db.Error
	}
	return &fruit, nil
}

// CreateFruit creates a new Fruit object with the given name and stock in the
// database.
func (db *DB) CreateFruit(fruit Fruit) (*Fruit, error) {
	if err := db.Create(&fruit).Error; err != nil {
		return nil, errs.Wrap(err, "failed to create")
	}
	return &fruit, nil
}

// UpdateFruit updates the fruit object represented by the 'id'. Returns the
// updated fruit object, or error on failure
func (db *DB) UpdateFruit(id int, fruit Fruit) (*Fruit, error) {
	var newFruit Fruit

	if err := db.First(&newFruit, id).Error; err != nil {
		return nil, errs.Wrapf(err, "failed to find object with ID: %d", id)
	}
	newFruit.Name = fruit.Name
	newFruit.Stock = fruit.Stock
	if err := db.Save(newFruit).Error; err != nil {
		return nil, errs.Wrap(err, "failed to save updated object")
	}
	return &newFruit, nil
}

// DeleteFruit soft deletes the Fruit object represented by the 'id' in the database
func (db *DB) DeleteFruit(id int) (*Fruit, error) {
	var fruit Fruit

	if err := db.First(&fruit, id).Error; err != nil {
		return nil, errs.Wrapf(err, "failed to find fruit with ID:%d", id)
	}

	if err := db.Delete(&fruit).Error; err != nil {
		return nil, errs.Wrapf(err, "failed to delete fruit with ID:%d", id)
	}
	return &fruit, nil
}
