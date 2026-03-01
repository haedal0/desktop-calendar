<script lang="ts">
    import type { CellType } from "$lib/types/calendar";
    import type { CalendarEvent } from "$lib/db";

    interface Props {
        day: number;
        type: CellType;
        events: CalendarEvent[];
        maxVisibleEvents: number;
        onContextMenu: (e: MouseEvent, day: number, type: CellType, event?: CalendarEvent) => void;
        onMoreClick: (day: number, e: MouseEvent) => void;
    }

    let { day, type, events = [], maxVisibleEvents, onContextMenu, onMoreClick }: Props = $props();

    const isOtherMonth = $derived(type === "prev" || type === "next");
    const showAll = $derived(events.length <= maxVisibleEvents);
    const displayCount = $derived(
        showAll ? events.length : Math.max(0, maxVisibleEvents - 1)
    );
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="day blur"
    class:other-month-day={isOtherMonth}
    oncontextmenu={(e) => onContextMenu(e, day, type)}
>
    <h1 class="day-title" class:other-month-day-title={isOtherMonth}>
        {day}
    </h1>
    {#if type === "current"}
        <div class="event-container">
            {#each events.slice(0, displayCount) as event}
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                    class="event"
                    oncontextmenu={(e) => onContextMenu(e, day, type, event)}
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
                        onMoreClick(day, e);
                    }}
                >
                    그 외 {events.length - displayCount}개
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .day {
        display: flex;
        flex-direction: column;
        justify-content: start;
        padding: 12%;
        border: 1px solid var(--day-border-color);
        border-radius: 20%;
        aspect-ratio: 1;
    }

    .day.blur {
        background-color: var(--blur-background-color);
        backdrop-filter: var(--blur);
    }

    .day.other-month-day {
        border: none;
    }

    .day-title {
        font-size: clamp(1rem, 2vw, 3rem);
        font-weight: 200;
        margin-bottom: 8px;
        color: var(--day-title-color);
    }

    .day-title.other-month-day-title {
        color: var(--other-month-day-title-color);
    }

    .event-container {
        display: flex;
        flex-direction: column;
        gap: 3px;
    }

    .event {
        padding: 2px;
        font-size: clamp(0.5rem, 1.5vw, 3rem);
        background-color: var(--event-background-color);
        color: var(--event-text-color);
        border-radius: 3px / 5px;
    }

    .event.more-events {
        background-color: rgba(0, 0, 0, 0.05);
        color: #555;
        text-align: center;
        font-size: 0.8em;
        cursor: pointer;
    }
</style>
