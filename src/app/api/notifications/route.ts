import { NextRequest, NextResponse } from 'next/server';
import { serverDatabases, DB_ID, createSessionClient } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';
import { logApiError } from '@/lib/error-logger';

/**
 * GET /api/notifications — Fetch notification feed for the authenticated citizen.
 * Returns status changes for all their complaints, ordered by newest first.
 */
export async function GET(req: NextRequest) {
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!jwt) {
        return NextResponse.json(
            { error: 'Unauthorized', code: 'ERR_UNAUTHORIZED', status: 401 },
            { status: 401 }
        );
    }

    try {
        const { account } = createSessionClient(jwt);
        const user = await account.get();

        const complaintsRes = await serverDatabases.listDocuments(DB_ID, 'complaints', [
            Query.equal('citizen_contact', user.$id),
            Query.limit(100),
        ]);

        if (complaintsRes.documents.length === 0) {
            return NextResponse.json({ notifications: [], total: 0 });
        }

        const trackingIds = complaintsRes.documents.map((c: any) => c.tracking_id).filter(Boolean);

        const notifications: any[] = [];
        for (const trackingId of trackingIds) {
            try {
                const logsRes = await serverDatabases.listDocuments(DB_ID, 'status_logs', [
                    Query.equal('complaint_id', trackingId),
                    Query.orderDesc('$createdAt'),
                    Query.limit(20),
                ]);

                const complaint = complaintsRes.documents.find((c: any) => c.tracking_id === trackingId);

                for (const log of logsRes.documents) {
                    notifications.push({
                        id: log.$id,
                        tracking_id: trackingId,
                        category: complaint?.category || 'unknown',
                        status_from: log.status_from,
                        status_to: log.status_to,
                        remarks: log.remarks,
                        changed_by: log.changed_by_staff_id,
                        created_at: log.$createdAt,
                    });
                }
            } catch { /* skip individual tracking ID errors */ }
        }

        notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return NextResponse.json({
            notifications: notifications.slice(0, 50),
            total: notifications.length,
        });
    } catch (error: any) {
        logApiError('/api/notifications', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error', code: 'ERR_INTERNAL', status: 500 },
            { status: 500 }
        );
    }
}
