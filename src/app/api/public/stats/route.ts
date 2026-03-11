import { NextResponse } from 'next/server';
import { serverDatabases, DB_ID } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';

/**
 * GET /api/public/stats — Public endpoint returning live complaint statistics.
 * No auth required. Used on the landing page.
 */
export async function GET() {
    try {
        // Total complaints
        const totalRes = await serverDatabases.listDocuments(DB_ID, 'complaints', [
            Query.limit(1),
        ]);
        const totalComplaints = totalRes.total;

        // Resolved complaints
        const resolvedRes = await serverDatabases.listDocuments(DB_ID, 'complaints', [
            Query.equal('status', 'resolved'),
            Query.limit(1),
        ]);
        const resolvedComplaints = resolvedRes.total;

        // Count distinct areas (unique ward_id values where complaints exist)
        let activeAreas = 0;
        try {
            // Fetch a sample of complaints to count unique geographic areas
            const areaRes = await serverDatabases.listDocuments(DB_ID, 'complaints', [
                Query.limit(200),
                Query.select(['ward_id', 'village_id', 'city_id']),
            ]);
            const uniqueAreas = new Set<string>();
            for (const doc of areaRes.documents) {
                if (doc.ward_id) uniqueAreas.add(doc.ward_id);
                else if (doc.village_id) uniqueAreas.add(doc.village_id);
                else if (doc.city_id) uniqueAreas.add(doc.city_id);
            }
            activeAreas = uniqueAreas.size;
        } catch {
            activeAreas = 0;
        }

        // Average response time (time from creation to resolution for resolved complaints)
        let avgResponseHours = 0;
        try {
            const resolvedDocs = await serverDatabases.listDocuments(DB_ID, 'complaints', [
                Query.equal('status', 'resolved'),
                Query.orderDesc('$updatedAt'),
                Query.limit(50),
            ]);
            if (resolvedDocs.documents.length > 0) {
                let totalHours = 0;
                let count = 0;
                for (const doc of resolvedDocs.documents) {
                    const created = new Date(doc.$createdAt).getTime();
                    const updated = new Date(doc.$updatedAt).getTime();
                    const diffH = (updated - created) / (1000 * 60 * 60);
                    if (diffH > 0 && diffH < 720) { // cap at 30 days
                        totalHours += diffH;
                        count++;
                    }
                }
                avgResponseHours = count > 0 ? Math.round(totalHours / count) : 0;
            }
        } catch {
            avgResponseHours = 0;
        }

        return NextResponse.json({
            totalComplaints,
            resolvedComplaints,
            activeAreas,
            avgResponseHours,
        });
    } catch (error: any) {
        console.error('[public/stats GET]', error);
        return NextResponse.json(
            { error: 'Failed to fetch stats', code: 'ERR_INTERNAL', status: 500 },
            { status: 500 }
        );
    }
}
