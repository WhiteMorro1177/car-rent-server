FROM postgres:latest

WORKDIR /db
COPY . /db

RUN cd /bin || psql -U postgres -d rentdb -f /db/db-config/init.sql