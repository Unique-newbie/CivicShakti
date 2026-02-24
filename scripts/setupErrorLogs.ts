import { Client, Databases, Permission, Role } from "node-appwrite";
import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

const databases = new Databases(client);

async function setupErrorLogs() {
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
    const collectionId = "error_logs";

    try {
        console.log(`Creating collection: ${collectionId}`);
        await databases.createCollection(
            databaseId,
            collectionId,
            "Error Logs",
            [
                Permission.create(Role.any()), // Anyone can log an error (including unauthenticated users hitting a 500)
                Permission.read(Role.users()), // Authenticated staff can read
            ]
        );
        console.log("Collection created.");

        // Create Attributes
        console.log("Creating attributes...");
        await databases.createStringAttribute(databaseId, collectionId, "errorMessage", 5000, true);
        await databases.createStringAttribute(databaseId, collectionId, "errorStack", 10000, false);
        await databases.createStringAttribute(databaseId, collectionId, "componentStack", 10000, false);
        await databases.createStringAttribute(databaseId, collectionId, "url", 2000, false);
        await databases.createStringAttribute(databaseId, collectionId, "userId", 100, false);

        console.log("Please wait a few seconds for attributes to be ready before creating indexes.");
    } catch (error: any) {
        if (error.code === 409) {
            console.log("Collection already exists, skipping creation.");
        } else {
            console.error("Failed to setup error_logs:", error);
        }
    }
}

setupErrorLogs();
