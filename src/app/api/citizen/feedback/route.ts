import { NextRequest, NextResponse } from "next/server";
import { Client, Databases } from "node-appwrite";

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

const databases = new Databases(client);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { complaintId, trackingId, rating, feedbackText } = body;

        if (!complaintId || !rating) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
        const complaintsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_COMPLAINTS_COLLECTION_ID!;

        // Update the complaint document with feedback
        await databases.updateDocument(
            databaseId,
            complaintsCollectionId,
            complaintId,
            {
                citizen_feedback_rating: parseInt(rating, 10),
                citizen_feedback_text: feedbackText || "",
            }
        );

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error("Failed to submit feedback:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
