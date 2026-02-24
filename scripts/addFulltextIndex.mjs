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

async function addFulltextIndex() {
    try {
        console.log("Adding fulltext index to Complaints collection...");
        const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
        const collectionId = process.env.NEXT_PUBLIC_APPWRITE_COMPLAINTS_COLLECTION_ID;

        await databases.createIndex(
            dbId,
            collectionId,
            `search_index`,
            'fulltext',
            ['tracking_id', 'description', 'address', 'category'],
            ['ASC', 'ASC', 'ASC', 'ASC']
        );
        console.log("Created fulltext search index");
    } catch (error) {
        if (error.code === 409) {
            console.log(`Index already exists.`);
        } else {
            console.error("Failed to add index:", error);
        }
    }
}

addFulltextIndex();
