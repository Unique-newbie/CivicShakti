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

async function addAssigneeField() {
    try {
        console.log("Adding assigned_to attribute to Complaints collection...");

        await databases.createStringAttribute(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
            process.env.NEXT_PUBLIC_APPWRITE_COMPLAINTS_COLLECTION_ID,
            "assigned_to",
            100, // length
            false, // required
            "",    // default string
            false  // array?
        );

        console.log("Successfully added 'assigned_to' attribute! Please wait a few moments for it to become available.");
    } catch (error) {
        if (error.code === 409) {
            console.log("Attribute 'assigned_to' already exists.");
        } else {
            console.error("Failed to add attribute:", error);
        }
    }
}

addAssigneeField();
