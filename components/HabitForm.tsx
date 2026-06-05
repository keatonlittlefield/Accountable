"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { HabitWithStats, HabitType, Frequency } from "@/lib/types";
import clsx from "clsx";

const EMOJI_OPTIONS = ["✅", "🏃", "💪", "📚", "🥗", "💧", "🧘", "😴", "🚭", "🍺", "📱", "🎯", "🧠", "❤️", "🚀"];
const COLOR_OPTIONS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Props {
  initial?: HabitWithStats;
  onSave: (data: FormData) => Promise<void>;
  onClose: () => void;
}

interface FormData {
  name: string;
  type: HabitType;
  description: string;
  frequency: Frequency;
  target_days: number[] | null;
  color: string;
  emoji: string;
}

export function HabitForm({ initial, onSave, onClose }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<HabitType>(initial?.type ?? "start");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [frequency, setFrequency] = useState<Frequency>(initial?.frequency ?? "daily");
  const [targetDays, setTargetDays] = useState<number[]>(initial?.target_days ?? [0, 1, 2, 3, 4, 5, 6]);
  const [color, setColor] = useState(initial?.color ?? "#6366f1");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "✅");
  const [saving, setSaving] = useState(false);

  function toggleDay(day: number) {
    setTargetDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onSave({
      name: name.trim(),
      type,
      description: description.trim(),
      frequency,
      target_days: frequency === "weekly" ? targetDays : null,
      color,
      emoji,
    });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">
            {initial ? "Edit Habit" : "New Habit"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Type toggle */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Habit type</label>
            <div className="grid grid-cols-2 gap-2">
              {(["start", "stop"] as HabitType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={clsx(
                    "py-3 rounded-xl text-sm font-semibold transition-all",
                    type === t
                      ? t === "start"
                        ? "bg-green-500 text-white shadow-sm"
                        : "bg-red-500 text-white shadow-sm"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  )}
                >
                  {t === "start" ? "✅ Start doing" : "🚫 Stop doing"}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              {type === "start"
                ? "A habit you want to build — track when you complete it."
                : "A habit you want to quit — track when you resist it."}
            </p>
          </div>

          {/* Name */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === "start" ? "e.g. Morning run" : "e.g. Smoking"}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">
              Description <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why does this matter to you?"
              rows={2}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent resize-none"
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Frequency</label>
            <div className="grid grid-cols-2 gap-2">
              {(["daily", "weekly"] as Frequency[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(f)}
                  className={clsx(
                    "py-2.5 rounded-xl text-sm font-medium transition-all",
                    frequency === f
                      ? "bg-indigo-500 text-white shadow-sm"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  )}
                >
                  {f === "daily" ? "Every day" : "Specific days"}
                </button>
              ))}
            </div>

            {frequency === "weekly" && (
              <div className="flex gap-1.5 mt-3">
                {DAYS.map((day, i) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={clsx(
                      "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
                      targetDays.includes(i)
                        ? "bg-indigo-500 text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Emoji */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Emoji</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={clsx(
                    "w-10 h-10 text-xl rounded-xl transition-all",
                    emoji === e ? "bg-indigo-100 ring-2 ring-indigo-400" : "bg-slate-100 hover:bg-slate-200"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={clsx(
                    "w-8 h-8 rounded-full transition-all",
                    color === c ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : "hover:scale-105"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : initial ? "Save changes" : "Create habit"}
          </button>
        </form>
      </div>
    </div>
  );
}
