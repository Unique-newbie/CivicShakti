/**
 * A utility to send client-side or catchable errors to the Central Error Logger API.
 */
export async function logClientError(error: Error, additionalContext: Record<string, any> = {}) {
    try {
        const payload = {
            message: error.message || "Unknown Error",
            stack: error.stack || "",
            context: JSON.stringify(additionalContext),
            url: typeof window !== "undefined" ? window.location.href : "server",
        };

        if (typeof window !== "undefined") {
            // Include user ID if cached locally or logged in
            const localUser = localStorage.getItem("cookieFallback");
            if (localUser) {
                try {
                    const parsed = JSON.parse(localUser);
                    // Just an example, appwrite users store id somewhere here or we could bypass
                    payload.context = JSON.stringify({ ...additionalContext, userHint: parsed });
                } catch (e) { }
            }
        }

        // We use fetch with keepalive to ensure it goes through even on page unload
        await fetch("/api/errors", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
            keepalive: true,
        });
    } catch (loggingError) {
        // Fallback to console if logging itself fails
        console.error("Failed to send error to log service:", loggingError);
    }
}
