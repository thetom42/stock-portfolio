-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** PORTFOLIOS

CREATE TABLE PORTFOLIOS
(
 PORTFOLIOS_ID text NOT NULL,
 NAME         text NOT NULL,
 CREATED_AT   timestamp NOT NULL,
 USERS_ID      text NOT NULL,
 CONSTRAINT PK_portfolios PRIMARY KEY ( PORTFOLIOS_ID ),
 CONSTRAINT FK_50 FOREIGN KEY ( USERS_ID ) REFERENCES USERS ( USERS_ID )
);

CREATE INDEX fkIdx_51 ON PORTFOLIOS
(
 USERS_ID
);
