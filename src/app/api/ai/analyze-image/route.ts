import { NextRequest, NextResponse } from 'next/server';
import { analyzeImage, VisionAnalysis } from '@/lib/gemini';
import { logApiError } from '@/lib/error-logger';

/**
 * POST /api/ai/analyze-image
 * 
 * CivicShakti Vision AI Engine — Multi-stage image analysis
 * Accepts a base64 image and returns comprehensive civic issue analysis.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { base64Image, mimeType, description } = body;

        if (!base64Image || !mimeType) {
            return NextResponse.json(
                { error: "Image data (base64Image and mimeType) is required" },
                { status: 400 }
            );
        }

        // Strip the data URL prefix if present (e.g., "data:image/jpeg;base64,")
        let imageData = base64Image;
        if (imageData.startsWith('data:')) {
            imageData = imageData.split(',')[1];
        }

        const analysis: VisionAnalysis = await analyzeImage(imageData, mimeType, description);

        return NextResponse.json({
            success: true,
            analysis,
        });
    } catch (error: any) {
        console.error('[ai/analyze-image POST]', error);
        logApiError('/api/ai/analyze-image', error);
        return NextResponse.json(
            { error: "Failed to analyze image", details: error.message },
            { status: 500 }
        );
    }
}
