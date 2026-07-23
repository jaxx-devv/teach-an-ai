import {
  getActiveGuestProfile,
  logChatMessage,
  completeLesson as completeGuestLesson,
  setCurrentLesson as setGuestCurrentLesson,
  saveCustomTopicTitle as saveGuestCustomTopicTitle,
  updateGuestDisplayName,
  getRecentConversations as getGuestConversations,
  getAllConfidences as getGuestConfidences,
  getConfidenceForLesson as getGuestConfidenceForLesson,
  getTeachingStreak as getGuestStreak,
  getTotalUserMessages as getGuestTotalMessages,
  resetGuestMemory,
  exportGuestData,
  deleteConversation as deleteGuestConversation,
  type ConversationSummary,
} from "./guest-db";

export interface Identity {
  source: "guest" | "github";
  id: string;
  displayName: string;
  xp: number;
  lessonsCompleted: string[];
  customTopics: Record<string, string>;
  currentLessonId: string | null;
}

interface GithubUserResponse {
  id: string;
  displayName: string;
  xp: number;
  lessonsCompleted: string[];
  customTopics: Record<string, string>;
  currentLessonId: string | null;
}

const GUEST_ACTIVE_KEY = "teach-an-ai-active-guest";

export async function getCurrentIdentity(): Promise<Identity | null> {
  // Guests are identified purely by a local pointer, so skip the network
  // entirely when one is already present. This is what makes navigation
  // between dashboard pages fast for guests.
  if (typeof window !== "undefined" && localStorage.getItem(GUEST_ACTIVE_KEY)) {
    const guest = await getActiveGuestProfile();
    if (guest) {
      return {
        source: "guest",
        id: guest.id,
        displayName: guest.displayName,
        xp: guest.xp,
        lessonsCompleted: guest.lessonsCompleted,
        customTopics: guest.customTopics ?? {},
        currentLessonId: guest.currentLessonId ?? null,
      };
    }
  }

  try {
    const res = await fetch("/api/user/me");
    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        const u = data.user as GithubUserResponse;
        return {
          source: "github",
          id: u.id,
          displayName: u.displayName,
          xp: u.xp,
          lessonsCompleted: u.lessonsCompleted ?? [],
          customTopics: u.customTopics ?? {},
          currentLessonId: u.currentLessonId ?? null,
        };
      }
    }
  } catch {
    // fall through to guest
  }

  const guest = await getActiveGuestProfile();
  if (!guest) return null;
  return {
    source: "guest",
    id: guest.id,
    displayName: guest.displayName,
    xp: guest.xp,
    lessonsCompleted: guest.lessonsCompleted,
    customTopics: guest.customTopics ?? {},
    currentLessonId: guest.currentLessonId ?? null,
  };
}

export async function logMessage(
  identity: Identity,
  msg: { lessonId: string; role: "mascot" | "user"; content: string }
) {
  if (identity.source === "guest") {
    return logChatMessage({ guestId: identity.id, ...msg, createdAt: Date.now() });
  }
  await fetch("/api/user/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(msg),
  });
}

export async function completeLessonFor(identity: Identity, lessonId: string, xpAward: number) {
  if (identity.source === "guest") {
    return completeGuestLesson(identity.id, lessonId, xpAward);
  }
  await fetch("/api/user/complete-lesson", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lessonId, xpAward }),
  });
}

export async function setCurrentLessonFor(identity: Identity, lessonId: string | null) {
  if (identity.source === "guest") {
    return setGuestCurrentLesson(identity.id, lessonId);
  }
  await fetch("/api/user/current-lesson", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lessonId }),
  });
}

export async function saveCustomTopicTitleFor(identity: Identity, lessonId: string, title: string) {
  if (identity.source === "guest") {
    return saveGuestCustomTopicTitle(identity.id, lessonId, title);
  }
  await fetch("/api/user/custom-topic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lessonId, title }),
  });
}

// Renaming a card reuses the same title-override mechanism, it just also
// works for catalog lessons (not only freshly-created custom topics).
export const renameTopicFor = saveCustomTopicTitleFor;

export async function deleteConversationFor(identity: Identity, lessonId: string) {
  if (identity.source === "guest") {
    return deleteGuestConversation(identity.id, lessonId);
  }
  await fetch("/api/user/delete-conversation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lessonId }),
  });
}

export async function updateDisplayNameFor(identity: Identity, displayName: string) {
  if (identity.source === "guest") {
    return updateGuestDisplayName(identity.id, displayName);
  }
  await fetch("/api/user/display-name", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ displayName }),
  });
}

export async function getRecentConversationsFor(identity: Identity, limit = 5): Promise<ConversationSummary[]> {
  if (identity.source === "guest") {
    return getGuestConversations(identity.id, limit);
  }
  const res = await fetch(`/api/user/conversations?limit=${limit}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.conversations ?? [];
}

export async function getAllConfidencesFor(identity: Identity): Promise<Record<string, number>> {
  if (identity.source === "guest") {
    return getGuestConfidences(identity.id);
  }
  const res = await fetch("/api/user/stats");
  if (!res.ok) return {};
  const data = await res.json();
  return data.confidences ?? {};
}

export async function getConfidenceForLessonFor(identity: Identity, lessonId: string): Promise<number> {
  if (identity.source === "guest") {
    return getGuestConfidenceForLesson(identity.id, lessonId);
  }
  const all = await getAllConfidencesFor(identity);
  return all[lessonId] ?? 0;
}

export async function getStatsFor(identity: Identity) {
  if (identity.source === "guest") {
    const [confidences, streak, totalUserMessages] = await Promise.all([
      getGuestConfidences(identity.id),
      getGuestStreak(identity.id),
      getGuestTotalMessages(identity.id),
    ]);
    return { confidences, streak, totalUserMessages };
  }
  const res = await fetch("/api/user/stats");
  if (!res.ok) return { confidences: {}, streak: 0, totalUserMessages: 0 };
  return res.json();
}

export async function resetMemoryFor(identity: Identity) {
  if (identity.source === "guest") {
    return resetGuestMemory(identity.id);
  }
  await fetch("/api/user/reset", { method: "POST" });
}

export async function exportDataFor(identity: Identity) {
  if (identity.source === "guest") {
    return exportGuestData(identity.id);
  }
  const res = await fetch("/api/user/export");
  return res.text();
}

export async function signOut() {
  await fetch("/api/user/sign-out", { method: "POST" });
}
