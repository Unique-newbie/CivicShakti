import { NextRequest, NextResponse } from 'next/server';
import { serverDatabases, DB_ID, createSessionClient } from '@/lib/appwrite-server';
import { Query, ID } from 'node-appwrite';
import { sendStatusUpdateEmail } from '@/lib/email';
import { logApiError } from '@/lib/error-logger';

export async function POST(req: NextRequest) {
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { account } = createSessionClient(jwt);
        const user = await account.get();
        if (!user.labels?.includes('staff') && !user.labels?.includes('superadmin')) {
            return NextResponse.json({ error: 'Staff only' }, { status: 403 });
        }

        const {
            complaintId, trackingId, newStatus, oldStatus,
            internalNotes, resolutionImageUrl, changedByStaffId,
        } = await req.json();

        // Update complaint status
        const updateData: any = { status: newStatus };
        if (resolutionImageUrl) updateData.resolution_image_url = resolutionImageUrl;

        await serverDatabases.updateDocument(DB_ID, 'complaints', complaintId, updateData);

        // Create status log
        await serverDatabases.createDocument(DB_ID, 'status_logs', ID.unique(), {
            complaint_id: trackingId,
            status_from: oldStatus,
            status_to: newStatus,
            changed_by_staff_id: changedByStaffId || user.name || user.email,
            remarks: internalNotes || null,
        });

        // Update trust score based on resolution
        if (newStatus === 'resolved') {
            try {
                const complaint = await serverDatabases.getDocument(DB_ID, 'complaints', complaintId);
                if (complaint.citizen_contact && complaint.citizen_contact !== 'anonymous') {
                    const profileRes = await serverDatabases.listDocuments(DB_ID, 'profiles', [
                        Query.equal('user_id', complaint.citizen_contact),
                        Query.limit(1),
                    ]);
                    if (profileRes.documents.length > 0) {
                        const profile = profileRes.documents[0];
                        const newScore = Math.min(100, (profile.trust_score || 50) + 2);
                        await serverDatabases.updateDocument(DB_ID, 'profiles', profile.$id, {
                            trust_score: newScore,
                        });
                    }
                }
            } catch (e) { console.warn('Trust score update failed:', e); }
        }

        // Send email notification (non-blocking)
        try {
            const complaint = await serverDatabases.getDocument(DB_ID, 'complaints', complaintId);
            if (complaint.citizen_contact && complaint.citizen_contact.includes('@')) {
                sendStatusUpdateEmail(
                    complaint.citizen_contact,
                    trackingId,
                    newStatus,
                    internalNotes || '',
                    complaint.department || 'General'
                ).catch(console.error);
            }
        } catch (e) { /* non-critical */ }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[complaint_status POST]', error);
        logApiError('/api/staff/complaint_status', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
