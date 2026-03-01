import { Image } from "@tauri-apps/api/image";
import { Menu } from "@tauri-apps/api/menu";
import type { CalendarEvent } from "$lib/db";
import type { CellType } from "$lib/types/calendar";

export function useContextMenu() {
    let plusIcon: Image | undefined;
    let penIcon: Image | undefined;
    let trashIcon: Image | undefined;

    async function loadIcon(path: string): Promise<Image> {
        const response = await fetch(path);
        const buffer = await response.arrayBuffer();
        return await Image.fromBytes(new Uint8Array(buffer));
    }

    async function showContextMenu(
        e: MouseEvent,
        day: number,
        type: CellType,
        event: CalendarEvent | undefined,
        onCreateEvent: (day: number) => void,
        onEditEvent: (day: number, event: CalendarEvent) => void,
        onDeleteEvent: (day: number, event: CalendarEvent) => void
    ) {
        e.preventDefault();
        e.stopPropagation();

        if (type !== "current") return;

        if (!plusIcon) {
            plusIcon = await loadIcon("/icons/plus.png");
        }

        const items: any[] = [
            {
                id: "title",
                text: `${day}일`,
                enabled: false,
            },
            {
                id: "create",
                icon: plusIcon,
                text: "일정 생성",
                action: () => onCreateEvent(day),
            },
        ];

        if (event) {
            if (!penIcon) {
                penIcon = await loadIcon("/icons/pen.png");
            }
            if (!trashIcon) {
                trashIcon = await loadIcon("/icons/trash.png");
            }

            items.push({
                item: "Separator" as const,
            });
            items.push({
                id: "event-title",
                text: event.title,
                enabled: false,
            });
            items.push({
                id: "edit",
                icon: penIcon,
                text: "수정",
                action: () => onEditEvent(day, event),
            });
            items.push({
                id: "delete",
                icon: trashIcon,
                text: "삭제",
                action: () => onDeleteEvent(day, event),
            });
        }

        const menu = await Menu.new({ items });
        menu.popup();
    }

    return {
        showContextMenu,
    };
}
