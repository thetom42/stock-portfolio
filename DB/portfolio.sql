-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** PORTFOLIO

CREATE TABLE PORTFOLIO
(
 PORTFOLIO_ID text NOT NULL,
 NAME         text NOT NULL,
 CREATED_AT   timestamp NOT NULL,
 USER_ID      text NOT NULL,
 CONSTRAINT PK_portfolio PRIMARY KEY ( PORTFOLIO_ID ),
 CONSTRAINT FK_50 FOREIGN KEY ( USER_ID ) REFERENCES "USER" ( USER_ID )
);

CREATE INDEX fkIdx_51 ON PORTFOLIO
(
 USER_ID
);
