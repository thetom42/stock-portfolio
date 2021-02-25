-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** "USER"

CREATE TABLE "USER"
(
 USER_ID   text NOT NULL,
 NAME      text NOT NULL,
 SURNAME   text NOT NULL,
 EMAIL     text NOT NULL,
 NICKNAME  text NOT NULL,
 PASSWORD  text NOT NULL,
 JOIN_DATE date NOT NULL,
 CONSTRAINT PK_user PRIMARY KEY ( USER_ID )
);
