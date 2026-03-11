import { NextRequest, NextResponse } from 'next/server';
import { serverDatabases, DB_ID, createSessionClient } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';
import { logApiError } from '@/lib/error-logger';

/**
 * POST /api/complaints/feedback — Submit citizen feedback on a resolved complaint
 */
export async function POST(req: NextRequest) {
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { account } = createSessionClient(jwt);
        const user = await account.get();

        const { complaintId, rating, feedbackText } = await req.json();

        if (!complaintId || !rating || rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'Invalid feedback: complaintId and rating (1-5) required' }, { status: 400 });
        }

        // Verify the complaint belongs to the citizen and is resolved
        const complaint = await serverDatabases.getDocument(DB_ID, 'complaints', complaintId);
        if (complaint.citizen_contact !== user.$id) {
            return NextResponse.json({ error: 'You can only rate your own complaints' }, { status: 403 });
        }
        if (complaint.status !== 'resolved') {
            return NextResponse.json({ error: 'Feedback can only be given on resolved complaints' }, { status: 400 });
        }

        // Update the complaint with feedback
        await serverDatabases.updateDocument(DB_ID, 'complaints', complaintId, {
            citizen_feedback_rating: rating,
            citizen_feedback_text: feedbackText || null,
        });

        return NextResponse.json({ success: true, message: 'Thank you for your feedback!' });
    } catch (error: any) {
        console.error('[complaints/feedback POST]', error);
        logApiError('/api/complaints/feedback', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
