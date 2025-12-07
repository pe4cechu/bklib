// javascript
// File: `app/utils/seed.js` (updated)

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const items = require('./items');

const uri = process.env.MONGO_URI || 'mongodb+srv://peacechu:Liminated123@greenly.9nt7y6k.mongodb.net/';

if (!uri) {
    console.error('ERROR: MONGO_URI not set. Add `MONGO_URI` to `../../.env` or set the environment variable.');
    process.exit(1);
}

async function run() {
    await mongoose.connect(uri); // removed deprecated options
    const db = mongoose.connection.db;
    const coll = db.collection('books');

    // normalize `items` to an array
    let docs = null;
    if (Array.isArray(items)) {
        docs = items;
    } else if (items && Array.isArray(items.default)) {
        docs = items.default;
    } else if (items && Array.isArray(items.items)) {
        docs = items.items;
    }

    if (!Array.isArray(docs)) {
        console.error('ERROR: `items` must export an array of documents. Found:', typeof items);
        await mongoose.disconnect();
        process.exit(1);
    }

    // optional: await coll.deleteMany({});
    const res = await coll.insertMany(docs);
    const inserted = res.insertedCount ?? Object.keys(res.insertedIds ?? {}).length;
    console.log('Inserted', inserted, 'documents');
    await mongoose.disconnect();
}

run().catch(async err => {
    console.error('Seeding failed:', err);
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(1);
});