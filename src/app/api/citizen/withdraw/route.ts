import { NextResponse } from "next/server";
import { Client, Databases, ID } from "node-appwrite";
import { logApiError } from '@/lib/error-logger';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { complaintId, trackingId } = body;

        if (!complaintId || !trackingId) {
            return NextResponse.json(
                { error: "Missing required fields", code: "ERR_VALIDATION", status: 400 },
                { status: 400 }
            );
        }

        const client = new Client();
        client
            .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
            .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
            .setKey(process.env.APPWRITE_API_KEY!);

        const databases = new Databases(client);
        const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

        const complaint = await databases.getDocument(
            databaseId,
            process.env.NEXT_PUBLIC_APPWRITE_COMPLAINTS_COLLECTION_ID!,
            complaintId
        );

        if (complaint.tracking_id !== trackingId) {
            return NextResponse.json(
                { error: "Invalid tracking ID", code: "ERR_FORBIDDEN", status: 403 },
                { status: 403 }
            );
        }

        if (complaint.status !== 'pending') {
            return NextResponse.json(
                { error: "Only pending complaints can be withdrawn", code: "ERR_INVALID_STATE", status: 400 },
                { status: 400 }
            );
        }

        await databases.updateDocument(
            databaseId,
            process.env.NEXT_PUBLIC_APPWRITE_COMPLAINTS_COLLECTION_ID!,
            complaintId,
            { status: 'resolved' }
        );

        await databases.createDocument(
            databaseId,
            process.env.NEXT_PUBLIC_APPWRITE_STATUS_LOGS_COLLECTION_ID!,
            ID.unique(),
            {
                complaint_id: trackingId,
                status_from: 'pending',
                status_to: 'resolved',
                remarks: 'Complaint withdrawn by citizen.',
                changed_by_staff_id: 'citizen'
            }
        );

        return NextResponse.json({ success: true, message: "Complaint withdrawn successfully" });

    } catch (error: any) {
        logApiError('/api/citizen/withdraw', error);
        return NextResponse.json(
            { error: "Internal Server Error", code: "ERR_INTERNAL", status: 500 },
            { status: 500 }
        );
    }
}
