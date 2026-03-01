<script lang="ts">
    const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
</script>

<div id="calendar-header">
    {#each weekDays as day}
        <div class="header-day">
            <p>{day}</p>
        </div>
    {/each}
</div>

<style>
    #calendar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
        flex-shrink: 0;
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
</style>
