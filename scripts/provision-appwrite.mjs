import { Client, Databases, Storage, ID, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Ensure we have a server-side API Key for this script to run
const API_KEY = process.env.APPWRITE_API_KEY;

if (!API_KEY) {
    console.error("❌ ERROR: APPWRITE_API_KEY is missing from .env.local");
    console.error("Please go to Appwrite Console -> Overview -> Integrate with your server -> Create API Key.");
    console.error("Give it permissions: databases.read, databases.write, storage.read, storage.write, collections.read, collections.write, attributes.read, attributes.write, indexes.read, indexes.write");
    process.exit(1);
}

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
    .setKey(API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

const DB_ID = ID.custom('civic_db');
const COMPLAINTS_COLLECTION_ID = ID.custom('complaints');
const STATUS_LOGS_COLLECTION_ID = ID.custom('status_logs');
const STORAGE_BUCKET_ID = ID.custom('complaint_images');

async function provisionAppwrite() {
    console.log("🚀 Starting Appwrite Provisioning...");

    try {
        const runIdempotent = async (promise) => {
            try { return await promise; } catch (e) {
                if (e.code !== 409 && e.code !== 403 && e.code !== 400) throw e;
                return null;
            }
        };

        // 1. Create Database
        console.log("📦 Creating Database...");
        await runIdempotent(databases.create(DB_ID, 'CivicShakti DB'));
        console.log("✅ Database Created: " + DB_ID);

        // 2. Create Complaints Collection
        console.log("📝 Creating Complaints Collection...");
        await runIdempotent(databases.createCollection(DB_ID, COMPLAINTS_COLLECTION_ID, 'Complaints', [
            Permission.read(Role.any()), // Public can read for tracking
            Permission.create(Role.any()), // Public can submit
            Permission.update(Role.users()), // Only logged in staff can update
            Permission.delete(Role.users())
        ]));
        console.log("✅ Complaints Collection Created: " + COMPLAINTS_COLLECTION_ID);

        // Define Complaints Attributes
        console.log("⚙️ Creating Complaint Attributes... (this takes a moment)");
        await runIdempotent(databases.createStringAttribute(DB_ID, COMPLAINTS_COLLECTION_ID, 'tracking_id', 50, true));
        await runIdempotent(databases.createStringAttribute(DB_ID, COMPLAINTS_COLLECTION_ID, 'category', 100, true));
        await runIdempotent(databases.createStringAttribute(DB_ID, COMPLAINTS_COLLECTION_ID, 'description', 2000, true));
        await runIdempotent(databases.createFloatAttribute(DB_ID, COMPLAINTS_COLLECTION_ID, 'lat', false));
        await runIdempotent(databases.createFloatAttribute(DB_ID, COMPLAINTS_COLLECTION_ID, 'lng', false));
        await runIdempotent(databases.createStringAttribute(DB_ID, COMPLAINTS_COLLECTION_ID, 'address', 500, false));
        await runIdempotent(databases.createStringAttribute(DB_ID, COMPLAINTS_COLLECTION_ID, 'status', 50, false, 'pending'));
        await runIdempotent(databases.createStringAttribute(DB_ID, COMPLAINTS_COLLECTION_ID, 'image_url', 1000, false));
        await runIdempotent(databases.createStringAttribute(DB_ID, COMPLAINTS_COLLECTION_ID, 'resolution_image_url', 1000, false));
        await runIdempotent(databases.createStringAttribute(DB_ID, COMPLAINTS_COLLECTION_ID, 'citizen_contact', 255, false));
        await runIdempotent(databases.createStringAttribute(DB_ID, COMPLAINTS_COLLECTION_ID, 'department', 100, false, 'General Services'));

        // Wait for attributes to be created before indexes (Appwrite requires this)
        await new Promise(resolve => setTimeout(resolve, 3000));

        await runIdempotent(databases.createIndex(DB_ID, COMPLAINTS_COLLECTION_ID, 'status_index', 'key', ['status']));
        await runIdempotent(databases.createIndex(DB_ID, COMPLAINTS_COLLECTION_ID, 'tracking_idx', 'unique', ['tracking_id']));

        console.log("✅ Complaints Attributes & Indexes Created");

        // 3. Create Status Logs Collection
        console.log("📝 Creating Status Logs Collection...");
        await runIdempotent(databases.createCollection(DB_ID, STATUS_LOGS_COLLECTION_ID, 'Status Logs', [
            Permission.read(Role.any()), // Public can read logs on track page
            Permission.create(Role.users()), // Only specific staff should ideally create logs, using generic users for MVP
            Permission.update(Role.users()),
            Permission.delete(Role.users())
        ]));

        console.log("✅ Status Logs Collection Created: " + STATUS_LOGS_COLLECTION_ID);

        console.log("⚙️ Creating Status Log Attributes...");
        await runIdempotent(databases.createStringAttribute(DB_ID, STATUS_LOGS_COLLECTION_ID, 'complaint_id', 100, true));
        await runIdempotent(databases.createStringAttribute(DB_ID, STATUS_LOGS_COLLECTION_ID, 'status_from', 50, true));
        await runIdempotent(databases.createStringAttribute(DB_ID, STATUS_LOGS_COLLECTION_ID, 'status_to', 50, true));
        await runIdempotent(databases.createStringAttribute(DB_ID, STATUS_LOGS_COLLECTION_ID, 'remarks', 2000, false));
        await runIdempotent(databases.createStringAttribute(DB_ID, STATUS_LOGS_COLLECTION_ID, 'changed_by_staff_id', 100, true));

        await new Promise(resolve => setTimeout(resolve, 2000));
        await runIdempotent(databases.createIndex(DB_ID, STATUS_LOGS_COLLECTION_ID, 'complaint_idx', 'key', ['complaint_id']));

        console.log("✅ Status Log Attributes & Indexes Created");

        // 4. Create Storage Bucket
        console.log("🪣 Creating Storage Bucket...");
        await runIdempotent(storage.createBucket(STORAGE_BUCKET_ID, 'Complaint Images', [
            Permission.read(Role.any()), // Anyone can view images
            Permission.create(Role.any()), // Public can upload images when reporting
            Permission.update(Role.users()), // Only staff can update
            Permission.delete(Role.users())
        ], false, 15000000)); // 15MB limit

        console.log("✅ Storage Bucket Created: " + STORAGE_BUCKET_ID);

        console.log("\n🎉 Provisioning Complete! Please add the following to your .env.local:\n");
        console.log(`NEXT_PUBLIC_APPWRITE_DATABASE_ID=${DB_ID}`);
        console.log(`NEXT_PUBLIC_APPWRITE_COMPLAINTS_COLLECTION_ID=${COMPLAINTS_COLLECTION_ID}`);
        console.log(`NEXT_PUBLIC_APPWRITE_STATUS_LOGS_COLLECTION_ID=${STATUS_LOGS_COLLECTION_ID}`);
        console.log(`NEXT_PUBLIC_APPWRITE_STORAGE_ID=${STORAGE_BUCKET_ID}`);

    } catch (error) {
        console.error("❌ Provisioning Failed:", error);
    }
}

provisionAppwrite();
