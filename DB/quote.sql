-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** QUOTE

CREATE TABLE QUOTE
(
 QUOTE_ID    text NOT NULL,
 ISIN        text NOT NULL,
 PRICE       decimal NOT NULL,
 CURRENCY    text NOT NULL,
 MARKET_TIME timestamp NOT NULL,
 EXCHANGE    text NOT NULL,
 CONSTRAINT PK_quote PRIMARY KEY ( QUOTE_ID ),
 CONSTRAINT FK_27 FOREIGN KEY ( ISIN ) REFERENCES STOCK ( ISIN )
);

CREATE INDEX fkIdx_28 ON QUOTE
(
 ISIN
);