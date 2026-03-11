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

async function addFeedbackFields() {
    try {
        console.log("Adding feedback fields to Complaints collection...");
        const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
        const collectionId = process.env.NEXT_PUBLIC_APPWRITE_COMPLAINTS_COLLECTION_ID;

        try {
            await databases.createIntegerAttribute(
                dbId,
                collectionId,
                "citizen_feedback_rating",
                false, // not required
                1,     // min
                5,     // max
                undefined, // default
                false  // array
            );
            console.log("Added citizen_feedback_rating");
        } catch (e) {
            console.log("citizen_feedback_rating might already exist", e.message);
        }

        try {
            await databases.createStringAttribute(
                dbId,
                collectionId,
                "citizen_feedback_text",
                1000,  // size
                false, // not required
                undefined,
                false
            );
            console.log("Added citizen_feedback_text");
        } catch (e) {
            console.log("citizen_feedback_text might already exist", e.message);
        }

        console.log("Done.");
    } catch (error) {
        console.error("Failed to add fields:", error);
    }
}

addFeedbackFields();
