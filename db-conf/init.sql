

-- Initialize database


/* Drop Tables */

set role postgres;

DROP TABLE IF EXISTS accidents;
DROP TABLE IF EXISTS archive;
DROP TABLE IF EXISTS manager_on_contract;
DROP TABLE IF EXISTS raw_contracts;
DROP TABLE IF EXISTS cars;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS managers;
DROP TABLE IF EXISTS parkings;
DROP TABLE IF EXISTS users;




/* Create Tables */

CREATE TABLE accidents
(
	ID_accident int NOT NULL UNIQUE,
	is_confirmed boolean NOT NULL,
	driving_license varchar(10) NOT NULL,
	vin_number varchar(100) NOT NULL UNIQUE,
	PRIMARY KEY (ID_accident)
) WITHOUT OIDS;


CREATE TABLE archive
(
	ID_record serial UNIQUE,

	ID_contract int NOT NULL,
	start_date date NOT NULL,
	end_date date NOT NULL,
	total_price money NOT NULL,

	car_vin_number varchar(100) NOT NULL UNIQUE,
	
	client_driving_license varchar(10) NOT NULL UNIQUE,
	client_name varchar(100) NOT NULL,
	phone_number varchar(20) UNIQUE,

	manager_passport_details varchar(90) NOT NULL UNIQUE,
	manager_name varchar(100) NOT NULL,

	PRIMARY KEY (ID_record)
) WITHOUT OIDS;


CREATE TABLE cars
(
	vin_number varchar(100) NOT NULL UNIQUE,
	cost_per_hour money,
	car_brand varchar(40) NOT NULL,
	car_color varchar(20) NOT NULL,
	car_class varchar(20) NOT NULL,
	transmission_type varchar(4) NOT NULL,
	fuel_type varchar(20) NOT NULL,
	locked boolean DEFAULT 'FALSE' NOT NULL,
	ID_parking int NOT NULL,
	PRIMARY KEY (vin_number)
) WITHOUT OIDS;


CREATE TABLE clients
(
	driving_license varchar(10) NOT NULL,
	name varchar(100) NOT NULL,
	phone varchar(20) UNIQUE,
	email varchar(50) UNIQUE,
	date_of_birth date,
	registration_address varchar,
	residence_address varchar,
	username varchar(20) NOT NULL UNIQUE,
	PRIMARY KEY (driving_license)
) WITHOUT OIDS;


CREATE TABLE managers
(
	manager_passport_details varchar(90) NOT NULL UNIQUE,
	name varchar(100) NOT NULL,
	phone varchar(20) NOT NULL UNIQUE,
	expirience smallint DEFAULT 0,
	salary int,
	username varchar(20) NOT NULL UNIQUE,
	ID_parking int NOT NULL UNIQUE,
	PRIMARY KEY (manager_passport_details)
) WITHOUT OIDS;


CREATE TABLE manager_on_contract
(
	manager_passport_details varchar(90) NOT NULL UNIQUE,
	ID_contract int NOT NULL UNIQUE
) WITHOUT OIDS;


CREATE TABLE parkings
(
	ID_parking int NOT NULL UNIQUE,
	address varchar(100) NOT NULL,
	PRIMARY KEY (ID_parking)
) WITHOUT OIDS;


CREATE TABLE raw_contracts
(
	ID_contract int NOT NULL UNIQUE,
	rental_duration interval NOT NULL,
	total_price money NOT NULL,
	driving_license varchar(10) NOT NULL UNIQUE,
	vin_number varchar(100) NOT NULL UNIQUE,
	signed boolean DEFAULT 'FALSE' NOT NULL,
	PRIMARY KEY (ID_contract)
) WITHOUT OIDS;


CREATE TABLE users
(
	username varchar(20) NOT NULL UNIQUE,
	password varchar(30) NOT NULL,
	PRIMARY KEY (username)
) WITHOUT OIDS;



/* Create Foreign Keys */

ALTER TABLE accidents
	ADD FOREIGN KEY (vin_number)
	REFERENCES cars (vin_number)
	ON UPDATE NO ACTION
	ON DELETE NO ACTION
;


ALTER TABLE accidents
	ADD FOREIGN KEY (driving_license)
	REFERENCES clients (driving_license)
	ON UPDATE NO ACTION
	ON DELETE NO ACTION
;


ALTER TABLE raw_contracts
	ADD FOREIGN KEY (vin_number)
	REFERENCES cars (vin_number)
	ON UPDATE NO ACTION
	ON DELETE NO ACTION
;


ALTER TABLE raw_contracts
	ADD FOREIGN KEY (driving_license)
	REFERENCES clients (driving_license)
	ON UPDATE NO ACTION
	ON DELETE NO ACTION
;


ALTER TABLE manager_on_contract
	ADD FOREIGN KEY (manager_passport_details)
	REFERENCES managers (manager_passport_details)
	ON UPDATE NO ACTION
	ON DELETE NO ACTION
;


ALTER TABLE cars
	ADD FOREIGN KEY (ID_parking)
	REFERENCES parkings (ID_parking)
	ON UPDATE NO ACTION
	ON DELETE NO ACTION
;


ALTER TABLE managers
	ADD FOREIGN KEY (ID_parking)
	REFERENCES parkings (ID_parking)
	ON UPDATE NO ACTION
	ON DELETE NO ACTION
;


ALTER TABLE manager_on_contract
	ADD FOREIGN KEY (ID_contract)
	REFERENCES raw_contracts (ID_contract)
	ON UPDATE CASCADE
	ON DELETE CASCADE
;


ALTER TABLE clients
	ADD FOREIGN KEY (username)
	REFERENCES users (username)
	ON UPDATE NO ACTION
	ON DELETE NO ACTION
;


ALTER TABLE managers
	ADD FOREIGN KEY (username)
	REFERENCES users (username)
	ON UPDATE NO ACTION
	ON DELETE NO ACTION
;


/* Comments */

COMMENT ON COLUMN clients.name IS 'Фамилия Имя Отчество клиента';
COMMENT ON COLUMN clients.phone IS 'Потребуется для быстрой связи с клиентом. Тип данных - могло быть и число, но для простоты учебного примера - пусть будет строка';
COMMENT ON COLUMN clients.email IS 'Электронный адрес';


-- Fill 

delete from users;

INSERT INTO users (username, role) VALUES
('user1', 'client'),
('user2', 'manager'),
('user3', 'admin'),
('user4', 'manager');


-- Functions

drop function if exists check_auth;
drop function if exists archive_contract;

create function check_auth (input_username varchar)
returns varchar as 
$$
declare 
    user_role varchar;
begin
    select role into user_role from users u
    where input_username = u.username;
    return user_role;
end
$$ LANGUAGE plpgsql;

create function archive_contract () 
returns trigger as 
$$
begin

    if new.signed = true then
        insert into archive ( ID_contract, 
            start_date, 
            end_date, 
            total_price, 
            car_vin_number, 
            client_driving_license, 
            client_name, 
            phone_number, 
            manager_passport_details, 
            manager_name) values (
                new.ID_contract,
                now(),
                now() + new.rental_duration,
                new.total_price,
                new.vin_number,
                new.driving_license,
                (select name from clients c where c.driving_license = new.driving_license),
                (select phone from clients c where c.driving_license = new.driving_license),
                (select manager_passport_details from managers m where m.manager_passport_details in (
                    select manager_passport_details from manager_on_contract mc where mc.ID_contract = new.ID_contract)
                ),
                (select name from managers m where m.manager_passport_details in (
                    select manager_passport_details from manager_on_contract mc where mc.ID_contract = new.ID_contract)
                )
        );

        delete from raw_contracts where new.ID_contract = old.ID_contract;
        return new;
    end if;
end;
$$ language plpgsql;


-- Triggers

CREATE OR REPLACE TRIGGER contract_signed 
    AFTER UPDATE OF signed 
    ON raw_contracts
    FOR EACH ROW
    EXECUTE PROCEDURE archive_contract();


-- Roles

drop role if exists _admin;
drop role if exists user4;
drop role if exists _manager;
drop role if exists _client;
drop role if exists _server;

create role _admin createrole;
create role _manager;
create role _client;
create role _server connection limit 1;

create user user4;
grant _manager to user4;


grant all on all tables in schema public to _admin;


grant select on cars, managers to _manager;
grant insert on archive, accidents to _manager;
grant update on raw_contracts to _manager;


grant insert on raw_contracts to _client;


grant select on users to _server;


-- Policies

set role postgres;
alter table cars enable row level security;

create policy manager_select_cars_policy on cars
    for select to _manager
    using ((select ID_parking from managers where username = current_user) = ID_parking);

