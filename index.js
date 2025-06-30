const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

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


        // delete method for parcel delete


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
