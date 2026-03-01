import type { CalendarCell } from "$lib/types/calendar";
import { getDaysInMonth, getFirstDayOfMonth, getLastDayOfPrevMonth } from "./date";

/**
 * Generates a 42-cell calendar grid (6 rows x 7 days)
 */
export function generateCalendarCells(year: number, month: number): CalendarCell[] {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const prevMonthLastDate = getLastDayOfPrevMonth(year, month);

    // Current month days
    const currentMonth: CalendarCell[] = Array.from({ length: daysInMonth }, (_, i) => ({
        day: i + 1,
        type: "current" as const,
    }));

    // Previous month overflow days
    const prevMonth: CalendarCell[] = Array.from({ length: firstDay }, (_, i) => ({
        day: prevMonthLastDate - firstDay + i + 1,
        type: "prev" as const,
    }));

    // Next month overflow days
    const remaining = 42 - (currentMonth.length + prevMonth.length);
    const nextMonth: CalendarCell[] = Array.from({ length: remaining }, (_, i) => ({
        day: i + 1,
        type: "next" as const,
    }));

    return [...prevMonth, ...currentMonth, ...nextMonth];
}

/**
 * Groups events by day
 */
export function groupEventsByDay<T extends { date: string }>(
    events: T[]
): Record<number, T[]> {
    const map: Record<number, T[]> = {};

    for (const event of events) {
        const day = parseInt(event.date.split("-")[2]);
        if (!map[day]) map[day] = [];
        map[day].push(event);
    }

    return map;
}
