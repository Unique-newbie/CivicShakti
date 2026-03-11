import { NextRequest, NextResponse } from 'next/server';
import { serverDatabases, DB_ID, createSessionClient } from '@/lib/appwrite-server';
import { Query, ID } from 'node-appwrite';
import { getSLAStatus } from '@/lib/slas';
import { logApiError } from '@/lib/error-logger';

/**
 * POST /api/staff/escalate — Manually escalate a complaint
 * GET  /api/staff/escalate — Fetch all SLA-breached complaints (for auto-escalation)
 */

export async function POST(req: NextRequest) {
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { account } = createSessionClient(jwt);
        const user = await account.get();
        if (!user.labels?.includes('staff') && !user.labels?.includes('superadmin')) {
            return NextResponse.json({ error: 'Staff only' }, { status: 403 });
        }

        const { complaintId, trackingId, reason } = await req.json();

        // Update complaint status to escalated
        await serverDatabases.updateDocument(DB_ID, 'complaints', complaintId, {
            status: 'escalated',
            urgency_level: 'Critical',
        });

        // Log the escalation
        await serverDatabases.createDocument(DB_ID, 'status_logs', ID.unique(), {
            complaint_id: trackingId,
            status_from: 'pending',
            status_to: 'escalated',
            changed_by_staff_id: user.name || user.email,
            remarks: reason || 'Escalated due to SLA breach or priority override',
        });

        return NextResponse.json({ success: true, message: 'Complaint escalated successfully' });
    } catch (error: any) {
        console.error('[staff/escalate POST]', error);
        logApiError('/api/staff/escalate', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { account } = createSessionClient(jwt);
        const user = await account.get();
        if (!user.labels?.includes('staff') && !user.labels?.includes('superadmin')) {
            return NextResponse.json({ error: 'Staff only' }, { status: 403 });
        }

        // Fetch all active complaints
        const active = await serverDatabases.listDocuments(DB_ID, 'complaints', [
            Query.notEqual('status', 'resolved'),
            Query.orderAsc('$createdAt'),
            Query.limit(200),
        ]);

        const breached: any[] = [];
        const warning: any[] = [];

        for (const c of active.documents) {
            const sla = getSLAStatus(c.$createdAt, c.category || 'default', c.status);
            if (sla.status === 'breached') {
                breached.push({
                    id: c.$id,
                    tracking_id: c.tracking_id,
                    category: c.category,
                    status: c.status,
                    address: c.address,
                    created_at: c.$createdAt,
                    hours_overdue: Math.round(sla.hoursOverdue),
                    sla_hours: sla.totalSLAHours,
                });
            } else if (sla.status === 'warning') {
                warning.push({
                    id: c.$id,
                    tracking_id: c.tracking_id,
                    category: c.category,
                    status: c.status,
                    address: c.address,
                    created_at: c.$createdAt,
                    hours_remaining: Math.round(sla.hoursRemaining),
                    sla_hours: sla.totalSLAHours,
                });
            }
        }

        return NextResponse.json({ breached, warning, total_breached: breached.length, total_warning: warning.length });
    } catch (error: any) {
        console.error('[staff/escalate GET]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
