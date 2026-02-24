import { NextRequest, NextResponse } from "next/server";
import { Client, Databases } from "node-appwrite";

// Setup Node Appwrite Client
const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

const databases = new Databases(client);

export async function POST(req: NextRequest) {
    try {
        // Enforce strict Server-Side Auth Check for Staff Actions
        try {
            const authHeader = req.headers.get('authorization');
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new Error("missing_jwt");
            }
            const jwt = authHeader.split(' ')[1];

            const { createJWTClient } = await import("@/lib/server-appwrite");
            const { account } = createJWTClient(jwt);
            const user = await account.get();
            // Validate official staff domain
            if (!user.email.endsWith("@civicshakti.gov") && !user.email.endsWith("@civicshakti.com")) {
                throw new Error("unauthorized_domain");
            }
        } catch (error) {
            console.warn("[Auth] Unauthorized staff action attempt blocked.", error);
            return NextResponse.json({ error: "Unauthorized. Official staff account required." }, { status: 401 });
        }

        const body = await req.json();
        const {
            complaintId,
            assignedTo // The staff ID (user.$id) who is taking this ticket
        } = body;

        if (!complaintId) {
            return NextResponse.json({ error: "Missing complaintId" }, { status: 400 });
        }

        const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
        const complaintsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_COMPLAINTS_COLLECTION_ID!;

        // Update the assigned_to field
        await databases.updateDocument(
            databaseId,
            complaintsCollectionId,
            complaintId,
            {
                assigned_to: assignedTo || "" // Use empty string to unassign
            }
        );

        return NextResponse.json({ success: true, assigned_to: assignedTo }, { status: 200 });

    } catch (error: any) {
        console.error("Failed to assign staff securely:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
