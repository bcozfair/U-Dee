export interface CheckInRecord {
    id: string;
    date: string;
    status: string;
    coords: {
        latitude: number;
        longitude: number;
    };
}

export const getRecordDate = (record: CheckInRecord): Date => {
    // Try parsing ID as timestamp first (more reliable)
    const timestamp = parseInt(record.id, 10);
    if (!isNaN(timestamp) && timestamp > 1000000000000) {
        return new Date(timestamp);
    }

    // Fallback to date string (flaky for "th-TH" strings, but kept for legacy)
    return new Date(record.date);
};

export const calculateStreak = (history: CheckInRecord[]): number => {
    if (!history || history.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort by date descending
    const sortedHistory = [...history].sort((a, b) =>
        getRecordDate(b).getTime() - getRecordDate(a).getTime()
    );

    let checkDate = new Date(today);

    // Use a map to track visited dates to handle multiple check-ins per day
    const visitedDates = new Set<string>();

    for (const record of sortedHistory) {
        const recordDate = getRecordDate(record);
        recordDate.setHours(0, 0, 0, 0);
        const dateStr = recordDate.toDateString();

        if (visitedDates.has(dateStr)) continue;
        visitedDates.add(dateStr);

        const diffTime = checkDate.getTime() - recordDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) { // Today
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else if (diffDays === 1) { // Yesterday (relative to checkDate)
            streak++;
            checkDate = recordDate;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            // Gap found
            break;
        }
    }

    return streak;
};
