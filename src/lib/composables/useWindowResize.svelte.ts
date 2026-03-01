import { invoke } from "@tauri-apps/api/core";
import { onMount } from "svelte";

export function useWindowResize() {
    let maxVisibleEvents = $state(3);

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

    return {
        get maxVisibleEvents() {
            return maxVisibleEvents;
        },
    };
}
