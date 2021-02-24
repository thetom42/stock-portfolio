-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** TRANSACTION

CREATE TABLE TRANSACTION
(
 TRANSACTION_ID     text NOT NULL,
 PORTFOLIO_STOCK_ID text NOT NULL,
 TRANSACTION_TIME   timestamp NOT NULL,
 AMOUNT             int NOT NULL,
 COST               decimal NOT NULL,
 PRICE              decimal NOT NULL,
 CONSTRAINT PK_transaction PRIMARY KEY ( TRANSACTION_ID ),
 CONSTRAINT FK_61 FOREIGN KEY ( PORTFOLIO_STOCK_ID ) REFERENCES PORTFOLIO_STOCK ( PORTFOLIO_STOCK_ID )
);

CREATE INDEX fkIdx_62 ON TRANSACTION
(
 PORTFOLIO_STOCK_ID
);
