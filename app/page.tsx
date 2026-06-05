"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Target, Flame, TrendingUp } from "lucide-react";
import { HabitCard } from "@/components/HabitCard";
import { HabitForm } from "@/components/HabitForm";
import { ProgressRing } from "@/components/ProgressRing";
import type { HabitWithStats, CompletionStatus } from "@/lib/types";

function todayStr() {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
}

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function Dashboard() {
  const [habits, setHabits] = useState<HabitWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitWithStats | null>(null);
  const today = todayStr();

  const loadHabits = useCallback(async () => {
    const res = await fetch("/api/habits");
    if (res.ok) setHabits(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  async function handleLog(habitId: number, status: CompletionStatus | null) {
    if (status === null) {
      await fetch("/api/completions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habit_id: habitId, date: today }),
      });
    } else {
      await fetch("/api/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habit_id: habitId, date: today, status }),
      });
    }
    await loadHabits();
  }

  async function handleCreate(data: Parameters<typeof handleSave>[0]) {
    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setShowForm(false);
    await loadHabits();
  }

  async function handleSave(data: {
    name: string;
    type: "start" | "stop";
    description: string;
    frequency: "daily" | "weekly";
    target_days: number[] | null;
    color: string;
    emoji: string;
  }) {
    if (editingHabit) {
      await fetch(`/api/habits/${editingHabit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setEditingHabit(null);
    } else {
      await handleCreate(data);
      return;
    }
    await loadHabits();
  }

  async function handleDelete(habitId: number) {
    if (!confirm("Delete this habit? This cannot be undone.")) return;
    await fetch(`/api/habits/${habitId}`, { method: "DELETE" });
    await loadHabits();
  }

  const logged = habits.filter((h) => h.todayStatus !== null).length;
  const done = habits.filter((h) => h.todayStatus === "done").length;
  const totalProgress = habits.length > 0 ? Math.round((logged / habits.length) * 100) : 0;
  const successRate = habits.length > 0 ? Math.round((done / habits.length) * 100) : 0;
  const avgStreak = habits.length > 0
    ? Math.round(habits.reduce((s, h) => s + h.currentStreak, 0) / habits.length)
    : 0;
  const avgCompletion = habits.length > 0
    ? Math.round(habits.reduce((s, h) => s + h.completionRate, 0) / habits.length)
    : 0;

  const startHabits = habits.filter((h) => h.type === "start");
  const stopHabits = habits.filter((h) => h.type === "stop");

  return (
    <>
      {/* Header */}
      <header className="pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Accountable</h1>
            <p className="text-sm text-slate-500 mt-0.5">{formatDate(today)}</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm"
          >
            <Plus size={18} />
            New habit
          </button>
        </div>
      </header>

      {/* Stats bar */}
      {habits.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col items-center gap-1">
            <ProgressRing value={totalProgress} size={64} strokeWidth={7} color="#6366f1" />
            <span className="text-xs text-slate-500 text-center leading-tight">Today&apos;s check-ins</span>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-1.5 text-orange-500">
              <Flame size={22} />
              <span className="text-2xl font-bold text-slate-800">{avgStreak}</span>
            </div>
            <span className="text-xs text-slate-500">Avg streak</span>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-1.5 text-indigo-500">
              <TrendingUp size={22} />
              <span className="text-2xl font-bold text-slate-800">{avgCompletion}%</span>
            </div>
            <span className="text-xs text-slate-500">30-day avg</span>
          </div>
        </div>
      )}

      {/* Habit lists */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading…</div>
      ) : habits.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-xl font-semibold text-slate-700">No habits yet</h2>
          <p className="text-slate-500 mt-2 mb-6">Start tracking habits you want to build or break.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} />
            Add your first habit
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Today's progress */}
          {logged < habits.length && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3">
              <Target size={18} className="text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800">
                <span className="font-semibold">{habits.length - logged} habit{habits.length - logged !== 1 ? "s" : ""}</span> left to log today
              </p>
            </div>
          )}
          {logged === habits.length && habits.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-3">
              <span className="text-green-600 text-lg">🎉</span>
              <p className="text-sm text-green-800">
                All habits logged! {done === habits.length ? "Perfect day!" : `${done}/${habits.length} successful.`}
              </p>
            </div>
          )}

          {startHabits.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="text-green-500">✅</span> Habits to build
              </h2>
              <div className="space-y-3">
                {startHabits.map((h) => (
                  <HabitCard
                    key={h.id}
                    habit={h}
                    today={today}
                    onLog={handleLog}
                    onEdit={(habit) => setEditingHabit(habit)}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </section>
          )}

          {stopHabits.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="text-red-500">🚫</span> Habits to break
              </h2>
              <div className="space-y-3">
                {stopHabits.map((h) => (
                  <HabitCard
                    key={h.id}
                    habit={h}
                    today={today}
                    onLog={handleLog}
                    onEdit={(habit) => setEditingHabit(habit)}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Success rate summary */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Today&apos;s summary</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{done}</div>
                <div className="text-xs text-slate-500 mt-0.5">Done</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500">
                  {habits.filter((h) => h.todayStatus === "failed").length}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Failed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-400">
                  {habits.filter((h) => h.todayStatus === null).length}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Pending</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forms */}
      {showForm && (
        <HabitForm
          onSave={handleCreate}
          onClose={() => setShowForm(false)}
        />
      )}
      {editingHabit && (
        <HabitForm
          initial={editingHabit}
          onSave={handleSave}
          onClose={() => setEditingHabit(null)}
        />
      )}
    </>
  );
}
