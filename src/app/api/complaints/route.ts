import { NextRequest, NextResponse } from 'next/server';
import { serverDatabases, DB_ID, createSessionClient } from '@/lib/appwrite-server';
import { Query, ID } from 'node-appwrite';
import { analyzeComplaint } from '@/lib/gemini';
import { logApiError } from '@/lib/error-logger';
import { sendSubmissionConfirmationEmail } from '@/lib/email';

// GET /api/complaints — list complaints for the current user
export async function GET(req: NextRequest) {
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { account } = createSessionClient(jwt);
        const user = await account.get();

        const res = await serverDatabases.listDocuments(DB_ID, 'complaints', [
            Query.equal('citizen_contact', user.$id),
            Query.orderDesc('$createdAt'),
            Query.limit(100),
        ]);

        return NextResponse.json(res.documents);
    } catch (error: any) {
        console.error('[complaints GET]', error);
        logApiError('/api/complaints GET', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/complaints — submit a new complaint
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            category, description, address, citizen_contact,
            lat, lng, image_url, device_fingerprint,
            state_id, city_id, village_id, ward_id,
            ai_department,
        } = body;

        // Generate tracking ID
        const tracking_id = 'CS-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

        // Process Base64 Image and AI
        let aiData: any = {};
        let finalImageUrl = image_url || null;

        try {
            let base64Image: string | undefined;
            let mimeType: string | undefined;
            
            if (image_url && image_url.startsWith('data:')) {
                const match = image_url.match(/^data:(.+?);base64,(.+)$/);
                if (match) {
                    mimeType = match[1];
                    base64Image = match[2];

                    if (base64Image && mimeType) {
                        // Upload image to Appwrite Storage to avoid 1000-char DB limit
                        try {
                            const { serverStorage } = await import('@/lib/appwrite-server');
                            const { InputFile } = await import('node-appwrite/file');
                            const buffer = Buffer.from(base64Image, 'base64');
                            const file = InputFile.fromBuffer(buffer, `upload-${Date.now()}.${mimeType.split('/')[1] || 'jpg'}`);
                        const bucketId = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_ID || 'complaint_images';
                        
                        const upload = await serverStorage.createFile(bucketId, ID.unique(), file);
                        const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
                        const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
                        
                        // Construct the view URL
                        finalImageUrl = `${endpoint}/storage/buckets/${bucketId}/files/${upload.$id}/view?project=${projectId}`;
                    } catch (uploadError) {
                        console.error('Failed to upload image to storage:', uploadError);
                        // Do not save the raw base64 string to avoid DB limit exception
                        finalImageUrl = null;
                    }
                    }
                }
            }

            const analysis = await analyzeComplaint(category, description, base64Image, mimeType);
            aiData = {
                ai_priority_score: analysis.priority_score,
                ai_analysis: analysis.analysis,
            };
        } catch (e) {
            console.warn('AI analysis failed, proceeding without:', e);
        }

        const doc = await serverDatabases.createDocument(DB_ID, 'complaints', ID.unique(), {
            tracking_id,
            citizen_contact: citizen_contact || 'anonymous',
            category,
            description,
            address: address || 'Location Pending',
            lat: lat || null,
            lng: lng || null,
            image_url: finalImageUrl,
            status: 'pending',
            device_fingerprint: device_fingerprint || null,
            state_id: state_id || null,
            city_id: city_id || null,
            village_id: village_id || null,
            ward_id: ward_id || null,
            department: ai_department || null,
            ai_department: ai_department || null,
            ...aiData,
        });

        // Send confirmation email (non-blocking)
        if (citizen_contact && citizen_contact.includes('@')) {
            sendSubmissionConfirmationEmail(citizen_contact, tracking_id, category, description).catch(console.error);
        } else {
            // Try to fetch email from user profile
            try {
                const profileRes = await serverDatabases.listDocuments(DB_ID, 'profiles', [
                    Query.equal('user_id', citizen_contact), Query.limit(1),
                ]);
                // User account email might be citizen_contact itself for email-based auth
            } catch { /* non-critical */ }
        }

        return NextResponse.json({
            success: true,
            tracking_id,
            complaintId: doc.$id,
        });
    } catch (error: any) {
        console.error('[complaints POST]', error);
        logApiError('/api/complaints POST', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

