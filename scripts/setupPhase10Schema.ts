import { Client, Databases, Permission, Role, ID } from "node-appwrite";
import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

const databases = new Databases(client);

async function setupPhase10Schema() {
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
    const complaintsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_COMPLAINTS_COLLECTION_ID!;
    const profilesCollectionId = "profiles";

    console.log("Adding attributes to complaints collection...");
    try {
        await databases.createStringAttribute(databaseId, complaintsCollectionId, "device_fingerprint", 255, false);
        console.log("Added device_fingerprint to complaints");
    } catch (e: any) {
        if (e.code === 409) console.log("device_fingerprint already exists");
        else console.error(e);
    }

    try {
        await databases.createStringAttribute(databaseId, complaintsCollectionId, "ip_address", 45, false);
        console.log("Added ip_address to complaints");
    } catch (e: any) {
        if (e.code === 409) console.log("ip_address already exists");
        else console.error(e);
    }

    console.log(`\nCreating collection: ${profilesCollectionId}`);
    try {
        await databases.createCollection(
            databaseId,
            profilesCollectionId,
            "Profiles",
            [
                Permission.read(Role.any()),
                Permission.read(Role.users()),
                Permission.update(Role.users()),
            ]
        );
        await databases.updateCollection(databaseId, profilesCollectionId, "Profiles", [
            Permission.read(Role.any()),
            Permission.create(Role.users()),
        ]);
        console.log("Collection created.");

        console.log("Creating attributes for profiles...");
        await databases.createStringAttribute(databaseId, profilesCollectionId, "user_id", 100, true);
        await databases.createIntegerAttribute(databaseId, profilesCollectionId, "trust_score", false, 0, 100, 50);

        console.log("\nPlease wait a few seconds...");

        console.log(`\nIMPORTANT: Add this to your .env.local and .env.example:
NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID=${profilesCollectionId}`);

    } catch (error: any) {
        if (error.code === 409) {
            console.log("Collection already exists, skipping creation. Just verifying attributes...");
            try {
                await databases.createStringAttribute(databaseId, profilesCollectionId, "user_id", 100, true);
                console.log("Added user_id");
            } catch (e: any) { }
            try {
                await databases.createIntegerAttribute(databaseId, profilesCollectionId, "trust_score", false, 0, 100, 50);
                console.log("Added trust_score");
            } catch (e: any) { }
        } else {
            console.error("Failed to setup profiles:", error);
        }
    }
}

setupPhase10Schema();
