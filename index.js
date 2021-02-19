import 'dotenv/config';
import cors from 'cors';
import express from 'express';
 
const app = express();
app.use(cors()); // set cors support
app.use(express.urlencoded({ extended: false })); // parse application/x-www-form-urlencoded
app.use(express.json()); // parse application/json

var daimler = {};
daimler.Stockname = "Daimler Benz";
daimler.WKN = 846900;
daimler.Symbol = "DAI";

var telekom = {};
telekom.Stockname = "Deutsche Telekom";
telekom.WKN = 555750;
telekom.Symbol = "DTEA";

//var str1 = 'Test';

// Service "/" returns a Hello message
app.get('/', (req, res) => {
  res.send('{"name": "Hello World!"}');
});

// Service "/Daimler" returns the Daimler stock
app.get('/Daimler', (req, res) => {
  res.send(daimler);
});

// Service "/Telekom" returns the Telekom stock
app.get('/Telekom', (req, res) => {
  res.send(telekom);
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

// Service "/createObject" creates an object
app.post('/createObject', (req, res) => { 
  console.log(req.body);
  res.json(req.body);
});
 
app.listen(process.env.PORT, () =>
  console.log(`Example app listening on port ${process.env.PORT}!`),
);
