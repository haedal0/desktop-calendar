import Database from "@tauri-apps/plugin-sql";

const DB_NAME = "calendar.db";

export interface CalendarEvent {
  id?: number;
  title: string;
  date: string;
}

export interface ThemeConfig {
  "--other-month-day-title-color": string;
  "--day-border-color": string;
  "--other-month-day-background-color": string;
  "--month-color": string;
  "--year-color": string;
  "--day-title-color": string;
  "--week-title-color": string;
  "--month-change-color": string;
  "--event-background-color": string;
  "--event-text-color": string;
  "--blur-background-color": string;
  "--blur": string;
}

export interface WindowState {
  x: number;
  y: number;
  width: number;
  height: number;
  monitor_name: string | null;
}

export interface CustomTheme {
  id?: number;
  name: string;
  config: ThemeConfig;
}

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (db) {
    return db;
  }
  db = await Database.load(`sqlite:${DB_NAME}`);
  await initTables();
  return db;
}

async function initTables() {
  if (!db) return;

  await db.execute(`
    CREATE TABLE IF NOT EXISTS calendar_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS themes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      config TEXT NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS window_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      x INTEGER NOT NULL,
      y INTEGER NOT NULL,
      width INTEGER NOT NULL,
      height INTEGER NOT NULL,
      monitor_name TEXT
    );
  `);
}

// Event Operations
export async function getEvents(
  startStr?: string,
  endStr?: string,
): Promise<CalendarEvent[]> {
  const db = await getDb();
  let query = "SELECT * FROM calendar_events";
  const params: any[] = [];

  if (startStr && endStr) {
    query += " WHERE date >= $1 AND date <= $2";
    params.push(startStr, endStr);
  }

  query += " ORDER BY date ASC";

  const rows = await db.select<any[]>(query, params);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    date: row.date,
  }));
}

export async function addEvent(
  event: Omit<CalendarEvent, "id">,
): Promise<number> {
  const db = await getDb();
  const result = await db.execute(
    "INSERT INTO calendar_events (title, date) VALUES ($1, $2)",
    [event.title, event.date],
  );
  return result.lastInsertId as number;
}

export async function updateEvent(event: CalendarEvent): Promise<void> {
  if (!event.id) throw new Error("Event ID is required for update");
  const db = await getDb();
  await db.execute(
    "UPDATE calendar_events SET title = $1, date = $2 WHERE id = $3",
    [event.title, event.date, event.id],
  );
}

export async function deleteEvent(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM calendar_events WHERE id = $1", [id]);
}

// Theme Operations
export async function getThemes(): Promise<CustomTheme[]> {
  const db = await getDb();
  const rows = await db.select<{ id: number; name: string; config: string }[]>(
    "SELECT * FROM themes",
  );
  return rows.map((row) => ({
    ...row,
    config: JSON.parse(row.config),
  }));
}

export async function addTheme(
  theme: Omit<CustomTheme, "id">,
): Promise<number> {
  const db = await getDb();
  const result = await db.execute(
    "INSERT INTO themes (name, config) VALUES ($1, $2)",
    [theme.name, JSON.stringify(theme.config)],
  );
  return result.lastInsertId as number;
}

export async function updateTheme(theme: CustomTheme): Promise<void> {
  if (!theme.id) throw new Error("Theme ID is required for update");
  const db = await getDb();
  await db.execute("UPDATE themes SET name = $1, config = $2 WHERE id = $3", [
    theme.name,
    JSON.stringify(theme.config),
    theme.id,
  ]);
}

export async function deleteTheme(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM themes WHERE id = $1", [id]);
}

// Window State Operations
export async function getWindowState(): Promise<WindowState | null> {
  const db = await getDb();
  const rows = await db.select<WindowState[]>(
    "SELECT x, y, width, height, monitor_name FROM window_state WHERE id = 1",
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function saveWindowState(state: WindowState): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT OR REPLACE INTO window_state (id, x, y, width, height, monitor_name) VALUES (1, $1, $2, $3, $4, $5)",
    [state.x, state.y, state.width, state.height, state.monitor_name],
  );
}
