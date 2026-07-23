import { MongoClient, type Db } from "mongodb";

let clientPromise: Promise<MongoClient> | null = null;

function getClientPromise() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured");
  if (!clientPromise) {
    clientPromise = new MongoClient(uri).connect();
  }
  return clientPromise;
}

async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(process.env.MONGODB_DB_NAME ?? "teach_an_ai");
}

export interface UserRecord {
  id: string;
  githubId: string;
  username: string;
  avatarUrl: string;
  displayName: string;
  xp: number;
  lessonsCompleted: string[];
  customTopics: Record<string, string>;
  currentLessonId: string | null;
  createdAt: number;
}

export interface UserMessage {
  id: string;
  userId: string;
  lessonId: string;
  role: "mascot" | "user";
  content: string;
  createdAt: number;
}

export interface ConversationSummary {
  lessonId: string;
  lastMessage: string;
  confidence: "High Confidence" | "Medium Confidence" | "Low Confidence";
  updatedAt: number;
}

export async function upsertGitHubUser(input: {
  githubId: string;
  username: string;
  avatarUrl: string;
  displayName: string;
}): Promise<UserRecord> {
  const db = await getDb();
  const users = db.collection<UserRecord>("users");

  const existing = await users.findOne({ githubId: input.githubId });
  if (existing) {
    await users.updateOne(
      { githubId: input.githubId },
      { $set: { username: input.username, avatarUrl: input.avatarUrl } }
    );
    return existing;
  }

  const record: UserRecord = {
    id: crypto.randomUUID(),
    githubId: input.githubId,
    username: input.username,
    avatarUrl: input.avatarUrl,
    displayName: input.displayName,
    xp: 0,
    lessonsCompleted: [],
    customTopics: {},
    currentLessonId: null,
    createdAt: Date.now(),
  };
  await users.insertOne(record);
  return record;
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  const db = await getDb();
  return db.collection<UserRecord>("users").findOne({ id }, { projection: { _id: 0 } });
}

export async function updateDisplayName(userId: string, displayName: string) {
  const db = await getDb();
  await db.collection<UserRecord>("users").updateOne({ id: userId }, { $set: { displayName } });
}

export async function setCurrentLesson(userId: string, lessonId: string | null) {
  const db = await getDb();
  await db.collection<UserRecord>("users").updateOne({ id: userId }, { $set: { currentLessonId: lessonId } });
}

export async function saveCustomTopicTitle(userId: string, lessonId: string, title: string) {
  const db = await getDb();
  await db
    .collection<UserRecord>("users")
    .updateOne({ id: userId }, { $set: { [`customTopics.${lessonId}`]: title } });
}

export async function completeLesson(userId: string, lessonId: string, xpAward: number) {
  const db = await getDb();
  const users = db.collection<UserRecord>("users");
  const user = await users.findOne({ id: userId });
  if (!user) return null;

  const update: Record<string, unknown> = { $inc: { xp: xpAward } };
  if (!user.lessonsCompleted.includes(lessonId)) {
    update.$addToSet = { lessonsCompleted: lessonId };
  }
  if (user.currentLessonId === lessonId) {
    update.$set = { currentLessonId: null };
  }
  await users.updateOne({ id: userId }, update);
  return users.findOne({ id: userId }, { projection: { _id: 0 } });
}

export async function logMessage(msg: Omit<UserMessage, "id">) {
  const db = await getDb();
  const entry: UserMessage = { ...msg, id: crypto.randomUUID() };
  await db.collection<UserMessage>("messages").insertOne(entry);
  return entry;
}

export async function getRecentConversations(userId: string, limit = 5): Promise<ConversationSummary[]> {
  const db = await getDb();
  const all = await db
    .collection<UserMessage>("messages")
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray();

  const byLesson = new Map<string, UserMessage[]>();
  for (const m of all) {
    const list = byLesson.get(m.lessonId) ?? [];
    list.push(m);
    byLesson.set(m.lessonId, list);
  }

  const summaries: ConversationSummary[] = [];
  for (const [lessonId, msgs] of byLesson) {
    const last = msgs[0];
    const mascotMsgs = msgs.filter((m) => m.role === "mascot").length;
    const confidence =
      mascotMsgs >= 6 ? "High Confidence" : mascotMsgs >= 3 ? "Medium Confidence" : "Low Confidence";
    summaries.push({ lessonId, lastMessage: last.content, confidence, updatedAt: last.createdAt });
  }

  return summaries.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit);
}

export async function getAllConfidences(userId: string): Promise<Record<string, number>> {
  const db = await getDb();
  const all = await db
    .collection<UserMessage>("messages")
    .find({ userId, role: "mascot" })
    .toArray();
  const counts = new Map<string, number>();
  for (const m of all) counts.set(m.lessonId, (counts.get(m.lessonId) ?? 0) + 1);
  const result: Record<string, number> = {};
  for (const [lessonId, count] of counts) result[lessonId] = Math.min(100, count * 20);
  return result;
}

export async function deleteConversation(userId: string, lessonId: string) {
  const db = await getDb();
  await db
    .collection<UserRecord>("users")
    .updateOne(
      { id: userId },
      { $unset: { [`customTopics.${lessonId}`]: "" } }
    );
  const users = db.collection<UserRecord>("users");
  const user = await users.findOne({ id: userId });
  if (user?.currentLessonId === lessonId) {
    await users.updateOne({ id: userId }, { $set: { currentLessonId: null } });
  }
  await db.collection<UserMessage>("messages").deleteMany({ userId, lessonId });
}

export async function getConfidenceForLesson(userId: string, lessonId: string) {
  const db = await getDb();
  const count = await db
    .collection<UserMessage>("messages")
    .countDocuments({ userId, lessonId, role: "mascot" });
  return Math.min(100, count * 20);
}

export async function getTeachingStreak(userId: string): Promise<number> {
  const db = await getDb();
  const all = await db
    .collection<UserMessage>("messages")
    .find({ userId, role: "user" })
    .project<{ createdAt: number }>({ createdAt: 1 })
    .toArray();
  if (all.length === 0) return 0;

  const days = new Set(all.map((m) => new Date(m.createdAt).toISOString().slice(0, 10)));
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

export async function getTotalUserMessages(userId: string) {
  const db = await getDb();
  return db.collection<UserMessage>("messages").countDocuments({ userId, role: "user" });
}

export async function resetUserMemory(userId: string) {
  const db = await getDb();
  await db
    .collection<UserRecord>("users")
    .updateOne({ id: userId }, { $set: { xp: 0, lessonsCompleted: [], currentLessonId: null } });
  await db.collection<UserMessage>("messages").deleteMany({ userId });
}

export async function exportUserData(userId: string) {
  const db = await getDb();
  const user = await db.collection<UserRecord>("users").findOne({ id: userId }, { projection: { _id: 0 } });
  const messages = await db
    .collection<UserMessage>("messages")
    .find({ userId }, { projection: { _id: 0 } })
    .toArray();
  return JSON.stringify({ user, messages }, null, 2);
}
