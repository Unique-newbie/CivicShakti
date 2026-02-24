import { NextRequest, NextResponse } from "next/server";
import { Client, Databases, ID } from "node-appwrite";

// Simple in-memory rate limiting (Note: In production with multiple instances, use Redis)
const ipRequestCounts = new Map<string, { count: number; timestamp: number }>();
const BLOCK_DURATION_MS = 60 * 60 * 1000; // 1 hour for hard blocks
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
const MAX_REQUESTS_PER_WINDOW = 5; // Max 5 complaints per 15 mins per IP

// Setup Node Appwrite Client
const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

const databases = new Databases(client);

export async function POST(req: NextRequest) {
    try {
        // 1. IP Tracking and Rate Limiting
        const ip = req.headers.get("x-forwarded-for") ?? "unknown_ip";

        const now = Date.now();
        const ipData = ipRequestCounts.get(ip) || { count: 0, timestamp: now };

        // Reset window if it has passed
        if (now - ipData.timestamp > RATE_LIMIT_WINDOW_MS) {
            ipData.count = 0;
            ipData.timestamp = now;
        }

        ipData.count += 1;
        ipRequestCounts.set(ip, ipData);

        if (ipData.count > MAX_REQUESTS_PER_WINDOW) {
            console.warn(`[Anti-Fraud] Rate limit exceeded for IP: ${ip}`);
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429 }
            );
        }

        // 2. Parse Payload
        const body = await req.json();
        const {
            category,
            description,
            address,
            lat,
            lng,
            image_url,
            device_fingerprint,
        } = body;

        // Validation
        if (!category || !description) {
            return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
        }

        // 3. AI Validation & Triage Pipeline
        // Dynamically import to ensure server-side execution is clean
        const { analyzeComplaint } = await import('@/lib/gemini');

        let base64Image = undefined;
        let mimeType = undefined;

        // If there's an image, fetch it to pass to Gemini
        if (image_url) {
            try {
                const imgRes = await fetch(image_url);
                if (imgRes.ok) {
                    const arrayBuffer = await imgRes.arrayBuffer();
                    base64Image = Buffer.from(arrayBuffer).toString('base64');
                    mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
                }
            } catch (imgErr) {
                console.warn("[AI Validation] Failed to fetch image for AI analysis:", imgErr);
            }
        }

        const aiResult = await analyzeComplaint(category, description, base64Image, mimeType);

        if (!aiResult.is_valid || !aiResult.image_matches_description) {
            // Log the blocked attempt securely
            console.warn(`[Blocked by AI] Reason: ${aiResult.analysis}`);
            return NextResponse.json(
                {
                    error: "Your submission was flagged by our automated systems.",
                    details: aiResult.analysis
                },
                { status: 400 }
            );
        }

        // Generate an easy-to-read tracking ID
        const trackingId = "C-" + Math.random().toString(36).substring(2, 8).toUpperCase();

        // Automatically Route to Department based on Category
        const getDepartment = (catId: string) => {
            switch (catId) {
                case "pothole":
                case "infrastructure":
                    return "Public Works";
                case "garbage":
                case "pollution":
                    return "Sanitation Dept";
                case "electricity":
                    return "Electrical Dept";
                case "water":
                    return "Water Board";
                default:
                    return "General Services";
            }
        };

        // Get securely authenticated user via JWT
        let authenticatedUserId = "anonymous";
        try {
            const authHeader = req.headers.get("Authorization");
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return NextResponse.json({ error: "Unauthorized. Please log in to submit reports." }, { status: 401 });
            }
            const jwt = authHeader.split("Bearer ")[1];
            const { createJWTClient } = await import("@/lib/server-appwrite");
            const { account } = createJWTClient(jwt);
            const user = await account.get();
            authenticatedUserId = user.$id;
        } catch (error) {
            console.warn("[Auth] Unauthorized submit attempt blocked.");
            return NextResponse.json({ error: "Unauthorized. Please log in to submit reports." }, { status: 401 });
        }

        const payload: any = {
            tracking_id: trackingId,
            category,
            description,
            address: address || "Location Pending",
            citizen_contact: authenticatedUserId,
            status: "pending",
            department: getDepartment(category),
            device_fingerprint: device_fingerprint || "unknown",
            ip_address: ip, // Store the IP securely
            ai_priority_score: aiResult.priority_score,
            ai_analysis: aiResult.analysis
        };

        if (lat !== null && lat !== undefined) payload.lat = lat;
        if (lng !== null && lng !== undefined) payload.lng = lng;
        if (image_url) payload.image_url = image_url;

        // 4. Database Insertion (Bypasses Client Permissions using Server Key)
        await databases.createDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_COMPLAINTS_COLLECTION_ID!,
            ID.unique(),
            payload
        );

        // 4. Status Log Insertion
        await databases.createDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_STATUS_LOGS_COLLECTION_ID!,
            ID.unique(),
            {
                complaint_id: trackingId,
                status_from: "none",
                status_to: "pending",
                remarks: "Complaint submitted successfully by citizen.",
                changed_by_staff_id: "system"
            }
        );

        return NextResponse.json({ success: true, tracking_id: trackingId }, { status: 201 });
    } catch (error: any) {
        console.error("Failed to submit complaint via secure API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
