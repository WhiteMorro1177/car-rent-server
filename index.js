
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
        await client.query(`set role ${username}`);
        
        const queryResult = await client.query("select * from get_cars()");
        console.log(queryResult); // !!! parse the result !!!
        res.status(200).send(queryResult.rows);
    } catch (exc) {
        res.status(404).send(errorMessage);
    }
});

// get parkings list
app.get("/parkings", async (req, res) => {
    res.status(200).send("ok");
});

// create contract
app.post("/contract", async (req, res) => {
    try {
        console.log("Request body:", req.body);
        const username = req.body.username;
        await client.query(`set role ${username}`);
        
        const vinNumber = req.body.vin;
        const rentalDuration = req.body.duration;

        const queryResult = await client.query(`select prepare_contract($1, $2, $3)`, [username, vinNumber, rentalDuration]);
        console.log(queryResult); // !!! parse the result !!!
        res.status(200).send("ok");
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
    console.log(queryResult); // !!! parse the result !!!

    res.status(200).send("Accident reported");
});



// manager controller

// sign contract
app.post("/contract", async (req, res) => {
    console.log("Request body:", req.body);
    const id = req.body.id;



    res.status(200).send("ok");
});

// confirm car accident
app.post("/accident", async (req, res) => {
    console.log("Request body:", req.body);
    const id = req.body.id;

    res.status(200).send("ok");
});



// start server
app.listen(PORT, async () => {
    await client.connect();
    console.log("Server started on port", PORT)
});