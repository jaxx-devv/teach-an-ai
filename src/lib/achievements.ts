export interface AchievementDef {
  id: string;
  title: string;
  story: string;
  icon: "spark" | "pencil" | "stack" | "trophy" | "flame";
}

export const ACHIEVEMENT_CATALOG: AchievementDef[] = [
  {
    id: "first-lesson",
    title: "First Thing I Learned",
    story: "The first time your AI understood something you taught it.",
    icon: "spark",
  },
  {
    id: "first-correction",
    title: "My First Correction",
    story: "You corrected a misconception and the AI updated its understanding.",
    icon: "pencil",
  },
  {
    id: "five-lessons",
    title: "Mastered My First Subject",
    story: "Five different concepts taught and understood.",
    icon: "stack",
  },
  {
    id: "mastered-topic",
    title: "Finally Understood",
    story: "One topic reached full confidence.",
    icon: "trophy",
  },
  {
    id: "streak-3",
    title: "Three Days Running",
    story: "You showed up to teach three days in a row.",
    icon: "flame",
  },
];

export interface AchievementState {
  lessonsCompleted: string[];
  totalUserMessages: number;
  confidences: Record<string, number>;
  streak: number;
}

export function evaluateAchievements(state: AchievementState) {
  const unlocked = new Set<string>();
  if (state.lessonsCompleted.length >= 1) unlocked.add("first-lesson");
  if (state.totalUserMessages >= 2) unlocked.add("first-correction");
  if (state.lessonsCompleted.length >= 5) unlocked.add("five-lessons");
  if (Object.values(state.confidences).some((c) => c >= 100)) unlocked.add("mastered-topic");
  if (state.streak >= 3) unlocked.add("streak-3");
  return unlocked;
}
