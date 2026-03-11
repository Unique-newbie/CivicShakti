import { NextRequest, NextResponse } from 'next/server';
import { serverDatabases, DB_ID, createSessionClient } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';
import { getSLAStatus } from '@/lib/slas';
import { logApiError } from '@/lib/error-logger';

const CATEGORIES = ['pothole', 'garbage', 'water', 'electricity', 'pollution', 'infrastructure'];

export async function GET(req: NextRequest) {
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { account } = createSessionClient(jwt);
        const user = await account.get();
        if (!user.labels?.includes('staff') && !user.labels?.includes('superadmin')) {
            return NextResponse.json({ error: 'Staff only' }, { status: 403 });
        }

        // Get staff profile for location scoping & admin level
        let locationFilters: any[] = [];
        let adminLevel = 'superadmin';
        let jurisdiction = '';

        try {
            const profileRes = await serverDatabases.listDocuments(DB_ID, 'profiles', [
                Query.equal('user_id', user.$id), Query.limit(1),
            ]);
            if (profileRes.documents.length > 0) {
                const p = profileRes.documents[0];
                adminLevel = user.labels?.includes('superadmin') ? 'superadmin' : (p.admin_level || 'superadmin');

                if (adminLevel === 'ward' && p.ward_id) {
                    locationFilters.push(Query.equal('ward_id', p.ward_id));
                    try {
                        const w = await serverDatabases.getDocument(DB_ID, 'wards', p.ward_id);
                        jurisdiction = w.name || p.ward_id;
                    } catch { jurisdiction = p.ward_id; }
                } else if (adminLevel === 'village' && p.village_id) {
                    locationFilters.push(Query.equal('village_id', p.village_id));
                    try {
                        const v = await serverDatabases.getDocument(DB_ID, 'villages', p.village_id);
                        jurisdiction = v.name || p.village_id;
                    } catch { jurisdiction = p.village_id; }
                } else if (adminLevel === 'city' && p.city_id) {
                    locationFilters.push(Query.equal('city_id', p.city_id));
                    try {
                        const c = await serverDatabases.getDocument(DB_ID, 'cities', p.city_id);
                        jurisdiction = c.name || p.city_id;
                    } catch { jurisdiction = p.city_id; }
                } else if (adminLevel === 'state' && p.state_id) {
                    locationFilters.push(Query.equal('state_id', p.state_id));
                    try {
                        const s = await serverDatabases.getDocument(DB_ID, 'states', p.state_id);
                        jurisdiction = s.name || p.state_id;
                    } catch { jurisdiction = p.state_id; }
                }
            }
        } catch (e) { /* superadmin */ }

        // ── Count by status ──
        const statuses = ['pending', 'in_progress', 'resolved', 'escalated'];
        const counts: Record<string, number> = {};

        for (const s of statuses) {
            try {
                const r = await serverDatabases.listDocuments(DB_ID, 'complaints', [
                    Query.equal('status', s), Query.limit(1), ...locationFilters,
                ]);
                counts[s] = r.total;
            } catch { counts[s] = 0; }
        }

        // ── Total ──
        let total = 0;
        try {
            const r = await serverDatabases.listDocuments(DB_ID, 'complaints', [
                Query.limit(1), ...locationFilters,
            ]);
            total = r.total;
        } catch { /* empty */ }

        // ── New today ──
        let newToday = 0;
        try {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const r = await serverDatabases.listDocuments(DB_ID, 'complaints', [
                Query.greaterThanEqual('$createdAt', todayStart.toISOString()),
                Query.limit(1),
                ...locationFilters,
            ]);
            newToday = r.total;
        } catch { /* empty */ }

        // ── Category distribution ──
        const categoryDistribution: { name: string; value: number }[] = [];
        for (const cat of CATEGORIES) {
            try {
                const r = await serverDatabases.listDocuments(DB_ID, 'complaints', [
                    Query.equal('category', cat), Query.limit(1), ...locationFilters,
                ]);
                if (r.total > 0) categoryDistribution.push({ name: cat, value: r.total });
            } catch { /* skip */ }
        }

        // ── SLA metrics ──
        let slaBreached = 0;
        let slaWarning = 0;
        try {
            // Fetch all active (non-resolved) complaints to check SLA
            const active = await serverDatabases.listDocuments(DB_ID, 'complaints', [
                Query.notEqual('status', 'resolved'),
                Query.limit(200),
                ...locationFilters,
            ]);
            for (const c of active.documents) {
                const sla = getSLAStatus(c.$createdAt, c.category || 'default', c.status);
                if (sla.status === 'breached') slaBreached++;
                else if (sla.status === 'warning') slaWarning++;
            }
        } catch { /* empty */ }

        // ── Sub-units (hierarchical roll-up) ──
        const subUnits: { name: string; total: number; resolved: number; rate: number }[] = [];
        try {
            let childCollection = '';
            let childFilter = '';
            let parentId = '';

            if (adminLevel === 'superadmin' || adminLevel === 'state') {
                // State sees cities, Superadmin sees states
                if (adminLevel === 'state') {
                    childCollection = 'cities';
                    childFilter = 'city_id';
                    const profile = (await serverDatabases.listDocuments(DB_ID, 'profiles', [
                        Query.equal('user_id', user.$id), Query.limit(1),
                    ])).documents[0];
                    parentId = profile?.state_id || '';
                } else {
                    childCollection = 'states';
                    childFilter = 'state_id';
                }

                let children;
                if (parentId && childCollection === 'cities') {
                    children = await serverDatabases.listDocuments(DB_ID, childCollection, [
                        Query.equal('state_id', parentId), Query.limit(50),
                    ]);
                } else {
                    children = await serverDatabases.listDocuments(DB_ID, childCollection, [
                        Query.limit(50),
                    ]);
                }

                for (const child of children.documents) {
                    try {
                        const totalR = await serverDatabases.listDocuments(DB_ID, 'complaints', [
                            Query.equal(childFilter, child.$id), Query.limit(1),
                        ]);
                        const resolvedR = await serverDatabases.listDocuments(DB_ID, 'complaints', [
                            Query.equal(childFilter, child.$id),
                            Query.equal('status', 'resolved'),
                            Query.limit(1),
                        ]);
                        const t = totalR.total;
                        const rv = resolvedR.total;
                        subUnits.push({
                            name: child.name,
                            total: t,
                            resolved: rv,
                            rate: t > 0 ? Math.round((rv / t) * 100) : 0,
                        });
                    } catch { /* skip */ }
                }
            } else if (adminLevel === 'city') {
                // City admin sees villages
                const profile = (await serverDatabases.listDocuments(DB_ID, 'profiles', [
                    Query.equal('user_id', user.$id), Query.limit(1),
                ])).documents[0];
                const cityId = profile?.city_id;
                if (cityId) {
                    const villages = await serverDatabases.listDocuments(DB_ID, 'villages', [
                        Query.equal('city_id', cityId), Query.limit(50),
                    ]);
                    for (const v of villages.documents) {
                        try {
                            const totalR = await serverDatabases.listDocuments(DB_ID, 'complaints', [
                                Query.equal('village_id', v.$id), Query.limit(1),
                            ]);
                            const resolvedR = await serverDatabases.listDocuments(DB_ID, 'complaints', [
                                Query.equal('village_id', v.$id),
                                Query.equal('status', 'resolved'),
                                Query.limit(1),
                            ]);
                            const t = totalR.total;
                            const rv = resolvedR.total;
                            subUnits.push({ name: v.name, total: t, resolved: rv, rate: t > 0 ? Math.round((rv / t) * 100) : 0 });
                        } catch { /* skip */ }
                    }
                }
            } else if (adminLevel === 'village') {
                // Village admin sees wards
                const profile = (await serverDatabases.listDocuments(DB_ID, 'profiles', [
                    Query.equal('user_id', user.$id), Query.limit(1),
                ])).documents[0];
                const villageId = profile?.village_id;
                if (villageId) {
                    const wards = await serverDatabases.listDocuments(DB_ID, 'wards', [
                        Query.equal('village_id', villageId), Query.limit(50),
                    ]);
                    for (const w of wards.documents) {
                        try {
                            const totalR = await serverDatabases.listDocuments(DB_ID, 'complaints', [
                                Query.equal('ward_id', w.$id), Query.limit(1),
                            ]);
                            const resolvedR = await serverDatabases.listDocuments(DB_ID, 'complaints', [
                                Query.equal('ward_id', w.$id),
                                Query.equal('status', 'resolved'),
                                Query.limit(1),
                            ]);
                            const t = totalR.total;
                            const rv = resolvedR.total;
                            subUnits.push({ name: w.name, total: t, resolved: rv, rate: t > 0 ? Math.round((rv / t) * 100) : 0 });
                        } catch { /* skip */ }
                    }
                }
            }
        } catch { /* empty */ }

        // ── Recent complaints ──
        let recent: any[] = [];
        try {
            const r = await serverDatabases.listDocuments(DB_ID, 'complaints', [
                Query.orderDesc('$createdAt'), Query.limit(5), ...locationFilters,
            ]);
            recent = r.documents.map((c: any) => ({
                id: c.$id,
                ticketId: c.tracking_id,
                category: c.category,
                description: c.description?.substring(0, 100),
                address: c.address,
                status: c.status,
                department: c.department,
                createdAt: c.$createdAt,
                urgencyLevel: c.urgency_level,
                sla: getSLAStatus(c.$createdAt, c.category || 'default', c.status),
            }));
        } catch { /* empty */ }

        return NextResponse.json({
            adminLevel,
            jurisdiction,
            total,
            pending: counts.pending || 0,
            in_progress: counts.in_progress || 0,
            resolved: counts.resolved || 0,
            escalated: counts.escalated || 0,
            newToday,
            categoryDistribution,
            slaBreached,
            slaWarning,
            subUnits,
            recent,
        });
    } catch (error: any) {
        logApiError('/api/staff/dashboard-stats', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error', code: 'ERR_INTERNAL', status: 500 },
            { status: 500 }
        );
    }
}
