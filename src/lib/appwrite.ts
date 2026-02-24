import { Client, Account, Databases, Storage } from 'appwrite';

export const appwriteConfig = {
    endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
    projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '',
    databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '',
    complaintsCollectionId: process.env.NEXT_PUBLIC_APPWRITE_COMPLAINTS_COLLECTION_ID || '',
    statusLogsCollectionId: process.env.NEXT_PUBLIC_APPWRITE_STATUS_LOGS_COLLECTION_ID || '',
    storageId: process.env.NEXT_PUBLIC_APPWRITE_STORAGE_ID || '',
    profilesCollectionId: process.env.NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID || '',
    errorLogsCollectionId: process.env.NEXT_PUBLIC_APPWRITE_ERROR_LOGS_COLLECTION_ID || '',
}

export const client = new Client();

client.setEndpoint(appwriteConfig.endpoint).setProject(appwriteConfig.projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
