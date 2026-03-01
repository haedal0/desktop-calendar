/**
 * Formats a date string in YYYY-MM-DD format
 */
export function formatDateString(year: number, month: number, day: number): string {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Gets the number of days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

/**
 * Gets the first day of the month (1-7, where 7 is Sunday)
 */
export function getFirstDayOfMonth(year: number, month: number): number {
    const firstDay = new Date(year, month, 1).getDay();
    return firstDay === 0 ? 7 : firstDay;
}

/**
 * Gets the last day of the previous month
 */
export function getLastDayOfPrevMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
}

/**
 * Parses day from date string (YYYY-MM-DD)
 */
export function parseDayFromDate(dateString: string): number {
    return parseInt(dateString.split("-")[2]);
}
