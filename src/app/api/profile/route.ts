import { NextRequest, NextResponse } from 'next/server';
import { serverDatabases, DB_ID, createSessionClient } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';
import { logApiError } from '@/lib/error-logger';

// GET /api/profile — get current user's profile + complaints
export async function GET(req: NextRequest) {
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { account } = createSessionClient(jwt);
        const user = await account.get();

        // Fetch profile
        let profile = null;
        try {
            const profileRes = await serverDatabases.listDocuments(DB_ID, 'profiles', [
                Query.equal('user_id', user.$id),
                Query.limit(1),
            ]);
            if (profileRes.documents.length > 0) profile = profileRes.documents[0];
        } catch (e) { /* no profile yet */ }

        // Fetch complaints
        let complaints: any[] = [];
        try {
            const complaintsRes = await serverDatabases.listDocuments(DB_ID, 'complaints', [
                Query.equal('citizen_contact', user.$id),
                Query.orderDesc('$createdAt'),
                Query.limit(100),
            ]);
            complaints = complaintsRes.documents;
        } catch (e) { /* no complaints */ }

        return NextResponse.json({
            user: {
                $id: user.$id,
                id: user.$id,
                email: user.email,
                name: user.name,
                role: user.labels?.includes('staff') ? 'staff' : 'citizen',
                createdAt: user.$createdAt,
                emailVerification: user.emailVerification,
            },
            profile,
            complaints,
        });
    } catch (error: any) {
        logApiError('/api/profile GET', error);
        return NextResponse.json(
            { error: 'Unauthorized', code: 'ERR_UNAUTHORIZED', status: 401 },
            { status: 401 }
        );
    }
}

// PATCH /api/profile — update profile
export async function PATCH(req: NextRequest) {
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { account } = createSessionClient(jwt);
        const user = await account.get();
        const body = await req.json();

        const profileRes = await serverDatabases.listDocuments(DB_ID, 'profiles', [
            Query.equal('user_id', user.$id),
            Query.limit(1),
        ]);

        const profileData: any = {};
        if (body.full_name !== undefined) profileData.full_name = body.full_name;
        if (body.phone_number !== undefined) profileData.phone_number = body.phone_number;
        if (body.address !== undefined) profileData.address = body.address;

        let updated;
        if (profileRes.documents.length > 0) {
            updated = await serverDatabases.updateDocument(
                DB_ID, 'profiles', profileRes.documents[0].$id, profileData
            );
        } else {
            const { ID } = require('node-appwrite');
            updated = await serverDatabases.createDocument(DB_ID, 'profiles', ID.unique(), {
                user_id: user.$id,
                trust_score: 50,
                is_verified: false,
                ...profileData,
            });
        }

        return NextResponse.json(updated);
    } catch (error: any) {
        logApiError('/api/profile PATCH', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error', code: 'ERR_INTERNAL', status: 500 },
            { status: 500 }
        );
    }
}
