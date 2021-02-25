-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** "USERS"

CREATE TABLE USERS
(
 USERS_ID   text NOT NULL,
 NAME      text NOT NULL,
 SURNAME   text NOT NULL,
 EMAIL     text NOT NULL,
 NICKNAME  text NOT NULL,
 PASSWORD  text NOT NULL,
 JOIN_DATE date NOT NULL,
 CONSTRAINT PK_users PRIMARY KEY ( USERS_ID )
);

-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** CATEGORIES

CREATE TABLE CATEGORIES
(
 CATEGORIES_ID text NOT NULL,
 NAME        text NOT NULL,
 CONSTRAINT PK_categories PRIMARY KEY ( CATEGORIES_ID )
);

-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** STOCKS

CREATE TABLE STOCKS
(
 ISIN        text NOT NULL,
 CATEGORIES_ID text NOT NULL,
 NAME        text NOT NULL,
 WKN         text NOT NULL,
 SYMBOL      text NOT NULL,
 CONSTRAINT PK_stocks PRIMARY KEY ( ISIN ),
 CONSTRAINT FK_38 FOREIGN KEY ( CATEGORIES_ID ) REFERENCES CATEGORY ( CATEGORIES_ID )
);

CREATE INDEX fkIdx_39 ON STOCKS
(
 CATEGORIES_ID
);

-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** QUOTES

CREATE TABLE QUOTES
(
 QUOTES_ID    text NOT NULL,
 ISIN        text NOT NULL,
 PRICE       decimal NOT NULL,
 CURRENCY    text NOT NULL,
 MARKET_TIME timestamp NOT NULL,
 EXCHANGE    text NOT NULL,
 CONSTRAINT PK_quotes PRIMARY KEY ( QUOTES_ID ),
 CONSTRAINT FK_27 FOREIGN KEY ( ISIN ) REFERENCES STOCKS ( ISIN )
);

CREATE INDEX fkIdx_28 ON QUOTES
(
 ISIN
);

-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** PORTFOLIOS

CREATE TABLE PORTFOLIOS
(
 PORTFOLIOS_ID text NOT NULL,
 NAME         text NOT NULL,
 CREATED_AT   timestamp NOT NULL,
 USERS_ID      text NOT NULL,
 CONSTRAINT PK_portfolios PRIMARY KEY ( PORTFOLIOS_ID ),
 CONSTRAINT FK_50 FOREIGN KEY ( USERS_ID ) REFERENCES USERS ( USERS_ID )
);

CREATE INDEX fkIdx_51 ON PORTFOLIOS
(
 USERS_ID
);

-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** HOLDINGS

CREATE TABLE HOLDINGS
(
 HOLDINGS_ID  text NOT NULL,
 PORTFOLIOS_ID text NOT NULL,
 ISIN         text NOT NULL,
 QUANTITY     int NOT NULL,
 START_DATE   date NOT NULL,
 END_DATE     date NULL,
 CONSTRAINT PK_holdings PRIMARY KEY ( HOLDINGS_ID ),
 CONSTRAINT FK_18 FOREIGN KEY ( PORTFOLIOS_ID ) REFERENCES PORTFOLIOS ( PORTFOLIOS_ID ),
 CONSTRAINT FK_21 FOREIGN KEY ( ISIN ) REFERENCES STOCKS ( ISIN )
);

CREATE INDEX fkIdx_19 ON HOLDINGS
(
 PORTFOLIOS_ID
);

CREATE INDEX fkIdx_22 ON HOLDINGS
(
 ISIN
);

-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** TRANSACTIONS

CREATE TABLE TRANSACTIONS
(
 TRANSACTIONS_ID     text NOT NULL,
 HOLDINGS_ID text NOT NULL,
 BUY                boolean NOT NULL,
 TRANSACTION_TIME   timestamp NOT NULL,
 AMOUNT             int NOT NULL,
 PRICE              decimal NOT NULL,
 COMMISSION         decimal NOT NULL,
 BROKER             text NOT NULL,
 CONSTRAINT PK_transactions PRIMARY KEY ( TRANSACTIONS_ID ),
 CONSTRAINT FK_61 FOREIGN KEY ( HOLDINGS_ID ) REFERENCES HOLDINGS ( HOLDINGS_ID )
);

CREATE INDEX fkIdx_62 ON TRANSACTIONS
(
 HOLDINGS_ID
);

