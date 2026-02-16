<script lang="ts">
    import { onMount } from "svelte";
    import { invoke } from "@tauri-apps/api/core";
    import { listen } from "@tauri-apps/api/event";
    import { Menu, PredefinedMenuItem } from "@tauri-apps/api/menu";
    import { ChevronLeft, ChevronRight, Plus } from "lucide-svelte";
    import { Image } from "@tauri-apps/api/image";
    import {
        getEvents,
        addEvent,
        updateEvent,
        deleteEvent as dbDeleteEvent,
        getThemes,
        type CalendarEvent,
    } from "$lib/db";

    //// CUSTOM THEME ////
    let themeSettings = $state({
        "--other-month-day-title-color": "#ccc",
        "--day-border-color": "#ebebeb",
        "--other-month-day-background-color": "#ffffff",
        "--month-color": "#000000",
        "--year-color": "#000000",
        "--day-title-color": "#000000",
        "--week-title-color": "#000000",
        "--month-change-color": "#000000",
        "--event-background-color": "rgba(245, 69, 66, 0.2)",
        "--event-text-color": "#000000",
        "--blur-background-color": "rgba(255, 255, 255, 0.1)",
        "--blur": "blur(5px)",
    });

    async function loadTheme() {
        try {
            const themes = await getThemes();
            if (themes.length > 0) {
                Object.assign(themeSettings, themes[0].config);
            }
        } catch (e) {
            console.error("Error loading theme:", e);
        }
    }

    onMount(() => {
        loadTheme();
        const unlistenTheme = listen("theme-changed", () => {
            loadTheme();
        });

        loadEvents();

        return () => {
            unlistenTheme.then((f) => f());
        };
    });

    let cssVariables = $derived(
        Object.entries(themeSettings)
            .map(([key, value]) => `${key}: ${value}`)
            .join(";"),
    );

    let now = new Date();
    let year = $state(now.getFullYear());
    let month = $state(now.getMonth());

    let plusIcon: Image | undefined;
    let penIcon: Image | undefined;
    let trashIcon: Image | undefined;

    let daysInMonth = $derived(new Date(year, month + 1, 0).getDate());
    let firstDay = $derived(
        new Date(year, month, 1).getDay() === 0
            ? 7
            : new Date(year, month, 1).getDay(),
    );
    let dbEvents = $state<CalendarEvent[]>([]);

    async function loadEvents() {
        try {
            dbEvents = await getEvents();
        } catch (e) {
            console.error("Error loading events:", e);
        }
    }

    let events = $derived.by(() => {
        const map: Record<number, CalendarEvent[]> = {};
        const currentMonthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;

        for (const e of dbEvents) {
            if (e.date.startsWith(currentMonthPrefix)) {
                const day = parseInt(e.date.split("-")[2]);
                if (!map[day]) map[day] = [];
                map[day].push(e);
            }
        }
        return map;
    });

    let isEventPopupOpen = $state(false);
    let isDeletePopupOpen = $state(false);
    let isListPopupOpen = $state(false);
    let listPopupPosition = $state({ x: 0, y: 0 });
    let popupMode = $state<"create" | "edit">("create");
    let targetDay = $state(0);
    let targetEvent = $state<CalendarEvent | null>(null);
    let inputEventTitle = $state("");
    let maxVisibleEvents = $state(3);

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

        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;

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
            await loadEvents();
            closePopups();
        } catch (e) {
            console.error("Error saving event:", e);
        }
    }

    async function deleteEvent() {
        try {
            if (targetEvent && targetEvent.id) {
                await dbDeleteEvent(targetEvent.id);
                await loadEvents();
            }
            closePopups();
        } catch (e) {
            console.error("Error deleting event:", e);
        }
    }

    let prevMonthLastDate = $derived(new Date(year, month, 0).getDate());

    let cells = $derived(
        (() => {
            const currentMonth = Array.from(
                { length: daysInMonth },
                (_, i) => ({
                    day: i + 1,
                    type: "current" as const,
                }),
            );

            const prevMonth = Array.from({ length: firstDay }, (_, i) => ({
                day: prevMonthLastDate - firstDay + i + 1,
                type: "prev" as const,
            }));

            const remaining = 42 - (currentMonth.length + prevMonth.length);
            const nextMonth = Array.from({ length: remaining }, (_, i) => ({
                day: i + 1,
                type: "next" as const,
            }));

            return [...prevMonth, ...currentMonth, ...nextMonth];
        })(),
    );

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

    async function handleContextMenu(
        e: MouseEvent,
        day: number,
        type: string,
        event?: CalendarEvent,
    ) {
        e.preventDefault();
        e.stopPropagation();

        if (type !== "current") return;

        if (!plusIcon) {
            const response = await fetch("/icons/plus.png");
            const buffer = await response.arrayBuffer();
            plusIcon = await Image.fromBytes(new Uint8Array(buffer));
        }

        const items = [];

        items.push(
            {
                id: "title",
                text: `${day}일`,
                enabled: false,
            },
            {
                id: "create",
                icon: plusIcon,
                text: "일정 생성",
                action: () => {
                    openCreatePopup(day);
                },
            },
        );

        if (event) {
            if (!penIcon) {
                const response = await fetch("/icons/pen.png");
                const buffer = await response.arrayBuffer();
                penIcon = await Image.fromBytes(new Uint8Array(buffer));
            }
            if (!trashIcon) {
                const response = await fetch("/icons/trash.png");
                const buffer = await response.arrayBuffer();
                trashIcon = await Image.fromBytes(new Uint8Array(buffer));
            }

            items.push({
                item: "Separator" as const,
            });
            items.push({
                id: "event-title",
                text: event.title,
                enabled: false,
            });
            items.push({
                id: "edit",
                icon: penIcon,
                text: "수정",
                action: () => {
                    openEditPopup(day, event);
                },
            });
            items.push({
                id: "delete",
                icon: trashIcon,
                text: "삭제",
                action: () => {
                    openDeletePopup(day, event);
                },
            });
        }

        const menu = await Menu.new({
            items,
        });
        menu.popup();
    }

    onMount(() => {
        const resizeObserver = new ResizeObserver(() => {
            const main = document.getElementById("main");
            const header = document.getElementById("header");
            const calHeader = document.getElementById("calendar-header");

            if (!main || !header || !calHeader) return;

            const mainRect = main.getBoundingClientRect();
            const headerRect = header.getBoundingClientRect();
            const calHeaderRect = calHeader.getBoundingClientRect();

            const paddingX = 32; // 16px * 2
            const paddingY = 32; // 16px * 2
            const gap = 9;
            const headerMarginBottom = 16;
            const calHeaderMarginBottom = 8;

            const availableWidth = window.innerWidth - paddingX;
            const cellWidth = (availableWidth - 6 * gap) / 7;
            const calendarBodyHeight = cellWidth * 6 + 5 * gap;

            const cellHeight = cellWidth;
            const padding = cellWidth * 0.24; // 12% top + 12% bottom
            const rem = 16;
            const vw = window.innerWidth * 0.02;
            const titleFontSize = Math.min(Math.max(rem, vw), 3 * rem);
            const titleHeight = titleFontSize * 1.2 + 8; // line-height + margin-bottom

            const evVw = window.innerWidth * 0.015;
            const evFontSize = Math.min(Math.max(0.5 * rem, evVw), 3 * rem);
            const eventItemHeight = evFontSize * 1.2 + 4; // line-height + padding

            const availableHeight = cellHeight - padding - titleHeight;
            const eventGap = 3;

            if (availableHeight > 0) {
                const count = Math.floor(
                    (availableHeight + eventGap) / (eventItemHeight + eventGap),
                );
                maxVisibleEvents = Math.max(0, count);
            } else {
                maxVisibleEvents = 0;
            }

            const contentHeight =
                paddingY +
                headerRect.height +
                headerMarginBottom +
                calHeaderRect.height +
                calHeaderMarginBottom +
                calendarBodyHeight +
                20;

            if (Math.abs(window.innerHeight - contentHeight) > 2) {
                invoke("update_window_with_ratio", {
                    width: window.innerWidth,
                    height: contentHeight,
                });
            }
        });

        resizeObserver.observe(document.body);

        return () => {
            resizeObserver.disconnect();
        };
    });
</script>

<div id="main" style={cssVariables}>
    <div id="header" data-tauri-drag-region>
        <div id="date">
            <h1 id="month">{month + 1}월</h1>
            <p id="year">{year}</p>
        </div>
        <div id="controls">
            <button id="prev" onclick={prevMonth}><ChevronLeft /></button>
            <button id="next" onclick={nextMonth}><ChevronRight /></button>
        </div>
    </div>
    <div id="body">
        <div id="calendar-header">
            {#each ["일", "월", "화", "수", "목", "금", "토"] as day}
                <div class="header-day">
                    <p>{day}</p>
                </div>
            {/each}
        </div>
        <div id="calendar-body">
            {#each cells as { day, type }}
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                    class="day blur"
                    class:other-month-day={type === "prev" || type === "next"}
                    oncontextmenu={(e) => handleContextMenu(e, day, type)}
                >
                    <h1
                        class="day-title"
                        class:other-month-day-title={type === "prev" ||
                            type === "next"}
                    >
                        {day}
                    </h1>
                    {#if type === "current"}
                        {@const dayEvents = events[day] || []}
                        {@const showAll = dayEvents.length <= maxVisibleEvents}
                        {@const displayCount = showAll
                            ? dayEvents.length
                            : Math.max(0, maxVisibleEvents - 1)}
                        <div class="event-container">
                            {#each dayEvents.slice(0, displayCount) as event}
                                <!-- svelte-ignore a11y_no_static_element_interactions -->
                                <div
                                    class="event"
                                    oncontextmenu={(e) =>
                                        handleContextMenu(e, day, type, event)}
                                >
                                    {event.title}
                                </div>
                            {/each}
                            {#if !showAll}
                                <!-- svelte-ignore a11y_click_events_have_key_events -->
                                <!-- svelte-ignore a11y_no_static_element_interactions -->
                                <div
                                    class="event more-events"
                                    onclick={(e) => {
                                        e.stopPropagation();
                                        openListPopup(day, e);
                                    }}
                                >
                                    그 외 {dayEvents.length - displayCount}개
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    </div>
</div>

{#if isEventPopupOpen}
    <div class="popup-overlay">
        <div class="popup">
            <h2>{popupMode === "create" ? "일정 생성" : "일정 수정"}</h2>
            <input
                type="text"
                bind:value={inputEventTitle}
                placeholder="일정 제목"
                autofocus
            />
            <div class="popup-actions">
                <button onclick={closePopups}>취소</button>
                <button onclick={saveEvent}>저장</button>
            </div>
        </div>
    </div>
{/if}

{#if isDeletePopupOpen}
    <div class="popup-overlay">
        <div class="popup">
            <h2>일정 삭제</h2>
            <p>"{targetEvent?.title}" 일정을 삭제하시겠습니까?</p>
            <div class="popup-actions">
                <button onclick={closePopups}>취소</button>
                <button onclick={deleteEvent} class="delete-btn">삭제</button>
            </div>
        </div>
    </div>
{/if}

{#if isListPopupOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="list-popup-overlay" onclick={closePopups}></div>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="popup list-popup"
        style="top: {listPopupPosition.y}px; left: {listPopupPosition.x}px;"
        onclick={(e) => e.stopPropagation()}
    >
        <h4>{targetDay}일 일정</h4>
        <div class="popup-event-list">
            {#each events[targetDay] || [] as event}
                <div class="popup-event-item">
                    {event.title}
                </div>
            {/each}
        </div>
    </div>
{/if}

<style>
    @font-face {
        font-family: "Pretendard";
        font-weight: 45 920;
        font-style: normal;
        font-display: swap;
        src: url("/fonts/PretendardVariable.woff2") format("woff2-variations");
    }

    * {
        font-family: "Pretendard";
        overflow: hidden;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
    }

    :root {
        background-color: transparent;
    }

    :global(body) {
        margin: 0;
        padding: 0;
    }

    #main {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        box-sizing: border-box;
        padding: 16px;
    }
    #header {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;
        margin-bottom: 16px;
    }
    #month {
        font-size: clamp(1rem, 3.5vw, 4rem);
        color: var(--month-color);
    }
    #year {
        font-size: clamp(0.5rem, 2vw, 3rem);
        color: var(--year-color);
    }

    #body {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }
    #calendar-header {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;
        margin-bottom: 8px;
    }
    #calendar-body {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 9px;
        flex: 1;
        align-content: start;
    }
    .header-day {
        width: 100%;
    }
    .header-day p {
        font-size: clamp(0.5rem, 2vw, 3rem);
        font-weight: 450;
        text-align: center;
        color: var(--week-title-color);
    }
    .day {
        aspect-ratio: 1;
        display: flex;
        justify-content: start;
        flex-direction: column;
        border: 1px solid;
        border-color: var(--day-border-color);
        padding: 12%;
        border-radius: 20%;
    }
    .day-title {
        font-size: clamp(1rem, 2vw, 3rem);
        font-family: "Pretendard";
        font-weight: 200;
        margin-bottom: 8px;
        color: var(--day-title-color);
    }
    .other-month-day-title {
        color: var(--other-month-day-title-color);
    }
    .other-month-day {
        background-color: var(--other-month-day-background-color);
        border: none;
    }
    .blur {
        background-color: var(--blur-background-color);
        backdrop-filter: var(--blur);
    }
    .event {
        font-size: clamp(0.5rem, 1.5vw, 3rem);
        background-color: var(--event-background-color);
        color: var(--event-text-color);
        border-radius: 3px / 5px;
        padding: 2px;
    }
    #prev,
    #next {
        border: none;
        background-color: transparent;
        cursor: pointer;
        color: var(--month-change-color);
    }

    .popup-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .popup {
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        min-width: 300px;
    }

    .popup h2 {
        margin-top: 0;
        margin-bottom: 16px;
        font-size: 1.2rem;
    }

    .popup input {
        width: 100%;
        padding: 8px;
        margin-bottom: 16px;
        box-sizing: border-box;
        border: 1px solid #ccc;
        border-radius: 4px;
    }

    .popup-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
    }

    .popup-actions button {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        background-color: #f0f0f0;
    }

    .popup-actions button:hover {
        background-color: #e0e0e0;
    }

    .popup-actions .delete-btn {
        background-color: #ff4d4f;
        color: white;
    }

    .popup-actions .delete-btn:hover {
        background-color: #ff7875;
    }
    .event-container {
        display: flex;
        flex-direction: column;
        gap: 3px;
    }

    .more-events {
        background-color: rgba(0, 0, 0, 0.05);
        color: #555;
        text-align: center;
        font-size: 0.8em;
        cursor: pointer;
    }

    .list-popup-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1100;
        background-color: transparent;
    }

    .list-popup {
        position: fixed;
        width: 200px;
        min-width: auto;
        padding: 10px;
        z-index: 1200;
        font-size: 0.9rem;
    }

    .list-popup h4 {
        margin: 0 0 8px 0;
        font-size: 1rem;
    }

    .popup-event-list {
        max-height: 300px;
        overflow-y: auto;
        margin-bottom: 16px;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .popup-event-item {
        padding: 8px;
        background-color: #f5f5f5;
        border-radius: 4px;
        font-size: 0.9rem;
    }
</style>
