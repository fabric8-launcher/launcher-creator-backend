-- Create the products table if not present
CREATE TABLE IF NOT EXISTS products (
  id        SERIAL PRIMARY KEY,
  name      VARCHAR(40) NOT NULL,
  stock     BIGINT
);

DELETE FROM products;

INSERT INTO products (id, name, stock) values (1, 'Apple', 10);
INSERT INTO products (id, name, stock) values (2, 'Orange', 10);
INSERT INTO products (id, name, stock) values (3, 'Pear', 10);