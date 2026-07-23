import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { GUEST_DB_NAME, GUEST_DB_VERSION } from "./constants";

export interface GuestProfile {
  id: string;
  displayName: string;
  createdAt: number;
  xp: number;
  lessonsCompleted: string[];
  customTopics: Record<string, string>;
  currentLessonId: string | null;
}

export interface ChatMessage {
  id: string;
  guestId: string;
  lessonId: string;
  role: "mascot" | "user";
  content: string;
  createdAt: number;
}

interface GuestDBSchema extends DBSchema {
  profile: {
    key: string;
    value: GuestProfile;
  };
  chatHistory: {
    key: string;
    value: ChatMessage;
    indexes: { "by-lesson": string };
  };
}

let dbPromise: Promise<IDBPDatabase<GuestDBSchema>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<GuestDBSchema>(GUEST_DB_NAME, GUEST_DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("profile")) {
          db.createObjectStore("profile", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("chatHistory")) {
          const store = db.createObjectStore("chatHistory", {
            keyPath: "id",
          });
          store.createIndex("by-lesson", "lessonId");
        }
      },
    });
  }
  return dbPromise;
}

function generateGuestId() {
  return `guest_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export async function createGuestProfile(displayName: string): Promise<GuestProfile> {
  const db = await getDB();
  const profile: GuestProfile = {
    id: generateGuestId(),
    displayName,
    createdAt: Date.now(),
    xp: 0,
    lessonsCompleted: [],
    customTopics: {},
    currentLessonId: null,
  };
  await db.put("profile", profile);
  localStorage.setItem("teach-an-ai-active-guest", profile.id);
  return profile;
}

export async function getActiveGuestProfile(): Promise<GuestProfile | null> {
  const activeId = localStorage.getItem("teach-an-ai-active-guest");
  if (!activeId) return null;
  const db = await getDB();
  return (await db.get("profile", activeId)) ?? null;
}

export async function setCurrentLesson(guestId: string, lessonId: string | null) {
  const db = await getDB();
  const profile = await db.get("profile", guestId);
  if (!profile) return;
  profile.currentLessonId = lessonId;
  await db.put("profile", profile);
  return profile;
}

export async function saveCustomTopicTitle(guestId: string, lessonId: string, title: string) {
  const db = await getDB();
  const profile = await db.get("profile", guestId);
  if (!profile) return;
  if (!profile.customTopics) profile.customTopics = {};
  profile.customTopics[lessonId] = title;
  await db.put("profile", profile);
  return profile;
}

export async function updateGuestDisplayName(id: string, displayName: string) {
  const db = await getDB();
  const profile = await db.get("profile", id);
  if (!profile) return;
  profile.displayName = displayName;
  await db.put("profile", profile);
}

export async function clearActiveGuestSession() {
  localStorage.removeItem("teach-an-ai-active-guest");
}

export async function logChatMessage(msg: Omit<ChatMessage, "id">) {
  const db = await getDB();
  const entry: ChatMessage = { ...msg, id: crypto.randomUUID() };
  await db.put("chatHistory", entry);
  return entry;
}

export interface ConversationSummary {
  lessonId: string;
  lastMessage: string;
  confidence: "High Confidence" | "Medium Confidence" | "Low Confidence";
  updatedAt: number;
}

export async function getRecentConversations(
  guestId: string,
  limit = 5
): Promise<ConversationSummary[]> {
  const db = await getDB();
  const all = await db.getAll("chatHistory");
  const mine = all.filter((m) => m.guestId === guestId);

  const byLesson = new Map<string, ChatMessage[]>();
  for (const m of mine) {
    const list = byLesson.get(m.lessonId) ?? [];
    list.push(m);
    byLesson.set(m.lessonId, list);
  }

  const summaries: ConversationSummary[] = [];
  for (const [lessonId, msgs] of byLesson) {
    msgs.sort((a, b) => b.createdAt - a.createdAt);
    const last = msgs[0];
    const mascotMsgs = msgs.filter((m) => m.role === "mascot").length;
    const confidence =
      mascotMsgs >= 6 ? "High Confidence" : mascotMsgs >= 3 ? "Medium Confidence" : "Low Confidence";
    summaries.push({
      lessonId,
      lastMessage: last.content,
      confidence,
      updatedAt: last.createdAt,
    });
  }

  return summaries.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit);
}

export async function deleteConversation(guestId: string, lessonId: string) {
  const db = await getDB();

  const profile = await db.get("profile", guestId);
  if (profile) {
    if (profile.customTopics?.[lessonId]) {
      delete profile.customTopics[lessonId];
    }
    if (profile.currentLessonId === lessonId) {
      profile.currentLessonId = null;
    }
    await db.put("profile", profile);
  }

  const all = await db.getAll("chatHistory");
  const tx = db.transaction("chatHistory", "readwrite");
  await Promise.all(
    all
      .filter((m) => m.guestId === guestId && m.lessonId === lessonId)
      .map((m) => tx.store.delete(m.id))
  );
  await tx.done;
}

export async function getConfidenceForLesson(guestId: string, lessonId: string) {
  const db = await getDB();
  const all = await db.getAll("chatHistory");
  const mascotMsgs = all.filter(
    (m) => m.guestId === guestId && m.lessonId === lessonId && m.role === "mascot"
  ).length;
  return Math.min(100, mascotMsgs * 20);
}

export async function getAllConfidences(guestId: string): Promise<Record<string, number>> {
  const db = await getDB();
  const all = await db.getAll("chatHistory");
  const mine = all.filter((m) => m.guestId === guestId && m.role === "mascot");
  const counts = new Map<string, number>();
  for (const m of mine) counts.set(m.lessonId, (counts.get(m.lessonId) ?? 0) + 1);
  const result: Record<string, number> = {};
  for (const [lessonId, count] of counts) result[lessonId] = Math.min(100, count * 20);
  return result;
}

export async function awardXP(guestId: string, amount: number) {
  const db = await getDB();
  const profile = await db.get("profile", guestId);
  if (!profile) return;
  profile.xp += amount;
  await db.put("profile", profile);
  return profile;
}

export async function completeLesson(guestId: string, lessonId: string, xpAward: number) {
  const db = await getDB();
  const profile = await db.get("profile", guestId);
  if (!profile) return;
  if (!profile.lessonsCompleted.includes(lessonId)) {
    profile.lessonsCompleted.push(lessonId);
  }
  profile.xp += xpAward;
  if (profile.currentLessonId === lessonId) profile.currentLessonId = null;
  await db.put("profile", profile);
  return profile;
}

export async function getTeachingStreak(guestId: string): Promise<number> {
  const db = await getDB();
  const all = await db.getAll("chatHistory");
  const mine = all.filter((m) => m.guestId === guestId && m.role === "user");
  if (mine.length === 0) return 0;

  const days = new Set(
    mine.map((m) => new Date(m.createdAt).toISOString().slice(0, 10))
  );

  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (days.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export async function resetGuestMemory(guestId: string) {
  const db = await getDB();
  const profile = await db.get("profile", guestId);
  if (!profile) return;
  profile.xp = 0;
  profile.lessonsCompleted = [];
  await db.put("profile", profile);

  const all = await db.getAll("chatHistory");
  const tx = db.transaction("chatHistory", "readwrite");
  await Promise.all(
    all
      .filter((m) => m.guestId === guestId)
      .map((m) => tx.store.delete(m.id))
  );
  await tx.done;
}

export async function getTotalUserMessages(guestId: string) {
  const db = await getDB();
  const all = await db.getAll("chatHistory");
  return all.filter((m) => m.guestId === guestId && m.role === "user").length;
}

export async function exportGuestData(guestId: string) {
  const db = await getDB();
  const profile = await db.get("profile", guestId);
  const all = await db.getAll("chatHistory");
  const messages = all.filter((m) => m.guestId === guestId);
  return JSON.stringify({ profile, messages }, null, 2);
}

