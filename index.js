const express = require('express');
const cors = require('cors');
require('dotenv').config();
const stripe = require('stripe')(process.env.PAYMENT_GETWAY_KEY); // Use your Stripe secret key
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

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

        const parcelCollection = client.db('parcelDB').collection('parcels');
        const paymentCollection = client.db('parcelDB').collection('payments');

        app.get('/all-parcel', async (req, res) => {
            const result = await parcelCollection.find().toArray();
            res.send(result);
        });

        app.post('/add-parcel', async (req, res) => {
            const newParcel = req.body;
            const result = await parcelCollection.insertOne(newParcel);
            res.send(result);
        });

        // get the user parcel with email query user-parcel?email=ma...@gmail.com
        app.get('/user-parcels', async (req, res) => {
            const userEmail = req.query.email;

            const query = userEmail ? { creator_email: userEmail } : {};

            try {
                const result = await parcelCollection
                    .find(query)
                    .sort({ creation_date: -1 }) // Always sorted newest first
                    .toArray();

                res.send(result);
            } catch (err) {
                console.error(err);
                res.status(500).send({ error: "Failed to fetch parcels" });
            }
        });

        // get single parcel
        app.get('/single-parcel/:id', async (req, res) => {
            const { id } = req.params;

            // ✅ Validate the ObjectId before querying
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



        // delete method for parcel delete
        app.delete('/single-parcel/:id', async (req, res) => {
            const { id } = req.params;
            const result = await parcelCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result)
            console.log(id);
        })

        // get the customer payment method
        app.post('/create-payment-intent', async (req, res) => {
            const amountInCent = req.body.amountInCent;
            try {
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: amountInCent, // Amount in cents
                    currency: 'usd',
                    payment_method_types: ['card'],
                });

                res.json({ clientSecret: paymentIntent.client_secret });
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });


        // Save payment and update parcel
        app.post('/payment-success', async (req, res) => {
            const { transactionId, amount, email, parcelId, createdAt } = req.body;

            if (!transactionId || !parcelId || !email) {
                return res.status(400).json({ error: 'Missing payment data.' });
            }

            try {
                // 1. Mark parcel as paid
                const parcelResult = await parcelCollection.updateOne(
                    { _id: new ObjectId(parcelId) },
                    {
                        $set: {
                            payment_status: 'paid'
                        }
                    }
                );

                // 2. Save payment record
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


        app.get('/user-payments', async (req, res) => {
            const { email } = req.query;
            if (!email) return res.status(400).json({ error: "Missing email" });

            try {
                const result = await paymentCollection
                    .find({ email })
                    .sort({ createdAt: -1 }) // latest first
                    .toArray();

                res.send(result);
            } catch (err) {
                res.status(500).json({ error: "Failed to fetch payment history" });
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
