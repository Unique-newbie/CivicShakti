import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function addIndexes() {
    try {
        console.log("Adding indexes to Complaints collection...");
        const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
        const collectionId = process.env.NEXT_PUBLIC_APPWRITE_COMPLAINTS_COLLECTION_ID;

        const attributesToIndex = ['status', 'category', 'department'];

        for (const attr of attributesToIndex) {
            try {
                await databases.createIndex(
                    dbId,
                    collectionId,
                    `index_${attr}`,
                    'key',
                    [attr],
                    ['ASC']
                );
                console.log(`Created index for ${attr}`);
            } catch (err) {
                if (err.code === 409) {
                    console.log(`Index for ${attr} already exists.`);
                } else {
                    console.error(`Failed to create index for ${attr}:`, err);
                }
            }
        }

        console.log("Successfully processed indexes! Ensure they are available before querying.");
    } catch (error) {
        console.error("Failed to add indexes:", error);
    }
}

addIndexes();
