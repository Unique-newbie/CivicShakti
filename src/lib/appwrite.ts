import { Client, Account, Databases, Storage } from 'appwrite';

// --- Client-side Appwrite SDK ---
const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const appwriteConfig = {
    endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!,
    projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
    databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'civic_db',
    complaintsCollectionId: 'complaints',
    statusLogsCollectionId: process.env.NEXT_PUBLIC_APPWRITE_STATUS_LOGS_COLLECTION_ID || 'status_logs',
    storageId: process.env.NEXT_PUBLIC_APPWRITE_STORAGE_ID || 'complaint_images',
    profilesCollectionId: process.env.NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID || 'profiles',
    errorLogsCollectionId: process.env.NEXT_PUBLIC_APPWRITE_ERROR_LOGS_COLLECTION_ID || 'error_logs',
};

export { client };
