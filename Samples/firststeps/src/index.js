import 'dotenv/config';
import cors from 'cors';
import express from 'express';
 
const app = express();
app.use(cors()); // set cors support
app.use(express.urlencoded({ extended: false })); // parse application/x-www-form-urlencoded
app.use(express.json()); // parse application/json

var portfolio = {};

// Service "/" returns a Hello message
app.get('/', (req, res) => {
  res.send('{"name": "Hello World!"}');
});

// Service "/getStocks" returns all stocks
app.get('/getStocks', (req, res) => {
  res.send(portfolio);
});
 
// Service "/error" returns status 404 and an error message
app.get('/error', (req, res) => {
  res.status(404).send('Sorry, we cannot find that!');
});

// Service "/sample" returns status 401
app.get('/sample', (req, res) => {
  res.status(401).send("Sorry, you aren't authorized!");
});

// Service "/getStock" returns a stock
app.get('/getStock', (req, res) => {
  let stock = getStock(req.body.stockname);

  if (stock == null) {
    res.status(404).send('Sorry, we cannot find the stock "' + req.body.stockname + '"!');
  } else {
    res.send(stock); 
  }
});

// Service "/createStock" creates an object
app.post('/createStock', (req, res) => { 
  let stock = createStock(req.body.stockname, req.body.wkn, req.body.symbol);
  portfolio[stock.stockname] = stock;
  
  res.send("Stock object successfully created!");
});

// Service "/createPortfolio" creates an object
app.post('/createPortfolio', (req, res) => { 
  portfolio = createPortfolio();
  
  res.send("Portfolio successfully created!");
});
 
app.listen(process.env.PORT, () =>
  console.log(`Example app listening on port ${process.env.PORT}!`),
);

function createStock(stockname, wkn, symbol){
  let stock = {};
  
  stock.stockname = stockname;
  stock.wkn = wkn;
  stock.symbol = symbol;

  return(stock);
}

function createPortfolio(){
  let portfolio = {};
  let stock = createStock("Daimler Benz", 846900, "DAI");
  portfolio[stock.stockname] = stock; 

  stock = createStock("Deutsche Telekom", 555750, "DTEA");
  portfolio[stock.stockname] = stock;

  return(portfolio);
} 

function getStock(stockname){
  let realStockname = Object.keys(portfolio).find(element => {
    return (element.includes(stockname));
  });

  return(portfolio[realStockname]);
}