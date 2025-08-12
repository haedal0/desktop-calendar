import { readTextFile, BaseDirectory, create } from '@tauri-apps/plugin-fs';
import { getCurrentWindow } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core';

interface CalendarEvent {
    [x: string]: any;
    title: string;
    start: string;
    end?: string;
}

const fileName = 'calendar.json';

async function loadEvents(): Promise<CalendarEvent[]> {
    try {
        const content = await readTextFile(fileName, { baseDir: BaseDirectory.AppData });
        return JSON.parse(content) as CalendarEvent[];
    } catch {
        return [];
    }
}

async function saveEvents(events: CalendarEvent[]): Promise<void> {
    const encoder = new TextEncoder();
    const file = await create(fileName, { baseDir: BaseDirectory.AppData });
    await file.write(encoder.encode(JSON.stringify(events)));
}

document.addEventListener('DOMContentLoaded', async () => {
    const modal = document.getElementById('eventModal')!;
    const backdrop = document.getElementById('modalBackdrop')!;
    const eventTitleInput = document.getElementById('eventTitleInput')!;
    const saveBtn = document.getElementById('saveBtn')!;
    const deleteBtn = document.getElementById('deleteBtn')!;
    const cancelBtn = document.getElementById('cancelBtn')!;

    let currentEvent: CalendarEvent | null = null;

    const calendarEl = document.getElementById('calendar') as HTMLElement;
    const initialEvents = await loadEvents();

    const calendar = new (window as any).FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        editable: true,
        selectable: true,
        locale: 'ko',
        dayMaxEventRows: true,
        buttonText: {
            today: '오늘'
        },
        headerToolbar: {
            left: '',
            center: 'title',
            right: 'prev,next'
        },
        dayCellContent: function (info: { dayNumberText: string; }) {
            var day = info.dayNumberText.replace(/\D/g, "");
            
            if (day.startsWith('0')) {
                day = day.substring(1);
            }
            
            return {
                html: day
            };
        },
        events: initialEvents,
        
        dateClick: function (info: any) {
            
            const title = prompt('이름:');
            if (title) {
                const newEvent: CalendarEvent = { title, start: info.dateStr };
                calendar.addEvent(newEvent);
                saveEvents(calendar.getEvents().map((e: any) => ({
                    title: e.title,
                    start: e.startStr,
                    end: e.endStr
                })));
            }
        },
        eventDrop: function () {
            saveEvents(calendar.getEvents().map((e: any) => ({
                title: e.title,
                start: e.startStr,
                end: e.endStr
            })));
        },
        eventResize: function () {
            saveEvents(calendar.getEvents().map((e: any) => ({
                title: e.title,
                start: e.startStr,
                end: e.endStr
            })));
        },
        eventClick: function (info: any) {
            currentEvent = info.event;
            (eventTitleInput as HTMLInputElement).value = currentEvent ? currentEvent.title : '';
            showModal();
        }
    });

    calendar.render();

    document.getElementsByClassName('fc-header-toolbar')[0].addEventListener('mousedown', (e) => {
        if (e.target && (e.target as Element).closest('button')) {
            return
        }
        getCurrentWindow().startDragging();
    })

    document.getElementById('calendar')?.addEventListener('pointerleave', () => {
        invoke('set_window_below_icons')
    })

    function showModal() {
        modal.style.display = 'block';
        backdrop.style.display = 'block';
        eventTitleInput.focus();
    }

    function closeModal() {
        modal.style.display = 'none';
        backdrop.style.display = 'none';
        currentEvent = null;
    }

    saveBtn.addEventListener('click', function() {
        if (!currentEvent) return;
        const newTitle = (eventTitleInput as HTMLInputElement).value.trim();
        if (newTitle.length === 0) {
            alert('제목을 입력하세요');
            return;
        }
        currentEvent.setProp('title', newTitle);
        saveEvents(calendar.getEvents().map((e: any) => ({
            title: e.title,
            start: e.startStr,
            end: e.endStr
        })));
        closeModal();
    });

    deleteBtn.addEventListener('click', function() {
        if (!currentEvent) return;
            if (confirm('이 이벤트를 삭제하시겠습니까?')) {
            currentEvent.remove();
            saveEvents(calendar.getEvents().map((e: any) => ({
                title: e.title,
                start: e.startStr,
                end: e.endStr
            })));
            closeModal();
        }
    });

    cancelBtn.addEventListener('click', function() {
        closeModal();
    });

    backdrop.addEventListener('click', function() {
        closeModal();
    });
});
