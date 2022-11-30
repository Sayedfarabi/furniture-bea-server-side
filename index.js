const express = require("express");
const cors = require("cors");
const colors = require("colors");
require("dotenv").config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId, ObjectID } = require('mongodb');
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
const category = client.db("furnitureBea").collection("category");
const products = client.db("furnitureBea").collection("products");
const bookingProducts = client.db("furnitureBea").collection("bookingProducts");
const wishProducts = client.db("furnitureBea").collection("wishProducts");
const advertisementProducts = client.db("furnitureBea").collection("advertisementProducts");

app.post('/userAddToDb', async (req, res) => {
    try {
        const userData = req.body;
        userData.verified = false;
        const email = userData.email;
        const isAdded = await Users.findOne({ email: email })
        if (isAdded) {
            console.log("user allready added")
        } else {
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
        }
    } catch (error) {
        console.log(error.name.bgRed, error.message.yellow)
        res.send({
            success: false,
            message: error.message
        })
    }
})

app.post("/getToken", async (req, res) => {
    try {
        const { email } = req.body;
        const newEmail = email;
        if (!newEmail) {
            return res.send({
                success: false,
                message: "Please provide email address"
            })
        } else {
            const userEmail = await Users.findOne({ email: newEmail })
            if (!userEmail) {
                return res.send({
                    success: false,
                    message: "Email is doesn't exist"
                })
            } else {
                const tokenObj = {
                    email: newEmail
                }

                // console.log(tokenObj)
                const token = jwt.sign(tokenObj, process.env.ACCESS_TOKEN_SECRET);
                res.send({
                    success: true,
                    message: "Get Token successfully",
                    data: tokenObj,
                    token: token
                })
            }
        }
    } catch (error) {
        console.log(error.name.bgRed, error.message.yellow)
        res.send({
            success: false,
            message: error.message
        })
    }
})

app.post('/addCategory', async (req, res) => {
    try {
        const categoryData = req.body;
        if (!categoryData) {
            res.send({
                success: false,
                message: "data can not exist"
            })
        }
        const data = await category.insertOne(categoryData)
        if (data.acknowledged) {
            res.send({
                success: true,
                message: "data added to Db successfully"
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

app.post('/addProduct', async (req, res) => {
    try {
        const productData = req.body;
        if (productData) {
            const data = await products.insertOne(productData)
            if (data.acknowledged) {
                res.send({
                    success: true,
                    message: "product data added successfully"
                })
            } else {
                res.send({
                    success: false,
                    message: "data can not added to Database"
                })
            }

        } else {
            res.send({
                success: false,
                message: "Can not exist data"
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

app.post("/addBooking", async (req, res) => {
    try {
        const bookingProduct = req.body;
        const productId = bookingProduct.productId;
        const isAdded = await bookingProducts.findOne({ productId: productId });
        if (isAdded) {
            res.send({
                success: false,
                message: "This product is  allready added booking list"
            })

        }
        else {
            const result = await bookingProducts.insertOne(bookingProduct)
            if (result.acknowledged) {
                res.send({
                    success: true,
                    message: "booking product added successfully"
                })
            }
        }

    } catch (error) {
        console.log(error.name.bgRed, error.message.yellow)
        res.send({
            success: false,
            message: error.message
        })
    }
})

app.post("/addWish", async (req, res) => {
    try {
        const wishProduct = req.body;
        const productId = wishProduct.productId;
        const isAdded = await wishProducts.findOne({ productId: productId });
        if (isAdded) {
            res.send({
                success: false,
                message: "This product is  allready added to wish list"
            })

        }
        else {
            const result = await wishProducts.insertOne(wishProduct)
            if (result.acknowledged) {
                res.send({
                    success: true,
                    message: "booking product added successfully"
                })
            }
        }

    } catch (error) {
        console.log(error.name.bgRed, error.message.yellow)
        res.send({
            success: false,
            message: error.message
        })
    }
})

app.post("/productAddToAdvertisement", async (req, res) => {
    try {
        const id = req?.query?.id;

        const productId = {
            _id: ObjectId(id)
        }
        const isAdded = await advertisementProducts.findOne(productId)

        if (!isAdded) {
            const product = await products.findOne(productId);
            if (product) {
                const result = advertisementProducts.insertOne(product)
                res.send({
                    success: true,
                    message: "Product Add to Advertisement Successfully"
                })
            } else {
                res.send({
                    success: false,
                    message: "Does not exist product in products collection"
                })
            }
        } else {
            res.send({
                success: false,
                message: "This product Allready Added to Advertisement collection"
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

app.get("/", async (req, res) => {
    try {
        const query = {};
        const data = await category.find(query).limit(3).toArray()
        res.send(data)
    } catch (error) {
        console.log(error.name.bgRed, error.message.yellow)
        res.send({
            success: false,
            message: error.message
        })
    }

})

app.get('/allCategories', async (req, res) => {
    try {
        const query = {};
        const data = await category.find(query).toArray()
        res.send(data)
    } catch (error) {
        console.log(error.name.bgRed, error.message.yellow)
        res.send({
            success: false,
            message: error.message
        })
    }
})

app.get("/user", async (req, res) => {
    try {
        const email = req?.query?.email;
        console.log(email)
        if (email) {
            const query = {
                email: email
            }
            const data = await Users.findOne(query)
            res.send({
                success: true,
                message: "user data get successfully",
                data: data
            })
        } else {
            res.send({
                success: false,
                message: "can not find email",
                data: {}
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

app.get("/myProducts", async (req, res) => {
    try {
        const email = req?.query?.email;
        console.log(email)
        if (email) {
            const query = {
                sellerEmail: email
            }
            const data = await products.find(query).toArray()
            if (data) {
                res.send({
                    success: true,
                    message: "user data get successfully",
                    data: data
                })
            } else {
                res.send({
                    success: false,
                    message: "cannot data query in products collection"
                })
            }
        } else {
            res.send({
                success: false,
                message: "can not find email",
                data: {}
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



app.get("/category/:id", async (req, res) => {
    try {
        const { id } = req.params;
        console.log(id)

        if (id) {
            const data = await products.find({ categoryId: id }).toArray();
            // console.log(data)
            res.send({
                success: true,
                products: data
            })
        } else {
            console.log("does not exist categoryId")
            res.send({
                success: false,
                message: "categoryId does not define"
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

app.delete("/productDelete", async (req, res) => {
    try {
        const id = req?.query?.id;
        console.log(id);
        const filter = { _id: ObjectId(id) };
        console.log(filter);
        const result = await products.deleteOne(filter);
        res.send(result);



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