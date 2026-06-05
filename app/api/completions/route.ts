import { NextResponse } from "next/server";
import { upsertCompletion, deleteCompletion, getCompletionsForDate } from "@/lib/db";
import type { CompletionStatus } from "@/lib/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const completions = getCompletionsForDate(date);
  return NextResponse.json(completions);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { habit_id, date, status, notes } = body as {
      habit_id: number;
      date: string;
      status: CompletionStatus;
      notes?: string;
    };

    if (!habit_id || !date || !status) {
      return NextResponse.json({ error: "habit_id, date, and status are required" }, { status: 400 });
    }

    const completion = upsertCompletion(habit_id, date, status, notes);
    return NextResponse.json(completion, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save completion" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { habit_id, date } = body as { habit_id: number; date: string };

    if (!habit_id || !date) {
      return NextResponse.json({ error: "habit_id and date are required" }, { status: 400 });
    }

    deleteCompletion(habit_id, date);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete completion" }, { status: 500 });
  }
}
