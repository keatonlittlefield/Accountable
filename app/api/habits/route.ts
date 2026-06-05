import { NextResponse } from "next/server";
import { getAllHabits, createHabit } from "@/lib/db";

export async function GET() {
  try {
    const habits = getAllHabits();
    return NextResponse.json(habits);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch habits" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, type, description, frequency, target_days, color, emoji } = body;

    if (!name || !type) {
      return NextResponse.json({ error: "name and type are required" }, { status: 400 });
    }

    const habit = createHabit({
      name,
      type,
      description: description ?? null,
      frequency: frequency ?? "daily",
      target_days: target_days ?? null,
      color: color ?? (type === "start" ? "#22c55e" : "#ef4444"),
      emoji: emoji ?? (type === "start" ? "✅" : "🚫"),
    });

    return NextResponse.json(habit, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create habit" }, { status: 500 });
  }
}
