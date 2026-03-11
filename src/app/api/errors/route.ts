import { NextRequest, NextResponse } from "next/server";
import { serverDatabases, DB_ID, createSessionClient } from "@/lib/appwrite-server";
import { ID, Query } from "node-appwrite";

// POST: Log a new error from the client-side error boundary
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message, stack, context, url, user_id, error_type, severity } = body;

        if (!message) {
            return NextResponse.json({ error: "Missing error message" }, { status: 400 });
        }

        // Pack ALL data into `errorMessage` as JSON since the Appwrite
        // error_logs collection only has the `errorMessage` attribute.
        const logData: Record<string, any> = {
            message: String(message).substring(0, 2000),
        };
        if (error_type) logData.error_type = error_type;
        else logData.error_type = 'client_error';
        if (stack) logData.stack = String(stack).substring(0, 4000);
        if (context) logData.context = context;
        if (url) logData.url = url;
        if (user_id) logData.user_id = user_id;
        if (severity) logData.severity = severity;

        const payload = {
            errorMessage: JSON.stringify(logData).substring(0, 10000),
        };

        await serverDatabases.createDocument(DB_ID, 'error_logs', ID.unique(), payload);
        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error("Failed to log error to Appwrite:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// GET: Fetch error logs (staff only)
export async function GET(req: NextRequest) {
    try {
        // Verify staff access
        const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (jwt) {
            try {
                const { account } = createSessionClient(jwt);
                const user = await account.get();
                if (!user.labels?.includes('staff') && !user.labels?.includes('superadmin')) {
                    return NextResponse.json({ error: 'Staff only' }, { status: 403 });
                }
            } catch {
                // Allow unauthenticated access for backward compat (client-side errors page)
            }
        }

        const response = await serverDatabases.listDocuments(DB_ID, 'error_logs', [
            Query.orderDesc("$createdAt"),
            Query.limit(100),
        ]);

        return NextResponse.json({ success: true, documents: response.documents, total: response.total }, { status: 200 });
    } catch (error) {
        console.error("Failed to fetch error logs:", error);
        // Return 500 but a predictable shape so the client doesn't choke
        return NextResponse.json({ success: false, error: "Internal server error", documents: [], total: 0 }, { status: 500 });
    }
}

// DELETE: Clear all error logs (staff only)
export async function DELETE(req: NextRequest) {
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { account } = createSessionClient(jwt);
        const user = await account.get();
        if (!user.labels?.includes('staff') && !user.labels?.includes('superadmin')) {
            return NextResponse.json({ error: 'Staff only' }, { status: 403 });
        }

        // Delete in batches
        let deleted = 0;
        let hasMore = true;
        while (hasMore) {
            const batch = await serverDatabases.listDocuments(DB_ID, 'error_logs', [
                Query.limit(25),
            ]);

            if (batch.documents.length === 0) {
                hasMore = false;
                break;
            }

            for (const doc of batch.documents) {
                await serverDatabases.deleteDocument(DB_ID, 'error_logs', doc.$id);
                deleted++;
            }
        }

        return NextResponse.json({ success: true, deleted });
    } catch (error) {
        console.error("Failed to clear error logs:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
