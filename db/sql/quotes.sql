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
