<script lang="ts">
    import { onMount } from "svelte";
    import CalendarHeader from "$lib/components/CalendarHeader.svelte";
    import WeekHeader from "$lib/components/WeekHeader.svelte";
    import DayCell from "$lib/components/DayCell.svelte";
    import EventPopup from "$lib/components/EventPopup.svelte";
    import DeleteConfirmPopup from "$lib/components/DeleteConfirmPopup.svelte";
    import EventListPopup from "$lib/components/EventListPopup.svelte";
    import { useTheme } from "$lib/composables/useTheme.svelte";
    import { useCalendar } from "$lib/composables/useCalendar.svelte";
    import { useEventManager } from "$lib/composables/useEventManager.svelte";
    import { useContextMenu } from "$lib/composables/useContextMenu.svelte";
    import { useWindowResize } from "$lib/composables/useWindowResize.svelte";

    // Initialize composables
    const theme = useTheme();
    const calendar = useCalendar();
    const eventManager = useEventManager(
        () => calendar.year,
        () => calendar.month,
        calendar.loadEvents
    );
    const contextMenu = useContextMenu();
    const windowResize = useWindowResize();

    // Setup on mount
    onMount(() => {
        theme.loadTheme();

        const unlistenThemePromise = theme.setupThemeListener();

        return () => {
            unlistenThemePromise.then((unlisten) => unlisten());
        };
    });
</script>

<div id="main" bind:this={theme.mainElement}>
    <CalendarHeader
        year={calendar.year}
        month={calendar.month}
        onPrev={calendar.prevMonth}
        onNext={calendar.nextMonth}
    />

    <div id="body">
        <WeekHeader />

        <div id="calendar-body">
            {#each calendar.cells as { day, type }}
                <DayCell
                    {day}
                    {type}
                    events={calendar.events[day] || []}
                    maxVisibleEvents={windowResize.maxVisibleEvents}
                    onContextMenu={(e, day, type, event) =>
                        contextMenu.showContextMenu(
                            e,
                            day,
                            type,
                            event,
                            eventManager.openCreatePopup,
                            eventManager.openEditPopup,
                            eventManager.openDeletePopup
                        )}
                    onMoreClick={eventManager.openListPopup}
                />
            {/each}
        </div>
    </div>
</div>

{#if eventManager.isEventPopupOpen}
    <EventPopup
        mode={eventManager.popupMode}
        bind:value={eventManager.inputEventTitle}
        onSave={eventManager.saveEvent}
        onCancel={eventManager.closePopups}
        onInput={(value) => (eventManager.inputEventTitle = value)}
    />
{/if}

{#if eventManager.isDeletePopupOpen}
    <DeleteConfirmPopup
        eventTitle={eventManager.targetEvent?.title ?? ""}
        onConfirm={eventManager.deleteEvent}
        onCancel={eventManager.closePopups}
    />
{/if}

{#if eventManager.isListPopupOpen}
    <EventListPopup
        day={eventManager.targetDay}
        events={calendar.events[eventManager.targetDay] || []}
        position={eventManager.listPopupPosition}
        onClose={eventManager.closePopups}
    />
{/if}

<style>
    /* ==================== Global Styles ==================== */
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
    }

    :root {
        background-color: transparent;
    }

    :global(body) {
        margin: 0;
        padding: 0;
    }

    /* ==================== Main Layout ==================== */
    #main {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        padding: 16px;
        box-sizing: border-box;
    }

    /* ==================== Calendar Body ==================== */
    #body {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
    }

    #calendar-body {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 9px;
        flex: 1;
        align-content: start;
    }
</style>
