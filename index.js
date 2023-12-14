
// db connection config
import pg from "pg";
const client = new pg.Client({
    host: 'db',
    port: 5432,
    database: 'rentdb',
    user: 'postgres',
    password: 'P0stgrePass',
  })


const PORT = process.env.PORT | 3002;

import express from "express";
const app = express();


// login controller
app.get("/login/:username&:password", async (req, res) => {
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
});

app.post("/auth/:username&:password&:role", async (req, res) => {
    const username = req.params.username;
    const password = req.params.password;
    const role = req.params.role;

    await client.query("call add_user($1, $2, $3)", [username, password, role]);
    res.status(200).send(role);
});


// client controller

// get cars list
app.get("/cars/:username", async (req, res) => {
    const username = req.params.username;
    await client.query("set role $1", [username]);
    const queryResult = await client.query("select * from get_cars()");
    console.log(queryResult);
    res.status(200).send("ok");
});

// get parkings list
app.get("/parkings", async (req, res) => {
    res.status(200).send("ok");
});

// create contract
app.post("/contract/:users/:vin&:duration", async (req, res) => {
    const username = req.params.username;
    await client.query("set role $1", [username]);

    // const drivingLisence = req.params.lisenceId;
    const vinNumber = req.params.vin;
    const rentalDuration = req.params.duration;

    const queryResult = await client.query("select prepare_contract($1, $2, $3)", [username, vinNumber, rentalDuration]);
    console.log(queryResult);
    res.status(200).send("ok");
});



// manager controller

// sign contract
app.post("/contract/:id", async (req, res) => {
    res.status(200).send("ok")
});

// 


// admin controller



// start server
app.listen(PORT, async () => {
    await client.connect();
    console.log("Server started on port", PORT)
});