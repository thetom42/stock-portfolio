-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** portfolio

CREATE TABLE portfolio
(
 portfolio_id text NOT NULL,
 name         text NOT NULL,
 created_at   timestamp NOT NULL,
 user_id      text NOT NULL,
 CONSTRAINT pk_portfolio PRIMARY KEY ( portfolio_id ),
 CONSTRAINT fk_50 FOREIGN KEY ( user_id ) REFERENCES user ( user_id )
);

CREATE INDEX fkidx_51 ON portfolio
(
 user_id
);
