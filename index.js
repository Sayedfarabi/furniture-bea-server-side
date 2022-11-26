const express = require("express");
const cors = require("cors");
const colors = require("colors");
const app = express();
require("dotenv").config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;

// middle wares : 
app.use(cors());
app.use(express.json());

// Db user and password 
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

// Start to Database Connection

app.post('userAddToDb', (req, res) => {
    const userData = req.body;
    console.log(userData)
})


// Server Running on Port Checking 
app.listen(port, () => {
    console.log(`This server running port on ${port}`);
})