-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** stock

CREATE TABLE stock
(
 isin        text NOT NULL,
 category_id text NOT NULL,
 name        text NOT NULL,
 wkn         text NOT NULL,
 symbol      text NOT NULL,
 CONSTRAINT pk_stock PRIMARY KEY ( isin ),
 CONSTRAINT fk_38 FOREIGN KEY ( category_id ) REFERENCES category ( category_id )
);

CREATE INDEX fkidx_39 ON stock
(
 category_id
);
