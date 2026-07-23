const BLOCKED_TERMS = [
  "porn", "sex", "nude", "nsfw", "rape", "suicide", "self harm", "self-harm",
  "kill myself", "bomb", "explosive", "weapon", "gun", "drug", "cocaine",
  "meth", "heroin", "nazi", "hitler", "terrorist", "slur", "kys",
];

export interface FilterResult {
  ok: boolean;
  reason?: string;
}

export function checkCustomTopic(raw: string): FilterResult {
  const topic = raw.trim();

  if (topic.length < 3) {
    return { ok: false, reason: "That is too short to be a topic." };
  }
  if (topic.length > 80) {
    return { ok: false, reason: "Keep the topic under 80 characters." };
  }

  const lower = topic.toLowerCase();
  for (const term of BLOCKED_TERMS) {
    if (lower.includes(term)) {
      return { ok: false, reason: "That topic is not allowed here." };
    }
  }

  const letters = topic.replace(/[^a-zA-Z]/g, "");
  if (letters.length < 3) {
    return { ok: false, reason: "That does not look like a real topic." };
  }

  const vowels = (letters.match(/[aeiouAEIOU]/g) ?? []).length;
  if (vowels === 0 && letters.length > 5) {
    return { ok: false, reason: "That does not look like a real topic." };
  }

  const words = topic.split(/\s+/);
  const longestRun = Math.max(...topic.split(/\s+/).map((w) => {
    const m = w.match(/(.)\1{3,}/);
    return m ? m[0].length : 0;
  }));
  if (longestRun >= 4) {
    return { ok: false, reason: "That does not look like a real topic." };
  }
  void words;

  return { ok: true };
}
