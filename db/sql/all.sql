-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** users

CREATE TABLE users
(
 users_id   text NOT NULL,
 name      text NOT NULL,
 surname   text NOT NULL,
 email     text NOT NULL,
 nickname  text NOT NULL,
 password  text NOT NULL,
 join_date date NOT NULL,
 CONSTRAINT pk_users PRIMARY KEY ( users_id )
);

-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** categories

CREATE TABLE categories
(
 categories_id text NOT NULL,
 name        text NOT NULL,
 CONSTRAINT pk_categories PRIMARY KEY ( categories_id )
);

-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** stocks

CREATE TABLE stocks
(
 isin        text NOT NULL,
 categories_id text NOT NULL,
 name        text NOT NULL,
 wkn         text NOT NULL,
 symbol      text NOT NULL,
 CONSTRAINT pk_stocks PRIMARY KEY ( isin ),
 CONSTRAINT fk_38 FOREIGN KEY ( categories_id ) REFERENCES categories ( categories_id )
);

CREATE INDEX fkidx_39 ON stocks
(
 categories_id
);

-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** quotes

CREATE TABLE quotes
(
 quotes_id    text NOT NULL,
 isin        text NOT NULL,
 price       decimal NOT NULL,
 currency    text NOT NULL,
 market_time timestamp NOT NULL,
 exchange    text NOT NULL,
 CONSTRAINT pk_quotes PRIMARY KEY ( quotes_id ),
 CONSTRAINT fk_27 FOREIGN KEY ( isin ) REFERENCES stocks ( isin )
);

CREATE INDEX fkidx_28 ON quotes
(
 isin
);

-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** portfolios

CREATE TABLE portfolios
(
 portfolios_id text NOT NULL,
 name         text NOT NULL,
 created_at   timestamp NOT NULL,
 users_id      text NOT NULL,
 CONSTRAINT pk_portfolios PRIMARY KEY ( portfolios_id ),
 CONSTRAINT fk_50 FOREIGN KEY ( users_id ) REFERENCES users ( users_id )
);

CREATE INDEX fkidx_51 ON portfolios
(
 users_id
);

-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** holdings

CREATE TABLE holdings
(
 holdings_id  text NOT NULL,
 portfolios_id text NOT NULL,
 isin         text NOT NULL,
 quantity     int NOT NULL,
 start_date   date NOT NULL,
 end_date     date NULL,
 CONSTRAINT pk_holdings PRIMARY KEY ( holdings_id ),
 CONSTRAINT fk_18 FOREIGN KEY ( portfolios_id ) REFERENCES portfolios ( portfolios_id ),
 CONSTRAINT fk_21 FOREIGN KEY ( isin ) REFERENCES stocks ( isin )
);

CREATE INDEX fkidx_19 ON holdings
(
 portfolios_id
);

CREATE INDEX fkidx_22 ON holdings
(
 isin
);

-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** transactions

CREATE TABLE transactions
(
 transactions_id     text NOT NULL,
 holdings_id text NOT NULL,
 buy                boolean NOT NULL,
 transaction_time   timestamp NOT NULL,
 amount             int NOT NULL,
 price              decimal NOT NULL,
 commission         decimal NOT NULL,
 broker             text NOT NULL,
 CONSTRAINT pk_transactions PRIMARY KEY ( transactions_id ),
 CONSTRAINT fk_61 FOREIGN KEY ( holdings_id ) REFERENCES holdings ( holdings_id )
);

CREATE INDEX fkidx_62 ON transactions
(
 holdings_id
);
