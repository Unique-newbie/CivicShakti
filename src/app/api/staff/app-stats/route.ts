import { NextRequest, NextResponse } from 'next/server';
import { createSessionClient, DB_ID, serverDatabases } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';
import { logApiError } from '@/lib/error-logger';

// GET — aggregate app-wide statistics (superadmin only)
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
            return NextResponse.json({ error: 'Only superadmins can view app stats' }, { status: 403 });
        }

        const { serverUsers } = await import('@/lib/appwrite-server');

        // Total auth users
        let totalUsers = 0;
        try {
            const usersRes = await serverUsers.list([Query.limit(1)]);
            totalUsers = usersRes.total;
        } catch { /* empty */ }

        // Total profiles
        let totalProfiles = 0;
        try {
            const profilesRes = await serverDatabases.listDocuments(DB_ID, 'profiles', [Query.limit(1)]);
            totalProfiles = profilesRes.total;
        } catch { /* empty */ }

        // Verified profiles
        let verifiedProfiles = 0;
        try {
            const verifiedRes = await serverDatabases.listDocuments(DB_ID, 'profiles', [
                Query.equal('is_verified', true),
                Query.limit(1),
            ]);
            verifiedProfiles = verifiedRes.total;
        } catch { /* empty */ }

        // Staff members
        let staffCount = 0;
        try {
            const staffRes = await serverDatabases.listDocuments(DB_ID, 'profiles', [
                Query.notEqual('admin_level', 'none'),
                Query.limit(1),
            ]);
            staffCount = staffRes.total;
        } catch {
            // Fallback: count users with staff label
            try {
                const staffUsers = await serverUsers.list([Query.limit(1)]);
                staffCount = staffUsers.users.filter((u: any) => u.labels?.includes('staff')).length;
            } catch { /* empty */ }
        }

        // Total complaints
        let totalComplaints = 0;
        let resolvedComplaints = 0;
        let pendingComplaints = 0;
        let inProgressComplaints = 0;
        let escalatedComplaints = 0;
        try {
            const compRes = await serverDatabases.listDocuments(DB_ID, 'complaints', [Query.limit(1)]);
            totalComplaints = compRes.total;
        } catch { /* empty */ }
        try {
            const r = await serverDatabases.listDocuments(DB_ID, 'complaints', [
                Query.equal('status', 'resolved'), Query.limit(1),
            ]);
            resolvedComplaints = r.total;
        } catch { /* empty */ }
        try {
            const r = await serverDatabases.listDocuments(DB_ID, 'complaints', [
                Query.equal('status', 'pending'), Query.limit(1),
            ]);
            pendingComplaints = r.total;
        } catch { /* empty */ }
        try {
            const r = await serverDatabases.listDocuments(DB_ID, 'complaints', [
                Query.equal('status', 'in_progress'), Query.limit(1),
            ]);
            inProgressComplaints = r.total;
        } catch { /* empty */ }
        try {
            const r = await serverDatabases.listDocuments(DB_ID, 'complaints', [
                Query.equal('status', 'escalated'), Query.limit(1),
            ]);
            escalatedComplaints = r.total;
        } catch { /* empty */ }

        // Total error logs
        let totalErrors = 0;
        try {
            const errRes = await serverDatabases.listDocuments(DB_ID, 'error_logs', [Query.limit(1)]);
            totalErrors = errRes.total;
        } catch { /* empty */ }

        // New users this week
        let newUsersThisWeek = 0;
        try {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const recentUsers = await serverUsers.list([
                Query.greaterThanEqual('$createdAt', weekAgo.toISOString()),
                Query.limit(1),
            ]);
            newUsersThisWeek = recentUsers.total;
        } catch { /* empty */ }

        // New complaints this week
        let newComplaintsThisWeek = 0;
        try {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const recentComplaints = await serverDatabases.listDocuments(DB_ID, 'complaints', [
                Query.greaterThanEqual('$createdAt', weekAgo.toISOString()),
                Query.limit(1),
            ]);
            newComplaintsThisWeek = recentComplaints.total;
        } catch { /* empty */ }

        // New complaints today
        let newComplaintsToday = 0;
        try {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const r = await serverDatabases.listDocuments(DB_ID, 'complaints', [
                Query.greaterThanEqual('$createdAt', todayStart.toISOString()),
                Query.limit(1),
            ]);
            newComplaintsToday = r.total;
        } catch { /* empty */ }

        return NextResponse.json({
            users: {
                total: totalUsers,
                profiles: totalProfiles,
                verified: verifiedProfiles,
                staff: staffCount,
                newThisWeek: newUsersThisWeek,
            },
            complaints: {
                total: totalComplaints,
                resolved: resolvedComplaints,
                pending: pendingComplaints,
                inProgress: inProgressComplaints,
                escalated: escalatedComplaints,
                resolutionRate: totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0,
                newThisWeek: newComplaintsThisWeek,
                newToday: newComplaintsToday,
            },
            errors: {
                total: totalErrors,
            },
        });
    } catch (error: any) {
        logApiError('/api/staff/app-stats GET', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error', code: 'ERR_INTERNAL', status: 500 },
            { status: 500 }
        );
    }
}
