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

app.put("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;
  const {name,address,city,country} = req.body;
  // get current customer values
  pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => {
        if (result.rowCount !== 1) {
            res.status(400).send(`No customer with id ${customerId}`)
        }
        const customer = result.rows[0];
        const query = 'UPDATE customers SET name=$2,address=$3,city=$4,country=$5 WHERE id=$1';
        pool
            .query(query, [
                customer.id,
                stringOrNull(name, customer.name),
                stringOrNull(address, customer.address),
                stringOrNull(city, customer.city),
                stringOrNull(country, customer.country)
            ])
            .then((result) => {
                if (result.rowCount !== 1) {
                    res.status(400).send(`No customer with id ${customerId}`)
                }
                res.send(`Customer ${customerId} updated!`)
            })
            .catch((e) => console.error(e));
    })
    .catch((e) => console.error(e));

});


app.post('/products', function (req, res){
  // const productId = req.body.id;
  const newProductName = req.body.product_name;
  const newUnitPrice = req.body.unit_price;
  const newSupplierId = req.body.supplier_id;

  pool
  .query("SELECT * FROM products WHERE supplier_id=$1", [newSupplierId])
  .then((result) => {
      if (result.rows.length < 0) {
        return res
          .status(400)
          .send(`There is no match with queried ${newSupplierId}`);
      } else if (newUnitPrice < 0){
        return res
          .status(400)
          .send(`${newUnitPrice} price must be bigger than 0`)
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


app.post('/customers/:customerId/orders', function (req, res){
  const customerId = req.body.customer_id;
  const newOrderDate = req.body.order_date;
  const newOrderReference = req.body.order_reference;

  pool
  .query("SELECT * FROM orders WHERE customer_id=$1", [customerId])
  .then((result) => {
      if (result.rows.length < 0) {
        return res
          .status(400)
          .send(`There is not any customer with that ${customerId}`);
      } else {
        const query =
          "INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1, $2, $3)";
        pool
          .query(query, [newOrderDate, newOrderReference, customerId])
          .then(() => res.send("Order created!"))
          .catch((e) => console.error(e));
      }
    });

})



app.listen(3000, function() {
    console.log("Server is listening on port 3000. Ready to accept requests!");
});