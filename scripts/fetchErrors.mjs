import { Client, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const API_KEY = process.env.APPWRITE_API_KEY;

if (!API_KEY) {
    console.error("APPWRITE_API_KEY missing");
    process.exit(1);
}

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
    .setKey(API_KEY);

const databases = new Databases(client);

async function fetchErrors() {
    try {
        const response = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
            'error_logs', // hardcoded error logs collection name or ID
            [
                Query.limit(5),
                Query.orderDesc('$createdAt')
            ]
        );
        console.log("Recent Errors:");
        response.documents.forEach(doc => {
            console.log(`\nTime: ${doc.$createdAt}\nError: ${doc.errorMessage}\nURL: ${doc.url}\nUser: ${doc.userId}`);
            console.log(`Stack: ${doc.errorStack ? doc.errorStack.substring(0, 500) : "None"}`);
        });
    } catch (e) {
        console.error("Failed to fetch errors:", e);
    }
}

fetchErrors();
