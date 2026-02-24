import { NextResponse } from 'next/server';
import { suggestCategory } from '@/lib/gemini';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { description, base64Image, mimeType } = body;

        // If neither is provided, we can't categorize
        if (!description && !base64Image) {
            return NextResponse.json(
                { error: "Description or image is required for categorization" },
                { status: 400 }
            );
        }

        const result = await suggestCategory(description, base64Image, mimeType);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Categorization API Error:', error);
        return NextResponse.json(
            { error: "Failed to categorize issue", details: error.message },
            { status: 500 }
        );
    }
}
