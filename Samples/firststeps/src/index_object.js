import 'dotenv/config';
const cors = require('cors');
import express from 'express';
 
const app = express();
app.use(cors()); // set cors support
app.use(express.urlencoded({ extended: false })); // parse application/x-www-form-urlencoded
app.use(express.json()); // parse application/json

var portfolio = {};

initPortfolio();

// Service "/createStock" creates a new stock object
app.post('/createStock', (req, res) => {
  let msg = '';

  if (getStock(req.body.stockname) == null) { 
    let stock = createStock(req.body.stockname, req.body.wkn, req.body.symbol);
    portfolio[stock.stockname] = stock;
    msg = 'Stock object successfully created!';
  } else {
    res.status(409)
    msg = 'Stock object already exists!';
  }

  res.send(msg);
});

// Service "/getStock" creates a new stock object
app.get('/getStock', (req, res) => {
  let msg = '';
  let stock = getStock(req.body.stockname);

  if (stock == null) {
    res.status(404);
    msg = req.body.stockname + ' not found';
  } else {
    msg = stock;
  }

  res.send(msg);
});

// Service "/" returns a Hello message
app.get('/', (req, res) => {
  res.send('{"name": "Hello World!"}');
});

// Service "/demo" returns a Hello message
app.get('/demo', (req, res) => {
  res.send('{"name": "Hello Demo!"}');
});

// Service "/error" returns status 404 and an error message
app.get('/error', (req, res) => {
  res.status(404).send('Sorry, we cannot find that!');
});

// Service "/sample" returns status 401
app.get('/sample', (req, res) => {
  res.status(401).send("Sorry, you aren't authorized!");
});

app.listen(process.env.PORT, () =>
  console.log(`Example app listening on port ${process.env.PORT}!`),
);

function createStock(stockname, wkz, symbol) {
  let stock = {'stockname': stockname, 'wkz': wkz, 'symbol': symbol};
  return(stock);
}

function getStock(stockname) {
  let realStockname = Object.keys(portfolio).find(element => {
    return(element.includes(stockname));
  })
  return(portfolio[realStockname]);
}

function initPortfolio() {
  let stock = createStock("Daimler Benz", 846900, "DAI");
  portfolio[stock.stockname] = stock;

  stock = createStock("Deutsche Telekom", 555750, "DTEA");
  portfolio[stock.stockname] = stock;
}
