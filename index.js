const express = require("express");
const cors = require("cors");
const colors = require("colors");
require("dotenv").config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;
const app = express();

// middle wares : 
app.use(cors());
app.use(express.json());

// Db User and Password 
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;

const uri = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.wfsi327.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function dbConnection() {
    try {
        await client.connect()
        console.log("Database connect".blue)
    } catch (error) {
        console.log(error.name.bgRed, error.message.yellow)
    }
}

dbConnection()


// Database Collection Name
const Users = client.db("furnitureBea").collection("users");

app.post('/userAddToDb', async (req, res) => {
    try {
        const userData = req.body;
        const data = await Users.insertOne(userData)
        if (data.acknowledged) {
            res.send({
                success: true,
                message: "Successfully added the user"
            })
        } else {
            res.send({
                success: false,
                message: "Couldn't added the user"
            })
        }
    } catch (error) {
        console.log(error.name.bgRed, error.message.yellow)
        res.send({
            success: false,
            message: error.message
        })
    }
})






// Server Running on Port Checking 
app.listen(port, () => {
    console.log(`This server running port on ${port}`);
})