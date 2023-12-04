const { postgresql } = require("pg") 

const { Pool } = postgresql;

const getConnection = (callback = null) => {
    const pool = new Pool({
        user: "postgres",
        database: "rentdb",
        password: "P0stgrePass",
        host: "localhost",
        port: "5432"
    });

    const connection = {
        pool, 
        query: (...args) => {
            return pool.connect().then((client) => {
                return client.query(...args).then((res) => {
                  client.release();
                  return res.rows;
                });
            });
        }
    };

    process.postgresql = connection;

    if (callback) {
        callback(connection);
    }

    return connection;
};

module.exports = {
    getConnection
}