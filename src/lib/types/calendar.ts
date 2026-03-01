export type CellType = "current" | "prev" | "next";

export interface CalendarCell {
    day: number;
    type: CellType;
}

export interface PopupPosition {
    x: number;
    y: number;
}

export type PopupMode = "create" | "edit";
