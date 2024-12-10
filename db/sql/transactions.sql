-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** transaction

CREATE TABLE transaction
(
 transaction_id   text NOT NULL,
 holding_id       text NOT NULL,
 buy             boolean NOT NULL,
 transaction_time timestamp NOT NULL,
 amount          int NOT NULL,
 price           decimal NOT NULL,
 commission      decimal NOT NULL,
 broker          text NOT NULL,
 CONSTRAINT pk_transaction PRIMARY KEY ( transaction_id ),
 CONSTRAINT fk_61 FOREIGN KEY ( holding_id ) REFERENCES holding ( holding_id )
);

CREATE INDEX fkidx_62 ON transaction
(
 holding_id
);
