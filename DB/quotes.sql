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