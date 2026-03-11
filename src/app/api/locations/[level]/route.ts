import { NextRequest, NextResponse } from 'next/server';
import { serverDatabases, DB_ID } from '@/lib/appwrite-server';
import { Query } from 'node-appwrite';
import { logApiError } from '@/lib/error-logger';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ level: string }> }
) {
    const { level } = await params;

    try {
        let collection = '';
        let parentKey = '';
        const parentId = req.nextUrl.searchParams.get('parentId');

        switch (level) {
            case 'states':
                collection = 'states';
                break;
            case 'cities':
                collection = 'cities';
                parentKey = 'state_id';
                break;
            case 'villages':
                collection = 'villages';
                parentKey = 'city_id';
                break;
            case 'wards':
                collection = 'wards';
                parentKey = 'village_id';
                break;
            default:
                return NextResponse.json(
                    { error: 'Invalid level', code: 'ERR_VALIDATION', status: 400 },
                    { status: 400 }
                );
        }

        const queries: any[] = [Query.limit(100), Query.orderAsc('name')];
        if (parentKey && parentId) {
            queries.push(Query.equal(parentKey, parentId));
        }

        const res = await serverDatabases.listDocuments(DB_ID, collection, queries);

        return NextResponse.json(res.documents.map((doc: any) => ({
            id: doc.$id,
            name: doc.name,
        })));
    } catch (error: any) {
        logApiError('/api/locations/[level]', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error', code: 'ERR_INTERNAL', status: 500 },
            { status: 500 }
        );
    }
}
