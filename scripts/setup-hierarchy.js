import { Client, Databases, ID } from "node-appwrite";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function setupHierarchy() {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const key = process.env.APPWRITE_API_KEY;
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const complaintsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_COMPLAINTS_COLLECTION_ID;
    const profilesCollectionId = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID;

    if (!endpoint || !project || !key || !dbId || !complaintsCollectionId || !profilesCollectionId) {
        console.error("Missing Appwrite environment variables. Please check .env.local");
        process.exit(1);
    }

    const client = new Client()
        .setEndpoint(endpoint)
        .setProject(project)
        .setKey(key);

    const databases = new Databases(client);

    console.log("Setting up Hierarchical Collections and Attributes...");

    try {
        // 1. Create States Collection
        console.log("Creating States collection...");
        const statesCollection = await createCollectionOrGet(databases, dbId, "states", "States");
        await createAttribute(databases, dbId, statesCollection.$id, 'string', "name", 128, true);

        // 2. Create Cities Collection
        console.log("Creating Cities collection...");
        const citiesCollection = await createCollectionOrGet(databases, dbId, "cities", "Cities");
        await createAttribute(databases, dbId, citiesCollection.$id, 'string', "name", 128, true);
        await createAttribute(databases, dbId, citiesCollection.$id, 'string', "state_id", 36, true);

        // 3. Create Villages Collection
        console.log("Creating Villages collection...");
        const villagesCollection = await createCollectionOrGet(databases, dbId, "villages", "Villages");
        await createAttribute(databases, dbId, villagesCollection.$id, 'string', "name", 128, true);
        await createAttribute(databases, dbId, villagesCollection.$id, 'string', "city_id", 36, true);

        // 4. Create Wards Collection
        console.log("Creating Wards collection...");
        const wardsCollection = await createCollectionOrGet(databases, dbId, "wards", "Wards");
        await createAttribute(databases, dbId, wardsCollection.$id, 'string', "name", 128, true);
        await createAttribute(databases, dbId, wardsCollection.$id, 'string', "village_id", 36, true);

        // 5. Update Complaints Collection schema
        console.log("Adding hierarchy fields to Complaints collection...");
        await createAttribute(databases, dbId, complaintsCollectionId, 'string', "state_id", 36, false);
        await createAttribute(databases, dbId, complaintsCollectionId, 'string', "city_id", 36, false);
        await createAttribute(databases, dbId, complaintsCollectionId, 'string', "village_id", 36, false);
        await createAttribute(databases, dbId, complaintsCollectionId, 'string', "ward_id", 36, false);

        // 6. Update Profiles Collection schema for staff admins
        console.log("Adding hierarchy fields to Profiles collection (for staff)...");
        await createAttribute(databases, dbId, profilesCollectionId, 'string', "admin_level", 32, false, "none"); // none, state, city, village, ward
        await createAttribute(databases, dbId, profilesCollectionId, 'string', "state_id", 36, false);
        await createAttribute(databases, dbId, profilesCollectionId, 'string', "city_id", 36, false);
        await createAttribute(databases, dbId, profilesCollectionId, 'string', "village_id", 36, false);
        await createAttribute(databases, dbId, profilesCollectionId, 'string', "ward_id", 36, false);

        console.log("\n✅ Hierarchy Setup Complete!");
        console.log("Please wait 30-60 seconds for Appwrite to create the database indexes and attributes before using the app.");

    } catch (error) {
        console.error("Setup failed:", error);
    }
}

async function createCollectionOrGet(databases, dbId, id, name) {
    try {
        const coll = await databases.createCollection(dbId, id, name);
        console.log(`Created collection: ${name} (${id})`);
        return coll;
    } catch (error) {
        if (error.code === 409) {
            console.log(`Collection ${name} (${id}) already exists.`);
            return databases.getCollection(dbId, id);
        }
        throw error;
    }
}

async function createAttribute(databases, dbId, collectionId, type, key, size, required, defaultValue = null) {
    try {
        if (type === 'string') {
            await databases.createStringAttribute(dbId, collectionId, key, size, required, defaultValue);
        }
        // Wait a small amount of time to avoid rapid-fire attribute creation errors in Appwrite
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log(`Added attribute ${key} to ${collectionId}`);
    } catch (error) {
        if (error.code === 409) {
            console.log(`Attribute ${key} already exists on ${collectionId}.`);
        } else {
            console.error(`Error creating attribute ${key} on ${collectionId}:`, error.message);
        }
    }
}

setupHierarchy();
