const { connectDB, client } = require('./db');

async function logPageView(url, user) {
    const { collection } = await connectDB();

    await collection.insertOne({
        url: url,
        user: user,
        timestamp: new Date()
    });

    console.log(`📊 Logged page view for ${url} by ${user}`);
    await client.close(); // Close connection
}

// Example Usage
logPageView("/home", "user123");
