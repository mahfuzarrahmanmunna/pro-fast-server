const express = require('express');
const cors = require('cors');
require('dotenv').config();
const stripe = require('stripe')(process.env.PAYMENT_GETWAY_KEY);
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const admin = require("firebase-admin");


const app = express();
const port = process.env.PORT || 3000;

const firebaseKey = './firebase-key.json'

const serviceAccount = require(firebaseKey);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


// Middleware
app.use(cors());
app.use(express.json());

// custom middleware
const verifyFBToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: "Unauthorized Access" })
    }

    // token
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).send({ message: "Unauthorized Access" })
    }

    // verify token
    try {
        const decoded = await admin.auth().verifyIdToken(token);
        req.decoded = decoded;
        next()
    }
    catch (error) {
        console.error(error);
        return res.status(403).send({ message: "Forbidden Access" })
    }
}

// verify email and jwt token
const verifyEmail = (req, res, next) => {
    const decoded = req.decoded;
    if (decoded.email !== req.query.email) {
        return res.status(403).send({ message: "Forbidden Access" })
    }
    console.log('email verification', req.query.email);
    next()
}

const client = new MongoClient(process.env.DB_URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // await client.connect();
        const userCollection = client.db('parcelDB').collection('users');
        const riderCollection = client.db('parcelDB').collection('rider')
        const parcelCollection = client.db('parcelDB').collection('parcels');
        const paymentCollection = client.db('parcelDB').collection('payments');
        const trackingCollection = client.db('parcelDB').collection('tracking');

        app.post('/users', async (req, res) => {
            const newUser = req.body;
            const result = await userCollection.insertOne(newUser);
            res.send(result);
        });

        app.get('/users', async (req, res) => {
            try {
                const result = await userCollection.find().toArray();
                res.send(result);
            } catch (err) {
                console.error('Error fetching users:', err);
                res.status(500).json({ error: 'Failed to fetch users' });
            }
        });

        app.put('/users', async (req, res) => {
            const user = req.body;

            if (!user?.email) {
                return res.status(400).json({ error: 'Missing user email' });
            }

            const filter = { email: user.email };
            const updateDoc = {
                $setOnInsert: {
                    role: user.role || 'customer',
                    createdAt: new Date(),
                },
                $set: {
                    name: user.name,
                    photo: user.photo,
                    lastLogin: new Date(),
                    uid: user.uid || null,
                }
            };

            const options = { upsert: true, returnDocument: 'after' };

            try {
                const result = await userCollection.findOneAndUpdate(filter, updateDoc, options);
                const isNewUser = result.lastErrorObject && result.lastErrorObject.upserted != null;

                res.send({
                    message: isNewUser ? 'New user created' : 'User updated',
                    user: result.value,
                    isNewUser
                });
            } catch (error) {
                console.error("Error upserting user:", error);
                res.status(500).json({ error: "Failed to save user data" });
            }
        });


        app.get('/all-parcel', async (req, res) => {
            const result = await parcelCollection.find().toArray();
            res.send(result);
        });

        app.post('/add-parcel', async (req, res) => {
            const newParcel = req.body;
            const result = await parcelCollection.insertOne(newParcel);
            res.send(result);
        });

        app.get('/user-parcels', async (req, res) => {
            const userEmail = req.query.email;
            const query = userEmail ? { creator_email: userEmail } : {};

            try {
                const result = await parcelCollection
                    .find(query)
                    .sort({ creation_date: -1 })
                    .toArray();

                res.send(result);
            } catch (err) {
                console.error(err);
                res.status(500).send({ error: "Failed to fetch parcels" });
            }
        });

        app.get('/single-parcel/:id', async (req, res) => {
            const { id } = req.params;

            if (!ObjectId.isValid(id)) {
                return res.status(400).json({ error: 'Invalid parcel ID format' });
            }

            try {
                const result = await parcelCollection.findOne({ _id: new ObjectId(id) });
                if (!result) {
                    return res.status(404).json({ error: 'Parcel not found' });
                }
                res.send(result);
            } catch (err) {
                console.error('Error fetching parcel:', err);
                res.status(500).json({ error: 'Server error' });
            }
        });

        app.delete('/single-parcel/:id', async (req, res) => {
            const { id } = req.params;
            const result = await parcelCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
            console.log(id);
        });

        app.post('/create-payment-intent', async (req, res) => {
            const amountInCent = req.body.amountInCent;
            try {
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: amountInCent,
                    currency: 'usd',
                    payment_method_types: ['card'],
                });
                res.json({ clientSecret: paymentIntent.client_secret });
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });

        app.post('/payment-success', async (req, res) => {
            const { transactionId, amount, email, parcelId, createdAt } = req.body;

            if (!transactionId || !parcelId || !email) {
                return res.status(400).json({ error: 'Missing payment data.' });
            }

            try {
                const parcelResult = await parcelCollection.updateOne(
                    { _id: new ObjectId(parcelId) },
                    { $set: { payment_status: 'paid' } }
                );

                const paymentData = {
                    transactionId,
                    amount,
                    email,
                    parcelId,
                    paid_at: new Date(),
                    createdAt: createdAt || new Date().toISOString(),
                };

                const paymentResult = await paymentCollection.insertOne(paymentData);

                res.status(200).json({
                    message: "Payment processed successfully",
                    parcelUpdate: parcelResult,
                    paymentInsert: paymentResult,
                });
            } catch (error) {
                console.error("Payment processing error:", error);
                res.status(500).json({ error: "Failed to process payment" });
            }
        });

        app.get('/user-payments', verifyFBToken, verifyEmail, async (req, res) => {
            const { email } = req.query;
            if (!email) return res.status(400).json({ error: "Missing email" });


            try {
                const result = await paymentCollection
                    .find({ email })
                    .sort({ createdAt: -1 })
                    .toArray();

                res.send(result);
            } catch (err) {
                res.status(500).json({ error: "Failed to fetch payment history" });
            }
        });

        app.post('/track-update', async (req, res) => {
            const { trackingId, parcelId, status, location } = req.body;

            if (!trackingId || !parcelId || !status || !location) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const trackingEntry = {
                trackingId,
                parcelId,
                status,
                location,
                timestamp: new Date()
            };

            try {
                const result = await trackingCollection.insertOne(trackingEntry);
                res.send({ message: 'Tracking update saved', insertedId: result.insertedId });
            } catch (error) {
                console.error('Error inserting tracking:', error);
                res.status(500).json({ error: 'Failed to save tracking update' });
            }
        });

        app.get('/track/:trackingId', async (req, res) => {
            const { trackingId } = req.params;

            try {
                const updates = await trackingCollection
                    .find({ trackingId })
                    .sort({ timestamp: 1 })
                    .toArray();

                if (!updates.length) {
                    return res.status(404).json({ error: 'No tracking history found' });
                }

                res.send({ trackingId, updates });
            } catch (error) {
                res.status(500).json({ error: 'Failed to fetch tracking updates' });
            }
        });

        app.post('/be-rider', async (req, res) => {
            const riderInfo = req.body; // Get rider info from the request body
            // console.log(riderInfo); // Log the rider info (for debugging purposes)
            try {
                const result = await riderCollection.insertOne(riderInfo); // Insert rider info into the database
                res.send(result); // Respond with the inserted data
            } catch (error) {
                console.log(error); // Log any errors that occur
            }
        });

        // GET route to retrieve all riders' data
        app.get('/be-rider', async (req, res) => {
            try {
                // Fetch all rider data from MongoDB
                const riders = await riderCollection.find().toArray();

                // If no riders are found, send a message indicating so
                if (!riders || riders.length === 0) {
                    return res.status(404).json({ message: 'No riders found' });
                }

                // Send back the retrieved rider data
                res.status(200).json(riders);
            } catch (error) {
                console.error('Error retrieving riders:', error);
                res.status(500).json({ error: 'Failed to retrieve riders' });
            }
        });


        console.log("✅ MongoDB connected.");
    } catch (err) {
        console.error(err);
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Pro fast net is cooking..!');
});

app.listen(port, () => {
    console.log(`ProFast app is running on http://localhost:${port}`);
});