import { NextRequest, NextResponse } from 'next/server';
import { serverDatabases, DB_ID, createSessionClient } from '@/lib/appwrite-server';
import { logApiError } from '@/lib/error-logger';

export async function POST(req: NextRequest) {
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
        if (!user.labels?.includes('staff') && !user.labels?.includes('superadmin')) {
            return NextResponse.json(
                { error: 'Staff only', code: 'ERR_FORBIDDEN', status: 403 },
                { status: 403 }
            );
        }

        const { complaintId, assignedTo } = await req.json();

        await serverDatabases.updateDocument(DB_ID, 'complaints', complaintId, {
            assigned_to: assignedTo || null,
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        logApiError('/api/staff/assign', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error', code: 'ERR_INTERNAL', status: 500 },
            { status: 500 }
        );
    }
}
