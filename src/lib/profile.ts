import { getJSONCookie, setJSONCookie, deleteCookie } from "./cookies";

const PROFILE_COOKIE = "taa_profile";

export interface LessonProgress {
  lessonId: string;
  mascotReplies: number;
  userReplies: number;
  lastMessage: string;
  updatedAt: number;
}

export interface Identity {
  id: string;
  displayName: string;
  createdAt: number;
  xp: number;
  lessonsCompleted: string[];
  customTopics: Record<string, string>;
  currentLessonId: string | null;
  lessons: Record<string, LessonProgress>;
  activeDays: string[];
}

export interface ConversationSummary {
  lessonId: string;
  lastMessage: string;
  confidence: "High Confidence" | "Medium Confidence" | "Low Confidence";
  updatedAt: number;
}

function generateId() {
  return `user_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function confidenceLabel(mascotReplies: number): ConversationSummary["confidence"] {
  if (mascotReplies >= 6) return "High Confidence";
  if (mascotReplies >= 3) return "Medium Confidence";
  return "Low Confidence";
}

function confidenceScore(mascotReplies: number) {
  return Math.min(100, mascotReplies * 20);
}

function save(identity: Identity) {
  setJSONCookie(PROFILE_COOKIE, identity);
  return identity;
}

export function getCurrentIdentity(): Identity | null {
  return getJSONCookie<Identity>(PROFILE_COOKIE);
}

export function createProfile(displayName: string): Identity {
  return save({
    id: generateId(),
    displayName,
    createdAt: Date.now(),
    xp: 0,
    lessonsCompleted: [],
    customTopics: {},
    currentLessonId: null,
    lessons: {},
    activeDays: [],
  });
}

export function updateDisplayName(identity: Identity, displayName: string) {
  return save({ ...identity, displayName });
}

export function setCurrentLesson(identity: Identity, lessonId: string | null) {
  return save({ ...identity, currentLessonId: lessonId });
}

export function saveCustomTopicTitle(identity: Identity, lessonId: string, title: string) {
  return save({ ...identity, customTopics: { ...identity.customTopics, [lessonId]: title } });
}

export const renameTopic = saveCustomTopicTitle;

export function logMessage(
  identity: Identity,
  msg: { lessonId: string; role: "mascot" | "user"; content: string }
) {
  const existing = identity.lessons[msg.lessonId];
  const lesson: LessonProgress = {
    lessonId: msg.lessonId,
    mascotReplies: (existing?.mascotReplies ?? 0) + (msg.role === "mascot" ? 1 : 0),
    userReplies: (existing?.userReplies ?? 0) + (msg.role === "user" ? 1 : 0),
    lastMessage: msg.content,
    updatedAt: Date.now(),
  };

  const today = new Date().toISOString().slice(0, 10);
  const activeDays =
    msg.role === "user" && !identity.activeDays.includes(today)
      ? [...identity.activeDays, today]
      : identity.activeDays;

  return save({
    ...identity,
    lessons: { ...identity.lessons, [msg.lessonId]: lesson },
    activeDays,
  });
}

export function completeLesson(identity: Identity, lessonId: string, xpAward: number) {
  return save({
    ...identity,
    xp: identity.xp + xpAward,
    lessonsCompleted: identity.lessonsCompleted.includes(lessonId)
      ? identity.lessonsCompleted
      : [...identity.lessonsCompleted, lessonId],
    currentLessonId: identity.currentLessonId === lessonId ? null : identity.currentLessonId,
  });
}

export function deleteConversation(identity: Identity, lessonId: string) {
  const { [lessonId]: _removedLesson, ...lessons } = identity.lessons;
  const { [lessonId]: _removedTopic, ...customTopics } = identity.customTopics;
  return save({
    ...identity,
    lessons,
    customTopics,
    currentLessonId: identity.currentLessonId === lessonId ? null : identity.currentLessonId,
  });
}

export function getRecentConversations(identity: Identity, limit = 5): ConversationSummary[] {
  return Object.values(identity.lessons)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit)
    .map((lesson) => ({
      lessonId: lesson.lessonId,
      lastMessage: lesson.lastMessage,
      confidence: confidenceLabel(lesson.mascotReplies),
      updatedAt: lesson.updatedAt,
    }));
}

export function getAllConfidences(identity: Identity): Record<string, number> {
  const result: Record<string, number> = {};
  for (const lesson of Object.values(identity.lessons)) {
    result[lesson.lessonId] = confidenceScore(lesson.mascotReplies);
  }
  return result;
}

export function getTeachingStreak(identity: Identity): number {
  const days = new Set(identity.activeDays);
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (!days.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function getTotalUserMessages(identity: Identity): number {
  return Object.values(identity.lessons).reduce((sum, lesson) => sum + lesson.userReplies, 0);
}

export function getStats(identity: Identity) {
  return {
    confidences: getAllConfidences(identity),
    streak: getTeachingStreak(identity),
    totalUserMessages: getTotalUserMessages(identity),
  };
}

export function resetMemory(identity: Identity) {
  return save({
    ...identity,
    xp: 0,
    lessonsCompleted: [],
    currentLessonId: null,
    lessons: {},
    activeDays: [],
  });
}

export function exportData(identity: Identity) {
  return JSON.stringify(identity, null, 2);
}

export function clearProfile() {
  deleteCookie(PROFILE_COOKIE);
}
