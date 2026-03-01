import { listen } from "@tauri-apps/api/event";
import { getThemes, DEFAULT_THEME_CONFIG, type ThemeConfig } from "$lib/db";

export function useTheme() {
    let themeSettings = $state<ThemeConfig>({ ...DEFAULT_THEME_CONFIG });
    let mainElement = $state<HTMLDivElement | undefined>();

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

    // Apply theme CSS variables when themeSettings changes
    $effect(() => {
        if (mainElement) {
            Object.entries(themeSettings).forEach(([key, value]) => {
                mainElement!.style.setProperty(key, value);
            });
        }
    });

    async function setupThemeListener() {
        const unlisten = await listen("theme-changed", () => {
            loadTheme();
        });
        return unlisten;
    }

    return {
        get themeSettings() {
            return themeSettings;
        },
        get mainElement() {
            return mainElement;
        },
        set mainElement(value: HTMLDivElement | undefined) {
            mainElement = value;
        },
        loadTheme,
        setupThemeListener,
    };
}
