const express = require("express");
const app = express();

const bodyParser = require("body-parser");
app.use(bodyParser.json());
const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'cyf_ecommerce',
    password: '',
    port: 5432
});

app.get("/customers", function(req, res) {
    pool.query('SELECT * FROM customers', (error, result) => {
        res.json(result.rows);
    });
});

app.get("/suppliers", function(req, res) {
    pool.query('SELECT * FROM suppliers', (error, result) => {
        res.json(result.rows);
    });
});

app.get("/products", function(req, res) {
    pool.query('SELECT products.product_name, suppliers.supplier_name FROM products INNER JOIN suppliers ON products.supplier_id = suppliers.id', (error, result) => {
        res.json(result.rows);
    });
});

app.get('/products', function (req, res){
    let searchProduct = req.query.name;
    let query = `SELECT * FROM products`;
    
    if(searchProduct){
        query = `SELECT * FROM products WHERE name LIKE '%${searchProduct}%' ORDER BY name`;
    }
    pool
    .query(query)
    .then((result) => res.json(result.rows))
    .catch((e)=> console.error(e));
});

app.get('/customers/:customerId', function (req, res){
    const customerId = req.params.customerId;

  pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});

app.post('/customers', function (req, res){
  const newCustomerName = req.body.name;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerCountry = req.body.country;

  pool
  .query("SELECT * FROM customers WHERE name=$1", [newCustomerName])
  .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("A customer with the same name already exists!");
      } else {
        const query =
          "INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4)";
        pool
          .query(query, [newCustomerName, newCustomerAddress, newCustomerCity, newCustomerCountry])
          .then(() => res.send("Customer created!"))
          .catch((e) => console.error(e));
      }
    });

});

app.post('/products', function (req, res){
  const newProductName = req.body.product_name;
  const newUnitPrice = req.body.unit_price;
  const newSupplierId = req.body.supplier_id;

  pool
  .query("SELECT * FROM products WHERE product_name=$1", [newProductName])
  .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("A product with the same name already exists!");
      } else {
        const query =
          "INSERT INTO products (product_name, unit_price, supplier_id) VALUES ($1, $2, $3)";
        pool
          .query(query, [newProductName, newUnitPrice, newSupplierId])
          .then(() => res.send("Product created!"))
          .catch((e) => console.error(e));
      }
    });

});

app.listen(3000, function() {
    console.log("Server is listening on port 3000. Ready to accept requests!");
});