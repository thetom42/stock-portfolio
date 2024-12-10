-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** holding

CREATE TABLE holding
(
 holding_id   text NOT NULL,
 portfolio_id text NOT NULL,
 isin         text NOT NULL,
 quantity     int NOT NULL,
 start_date   date NOT NULL,
 end_date     date NULL,
 CONSTRAINT pk_holding PRIMARY KEY ( holding_id ),
 CONSTRAINT fk_18 FOREIGN KEY ( portfolio_id ) REFERENCES portfolio ( portfolio_id ),
 CONSTRAINT fk_21 FOREIGN KEY ( isin ) REFERENCES stock ( isin )
);

CREATE INDEX fkidx_19 ON holding
(
 portfolio_id
);

CREATE INDEX fkidx_22 ON holding
(
 isin
);
