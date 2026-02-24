import { NextRequest, NextResponse } from "next/server";
import { Client, Databases, Query, ID } from "node-appwrite";

// Setup Node Appwrite Client
const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

const databases = new Databases(client);

export async function POST(req: NextRequest) {
    try {
        // Enforce strict Server-Side Auth Check for Staff Actions
        try {
            const { createSessionClient } = await import("@/lib/server-appwrite");
            const { account } = await createSessionClient();
            const user = await account.get();
            // Validate official staff domain
            if (!user.email.endsWith("@civicshakti.gov") && !user.email.endsWith("@civicshakti.com")) {
                throw new Error("unauthorized_domain");
            }
        } catch (error) {
            console.warn("[Auth] Unauthorized staff action attempt blocked.");
            return NextResponse.json({ error: "Unauthorized. Official staff account required." }, { status: 401 });
        }

        const body = await req.json();
        const {
            complaintId, // The Document ID
            trackingId,  // The tracking ID (e.g. C-XXXXXX)
            newStatus,
            oldStatus,
            internalNotes,
            resolutionImageUrl,
            changedByStaffId,
        } = body;

        if (!complaintId || !newStatus) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // --- Evidence-Based Closure Validation ---
        if (newStatus === "resolved" && !resolutionImageUrl) {
            return NextResponse.json(
                { error: "Photographic proof of resolution is strictly required to close a complaint." },
                { status: 400 }
            );
        }
        // -----------------------------------------

        const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
        const complaintsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_COMPLAINTS_COLLECTION_ID!;
        const profilesCollectionId = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID!;

        // 1. Fetch the complaint to ensure it exists and get the citizen_contact
        const complaint = await databases.getDocument(
            databaseId,
            complaintsCollectionId,
            complaintId
        );

        const citizenContact = complaint.citizen_contact;

        // 2. Update the Complaint Status
        let updatePayload: any = { status: newStatus };
        if (resolutionImageUrl) {
            updatePayload.resolution_image_url = resolutionImageUrl;
        }

        await databases.updateDocument(
            databaseId,
            complaintsCollectionId,
            complaintId,
            updatePayload
        );

        // 3. Create Status Log
        await databases.createDocument(
            databaseId,
            process.env.NEXT_PUBLIC_APPWRITE_STATUS_LOGS_COLLECTION_ID!,
            ID.unique(),
            {
                complaint_id: trackingId,
                status_from: oldStatus || complaint.status,
                status_to: newStatus,
                remarks: internalNotes || "Status updated by Staff",
                changed_by_staff_id: changedByStaffId || "system_admin"
            }
        );

        // 4. Update Trust Score if resolving/rejecting
        // Only valid registered users (not 'anonymous') get a trust score
        if (citizenContact && citizenContact !== "anonymous") {
            let scoreDelta = 0;
            if (newStatus === "resolved") scoreDelta = 5;
            if (newStatus === "rejected") scoreDelta = -10; // Future groundwork

            if (scoreDelta !== 0) {
                try {
                    // Find the user's profile
                    const profilesRes = await databases.listDocuments(
                        databaseId,
                        profilesCollectionId,
                        [Query.equal("user_id", citizenContact), Query.limit(1)]
                    );

                    let currentScore = 50; // default
                    let profileId = null;

                    if (profilesRes.documents.length > 0) {
                        profileId = profilesRes.documents[0].$id;
                        currentScore = profilesRes.documents[0].trust_score ?? 50;
                    }

                    // Calculate new score (bounded between 0 and 100)
                    const newScore = Math.max(0, Math.min(100, currentScore + scoreDelta));

                    if (profileId) {
                        // Update existing profile
                        await databases.updateDocument(databaseId, profilesCollectionId, profileId, {
                            trust_score: newScore
                        });
                    } else {
                        // Create new profile with combined score
                        await databases.createDocument(databaseId, profilesCollectionId, ID.unique(), {
                            user_id: citizenContact,
                            trust_score: newScore
                        });
                    }
                    console.log(`[Trust Score] Updated score for ${citizenContact} to ${newScore}`);
                } catch (profileErr) {
                    console.error("Failed to update trust score:", profileErr);
                    // We don't throw here to avoid failing the status update just because scoring failed
                }
            }
        }

        return NextResponse.json({ success: true, status: newStatus }, { status: 200 });

    } catch (error: any) {
        console.error("Failed to update status securely:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
