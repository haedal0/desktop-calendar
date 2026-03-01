import { addEvent, updateEvent, deleteEvent as dbDeleteEvent, type CalendarEvent } from "$lib/db";
import type { PopupMode, PopupPosition } from "$lib/types/calendar";
import { formatDateString } from "$lib/utils/date";

export function useEventManager(year: () => number, month: () => number, reloadEvents: () => Promise<void>) {
    let isEventPopupOpen = $state(false);
    let isDeletePopupOpen = $state(false);
    let isListPopupOpen = $state(false);
    let listPopupPosition = $state<PopupPosition>({ x: 0, y: 0 });
    let popupMode = $state<PopupMode>("create");
    let targetDay = $state(0);
    let targetEvent = $state<CalendarEvent | null>(null);
    let inputEventTitle = $state("");

    function openCreatePopup(day: number) {
        popupMode = "create";
        targetDay = day;
        inputEventTitle = "";
        isEventPopupOpen = true;
    }

    function openEditPopup(day: number, event: CalendarEvent) {
        popupMode = "edit";
        targetDay = day;
        targetEvent = event;
        inputEventTitle = event.title;
        isEventPopupOpen = true;
    }

    function openDeletePopup(day: number, event: CalendarEvent) {
        targetDay = day;
        targetEvent = event;
        isDeletePopupOpen = true;
    }

    function openListPopup(day: number, e: MouseEvent) {
        targetDay = day;
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        let x = rect.right + 5;
        if (x + 230 > window.innerWidth) {
            x = rect.left - 235;
        }
        listPopupPosition = { x, y: rect.top };
        isListPopupOpen = true;
    }

    function closePopups() {
        isEventPopupOpen = false;
        isDeletePopupOpen = false;
        isListPopupOpen = false;
        targetEvent = null;
    }

    async function saveEvent() {
        if (!inputEventTitle.trim()) return;

        const dateStr = formatDateString(year(), month(), targetDay);

        try {
            if (popupMode === "create") {
                await addEvent({ title: inputEventTitle, date: dateStr });
            } else if (targetEvent && targetEvent.id) {
                await updateEvent({
                    id: targetEvent.id,
                    title: inputEventTitle,
                    date: targetEvent.date,
                });
            }
            await reloadEvents();
            closePopups();
        } catch (e) {
            console.error("Error saving event:", e);
        }
    }

    async function deleteEvent() {
        try {
            if (targetEvent && targetEvent.id) {
                await dbDeleteEvent(targetEvent.id);
                await reloadEvents();
            }
            closePopups();
        } catch (e) {
            console.error("Error deleting event:", e);
        }
    }

    return {
        get isEventPopupOpen() {
            return isEventPopupOpen;
        },
        get isDeletePopupOpen() {
            return isDeletePopupOpen;
        },
        get isListPopupOpen() {
            return isListPopupOpen;
        },
        get listPopupPosition() {
            return listPopupPosition;
        },
        get popupMode() {
            return popupMode;
        },
        get targetDay() {
            return targetDay;
        },
        get targetEvent() {
            return targetEvent;
        },
        get inputEventTitle() {
            return inputEventTitle;
        },
        set inputEventTitle(value: string) {
            inputEventTitle = value;
        },
        openCreatePopup,
        openEditPopup,
        openDeletePopup,
        openListPopup,
        closePopups,
        saveEvent,
        deleteEvent,
    };
}
