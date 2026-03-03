/**
 * Format a UTC timestamp to Thai local time (UTC+7)
 * 
 * Helper to manually parse UTC ISO strings and convert to Thai time.
 * Handles formats: "2026-02-19T14:22:21.196+00:00"
 */
export const toThaiDateTime = (utcDateStr: string | null | undefined): string => {
    if (!utcDateStr) return '-';

    try {
        // 1. Clean string
        let cleanStr = utcDateStr.trim().replace(' ', 'T');
        cleanStr = cleanStr.split('+')[0].split('Z')[0];

        // 2. Parse components
        const [datePart, timePart] = cleanStr.split('T');
        if (!datePart || !timePart) return utcDateStr;

        const [yearStr, monthStr, dayStr] = datePart.split('-');
        const [hourStr, minuteStr] = timePart.split(':');

        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
        const day = parseInt(dayStr, 10);
        const hours = parseInt(hourStr, 10);
        const minutes = parseInt(minuteStr, 10);

        if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) {
            return utcDateStr;
        }

        // 3. Calculate Thai Time using Date.UTC to handle calendar math (leap years, etc.)
        // We act "as if" the UTC time is what we want, then add 7 hours.
        // Date.UTC returns milliseconds.
        const utcMilliseconds = Date.UTC(year, month - 1, day, hours, minutes);

        // Add 7 hours (in milliseconds)
        const thaiMilliseconds = utcMilliseconds + (7 * 60 * 60 * 1000);

        // Create new date object from the adjusted timestamp
        const thaiDate = new Date(thaiMilliseconds);

        // 4. Extract components using UTC methods
        // Since we manually shifted the time by 7 hours, reading it back as "UTC" gives us the Thai time components.
        const ty = thaiDate.getUTCFullYear();
        const tm = thaiDate.getUTCMonth() + 1;
        const td = thaiDate.getUTCDate();
        const th = thaiDate.getUTCHours();
        const tmin = thaiDate.getUTCMinutes();

        // 5. Format Output
        const buddhistYear = ty + 543;
        const dd = td.toString().padStart(2, '0');
        const mm = tm.toString().padStart(2, '0');
        const hh = th.toString().padStart(2, '0');
        const min = tmin.toString().padStart(2, '0');

        return `${dd}/${mm}/${buddhistYear} ${hh}:${min} น.`;

    } catch (e) {
        console.error("Error formatting date:", utcDateStr, e);
        return utcDateStr || '-';
    }
};

export const nowThaiFormatted = (): string => {
    const now = new Date();
    // Return current time shifted 
    return toThaiDateTime(now.toISOString());
};
