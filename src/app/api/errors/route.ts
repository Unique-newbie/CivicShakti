import { NextRequest, NextResponse } from "next/server";
import { Client, Databases, ID, Query } from "node-appwrite";

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

const databases = new Databases(client);

// POST: Add new error to logs from global error boundary
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message, stack, context, url, user_id } = body;

        if (!message) {
            return NextResponse.json({ error: "Missing error message" }, { status: 400 });
        }

        const payload: any = { message };
        if (stack) payload.stack = String(stack).substring(0, 5000);
        if (context) payload.context = String(context).substring(0, 1000);
        if (url) payload.url = String(url).substring(0, 500);
        if (user_id) payload.user_id = String(user_id);

        const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
        const colId = process.env.NEXT_PUBLIC_APPWRITE_ERROR_LOGS_COLLECTION_ID;

        if (!dbId || !colId) return NextResponse.json({ error: "Config error" }, { status: 500 });

        await databases.createDocument(dbId, colId, ID.unique(), payload);
        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error("Failed to log error to Appwrite:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// GET: Fetch recent error logs securely (used by Admin Errors Page)
export async function GET() {
    try {
        const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
        const colId = process.env.NEXT_PUBLIC_APPWRITE_ERROR_LOGS_COLLECTION_ID;

        if (!dbId || !colId) return NextResponse.json({ error: "Config missing" }, { status: 500 });

        const response = await databases.listDocuments(dbId, colId, [
            Query.orderDesc("$createdAt"),
            Query.limit(100)
        ]);

        return NextResponse.json({ documents: response.documents }, { status: 200 });
    } catch (error) {
        console.error("Failed to fetch error logs from Appwrite:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

