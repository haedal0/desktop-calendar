import { getEvents, type CalendarEvent } from "$lib/db";
import { formatDateString, getDaysInMonth } from "$lib/utils/date";
import { generateCalendarCells, groupEventsByDay } from "$lib/utils/calendar";

export function useCalendar() {
    const now = new Date();
    let year = $state(now.getFullYear());
    let month = $state(now.getMonth());
    let dbEvents = $state<CalendarEvent[]>([]);

    const cells = $derived(generateCalendarCells(year, month));
    const events = $derived(groupEventsByDay(dbEvents));

    async function loadEvents() {
        try {
            const startDate = formatDateString(year, month, 1);
            const lastDay = getDaysInMonth(year, month);
            const endDate = formatDateString(year, month, lastDay);
            dbEvents = await getEvents(startDate, endDate);
        } catch (e) {
            console.error("Error loading events:", e);
        }
    }

    // Reload events when year or month changes
    $effect(() => {
        void year;
        void month;
        loadEvents();
    });

    function nextMonth() {
        if (month === 11) {
            month = 0;
            year += 1;
        } else {
            month += 1;
        }
    }

    function prevMonth() {
        if (month === 0) {
            month = 11;
            year -= 1;
        } else {
            month -= 1;
        }
    }

    return {
        get year() {
            return year;
        },
        get month() {
            return month;
        },
        get cells() {
            return cells;
        },
        get events() {
            return events;
        },
        loadEvents,
        nextMonth,
        prevMonth,
    };
}
