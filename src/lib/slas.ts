export const SLA_THRESHOLDS_HOURS: Record<string, number> = {
    electricity: 12,
    water: 24,
    pothole: 48,
    garbage: 24,
    pollution: 48,
    infrastructure: 72,
    default: 72
};

export type SLAStatus = 'good' | 'warning' | 'breached';

export function getSLAStatus(createdAt: string, category: string, status: string): {
    status: SLAStatus;
    hoursRemaining: number;
    hoursOverdue: number;
    isOverdue: boolean;
    totalSLAHours: number;
} {
    // Determine total SLA timeframe based on category
    const normalizedCategory = category.toLowerCase();
    const totalSLAHours = SLA_THRESHOLDS_HOURS[normalizedCategory] || SLA_THRESHOLDS_HOURS.default;

    // Calculate elapsed time
    const createdDate = new Date(createdAt);
    const now = new Date();

    // We only evaluate SLA for active complaints
    if (status === 'resolved') {
        // Technically, we should check when it was resolved vs when it was created.
        // For MVP, if it's resolved, SLA is no longer active so we treat it as 'good' or non-applicable.
        return {
            status: 'good',
            hoursRemaining: 0,
            hoursOverdue: 0,
            isOverdue: false,
            totalSLAHours
        };
    }

    const diffMs = now.getTime() - createdDate.getTime();
    const elapsedHours = diffMs / (1000 * 60 * 60);

    const hoursRemaining = totalSLAHours - elapsedHours;

    let currentStatus: SLAStatus = 'good';

    // SLA Logic:
    // Breached: 0 or fewer hours remaining
    // Warning: Less than 20% of the total time remaining
    if (hoursRemaining <= 0) {
        currentStatus = 'breached';
    } else if (hoursRemaining <= (totalSLAHours * 0.2)) {
        currentStatus = 'warning';
    }

    return {
        status: currentStatus,
        hoursRemaining: Math.max(0, hoursRemaining),
        hoursOverdue: hoursRemaining < 0 ? Math.abs(hoursRemaining) : 0,
        isOverdue: hoursRemaining <= 0,
        totalSLAHours
    };
}
