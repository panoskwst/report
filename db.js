const { MongoClient } = require('mongodb');

const uri ="mongodb://localhost:27017/"; // local mongoDB instance
const client = new MongoClient(uri);

async function connectDB() {
    try {
        await client.connect();
        console.log("Conected to MongoDB!");

        // Select the DB
        const db = client.db("Reports");

        // Select Collection
        const collection = db.collection("Athensmagazine_inventory");

        return { db, collection };
    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
}
 
module.exports = { connectDB, client };