-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** CATEGORY

CREATE TABLE CATEGORY
(
 CATEGORY_ID text NOT NULL,
 NAME        text NOT NULL,
 CONSTRAINT PK_category PRIMARY KEY ( CATEGORY_ID )
);
