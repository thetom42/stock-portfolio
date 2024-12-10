-- *************** SqlDBM: PostgreSQL ****************;
-- ***************************************************;


-- ************************************** user

CREATE TABLE user
(
 user_id   text NOT NULL,
 name      text NOT NULL,
 surname   text NOT NULL,
 email     text NOT NULL,
 nickname  text NOT NULL,
 password  text NOT NULL,
 join_date date NOT NULL,
 CONSTRAINT pk_user PRIMARY KEY ( user_id )
);
