import { NextResponse } from "next/server";
import { getCurrentUser } from "./auth";

export async function ensureAuth() {
  const u = await getCurrentUser();
  if (!u) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { user: u };
}

export const json = (data: unknown, init?: ResponseInit) => NextResponse.json(data, init);
export const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });
