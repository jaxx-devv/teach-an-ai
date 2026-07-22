import { NextResponse } from "next/server";
import { getSession } from "./session";

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    return { session: null, unauthorized: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  }
  return { session, unauthorized: null };
}
