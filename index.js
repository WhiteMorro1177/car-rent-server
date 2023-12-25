
// db connection config
import pg from "pg";
const client = new pg.Client({
    host: 'db',
    port: 5432,
    database: 'rentdb',
    user: 'postgres',
    password: 'P0stgrePass',
  })


const PORT = process.env.PORT || 3002;
const errorMessage = "Error in request";

import express from "express";
const app = express();
app.use(express.json());


// login controller

// check authentification for client and manager
app.post("/login", async (req, res) => {
    try {
        await client.query("set role postgres");

        console.log("Request body:", req.body);
        const username = req.body.username;
        const password = req.body.password;
        
        const queryResult = await client.query("select check_auth($1, $2)", [username, password]);
        const user_role = queryResult.rows[0].check_auth;
        
        console.log(user_role);
        if (user_role === "null") {
            res.status(404).send(null);
        }
        console.log("Authentification successfull");
        res.status(200).send(user_role);
    } catch (exc) {
        res.status(404).send(errorMessage);
    }
});


// create new client
app.post("/auth", async (req, res) => {
    try {
        await client.query("set role postgres");

        console.log("Request body:", req.body);
        const username = req.body.username;
        const password = req.body.password;
        
        await client.query("call add_user($1, $2)", [username, password]);
        res.status(200).send(username);
    } catch (exc) {
        res.status(404).send(errorMessage);
    }
});


// client controller

// get cars list
app.get("/cars/:username", async (req, res) => {
    try {
        const username = req.params.username;
        console.log(username);
        await client.query(`set role ${username}`);
        
        const queryResult = await client.query("select * from get_cars()");
        console.log(queryResult);
        res.status(200).send(queryResult.rows);
    } catch (exc) {
        res.status(404).send(errorMessage);
    }
});

// get parkings list
app.get("/parkings/:username", async (req, res) => {
    try {
        const username = req.params.username;
        await client.query(`set role ${username}`);
        
        const queryResult = await client.query("select * from get_parkings()");
        console.log(queryResult);
        res.status(200).send(queryResult.rows);
    } catch (exc) {
        res.status(404).send(errorMessage);
    }
});

// create account
app.post("/account", async (req, res) => {
    try {
        console.log("Request body:", req.body);

        const drivingLicense = req.body.drivingLicense;
        const name = req.body.name;
        const phone = req.body.phone;
        const email = req.body.email;
        const date = req.body.date;
        const regAddress = req.body.regAddress;
        const resAddress = req.body.resAddress;
        
        const username = req.body.username;
        await client.query(`set role ${username}`);

        const queryResult = await client.query("insert into clients (driving_license, name, phone, email, date_of_birth, registration_address, residence_address, username) values ($1, $2, $3, $4, $5, $6, $7, $8)", [drivingLicense, name, phone, email, date, regAddress, resAddress, username]);
        
        res.status(200).send("Account created");
    } catch (exc) {
        res.status(404).send(errorMessage);
    }
})

// create contract
app.post("/contract", async (req, res) => {
    try {
        console.log("Request body:", req.body);
        const username = req.body.username;
        await client.query(`set role ${username}`);
        
        const vinNumber = req.body.vin;
        const rentalDuration = req.body.duration;

        const queryResult = await client.query(`select add_contract($1, $2, $3)`, [username, vinNumber, rentalDuration]);
        const contractId = queryResult.rows[0].add_contract;
        console.log(queryResult.rows);
        res.status(200).send(contractId);
    } catch (exc) {
        res.status(404).send(errorMessage);
    }
});

// report about car accident
app.post("/accident", async (req, res) => {
    console.log("Request body:", req.body);

    const username = req.body.username;
    await client.query(`set role ${username}`);

    const vin = req.body.vin;
    const queryResult = await client.query("select add_accident($1, $2)", [username, vin]);

    const accidentId = queryResult.rows[0].add_accident;
    console.log(queryResult.rows);
    res.status(200).send(accidentId);
});



// manager controller

//get raw contracts
app.get("/contracts/:username", async (req, res) => {
    try {
        const username = req.params.username;
        console.log("Manager username:", username);
        await client.query(`set role ${username}`);

        const queryResult = await client.query("select * from get_raw_contracts()");
        console.log(queryResult.rows);
        res.status(200).send(queryResult.rows);
    } catch (exc) {
        res.status(404).send(errorMessage);
    }
});

// get raw accidents
app.get("/accidents/:username", async (req, res) => {
    try {
        const username = req.params.username;
        console.log("Manager username:", username);
        await client.query(`set role ${username}`);

        const queryResult = await client.query("select * from get_raw_accidents()");
        console.log(queryResult.rows);
        res.status(200).send(queryResult.rows);
    } catch (exc) {
        res.status(404).send(errorMessage);
    }
});

// get returnable cars
app.get("/return/:username", async (req, res) => {
    try {
        const username = req.params.username;
        console.log("Manager username:", username);
        await client.query(`set role ${username}`);

        const queryResult = await client.query("select * from get_return()");
        console.log(queryResult.rows);
        res.status(200).send(queryResult.rows);
    } catch (exc) {
        res.status(404).send(errorMessage);
    }
});


// submit contract
app.post("/contracts", async (req, res) => {
    try {
        console.log("Request body:", req.body);

        const username = req.body.username;
        await client.query(`set role ${username}`);

        const id = req.body.id;
        const queryResult = await client.query("call confirm_contract($1)", [id]);

        console.log(queryResult);
        
        res.status(200).send("Contract confirmed");
    } catch (exc) {
        res.status(404).send(errorMessage);
    }
});

// confirm car accident
app.post("/accidents", async (req, res) => {
    try {
        console.log("Request body:", req.body);
        const username = req.body.username;
        await client.query(`set role ${username}`);

        const id = req.body.id;
        const queryResult = await client.query("call confirm_accident($1)", [id]);
        
        res.status(200).send("Accident confirmed");
    } catch (exc) {
        res.status(404).send(errorMessage);
    }
});

// return car on parking
app.post("/return", async (req, res) => {
    try {
        console.log("Request body:", req.body);
        const username = req.body.username;
        await client.query(`set role ${username}`);

        const id = req.body.id;
        const vinNumber = req.body.vin;
        const queryResult = await client.query("call return_car($1, $2)", [id, vinNumber]);
        
        res.status(200).send("Car registered");
    } catch (exc) {
        res.status(404).send(errorMessage);
    }
});



// start server
app.listen(PORT, async () => {
    await client.connect();
    console.log("Server started on port", PORT)
});