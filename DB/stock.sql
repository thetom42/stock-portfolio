-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** STOCK

CREATE TABLE STOCK
(
 ISIN        text NOT NULL,
 CATEGORY_ID text NOT NULL,
 NAME        text NOT NULL,
 WKN         text NOT NULL,
 SYMBOL      text NOT NULL,
 CONSTRAINT PK_stock PRIMARY KEY ( ISIN ),
 CONSTRAINT FK_38 FOREIGN KEY ( CATEGORY_ID ) REFERENCES CATEGORY ( CATEGORY_ID )
);

CREATE INDEX fkIdx_39 ON STOCK
(
 CATEGORY_ID
);