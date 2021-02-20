import 'dotenv/config';
import cors from 'cors';
import express from 'express';
 
const app = express();
app.use(cors()); // set cors support
app.use(express.urlencoded({ extended: false })); // parse application/x-www-form-urlencoded
app.use(express.json()); // parse application/json

var portfolio = [];
var stock = {};

stock.stockname = "Daimler Benz";
stock.wkn = 846900;
stock.symbol = "DAI";
portfolio.push(stock);

stock = new Object();

stock.stockname = "Deutsche Telekom";
stock.wkn = 555750;
stock.symbol = "DTEA";
portfolio.push(stock);



//var str1 = 'Test';

// Service "/" returns a Hello message
app.get('/', (req, res) => {
  res.send('{"name": "Hello World!"}');
});

// Service "/stocks" returns all stocks
app.get('/stocks', (req, res) => {
  res.send(portfolio);
});

// Service "/Telekom" returns the Telekom stock
//app.get('/Telekom', (req, res) => {
//  res.send(telekom);
//});
 
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

// Service "/stock" returns a stock
app.get('/stock', (req, res) => {
  stock = portfolio.find(element => {
    return (element.stockname == req.body.stockname);
  });
  
  res.send(stock);
});

// Service "/createObject" creates an object
app.post('/createObject', (req, res) => { 
  stock = new Object();
  stock.stockname = req.body.stockname;
  stock.wkn = req.body.wkn;
  stock.symbol = req.body.symbol;
  portfolio.push(stock);
  
  res.send(stock);
});
 
app.listen(process.env.PORT, () =>
  console.log(`Example app listening on port ${process.env.PORT}!`),
);
