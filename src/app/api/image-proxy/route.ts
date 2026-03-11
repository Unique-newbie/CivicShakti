import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/image-proxy?url=<encoded-url>
 * 
 * Proxies Appwrite Storage file URLs to avoid CORS issues and 
 * authentication problems when displaying evidence images on 
 * the citizen tracking page.
 */
export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    try {
        // Only allow proxying from our own Appwrite endpoint
        const allowedHost = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
            ? new URL(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT).hostname
            : null;

        const requestedHost = new URL(url).hostname;

        if (allowedHost && requestedHost !== allowedHost && requestedHost !== 'cloud.appwrite.io') {
            return NextResponse.json({ error: 'URL not allowed' }, { status: 403 });
        }

        const response = await fetch(url, {
            headers: {
                'X-Appwrite-Project': process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '',
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Upstream returned ${response.status}` },
                { status: response.status }
            );
        }

        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const buffer = await response.arrayBuffer();

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400, s-maxage=86400',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error: any) {
        console.error('[image-proxy]', error.message);
        return NextResponse.json({ error: 'Failed to proxy image' }, { status: 500 });
    }
}
