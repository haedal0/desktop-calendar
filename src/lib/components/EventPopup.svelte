<script lang="ts">
    import type { PopupMode } from "$lib/types/calendar";

    interface Props {
        mode: PopupMode;
        value: string;
        onSave: () => void;
        onCancel: () => void;
        onInput: (value: string) => void;
    }

    let { mode, value = $bindable(""), onSave, onCancel, onInput }: Props = $props();
</script>

<div class="popup-overlay">
    <div class="popup">
        <h2>{mode === "create" ? "일정 생성" : "일정 수정"}</h2>
        <input
            type="text"
            bind:value
            oninput={(e) => onInput(e.currentTarget.value)}
            placeholder="일정 제목"
            autofocus
        />
        <div class="popup-actions">
            <button onclick={onCancel}>취소</button>
            <button onclick={onSave}>저장</button>
        </div>
    </div>
</div>

<style>
    .popup-overlay {
        position: fixed;
        top: 0;
        left: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1000;
    }

    .popup {
        min-width: 300px;
        padding: 20px;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .popup h2 {
        margin: 0 0 16px;
        font-size: 1.2rem;
    }

    .popup input {
        width: 100%;
        padding: 8px;
        margin-bottom: 16px;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-sizing: border-box;
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
        background-color: #f0f0f0;
        cursor: pointer;
    }

    .popup-actions button:hover {
        background-color: #e0e0e0;
    }
</style>
