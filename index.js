
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
    const inputUsername = req.params.username;
    const inputPassword = req.params.password;

    const user_role = await client.query(`call check_auth(${inputUsername})`);

    console,log(user_role);
    if (user_role === undefined) {
        res.status(404).send("Account does not exists");
    }
    
    const password = await client.query("select rolpassword from pg_roles where rolname = $1", [user_role]);
    
    console,log(password);
    if (inputPassword !== password) {
        res.status(404).send("Wrong password");
    }

    res.status(200).send("ok");
});


// client controller



// manager controller
app.get("/contract/:id", async (req, res) => {
    
    res.status(200).send("ok")
})


// admin controller



// start server
app.listen(PORT, async () => {
    await client.connect();
    console.log("Server started on port", PORT)
});