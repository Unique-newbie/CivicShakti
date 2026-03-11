import { NextResponse } from "next/server";
import { serverDatabases, serverUsers, serverStorage, DB_ID } from "@/lib/appwrite-server";
import { Query } from "node-appwrite";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
    const start = Date.now();
    
    // Default statuses
    const services = {
        api: { status: "operational", latency: 0, name: "API Gateway" },
        database: { status: "outage", latency: 0, name: "Database" },
        auth: { status: "outage", latency: 0, name: "Authentication" },
        storage: { status: "outage", latency: 0, name: "Storage" },
        ai: { status: process.env.GEMINI_API_KEY ? "operational" : "outage", latency: 0, name: "AI Analysis" },
    };

    let overallStatus = "operational";

    // Check Database
    try {
        const dbStart = Date.now();
        await serverDatabases.listDocuments(DB_ID, 'profiles', [Query.limit(1)]);
        services.database.latency = Date.now() - dbStart;
        services.database.status = "operational";
    } catch (e) {
        overallStatus = "degraded";
    }

    // Check Auth
    try {
        const authStart = Date.now();
        await serverUsers.list([Query.limit(1)]);
        services.auth.latency = Date.now() - authStart;
        services.auth.status = "operational";
    } catch (e) {
        overallStatus = "degraded";
    }

    // Check Storage
    try {
        const storageStart = Date.now();
        const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || 'complaint_images';
        await serverStorage.listFiles(bucketId, [Query.limit(1)]);
        services.storage.latency = Date.now() - storageStart;
        services.storage.status = "operational";
    } catch (e) {
        overallStatus = "degraded";
    }

    // Finalize API Gateway latency
    services.api.latency = Date.now() - start;

    // Determine overall status
    if (services.database.status === "outage" && services.auth.status === "outage") {
        overallStatus = "outage";
    }

    return NextResponse.json(
        {
            status: overallStatus,
            latency: Date.now() - start,
            timestamp: new Date().toISOString(),
            services
        },
        { status: overallStatus === "outage" ? 503 : 200 }
    );
}
