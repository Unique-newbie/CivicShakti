import { NextRequest, NextResponse } from 'next/server';
import { serverDatabases, DB_ID, createSessionClient } from '@/lib/appwrite-server';
import { Query, ID } from 'node-appwrite';
import { logApiError } from '@/lib/error-logger';

/**
 * POST /api/ai/feedback
 * Staff submits feedback on AI detection accuracy.
 * Stores labeled data for few-shot learning enhancement.
 */
export async function POST(req: NextRequest) {
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { account } = createSessionClient(jwt);
        const user = await account.get();

        // Only staff can submit feedback
        if (!user.labels?.includes('staff')) {
            return NextResponse.json({ error: 'Staff only' }, { status: 403 });
        }

        const body = await req.json();
        const {
            complaint_id,
            ai_category,
            correct_category,
            ai_severity_score,
            correct_severity,
            is_correct,
            feedback_note,
            image_url,
        } = body;

        if (!complaint_id) {
            return NextResponse.json({ error: 'complaint_id is required' }, { status: 400 });
        }

        const payload: Record<string, any> = {
            complaint_id: String(complaint_id),
            staff_id: user.$id,
            ai_category: String(ai_category || ''),
            correct_category: String(correct_category || ai_category || ''),
            is_correct: is_correct !== false, // default to true
            feedback_note: String(feedback_note || '').substring(0, 2000),
        };

        // Optional fields
        if (ai_severity_score !== undefined) payload.ai_severity_score = Number(ai_severity_score);
        if (correct_severity !== undefined) payload.correct_severity = String(correct_severity);
        if (image_url) payload.image_url = String(image_url).substring(0, 5000);

        await serverDatabases.createDocument(DB_ID, 'ai_feedback', ID.unique(), payload);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[ai/feedback POST]', error);
        logApiError('/api/ai/feedback', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * GET /api/ai/feedback
 * Fetch AI accuracy stats for the admin dashboard.
 */
export async function GET(req: NextRequest) {
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { account } = createSessionClient(jwt);
        const user = await account.get();
        if (!user.labels?.includes('staff')) {
            return NextResponse.json({ error: 'Staff only' }, { status: 403 });
        }

        // Fetch all feedback entries
        const all = await serverDatabases.listDocuments(DB_ID, 'ai_feedback', [
            Query.orderDesc('$createdAt'),
            Query.limit(500),
        ]);

        const total = all.total;
        const correct = all.documents.filter((d: any) => d.is_correct === true).length;
        const incorrect = total - correct;
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

        // Category accuracy breakdown
        const categoryStats: Record<string, { correct: number; total: number }> = {};
        for (const doc of all.documents) {
            const cat = (doc as any).ai_category || 'unknown';
            if (!categoryStats[cat]) categoryStats[cat] = { correct: 0, total: 0 };
            categoryStats[cat].total++;
            if ((doc as any).is_correct) categoryStats[cat].correct++;
        }

        return NextResponse.json({
            total,
            correct,
            incorrect,
            accuracy,
            category_stats: categoryStats,
            recent_feedback: all.documents.slice(0, 20),
        });
    } catch (error: any) {
        console.error('[ai/feedback GET]', error);
        logApiError('/api/ai/feedback GET', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
