-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** user

CREATE TABLE user
(
 user_id    text NOT NULL,
 name      text NOT NULL,
 surname   text NOT NULL,
 email     text NOT NULL,
 nickname  text NOT NULL,
 password  text NOT NULL,
 join_date date NOT NULL,
 CONSTRAINT pk_user PRIMARY KEY ( user_id )
);

-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** category

CREATE TABLE category
(
 category_id text NOT NULL,
 name        text NOT NULL,
 CONSTRAINT pk_category PRIMARY KEY ( category_id )
);

-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** stock

CREATE TABLE stock
(
 isin        text NOT NULL,
 category_id text NOT NULL,
 name        text NOT NULL,
 wkn         text NOT NULL,
 symbol      text NOT NULL,
 CONSTRAINT pk_stock PRIMARY KEY ( isin ),
 CONSTRAINT fk_38 FOREIGN KEY ( category_id ) REFERENCES category ( category_id )
);

CREATE INDEX fkidx_39 ON stock
(
 category_id
);

-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** quote

CREATE TABLE quote
(
 quote_id    text NOT NULL,
 isin        text NOT NULL,
 price       decimal NOT NULL,
 currency    text NOT NULL,
 market_time timestamp NOT NULL,
 exchange    text NOT NULL,
 CONSTRAINT pk_quote PRIMARY KEY ( quote_id ),
 CONSTRAINT fk_27 FOREIGN KEY ( isin ) REFERENCES stock ( isin )
);

CREATE INDEX fkidx_28 ON quote
(
 isin
);

-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** portfolio

CREATE TABLE portfolio
(
 portfolio_id text NOT NULL,
 name         text NOT NULL,
 created_at   timestamp NOT NULL,
 user_id      text NOT NULL,
 CONSTRAINT pk_portfolio PRIMARY KEY ( portfolio_id ),
 CONSTRAINT fk_50 FOREIGN KEY ( user_id ) REFERENCES user ( user_id )
);

CREATE INDEX fkidx_51 ON portfolio
(
 user_id
);

-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** holding

CREATE TABLE holding
(
 holding_id   text NOT NULL,
 portfolio_id text NOT NULL,
 isin         text NOT NULL,
 quantity     int NOT NULL,
 start_date   date NOT NULL,
 end_date     date NULL,
 CONSTRAINT pk_holding PRIMARY KEY ( holding_id ),
 CONSTRAINT fk_18 FOREIGN KEY ( portfolio_id ) REFERENCES portfolio ( portfolio_id ),
 CONSTRAINT fk_21 FOREIGN KEY ( isin ) REFERENCES stock ( isin )
);

CREATE INDEX fkidx_19 ON holding
(
 portfolio_id
);

CREATE INDEX fkidx_22 ON holding
(
 isin
);

-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** transaction

CREATE TABLE transaction
(
 transaction_id     text NOT NULL,
 holding_id text NOT NULL,
 buy                boolean NOT NULL,
 transaction_time   timestamp NOT NULL,
 amount             int NOT NULL,
 price              decimal NOT NULL,
 commission         decimal NOT NULL,
 broker             text NOT NULL,
 CONSTRAINT pk_transaction PRIMARY KEY ( transaction_id ),
 CONSTRAINT fk_61 FOREIGN KEY ( holding_id ) REFERENCES holding ( holding_id )
);

CREATE INDEX fkidx_62 ON transaction
(
 holding_id
);
