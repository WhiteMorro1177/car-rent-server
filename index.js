
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


// login controller
app.get("/login/:username&:password", async (req, res) => {
    try {
        const username = req.params.username;
        const password = req.params.password;
        
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

app.post("/auth/:username&:password", async (req, res) => {
    try {
        const username = req.params.username;
        const password = req.params.password;
        
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
app.post("/contract/:username/:vin&:duration", async (req, res) => {
    try {
        const username = req.params.username;
        await client.query(`set role ${username}`);

        // const drivingLisence = req.params.lisenceId;
        const vinNumber = req.params.vin;
        const rentalDuration = req.params.duration;

        const queryResult = await client.query("select prepare_contract($1, $2, $3)", [username, vinNumber, rentalDuration]);
        console.log(queryResult); // !!! parse the result !!!
        res.status(200).send("ok");
    } catch (exc) {
        res.status(404).send(errorMessage);
    }
});

// report about car accident
app.post("/accident/:username&:vin", async (req, res) => {
    const username = req.params.username;
    await client.query(`set role ${username}`);

    const vin = req.params.vin;
    const queryResult = await client.query("select add_accident($1, $2)", [username, vin]);
    console.log(queryResult); // !!! parse the result !!!

    res.status(200).send("Accident reported");
});



// manager controller

// sign contract
app.post("/contract/:id", async (req, res) => {
    res.status(200).send("ok")
});

// confirm car accident
app.post("/accident/:id", async (req, res) => {


    res.status(200).send("Accident confirmed");
});



// start server
app.listen(PORT, async () => {
    await client.connect();
    console.log("Server started on port", PORT)
});