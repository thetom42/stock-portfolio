-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** PORTFOLIO_STOCK

CREATE TABLE PORTFOLIO_STOCK
(
 PORTFOLIO_STOCK_ID text NOT NULL,
 PORTFOLIO_ID       text NOT NULL,
 ISIN               text NOT NULL,
 AMOUNT             int NOT NULL,
 CONSTRAINT PK_portfolio_stock_assoc PRIMARY KEY ( PORTFOLIO_STOCK_ID ),
 CONSTRAINT FK_18 FOREIGN KEY ( PORTFOLIO_ID ) REFERENCES PORTFOLIO ( PORTFOLIO_ID ),
 CONSTRAINT FK_21 FOREIGN KEY ( ISIN ) REFERENCES STOCK ( ISIN )
);

CREATE INDEX fkIdx_19 ON PORTFOLIO_STOCK
(
 PORTFOLIO_ID
);

CREATE INDEX fkIdx_22 ON PORTFOLIO_STOCK
(
 ISIN
);