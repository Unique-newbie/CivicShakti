import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const complaintsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_COMPLAINTS_COLLECTION_ID;

if (!projectId || !endpoint || !apiKey || !databaseId || !complaintsCollectionId) {
    console.error("Missing required environment variables. Check .env.local");
    process.exit(1);
}

const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

const databases = new Databases(client);

async function updateSchema() {
    try {
        console.log("Updating Appwrite schema for Phase 11 (AI Validation)...");

        // 1. Add ai_priority_score (Integer)
        try {
            await databases.createIntegerAttribute(databaseId!, complaintsCollectionId!, "ai_priority_score", false, 0, 100, 50);
            console.log("Created ai_priority_score attribute in complaints.");
        } catch (e: any) {
            if (e.code === 409) console.log("ai_priority_score already exists.");
            else throw e;
        }

        // 2. Add ai_analysis (String)
        try {
            await databases.createStringAttribute(databaseId!, complaintsCollectionId!, "ai_analysis", 500, false, "Pending AI analysis");
            console.log("Created ai_analysis attribute in complaints.");
        } catch (e: any) {
            if (e.code === 409) console.log("ai_analysis already exists.");
            else throw e;
        }

        console.log("Schema update complete! Waiting a bit for Appwrite to apply attributes...");

        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log("Done.");

    } catch (error) {
        console.error("Failed to update schema:", error);
    }
}

updateSchema();
