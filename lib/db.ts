import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import type { Habit, Completion, HabitWithStats, CompletionStatus } from "./types";

const DB_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DB_DIR, "accountable.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  migrate(_db);
  return _db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('start','stop')),
      description TEXT,
      frequency TEXT NOT NULL DEFAULT 'daily' CHECK(frequency IN ('daily','weekly')),
      target_days TEXT,
      color TEXT NOT NULL DEFAULT '#6366f1',
      emoji TEXT NOT NULL DEFAULT '✅',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      archived INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('done','failed','skipped')),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(habit_id, date)
    );

    CREATE INDEX IF NOT EXISTS idx_completions_habit_date ON completions(habit_id, date);
  `);
}

export function getAllHabits(): HabitWithStats[] {
  const db = getDb();
  const habits = db.prepare("SELECT * FROM habits WHERE archived = 0 ORDER BY created_at ASC").all() as Habit[];
  const today = todayStr();
  return habits.map((h) => addStats(db, h, today));
}

export function getHabit(id: number): HabitWithStats | null {
  const db = getDb();
  const habit = db.prepare("SELECT * FROM habits WHERE id = ?").get(id) as Habit | undefined;
  if (!habit) return null;
  return addStats(db, habit, todayStr());
}

export function createHabit(data: Omit<Habit, "id" | "created_at" | "archived">): HabitWithStats {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO habits (name, type, description, frequency, target_days, color, emoji)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.name,
    data.type,
    data.description ?? null,
    data.frequency,
    data.target_days ? JSON.stringify(data.target_days) : null,
    data.color,
    data.emoji
  );
  return getHabit(result.lastInsertRowid as number)!;
}

export function updateHabit(id: number, data: Partial<Omit<Habit, "id" | "created_at">>): HabitWithStats | null {
  const db = getDb();
  const current = db.prepare("SELECT * FROM habits WHERE id = ?").get(id) as Habit | undefined;
  if (!current) return null;

  const merged = { ...current, ...data };
  db.prepare(`
    UPDATE habits SET name=?, type=?, description=?, frequency=?, target_days=?, color=?, emoji=?, archived=?
    WHERE id=?
  `).run(
    merged.name, merged.type, merged.description ?? null, merged.frequency,
    merged.target_days ? JSON.stringify(merged.target_days) : null,
    merged.color, merged.emoji, merged.archived ? 1 : 0, id
  );
  return getHabit(id);
}

export function deleteHabit(id: number): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM habits WHERE id = ?").run(id);
  return result.changes > 0;
}

export function upsertCompletion(habitId: number, date: string, status: CompletionStatus, notes?: string): Completion {
  const db = getDb();
  db.prepare(`
    INSERT INTO completions (habit_id, date, status, notes)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(habit_id, date) DO UPDATE SET status=excluded.status, notes=excluded.notes
  `).run(habitId, date, status, notes ?? null);
  return db.prepare("SELECT * FROM completions WHERE habit_id=? AND date=?").get(habitId, date) as Completion;
}

export function deleteCompletion(habitId: number, date: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM completions WHERE habit_id=? AND date=?").run(habitId, date);
  return result.changes > 0;
}

export function getCompletionsForDate(date: string): Completion[] {
  const db = getDb();
  return db.prepare("SELECT * FROM completions WHERE date=?").all(date) as Completion[];
}

export function getCompletionsForHabit(habitId: number, limit = 90): Completion[] {
  const db = getDb();
  return db.prepare(
    "SELECT * FROM completions WHERE habit_id=? ORDER BY date DESC LIMIT ?"
  ).all(habitId, limit) as Completion[];
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function addStats(db: Database.Database, raw: Habit, today: string): HabitWithStats {
  const habit: Habit = {
    ...raw,
    target_days: raw.target_days ? JSON.parse(raw.target_days as unknown as string) : null,
    archived: Boolean((raw as unknown as { archived: number }).archived),
  };

  const completions = db.prepare(
    "SELECT date, status FROM completions WHERE habit_id=? ORDER BY date DESC"
  ).all(habit.id) as { date: string; status: CompletionStatus }[];

  const completionMap = new Map(completions.map((c) => [c.date, c.status]));

  // Calculate streaks based on consecutive completed days
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  // Build sorted list of dates we should have checked in
  const allDates = getRelevantDates(habit, today, 365);
  for (const date of allDates) {
    const status = completionMap.get(date);
    if (status === "done") {
      tempStreak++;
      if (tempStreak > bestStreak) bestStreak = tempStreak;
    } else if (status === "failed") {
      tempStreak = 0;
    } else {
      // not logged — if in the past, break streak; if today, don't penalize yet
      if (date < today) tempStreak = 0;
    }
  }
  // current streak = streak ending today or yesterday
  const recentDates = getRelevantDates(habit, today, 60).reverse();
  currentStreak = 0;
  for (const date of recentDates) {
    const status = completionMap.get(date);
    if (status === "done") {
      currentStreak++;
    } else if (status === "failed") {
      break;
    } else if (date < today) {
      break;
    }
    // today not yet logged — keep going
  }

  // Completion rate: last 30 scheduled days
  const last30 = getRelevantDates(habit, today, 30).filter((d) => d <= today);
  const doneCount = last30.filter((d) => completionMap.get(d) === "done").length;
  const completionRate = last30.length > 0 ? Math.round((doneCount / last30.length) * 100) : 0;

  const todayStatus = completionMap.get(today) ?? null;

  return { ...habit, currentStreak, bestStreak, completionRate, todayStatus };
}

function getRelevantDates(habit: Habit, endDate: string, days: number): string[] {
  const dates: string[] = [];
  const end = new Date(endDate + "T12:00:00Z");
  for (let i = 0; i < days; i++) {
    const d = new Date(end);
    d.setUTCDate(d.getUTCDate() - i);
    const dayOfWeek = d.getUTCDay();
    if (habit.target_days === null || habit.target_days.includes(dayOfWeek)) {
      dates.push(d.toISOString().slice(0, 10));
    }
  }
  return dates;
}
