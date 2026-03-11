import { NextRequest, NextResponse } from 'next/server';
import { createSessionClient, DB_ID, serverDatabases } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';
import { logApiError } from '@/lib/error-logger';

// GET — list all Appwrite auth users (superadmin only)
export async function GET(req: NextRequest) {
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { account } = createSessionClient(jwt);
        const user = await account.get();
        if (!user.labels?.includes('staff') && !user.labels?.includes('superadmin')) {
            return NextResponse.json({ error: 'Staff only' }, { status: 403 });
        }

        // Verify superadmin
        const callerProfileRes = await serverDatabases.listDocuments(DB_ID, 'profiles', [
            Query.equal('user_id', user.$id),
            Query.limit(1),
        ]);
        const callerProfile = callerProfileRes.documents[0];
        const isSuperadmin = user.labels?.includes('superadmin') || callerProfile?.admin_level === 'superadmin';
        if (!isSuperadmin) {
            return NextResponse.json({ error: 'Only superadmins can view all accounts' }, { status: 403 });
        }

        const { serverUsers } = await import('@/lib/appwrite-server');
        
        // Fetch all users (paginated, up to 100)
        const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
        const limit = 25;
        const offset = (page - 1) * limit;
        
        const usersRes = await serverUsers.list(
            [Query.limit(limit), Query.offset(offset), Query.orderDesc('$createdAt')]
        );

        // For each user, try to get their profile info
        const usersWithProfiles = await Promise.all(
            usersRes.users.map(async (u: any) => {
                let profile = null;
                try {
                    const profileRes = await serverDatabases.listDocuments(DB_ID, 'profiles', [
                        Query.equal('user_id', u.$id),
                        Query.limit(1),
                    ]);
                    profile = profileRes.documents[0] || null;
                } catch { /* no profile */ }

                return {
                    id: u.$id,
                    name: u.name,
                    email: u.email,
                    phone: u.phone,
                    labels: u.labels || [],
                    emailVerification: u.emailVerification,
                    status: u.status,
                    registration: u.registration,
                    createdAt: u.$createdAt,
                    lastActivity: u.accessedAt,
                    profile: profile ? {
                        id: profile.$id,
                        fullName: profile.full_name,
                        adminLevel: profile.admin_level || 'none',
                        isVerified: profile.is_verified,
                        trustScore: profile.trust_score,
                    } : null,
                };
            })
        );

        return NextResponse.json({
            users: usersWithProfiles,
            total: usersRes.total,
            page,
            totalPages: Math.ceil(usersRes.total / limit),
        });
    } catch (error: any) {
        logApiError('/api/staff/accounts GET', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error', code: 'ERR_INTERNAL', status: 500 },
            { status: 500 }
        );
    }
}

// DELETE — delete a user account (superadmin only)
export async function DELETE(req: NextRequest) {
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { account } = createSessionClient(jwt);
        const user = await account.get();
        if (!user.labels?.includes('staff') && !user.labels?.includes('superadmin')) {
            return NextResponse.json({ error: 'Staff only' }, { status: 403 });
        }

        // Verify superadmin
        const callerProfileRes = await serverDatabases.listDocuments(DB_ID, 'profiles', [
            Query.equal('user_id', user.$id),
            Query.limit(1),
        ]);
        const callerProfile = callerProfileRes.documents[0];
        const isSuperadmin = user.labels?.includes('superadmin') || callerProfile?.admin_level === 'superadmin';
        if (!isSuperadmin) {
            return NextResponse.json({ error: 'Only superadmins can delete accounts' }, { status: 403 });
        }

        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        // Prevent self-deletion
        if (userId === user.$id) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }

        const { serverUsers } = await import('@/lib/appwrite-server');

        // Delete user's profile document if exists
        try {
            const profileRes = await serverDatabases.listDocuments(DB_ID, 'profiles', [
                Query.equal('user_id', userId),
                Query.limit(1),
            ]);
            if (profileRes.documents.length > 0) {
                await serverDatabases.deleteDocument(DB_ID, 'profiles', profileRes.documents[0].$id);
            }
        } catch { /* profile might not exist */ }

        // Delete the auth user
        await serverUsers.delete(userId);

        return NextResponse.json({ success: true, deletedUserId: userId });
    } catch (error: any) {
        logApiError('/api/staff/accounts DELETE', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error', code: 'ERR_INTERNAL', status: 500 },
            { status: 500 }
        );
    }
}
