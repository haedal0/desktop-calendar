<script lang="ts">
    import { getCurrentWindow } from "@tauri-apps/api/window";
    import { emit } from "@tauri-apps/api/event";
    import { onMount } from "svelte";
    import {
        getThemes,
        addTheme,
        updateTheme,
        type ThemeConfig,
    } from "$lib/db";

    const defaultSettings = {
        "--other-month-day-title-color": "#ccc",
        "--day-border-color": "#ebebeb",
        "--other-month-day-background-color": "#ffffff",
        "--month-color": "#000000",
        "--year-color": "#000000",
        "--day-title-color": "#000000",
        "--week-title-color": "#000000",
        "--month-change-color": "#000000",
        "--blur-background-color": "rgba(255, 255, 255, 0.1)",
        "--blur": "blur(5px)",
    };

    let themeSettings = $state({ ...defaultSettings });
    let themeId: number | undefined = $state(undefined);

    async function initSettings() {
        try {
            const themes = await getThemes();
            console.log("Loaded themes:", themes);
            if (themes.length > 0) {
                themeSettings = { ...defaultSettings, ...themes[0].config };
                themeId = themes[0].id;
            } else {
                console.log("Creating default theme");
                const id = await addTheme({
                    name: "default",
                    config: defaultSettings,
                });
                themeId = id;
            }
        } catch (e) {
            console.error("Failed to load settings", e);
        }
    }

    onMount(() => {
        initSettings();
    });

    $effect(() => {
        const configSnapshot = { ...themeSettings };
        console.log("Attempting to save theme", themeId, configSnapshot);

        if (themeId) {
            updateTheme({
                id: themeId,
                name: "default",
                config: configSnapshot,
            })
                .then(() => {
                    console.log("Theme saved, emitting change event");
                    emit("theme-changed");
                })
                .catch((e) => console.error("Save failed", e));
        }
    });

    async function closeWindow() {
        await getCurrentWindow().close();
    }

    function resetSettings() {
        Object.assign(themeSettings, defaultSettings);
    }

    const labels = {
        "--other-month-day-title-color": "이전/다음 달 날짜 색상",
        "--day-border-color": "날짜 테두리 색상",
        "--other-month-day-background-color": "이전/다음 달 배경 색상",
        "--month-color": "월 표시 색상",
        "--year-color": "연도 표시 색상",
        "--day-title-color": "날짜 제목 색상",
        "--week-title-color": "요일 제목 색상",
        "--month-change-color": "달 변경 버튼 색상",
        "--blur-background-color": "블러 배경 색상 (RGBA)",
        "--blur": "블러 효과 (CSS)",
    };
</script>

<div class="container">
    <div class="header">
        <h1>설정</h1>
        <button onclick={closeWindow}>닫기</button>
    </div>

    <div class="settings-list">
        {#each Object.entries(themeSettings) as [key, value]}
            <div class="setting-item">
                <label for={key}
                    >{labels[key as keyof typeof labels] || key}</label
                >
                {#if key === "--blur"}
                    <input
                        type="text"
                        id={key}
                        bind:value={
                            themeSettings[key as keyof typeof themeSettings]
                        }
                        placeholder="e.g. blur(5px)"
                    />
                {:else if key === "--blur-background-color"}
                    <input
                        type="text"
                        id={key}
                        bind:value={
                            themeSettings[key as keyof typeof themeSettings]
                        }
                        placeholder="e.g. rgba(255, 255, 255, 0.1)"
                    />
                {:else}
                    <div class="color-input-wrapper">
                        <input
                            type="color"
                            id={key}
                            bind:value={
                                themeSettings[key as keyof typeof themeSettings]
                            }
                        />
                        <input
                            type="text"
                            bind:value={
                                themeSettings[key as keyof typeof themeSettings]
                            }
                            class="color-text"
                        />
                    </div>
                {/if}
            </div>
        {/each}
    </div>

    <div class="actions">
        <button onclick={resetSettings} class="reset-btn"
            >기본값으로 초기화</button
        >
    </div>
</div>

<style>
    .container {
        padding: 20px;
        font-family:
            -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
            Arial, sans-serif;
        height: 100vh;
        box-sizing: border-box;
        background-color: white;
        color: #333;
        display: flex;
        flex-direction: column;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
    }

    h1 {
        margin: 0;
        font-size: 24px;
    }

    .settings-list {
        flex: 1;
        overflow-y: auto;
        padding-right: 10px;
    }

    .setting-item {
        margin-bottom: 15px;
        display: flex;
        flex-direction: column;
    }

    label {
        margin-bottom: 5px;
        font-weight: 500;
        font-size: 14px;
        color: #555;
    }

    input[type="text"] {
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 14px;
        width: 100%;
        box-sizing: border-box;
    }

    .color-input-wrapper {
        display: flex;
        gap: 10px;
        align-items: center;
    }

    input[type="color"] {
        border: none;
        width: 40px;
        height: 40px;
        cursor: pointer;
        padding: 0;
        background: none;
        flex-shrink: 0;
    }

    .color-text {
        flex: 1;
    }

    button {
        padding: 8px 16px;
        cursor: pointer;
        background-color: #f0f0f0;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 14px;
        transition: background-color 0.2s;
    }

    button:hover {
        background-color: #e0e0e0;
    }

    .actions {
        margin-top: 20px;
        padding-top: 10px;
        border-top: 1px solid #eee;
        text-align: right;
    }

    .reset-btn {
        background-color: #fff0f0;
        border-color: #ffcccc;
        color: #d32f2f;
    }

    .reset-btn:hover {
        background-color: #ffe0e0;
    }

    .settings-list::-webkit-scrollbar {
        width: 8px;
    }

    .settings-list::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
    }

    .settings-list::-webkit-scrollbar-thumb {
        background: #ccc;
        border-radius: 4px;
    }

    .settings-list::-webkit-scrollbar-thumb:hover {
        background: #bbb;
    }
</style>
