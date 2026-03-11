/**
 * Server-side error logger — logs errors to the Appwrite error_logs collection.
 * The collection only has ONE custom attribute: `errorMessage` (string).
 * All metadata is packed into this field as a JSON string.
 */
import { serverDatabases, DB_ID } from '@/lib/appwrite-server';
import { ID } from 'node-appwrite';

interface ErrorLogInput {
    error_type?: string;
    message: string;
    stack?: string;
    context?: string;
    url?: string;
    user_id?: string;
    severity?: 'info' | 'warning' | 'error' | 'critical';
}

/**
 * Logs an error to the Appwrite error_logs collection.
 * Packs everything into `errorMessage` as JSON since the collection
 * only supports the `errorMessage` attribute.
 */
export async function logError(input: ErrorLogInput): Promise<void> {
    try {
        const logData: Record<string, any> = {
            message: String(input.message).substring(0, 2000),
        };
        if (input.error_type) logData.error_type = input.error_type;
        if (input.stack) logData.stack = input.stack.substring(0, 4000);
        if (input.context) logData.context = input.context;
        if (input.url) logData.url = input.url;
        if (input.user_id) logData.user_id = input.user_id;
        if (input.severity) logData.severity = input.severity;

        const payload = {
            errorMessage: JSON.stringify(logData).substring(0, 10000),
        };

        await serverDatabases.createDocument(DB_ID, 'error_logs', ID.unique(), payload);
    } catch (e) {
        // Don't let error logging failures crash the app
        console.error('[ErrorLogger] Failed to log error:', e);
    }
}

/**
 * Convenience wrapper for logging API route errors.
 */
export async function logApiError(routePath: string, error: any, userId?: string): Promise<void> {
    await logError({
        error_type: 'api_error',
        message: error?.message || String(error),
        stack: error?.stack,
        context: routePath,
        url: routePath,
        user_id: userId,
        severity: 'error',
    });
}
