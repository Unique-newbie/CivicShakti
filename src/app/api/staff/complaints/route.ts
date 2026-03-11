import { NextRequest, NextResponse } from 'next/server';
import { serverDatabases, DB_ID, createSessionClient } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';
import { logApiError } from '@/lib/error-logger';

export async function GET(req: NextRequest) {
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { account } = createSessionClient(jwt);
        const user = await account.get();
        if (!user.labels?.includes('staff') && !user.labels?.includes('superadmin')) {
            return NextResponse.json({ error: 'Staff only' }, { status: 403 });
        }

        // Get staff profile for admin level
        let adminLevel = 'superadmin';
        let locationFilters: any[] = [];

        try {
            const profileRes = await serverDatabases.listDocuments(DB_ID, 'profiles', [
                Query.equal('user_id', user.$id), Query.limit(1),
            ]);
            if (profileRes.documents.length > 0) {
                const profile = profileRes.documents[0];
                adminLevel = profile.admin_level || 'superadmin';

                if (adminLevel === 'ward' && profile.ward_id)
                    locationFilters.push(Query.equal('ward_id', profile.ward_id));
                else if (adminLevel === 'village' && profile.village_id)
                    locationFilters.push(Query.equal('village_id', profile.village_id));
                else if (adminLevel === 'city' && profile.city_id)
                    locationFilters.push(Query.equal('city_id', profile.city_id));
                else if (adminLevel === 'state' && profile.state_id)
                    locationFilters.push(Query.equal('state_id', profile.state_id));
            }
        } catch (e) { /* superadmin sees all */ }

        const { searchParams } = req.nextUrl;
        const status = searchParams.get('status');
        const department = searchParams.get('department');
        const category = searchParams.get('category');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = 25;

        const queries: any[] = [
            Query.orderDesc('$createdAt'),
            Query.limit(limit),
            Query.offset((page - 1) * limit),
            ...locationFilters,
        ];

        if (status && status !== 'all') {
            queries.push(Query.equal('status', status));
        }
        if (department && department !== 'all') {
            queries.push(Query.equal('department', department));
        }
        if (category && category !== 'all') {
            queries.push(Query.equal('category', category));
        }

        const res = await serverDatabases.listDocuments(DB_ID, 'complaints', queries);

        return NextResponse.json({
            complaints: res.documents,
            total: res.total,
        });
    } catch (error: any) {
        console.error('[staff/complaints GET]', error);
        logApiError('/api/staff/complaints', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
