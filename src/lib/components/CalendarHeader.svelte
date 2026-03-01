<script lang="ts">
    import { ChevronLeft, ChevronRight } from "lucide-svelte";

    interface Props {
        year: number;
        month: number;
        onPrev: () => void;
        onNext: () => void;
    }

    let { year, month, onPrev, onNext }: Props = $props();
</script>

<div id="header" data-tauri-drag-region>
    <div id="date">
        <h1 id="month">{month + 1}월</h1>
        <p id="year">{year}</p>
    </div>
    <div id="controls">
        <button id="prev" onclick={onPrev}>
            <ChevronLeft />
        </button>
        <button id="next" onclick={onNext}>
            <ChevronRight />
        </button>
    </div>
</div>

<style>
    #header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
        flex-shrink: 0;
    }

    #month {
        font-size: clamp(1rem, 3.5vw, 4rem);
        color: var(--month-color);
    }

    #year {
        font-size: clamp(0.5rem, 2vw, 3rem);
        color: var(--year-color);
    }

    #prev,
    #next {
        padding: 0;
        border: none;
        background-color: transparent;
        color: var(--month-change-color);
        cursor: pointer;
    }
</style>
