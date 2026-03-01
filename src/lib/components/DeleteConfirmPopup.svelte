<script lang="ts">
    interface Props {
        eventTitle: string;
        onConfirm: () => void;
        onCancel: () => void;
    }

    let { eventTitle, onConfirm, onCancel }: Props = $props();
</script>

<div class="popup-overlay">
    <div class="popup">
        <h2>일정 삭제</h2>
        <p>"{eventTitle}" 일정을 삭제하시겠습니까?</p>
        <div class="popup-actions">
            <button onclick={onCancel}>취소</button>
            <button onclick={onConfirm} class="delete-btn">삭제</button>
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

    .popup p {
        margin-bottom: 16px;
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

    .popup-actions .delete-btn {
        background-color: #ff4d4f;
        color: white;
    }

    .popup-actions .delete-btn:hover {
        background-color: #ff7875;
    }
</style>
