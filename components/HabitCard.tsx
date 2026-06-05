"use client";

import { useState } from "react";
import { Flame, CheckCircle, XCircle, MinusCircle, RotateCcw, Trash2, Pencil } from "lucide-react";
import type { HabitWithStats, CompletionStatus } from "@/lib/types";
import clsx from "clsx";

interface Props {
  habit: HabitWithStats;
  today: string;
  onLog: (habitId: number, status: CompletionStatus | null) => Promise<void>;
  onEdit: (habit: HabitWithStats) => void;
  onDelete: (habitId: number) => void;
}

export function HabitCard({ habit, today, onLog, onEdit, onDelete }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleLog(status: CompletionStatus | null) {
    setLoading(true);
    await onLog(habit.id, status);
    setLoading(false);
  }

  const isStart = habit.type === "start";
  const statusColors: Record<CompletionStatus, string> = {
    done: "bg-green-50 border-green-200",
    failed: "bg-red-50 border-red-200",
    skipped: "bg-slate-50 border-slate-200",
  };
  const cardClass = habit.todayStatus
    ? statusColors[habit.todayStatus]
    : "bg-white border-slate-200";

  return (
    <div
      className={clsx(
        "border rounded-2xl p-4 transition-all duration-200 animate-fade-in",
        cardClass
      )}
    >
      <div className="flex items-start gap-3">
        {/* Emoji + streak */}
        <div className="flex flex-col items-center gap-1 min-w-[44px]">
          <span className="text-3xl">{habit.emoji}</span>
          {habit.currentStreak > 0 && (
            <div className="flex items-center gap-0.5 text-orange-500">
              <Flame size={12} />
              <span className="text-xs font-semibold">{habit.currentStreak}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                isStart
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              )}
            >
              {isStart ? "START" : "STOP"}
            </span>
            <h3 className="font-semibold text-slate-800 truncate">{habit.name}</h3>
          </div>
          {habit.description && (
            <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{habit.description}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs text-slate-400">
              {habit.completionRate}% this month
            </span>
            {habit.bestStreak > 0 && (
              <span className="text-xs text-slate-400">
                Best: {habit.bestStreak} days
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(habit)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(habit.id)}
            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Log buttons */}
      <div className="flex gap-2 mt-3">
        {habit.todayStatus ? (
          <>
            <div
              className={clsx(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium",
                habit.todayStatus === "done" && "bg-green-100 text-green-700",
                habit.todayStatus === "failed" && "bg-red-100 text-red-700",
                habit.todayStatus === "skipped" && "bg-slate-100 text-slate-600"
              )}
            >
              {habit.todayStatus === "done" && <><CheckCircle size={16} /> Done</>}
              {habit.todayStatus === "failed" && <><XCircle size={16} /> Failed</>}
              {habit.todayStatus === "skipped" && <><MinusCircle size={16} /> Skipped</>}
            </div>
            <button
              onClick={() => handleLog(null)}
              disabled={loading}
              className="px-3 py-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Undo"
            >
              <RotateCcw size={16} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleLog("done")}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              <CheckCircle size={16} />
              {isStart ? "Done it" : "Resisted"}
            </button>
            <button
              onClick={() => handleLog("failed")}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              <XCircle size={16} />
              {isStart ? "Missed" : "Gave in"}
            </button>
            <button
              onClick={() => handleLog("skipped")}
              disabled={loading}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-sm transition-colors disabled:opacity-50"
              title="Skip"
            >
              <MinusCircle size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
