const express = require("express");
const cors = require("cors");
const colors = require("colors");
require("dotenv").config();
const jwt = require('jsonwebtoken');
const Auth = require("./middleWares/Auth");
const { MongoClient, ServerApiVersion, ObjectId, ObjectID } = require('mongodb');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
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
const payments = client.db("furnitureBea").collection("payments");

const verifyAdmin = async (req, res, next) => {
    const decodedEmail = req?.decoded?.email;
    const query = { email: decodedEmail };
    const user = await Users.findOne(query);

    if (user?.userRole !== 'admin') {
        return res.status(403).send({ message: 'forbidden access' })
    }
    next();
}

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

app.post('/addCategory', Auth, verifyAdmin, async (req, res) => {
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

app.post('/addProduct', Auth, async (req, res) => {
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

app.post("/addBooking", Auth, async (req, res) => {
    try {
        const bookingProduct = req.body;
        const productId = bookingProduct.productId;
        const buyerEmail = bookingProduct.buyerEmail;
        const query = {
            buyerEmail: buyerEmail,
            productId: productId
        }
        const isAdded = await bookingProducts.findOne(query);
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

app.post("/addWish", Auth, async (req, res) => {
    try {
        const wishProduct = req.body;
        const productId = wishProduct.productId;
        const email = wishProduct.email;
        const query = {
            email: email,
            productId: productId
        }
        console.log(query);
        const isAdded = await wishProducts.findOne(query);
        console.log(isAdded);
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
                    message: "Wish product added successfully"
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

app.post("/productAddToAdvertisement", Auth, async (req, res) => {
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

app.get("/advertisement", async (req, res) => {
    try {
        const query = {};
        const data = await advertisementProducts.find(query).toArray();
        res.send({
            success: true,
            data: data
        })
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

app.get("/myProducts", Auth, async (req, res) => {
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

app.get("/booking", Auth, async (req, res) => {
    try {
        const email = req?.query?.email;
        if (email) {
            const bookingQuery = {
                buyerEmail: email
            }
            const data = await bookingProducts.find(bookingQuery).toArray()
            res.send({
                success: true,
                data: data
            })
        } else {
            res.send({
                success: false,
                message: "Buyer email does not exist"
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


app.get("/wishes", Auth, async (req, res) => {
    try {
        const email = req?.query?.email;
        if (email) {
            const wishQuery = {
                email: email
            }
            const data = await wishProducts.find(wishQuery).toArray()
            res.send({
                success: true,
                data: data
            })
        } else {
            res.send({
                success: false,
                message: "Buyer email does not exist"
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

app.delete("/bookingDelete", Auth, async (req, res) => {
    try {
        const email = req.body;
        const id = req?.query?.id;
        const query = {
            _id: ObjectId(id),
            buyerEmail: email.buyerEmail
        }
        const result = await bookingProducts.deleteOne(query);
        res.send(result);

    } catch (error) {
        console.log(error.name.bgRed, error.message.yellow)
        res.send({
            success: false,
            message: error.message
        })
    }
})

app.delete("/wishDelete", Auth, async (req, res) => {
    try {
        const id = req?.query?.id;
        const buyerEmail = req?.body;
        console.log(buyerEmail);
        const query = {
            _id: ObjectId(id),
            email: buyerEmail?.buyerEmail
        }
        console.log(query);
        const result = await wishProducts.deleteOne(query);
        console.log(result);
        res.send(result);

    } catch (error) {
        console.log(error.name.bgRed, error.message.yellow)
        res.send({
            success: false,
            message: error.message
        })
    }
})


app.get("/category/:id", Auth, async (req, res) => {
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

app.delete("/productDelete", Auth, async (req, res) => {
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

app.get("/dashboard/payment/:id", Auth, async (req, res) => {
    try {
        const id = req?.params?.id;
        console.log(id);
        const query = {
            _id: ObjectId(id)
        }
        const data = await bookingProducts.findOne(query)
        if (data) {
            res.send({
                success: true,
                data: data
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

app.get("/allBuyer", Auth, verifyAdmin, async (req, res) => {
    try {
        const query = {
            userRole: "buyer"
        };
        const data = await Users.find(query).toArray();
        res.send({
            success: true,
            data: data
        })
    } catch (error) {
        console.log(error.name.bgRed, error.message.yellow)
        res.send({
            success: false,
            message: error.message
        })
    }
})

app.get("/allSeller", Auth, verifyAdmin, async (req, res) => {
    try {
        const query = {
            userRole: "seller"
        };
        const data = await Users.find(query).toArray();
        res.send({
            success: true,
            data: data
        })
    } catch (error) {
        console.log(error.name.bgRed, error.message.yellow)
        res.send({
            success: false,
            message: error.message
        })
    }
})

app.delete("/deleteUser", Auth, verifyAdmin, async (req, res) => {
    try {
        const email = req?.query?.email;
        const query = {
            email: email
        }
        const result = await Users.deleteOne(query)
        console.log(result);
        res.send(result)
    } catch (error) {
        console.log(error.name.bgRed, error.message.yellow)
        res.send({
            success: false,
            message: error.message
        })
    }
})

app.patch("/verifyUser", Auth, verifyAdmin, async (req, res) => {
    try {
        const email = req?.query?.email;
        const query = {
            email: email
        }
        const result = await Users.updateOne(query, {
            $set: {
                verified: true
            }
        })
        if (result.matchedCount) {
            res.send({
                success: true,
                message: "Successfully verified updated"
            })
        } else {
            res.send({
                success: false,
                message: "Couldn't update"
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

app.patch("/makeNewAdmin", Auth, verifyAdmin, async (req, res) => {
    try {
        const adminNewEmail = req?.query?.email;
        const query = {
            email: adminNewEmail
        }
        const isUser = await Users.findOne(query)
        if (isUser) {
            const result = await Users.updateOne(query, {
                $set: {
                    userRole: "admin",
                    verified: true
                }
            })
            if (result.matchedCount) {
                res.send({
                    success: true,
                    message: `${adminNewEmail} is updated for new admin`
                })
            }
        } else {
            res.send({
                success: false,
                message: `${adminNewEmail} is could not exist to User Collection`
            })
        }

    } catch (error) {
        console.log(error.name.bgRed, error.message.yellow)
        res.send({
            success: false,
            message: error.message
        })
    }
}



)

app.post('/create-payment-intent', Auth, async (req, res) => {
    try {
        const productPrice = req?.body;
        // console.log(productPrice.productPrice);
        const price = productPrice?.productPrice;
        const amount = price * 100;
        console.log(amount);
        if (price) {
            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        } else {
            res.send({
                success: false,
                message: "can not exist product price"
            })
        }

    } catch (error) {
        console.log(error.name.bgRed, error.message.yellow)
        res.send({
            success: false,
            message: error.message
        })
    }
});

app.post("/payment", Auth, async (req, res) => {
    try {
        const paymentInfo = req.body;
        // console.log(paymentInfo);
        const productId = paymentInfo?.productId;
        const query = {
            _id: ObjectId(productId)
        }
        const bookingQuery = {
            productId
        }
        const updateProduct = {
            $set: {
                inStock: "unavailable",
                transactionId: paymentInfo?.transactionId
            }
        }
        const updateResult = await products.updateOne(query, updateProduct)
        console.log(updateResult);
        if (updateResult.modifiedCount > 0) {
            const result = await payments.insertOne(paymentInfo)
            if (result.acknowledged) {
                const bookingDelete = await bookingProducts.deleteOne(bookingQuery)
                res.send({
                    success: true,
                    message: "product update and payment added done"
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



// Server Running on Port Checking 
app.listen(port, () => {
    console.log(`This server running port on ${port}`);
})



