import { NextRequest, NextResponse } from 'next/server';
import { serverDatabases, DB_ID, createSessionClient } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';
import { logApiError } from '@/lib/error-logger';

// Role hierarchy: superadmin > state > city > village > ward > none/citizen
const ROLE_HIERARCHY: Record<string, number> = {
    superadmin: 5,
    state: 4,
    city: 3,
    village: 2,
    ward: 1,
    citizen: 0,
    none: 0,
};

// GET — list all citizen profiles (staff only)
export async function GET(req: NextRequest) {
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { account } = createSessionClient(jwt);
        const user = await account.get();
        if (!user.labels?.includes('staff') && !user.labels?.includes('superadmin')) {
            return NextResponse.json({ error: 'Staff only' }, { status: 403 });
        }

        const res = await serverDatabases.listDocuments(DB_ID, 'profiles', [
            Query.orderDesc('$createdAt'),
            Query.limit(100),
        ]);

        return NextResponse.json(res.documents);
    } catch (error: any) {
        logApiError('/api/staff/users GET', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error', code: 'ERR_INTERNAL', status: 500 },
            { status: 500 }
        );
    }
}

// PATCH — update citizen verification status
export async function PATCH(req: NextRequest) {
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { account } = createSessionClient(jwt);
        const user = await account.get();
        if (!user.labels?.includes('staff') && !user.labels?.includes('superadmin')) {
            return NextResponse.json({ error: 'Staff only' }, { status: 403 });
        }

        const { profileId, isVerified } = await req.json();

        const updated = await serverDatabases.updateDocument(DB_ID, 'profiles', profileId, {
            is_verified: isVerified,
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        logApiError('/api/staff/users PATCH', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error', code: 'ERR_INTERNAL', status: 500 },
            { status: 500 }
        );
    }
}

// PUT — update citizen role and jurisdiction (hierarchical delegation)
// Superadmin → can assign any role
// State Admin → can assign city, village, ward admins (within their state)
// City Admin → can assign village, ward admins (within their city)
// Village Admin → can assign ward admins (within their village)
// Ward Admin → cannot assign anyone
export async function PUT(req: NextRequest) {
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { account } = createSessionClient(jwt);
        const user = await account.get();
        if (!user.labels?.includes('staff') && !user.labels?.includes('superadmin')) {
            return NextResponse.json({ error: 'Staff only' }, { status: 403 });
        }

        // Look up the caller's profile to check their admin level
        const callerProfileRes = await serverDatabases.listDocuments(DB_ID, 'profiles', [
            Query.equal('user_id', user.$id),
            Query.limit(1)
        ]);
        const callerProfile = callerProfileRes.documents[0];
        let callerRole = callerProfile?.admin_level || 'none';
        if (user.labels?.includes('superadmin')) {
            callerRole = 'superadmin';
        }
        const callerRank = ROLE_HIERARCHY[callerRole] ?? 0;

        // Must be at least a village admin to assign anyone
        if (callerRank < 2) {
            return NextResponse.json(
                { error: 'You do not have permission to assign roles. At minimum Village Admin is required.' },
                { status: 403 }
            );
        }

        const { profileId, userId, adminLevel, stateId, cityId, villageId, wardId } = await req.json();
        const targetRank = ROLE_HIERARCHY[adminLevel] ?? 0;

        // Caller can only assign roles BELOW their own rank
        if (targetRank >= callerRank) {
            return NextResponse.json(
                { error: `Your role (${callerRole}) cannot assign the "${adminLevel}" role. You can only assign roles below your own level.` },
                { status: 403 }
            );
        }

        // For non-superadmin callers, verify jurisdiction containment
        // e.g., a City Admin for "Mumbai" can only assign ward/village admins within "Mumbai"
        if (callerRole !== 'superadmin') {
            // State admin can only assign within their state
            if (callerRole === 'state' && stateId && stateId !== callerProfile.state_id) {
                return NextResponse.json(
                    { error: `You can only assign managers within your state (${callerProfile.state_id}).` },
                    { status: 403 }
                );
            }
            // City admin can only assign within their city (and inherits state)
            if (callerRole === 'city') {
                if (cityId && cityId !== callerProfile.city_id) {
                    return NextResponse.json(
                        { error: `You can only assign managers within your city (${callerProfile.city_id}).` },
                        { status: 403 }
                    );
                }
            }
            // Village admin can only assign ward admins within their village
            if (callerRole === 'village') {
                if (villageId && villageId !== callerProfile.village_id) {
                    return NextResponse.json(
                        { error: `You can only assign managers within your village (${callerProfile.village_id}).` },
                        { status: 403 }
                    );
                }
            }
        }

        // 1. Update Profile Document with jurisdiction names (not IDs)
        const updatedProfile = await serverDatabases.updateDocument(DB_ID, 'profiles', profileId, {
            admin_level: adminLevel,
            state_id: stateId || null,
            city_id: cityId || null,
            village_id: villageId || null,
            ward_id: wardId || null,
        });

        // 2. Update Auth Labels
        const { serverUsers } = await import('@/lib/appwrite-server');
        const targetUser = await serverUsers.get(userId);
        let labels = targetUser.labels || [];

        if (adminLevel === 'none' || adminLevel === 'citizen') {
            labels = labels.filter((label: string) => label !== 'staff');
        } else {
            if (!labels.includes('staff') && !labels.includes('superadmin')) {
                labels.push('staff');
            }
        }

        await serverUsers.updateLabels(userId, labels);

        return NextResponse.json({
            success: true,
            profile: updatedProfile,
            callerRole, // Send back so frontend knows what happened
        });
    } catch (error: any) {
        logApiError('/api/staff/users PUT', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error', code: 'ERR_INTERNAL', status: 500 },
            { status: 500 }
        );
    }
}
