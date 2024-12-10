-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** category

CREATE TABLE category
(
 category_id text NOT NULL,
 name        text NOT NULL,
 CONSTRAINT pk_category PRIMARY KEY ( category_id )
);
