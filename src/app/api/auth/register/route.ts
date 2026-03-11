import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    // Registration is handled client-side via Appwrite SDK's account.create()
    // This route can be used as a webhook or additional server-side logic if needed.
    return NextResponse.json({
        success: true,
        message: 'Use client-side Appwrite SDK for registration',
    });
}
