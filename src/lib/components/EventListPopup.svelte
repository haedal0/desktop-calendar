<script lang="ts">
    import type { CalendarEvent } from "$lib/db";
    import type { PopupPosition } from "$lib/types/calendar";

    interface Props {
        day: number;
        events: CalendarEvent[];
        position: PopupPosition;
        onClose: () => void;
    }

    let { day, events, position, onClose }: Props = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="list-popup-overlay" onclick={onClose}></div>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="popup list-popup"
    style="top: {position.y}px; left: {position.x}px;"
    onclick={(e) => e.stopPropagation()}
>
    <h4>{day}일 일정</h4>
    <div class="popup-event-list">
        {#each events as event}
            <div class="popup-event-item">
                {event.title}
            </div>
        {/each}
    </div>
</div>

<style>
    .list-popup-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: transparent;
        z-index: 1100;
    }

    .list-popup {
        position: fixed;
        width: 200px;
        padding: 10px;
        font-size: 0.9rem;
        z-index: 1200;
    }

    .list-popup h4 {
        margin: 0 0 8px;
        font-size: 1rem;
    }

    .popup-event-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
        max-height: 300px;
        margin-bottom: 16px;
        overflow-y: auto;
    }

    .popup-event-item {
        padding: 8px;
        background-color: #f5f5f5;
        border-radius: 4px;
        font-size: 0.9rem;
    }

    .popup {
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
</style>
