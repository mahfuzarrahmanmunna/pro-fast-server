const express = require('express');
const app = express()
const cors = require('cors');
require('dotenv').config()
const stripe = require('stripe')(process.env.PAYMENT_GETWAY_KEY);
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const admin = require("firebase-admin");
var cookieParser = require('cookie-parser')
const port = process.env.PORT || 3000;



const decoded = Buffer.from(`ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAicHJvLWZhc3QtMWFlZWMiLAogICJwcml2YXRlX2tleV9pZCI6ICI0ZTUyY2JhYTVhNTI3Yjk3MmJlYTNlZ
GUzMzBlZDMwNzBlNzYxYTM3IiwKICAicHJpdmF0ZV9rZXkiOiAiLS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tXG5NSUlFdmdJQkFEQU5CZ2txaGtpRzl3MEJBUUVGQUFTQ0JLZ3dnZ1NrQW
dFQUFvSUJBUUM2NUlyOHFveE5FYTJHXG5vMVdnY2dSNUFCSlc2d0pSMWZFWm83NWJXaUJLRXdPU0xWYmw5amFRUDFJQUNmYWd1TCtKQVNjV0VJdTYwMXpQXG5ja0x5OGNmMjN5VHM5NCtmM1h
EaVcyY0JUc0oxNzZabW1GSHB1TXhPYXhQVFdhKzRaVHkrcEF6SFRtMWR4RXgrXG5RNkp6b0ZnNThXQkoyVU1EaXo5NXZjMmp6amxpRnlPZjZXOVFWdjJpaHN1UmdENS85Qm5vM3d2OGUyRUpD
ZnFLXG5ndE9zT2lJWEp3aWw1TXRUaXhXYTdna0pOYi92UUhwRjBmWlo1Rnk1WVFiWGVjcjR6b1oxSndwcnl0K055MEpuXG5hS2JDaHBQN3NpL3o3eUUwVHJleHo1Y2xncFZyT3hhdEpCenBDR
U9GaUJDakFJNzhab2N2VFlqc1dqZHJaQzU4XG5RcWdnUWlzcEFnTUJBQUVDZ2dFQUVRVGU0ME5rbzJBSXZVb0NjaW52M2xUelZwYndEeU84WU9sWVhGbEl0M1lqXG56UnZ6M2QwZCt1VEpRdG
VsYmQxbEU4VFhHbHRIWGl3Qk42TGdGZCtPcGh5TDhFaGErK1BlYzc1L0VzOXBSZlFjXG40eHJiMnJ6SlhockNJMnozWTROVWxNZTdvaXF5S3VmRlQzbzVRTzVKR24yd2x3a0I0VUM4OXdraHd
OajJ3TWZTXG5ubzdTUjR6MVNUN05tcDdSM2RpTlpNZUk0ZzZUV2dRWHhNL3lIcS8zbkNLUW9ncUkrN3ZPdkFOb3lpOC9zeG42XG4zYUhobTB5b25UTU1CaUNyNk1zbmZMM0hwUlR3amVMRlZ1
UjZsK1JndHFYWko4TDY5Wlk3dXFPTy8yS2k2VDRwXG54T0prb0pqd1U5UWlUVWdjSWxRU2lGbys3WWFaK0pWdzFyaEtZZmZOUVFLQmdRRHhhSWFpRGxiTjhWWlRrRjI4XG40bTNSSWF3TTcwb
2hHVmtjTWZyR2tKdTNCZ3FpK0ZLT3U5dDVLNFRFZks1MGFzOGRaenMyem1PQzBIdHlSYjBNXG4vWjlQdzE1REJKWGN5d04vZnRXbkR4cVc4eTVlaitnNGF5RnpxR1dxSlZTN0dxeWpsMG96Sl
owbU5ZMFJ3bU0zXG51dXpPRFRld1RNVVRhSCttck85TG9ldmZPd0tCZ1FER01IWDdwNXdlUkpNQmpVeUY0Rlp5RW52WTVHRVBobDBQXG5ZUjl1bi8yTUxZQU5vV3l6dnBuaXlwbktmR1h0WTh
VdWp4MU5ESnR6T1dJWW93bUYrNUZZckJGWGFMbnFua01wXG5jV3Nnek53dFNoN3ZzUSszQUxmWTdxMTFkQmtxR3ZvUzNteGhEbFVjdzhkQ0U2UjhqbFhUWGU4WmZiY2lySERTXG55TUhRQ3ZE
QTZ3S0JnQ1pCM0dRK1JYOXBxYmFnZ0ZwNHY5S090WWR2UEo0Mk9Dc0J1SzVUS0hvKzJOeXU0ZGFBXG42dTB1K21GeEtPeUdLTUNPSlpJdjd4RkNITzRsSXlxMTN0TnpNTE1LUFAyNnBwbEQ3b
lFGTHIrUlZsM2lESGswXG5jUjYxSnpkcHB4M253a2hDcDUybmJsb3B6bXRzRlBFMkRHVXpMd29mZ0hQczhaM21kaDNVVVY4VkFvR0JBSW83XG5GcTlWY2pBeVNBNVhEVDU3QUJCRUVCbHhBTG
1oVDVzQWRMbmw0U1E2UUF4QndOMkZYVE92ZDZDaEx6NXB6Z2Z4XG5UZENGc0k2blFXSkpwTVRNZDgzUEJiRmZtL3ltTWRYZ0E0WTNISUtDSmgycjgzZ0NpamhHRUxuUkpoUVdDTUhNXG5YTzg
4M2VSWU1NeEhndnhWRWt1QVF0b1dzdnIrSnhyOVp5REI0TFhOQW9HQkFNSGk1LzI5WFNFajBZdmZ2cHpjXG5qVFVwcjhOMzBUWjltRG9wcTFaRGhKMDAyUnovSndIRTBjQjFlQ2plaGVPZ3hH
MVlvWldvVFZCOGNhek04OWdRXG5MaUZyZlZKYnJIVE5xbHlsQ0lkRFpFSWcrZFF4UHMzMkRXdEV6S2s1a2JCWmFCbmpmZWlCYUpQazZNbkVWNWU2XG5MVUtKOXAvNUNTaG5talRtTnJWQlhUS
HRcbi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS1cbiIsCiAgImNsaWVudF9lbWFpbCI6ICJmaXJlYmFzZS1hZG1pbnNkay1mYnN2Y0Bwcm8tZmFzdC0xYWVlYy5pYW0uZ3NlcnZpY2VhY2NvdW
50LmNvbSIsCiAgImNsaWVudF9pZCI6ICIxMDM5NDQxNjcwMDAxMDI1MTc5NjAiLAogICJhdXRoX3VyaSI6ICJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20vby9vYXV0aDIvYXV0aCIsCiA
gInRva2VuX3VyaSI6ICJodHRwczovL29hdXRoMi5nb29nbGVhcGlzLmNvbS90b2tlbiIsCiAgImF1dGhfcHJvdmlkZXJfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlz
LmNvbS9vYXV0aDIvdjEvY2VydHMiLAogICJjbGllbnRfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9yb2JvdC92MS9tZXRhZGF0YS94NTA5L2ZpcmViYXNlL
WFkbWluc2RrLWZic3ZjJTQwcHJvLWZhc3QtMWFlZWMuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJ1bml2ZXJzZV9kb21haW4iOiAiZ29vZ2xlYXBpcy5jb20iCn0K`, 'base64').toString('utf8');
console.log(process.env.FB_SERVICE_KEY);
const serviceAccount = JSON.parse(decoded)
// console.log(serviceAccount);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});





// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());


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
    const targetEmail = req.query.email || req.params.email;

    if (!decoded || decoded.email !== targetEmail) {
        return res.status(403).send({ message: "Forbidden Access" });
    }

    console.log('email verification', targetEmail);
    next();
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

        // middle ware for admin verification
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded?.email;
            const query = { email }
            console.log(query);
            const user = await userCollection.findOne(query);
            console.log(user.role);
            if (!user || user.role !== 'admin') {
                return res.status(403).send({ message: "Forbidden Access" })
            }
            next()
        };

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
            const { payment_status, delivery_status, email } = req.query;

            const query = {};
            if (payment_status) query.payment_status = payment_status;
            if (delivery_status) query.delivery_status = delivery_status;
            if (email) query.creator_email = email;

            try {
                const result = await parcelCollection
                    .find(query)
                    .sort({ createdAt: -1 }) // Sort by latest date
                    .toArray();
                res.send(result);
            } catch (error) {
                console.error('Error fetching parcels:', error);
                res.status(500).json({ error: 'Failed to fetch parcels' });
            }
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
            const riderInfo = req.body;

            const riderDataWithStatus = {
                ...riderInfo,
                status: 'pending',
                appliedAt: new Date(),
            };
            try {
                const result = await riderCollection.insertOne(riderDataWithStatus);
                res.send(result);
            } catch (error) {
                console.error('Error adding rider application:', error);
                res.status(500).json({ error: 'Failed to submit rider application' });
            }
        });

        // GET route to retrieve pending riders
        app.get('/be-rider/pending', async (req, res) => {
            try {
                const pendingRiders = await riderCollection.find({ status: 'pending' }).toArray();


                res.status(200).json(pendingRiders);
            } catch (error) {
                console.error('Error retrieving pending riders:', error);
                res.status(500).json({ error: 'Failed to retrieve pending riders' });
            }
        });

        app.put('/be-rider/approve/:id', async (req, res) => {
            const { id } = req.params;
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({ error: 'Missing rider email' });
            }

            try {
                // Step 1: Approve rider (in rider collection)
                const riderUpdate = await riderCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { status: 'active' } }
                );

                // Step 2: Update user's role (by email)
                const userUpdate = await userCollection.updateOne(
                    { email }, // ✅ correct: use email, not _id
                    { $set: { role: 'rider' } }
                );

                if (userUpdate.matchedCount === 0) {
                    return res.status(404).json({ error: 'User not found' });
                }

                res.status(200).json({
                    message: 'Rider approved and user role updated to rider',
                    riderUpdate,
                    userUpdate
                });
            } catch (error) {
                console.error('Error approving rider:', error);
                return res.status(500).json({ error: 'Failed to approve rider' });
            }
        });



        // Get all active riders (only accepted by admin)
        app.get('/be-rider/active', async (req, res) => {
            const { region } = req.query;

            const filter = region ? { status: 'active', region } : { status: 'active' };

            try {
                const result = await riderCollection.find(filter).toArray();
                res.send(result);
            } catch (error) {
                console.error('Error fetching active riders:', error);
                res.status(500).json({ error: 'Failed to fetch active riders' });
            }
        });

        app.put('/assign-rider', async (req, res) => {
            const { parcelId, riderEmail, riderName } = req.body;

            if (!parcelId || !riderEmail) {
                return res.status(400).json({ error: 'Missing parcel ID or rider email' });
            }

            try {
                const parcelUpdate = await parcelCollection.updateOne(
                    { _id: new ObjectId(parcelId) },
                    {
                        $set: {
                            delivery_status: 'in-transit',
                            assigned_rider: riderEmail,
                            rider: riderName,
                            assigned_at: new Date(),
                        }
                    }
                );

                const riderUpdate = await riderCollection.updateOne(
                    { email: riderEmail },
                    { $set: { work_status: 'in-busy' } }
                );

                res.status(200).json({
                    message: 'Parcel and rider updated successfully',
                    parcelUpdate,
                    riderUpdate
                });
            } catch (error) {
                console.error('Error assigning rider:', error);
                res.status(500).json({ error: 'Failed to assign rider' });
            }
        });




        // rider delete
        app.delete('/be-rider/:id', async (req, res) => {
            const { id } = req.params;

            if (!ObjectId.isValid(id)) {
                return res.status(400).json({ error: 'Invalid rider ID' });
            }

            try {
                const result = await riderCollection.deleteOne({ _id: new ObjectId(id) });

                if (result.deletedCount === 0) {
                    return res.status(404).json({ error: 'Rider application not found' });
                }

                res.status(200).json({ message: 'Rider application deleted successfully' });
            } catch (error) {
                console.error('Error deleting rider application:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        // Route: Search user by email
        app.get('/users/search', verifyFBToken, async (req, res) => {
            const email = req.query.email;

            if (!email) {
                return res.status(400).json({ error: 'Email query is required' });
            }

            const regex = new RegExp(email, 'i'); // Case-insensitive partial match
            try {
                const users = await userCollection
                    .find({ email: { $regex: regex } })
                    .project({ email: 1, createdAt: 1, role: 1, _id: 0 }) // Optional: omit _id if not needed
                    .limit(10)
                    .toArray();

                if (!users.length) {
                    return res.status(404).json({ message: 'No users found' });
                }

                res.status(200).json(users);
            } catch (error) {
                console.error('Error searching user:', error);
                res.status(500).json({ error: 'Failed to search users' });
            }
        });

        app.get('/users/role/:email', verifyFBToken, async (req, res) => {
            const { email } = req.params;

            try {
                const user = await userCollection.findOne({ email });

                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }

                res.status(200).json({ role: user.role });
            } catch (error) {
                console.error('Error fetching user role:', error);
                res.status(500).json({ error: 'Failed to get user role' });
            }
        });


        // Protect this route using verifyFBToken middleware
        app.put('/users/role/:email', verifyFBToken, verifyAdmin, async (req, res) => {
            try {
                const email = req.params.email;
                const { role } = req.body;

                if (!email || !role) {
                    return res.status(400).json({ error: 'Missing email or role in request.' });
                }

                const result = await userCollection.updateOne(
                    { email: email },
                    { $set: { role: role } }
                );

                if (result.matchedCount === 0) {
                    return res.status(404).json({ error: 'User not found.' });
                }

                res.json({ message: `User role updated to ${role}` });
            } catch (err) {
                console.error('Error in PUT /users/role/:email =>', err);
                res.status(500).json({ error: 'Server error.' });
            }
        });

        // rider parcel
        app.get('/rider/pending-deliveries', async (req, res) => {
            const { email } = req.query;

            if (!email) {
                return res.status(400).json({ error: 'Missing rider email in query' });
            }

            try {
                const filter = {
                    assigned_rider: email,
                    delivery_status: { $in: ['in-transit', 'rider-assigned'] },
                };

                const parcels = await parcelCollection
                    .find(filter)
                    .sort({ assigned_at: -1 }) // optional: latest assigned first
                    .toArray();

                res.status(200).json(parcels);
            } catch (error) {
                console.error('Error fetching pending deliveries:', error);
                res.status(500).json({ error: 'Failed to fetch pending deliveries' });
            }
        });


        app.patch('/parcels/update-status/:id', async (req, res) => {
            const { id } = req.params;
            const { delivery_status } = req.body;

            try {
                const result = await parcelCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { delivery_status } }
                );
                res.send({ message: 'Status updated', result });
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: 'Failed to update status' });
            }
        });


        app.get('/rider/pending-parcels', async (req, res) => {
            const { email } = req.query;

            if (!email) {
                return res.status(400).json({ error: 'Missing rider email' });
            }

            try {
                const parcels = await parcelCollection.find({
                    assigned_rider: email,
                    delivery_status: { $in: ['rider_assigned', 'in-transit'] }
                }).sort({ assigned_at: -1 }).toArray();

                res.send(parcels);
            } catch (error) {
                console.error('Error fetching pending parcels:', error);
                res.status(500).json({ error: 'Failed to load rider parcels' });
            }
        });

        app.put('/parcels/status/:id', async (req, res) => {
            const { id } = req.params;
            const { status } = req.body;

            if (!id || !status) {
                return res.status(400).json({ error: 'Missing parcel ID or new status' });
            }

            try {
                const result = await parcelCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { delivery_status: status } }
                );

                if (result.modifiedCount === 0) {
                    return res.status(404).json({ error: 'Parcel not found or already updated' });
                }

                res.status(200).json({ message: 'Parcel status updated', result });
            } catch (error) {
                console.error('Error updating parcel status:', error);
                res.status(500).json({ error: 'Failed to update status' });
            }
        });

        app.get('/rider/in-progress-parcels', async (req, res) => {
            const { email } = req.query;
            try {
                const query = {
                    assigned_rider: email,
                    delivery_status: 'in-transit'
                };
                const result = await parcelCollection.find(query).toArray();
                res.send(result);
            } catch (err) {
                console.error('Error fetching in-progress parcels:', err);
                res.status(500).json({ error: 'Failed to fetch data' });
            }
        });

        // Completed Parcel
        app.get('/rider/completed-parcels', async (req, res) => {
            const { email } = req.query;

            try {
                const completed = await parcelCollection
                    .find({ assigned_rider: email, delivery_status: 'delivered' })
                    .sort({ updatedAt: -1 }) // optional: show recent first
                    .toArray();

                res.send(completed);
            } catch (err) {
                console.error('Error fetching completed parcels:', err);
                res.status(500).json({ error: 'Failed to fetch completed deliveries' });
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