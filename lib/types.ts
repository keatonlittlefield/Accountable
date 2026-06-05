export type HabitType = "start" | "stop";
export type CompletionStatus = "done" | "failed" | "skipped";
export type Frequency = "daily" | "weekly";

export interface Habit {
  id: number;
  name: string;
  type: HabitType;
  description: string | null;
  frequency: Frequency;
  target_days: number[] | null; // 0=Sun..6=Sat, null means every day
  color: string;
  emoji: string;
  created_at: string;
  archived: boolean;
}

export interface Completion {
  id: number;
  habit_id: number;
  date: string; // YYYY-MM-DD
  status: CompletionStatus;
  notes: string | null;
  created_at: string;
}

export interface HabitWithStats extends Habit {
  currentStreak: number;
  bestStreak: number;
  completionRate: number; // 0-100, last 30 days
  todayStatus: CompletionStatus | null;
}
