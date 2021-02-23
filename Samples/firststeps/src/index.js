import 'dotenv/config';
import cors from 'cors';
import express from 'express';
const sqlite3 = require('sqlite3').verbose();
 
// open the database
let db = new sqlite3.Database('./db/portfolio.db', sqlite3.CREATE, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the portfolio database.');
});

const app = express();
app.use(cors()); // set cors support
app.use(express.urlencoded({ extended: false })); // parse application/x-www-form-urlencoded
app.use(express.json()); // parse application/json

var portfolio = [];

// Service "/" returns a Hello message
app.get('/', (req, res) => {
  res.send('{"name": "Hello World!"}');
});

// Service "/getStocks" returns all stocks
app.get('/getStocks', (req, res) => {
  res.send(portfolio);
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
  let msg = "";

  if (stock != null) {
    portfolio.push(stock);
    msg = "Stock object successfully created!";
  } else {
    msg = `Stock object could not be created for: stockname: "${req.body.stockname}",  wkn: "${req.body.wkn}", symbol: "${req.body.symbol}"`;
    res.status(404);
  }

  res.send(msg);
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
  let stock = null;
  
  if (!isNullOrEmpty(stockname) && !isNullOrEmpty(wkn) && !isNullOrEmpty(symbol)) {
    stock = {};
    stock.stockname = stockname;
    stock.wkn = wkn;
    stock.symbol = symbol;
  }

  return(stock);
}

function createPortfolio(){
  let portfolio = [];

  let stock = createStock("Daimler Benz", "846900", "DAI");
  portfolio.push(stock); 

  stock = createStock("Deutsche Telekom", "555750", "DTEA");
  portfolio.push(stock);

  return(portfolio);
} 

function getStock(searchstr) {
  let stock = portfolio.find(stock => {
    return(stock.stockname.includes(searchstr))});
  return(stock);
}

function isNullOrEmpty(obj) {
  return (obj == null || obj.length == 0 || obj.trim().length == 0);
};

function storePortfolio(portfolio) {
  db.serialize(() => {
    db.each(`SELECT PlaylistId as id,
                    Name as name
            FROM playlists`, (err, row) => {
      if (err) {
        console.error(err.message);
      }
      console.log(row.id + "\t" + row.name);
    });
  });
};

function closeDB() {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Close the database connection.');
  });
}
