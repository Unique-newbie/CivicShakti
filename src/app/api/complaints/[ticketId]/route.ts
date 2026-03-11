import { NextRequest, NextResponse } from 'next/server';
import { serverDatabases, DB_ID } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';
import { logApiError } from '@/lib/error-logger';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ ticketId: string }> }
) {
    const { ticketId } = await params;

    try {
        const res = await serverDatabases.listDocuments(DB_ID, 'complaints', [
            Query.equal('tracking_id', ticketId),
            Query.limit(1),
        ]);

        if (res.documents.length === 0) {
            return NextResponse.json(
                { error: 'Complaint not found', code: 'ERR_NOT_FOUND', status: 404 },
                { status: 404 }
            );
        }

        const complaint = res.documents[0];

        const logsRes = await serverDatabases.listDocuments(DB_ID, 'status_logs', [
            Query.equal('complaint_id', ticketId),
            Query.orderAsc('$createdAt'),
        ]);

        return NextResponse.json({
            ...complaint,
            statusLogs: logsRes.documents,
        });
    } catch (error: any) {
        logApiError('/api/complaints/[ticketId]', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error', code: 'ERR_INTERNAL', status: 500 },
            { status: 500 }
        );
    }
}
