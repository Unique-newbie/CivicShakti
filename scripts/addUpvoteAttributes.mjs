import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const API_KEY = process.env.APPWRITE_API_KEY;

if (!API_KEY) {
    console.error("❌ ERROR: APPWRITE_API_KEY is missing from .env.local");
    process.exit(1);
}

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
    .setKey(API_KEY);

const databases = new Databases(client);
const DB_ID = "civic_db";
const COMPLAINTS_COLLECTION_ID = "complaints";

async function run() {
    console.log("Adding Upvote Attributes...");
    try {
        // key, required, min, max, default
        await databases.createIntegerAttribute(DB_ID, COMPLAINTS_COLLECTION_ID, 'upvotes', false, 0, 10000000, 0);
        console.log("✅ 'upvotes' integer attribute created.");
    } catch (e) {
        console.log("upvotes attribute might already exist or error: ", e.message);
    }

    try {
        // key, size, required, default, array
        await databases.createStringAttribute(DB_ID, COMPLAINTS_COLLECTION_ID, 'upvoted_by', 50, false, undefined, true);
        console.log("✅ 'upvoted_by' string array attribute created.");
    } catch (e) {
        console.log("upvoted_by attribute might already exist or error: ", e.message);
    }
}
run();
