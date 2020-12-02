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

app.get('/customers/:customerId', function (req, res){
    const customerId = req.params.customerId;

  pool
    .query("SELECT * FROM customers WHERE id=$1", [customerId])
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
});

app.get('/customers/:customerId/orders', function (req, res){
      pool.query('SELECT orders.order_date, orders.order_reference, order_items.quantity, products.product_name, products.unit_price, suppliers.supplier_name FROM orders, order_items, products, suppliers WHERE orders.id = order_items.order_id AND order_items.product_id = products.id AND products.supplier_id = suppliers.id', (error, result) => {
        res.json(result.rows);
    });

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

app.put('/customers/:customerId', (req, res) => {
    const customerId = req.params.customerId;
    const newName = req.body.name;
    const newAddress = req.body.address;
    const newCity = req.body.city;
    const newCountry = req.body.country;
    let query = `UPDATE customers SET name=$1, address=$2, city=$3, country=$4 where id=$5`;
    if(newName === "" || newAddress === "" || newCountry === "" || newCity === ""){
        res.status(400).send('Please put the data for the fields !!!')
    }else{
        pool.query(query, [newName, newAddress, newCity, newCountry,  customerId])
        .then((result) => res.send(`Customer ${customerId} updated!`))
        .catch(e => {
            console.error(e);
        });
    }
})

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

app.delete("/customers/:customerId", function (req, res) {
  const customerId = req.params.customerId;

  pool
    .query("DELETE FROM orders WHERE customer_id=$1", [customerId])
    .then(() => {
      pool
        .query("DELETE FROM customers WHERE id=$1", [customerId])
        .then(() => res.send(`Selected customer ${customerId} is deleted!`))
        .catch((e) => console.error(e));
    })
    .catch((e) => console.error(e));
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

app.get("/orders", function(req, res) {
    pool.query('SELECT * FROM orders', (error, result) => {
        res.json(result.rows);
    });
});


app.delete ('/orders/:orderId', function (req,res){
    const orderId = req.params.orderId;
    
    pool
    .query("DELETE FROM order_items WHERE order_id=$1", [orderId])
    .then(() => {
      pool
        .query("DELETE FROM orders WHERE id=$1", [orderId])
        .then(() => res.send(`Selected order ${orderId} is deleted!`))
        .catch((e) => console.error(e));
    })
    .catch((e) => console.error(e));
});


app.listen(3000, function() {
    console.log("Server is listening on port 3000. Ready to accept requests!");
});