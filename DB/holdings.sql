-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** HOLDINGS

CREATE TABLE HOLDINGS
(
 HOLDINGS_ID  text NOT NULL,
 PORTFOLIO_ID text NOT NULL,
 ISIN         text NOT NULL,
 QUANTITY     int NOT NULL,
 START_DATE   date NOT NULL,
 END_DATE     date NULL,
 CONSTRAINT PK_portfolio_stock_assoc PRIMARY KEY ( HOLDINGS_ID ),
 CONSTRAINT FK_18 FOREIGN KEY ( PORTFOLIO_ID ) REFERENCES PORTFOLIO ( PORTFOLIO_ID ),
 CONSTRAINT FK_21 FOREIGN KEY ( ISIN ) REFERENCES STOCK ( ISIN )
);

CREATE INDEX fkIdx_19 ON HOLDINGS
(
 PORTFOLIO_ID
);

CREATE INDEX fkIdx_22 ON HOLDINGS
(
 ISIN
);