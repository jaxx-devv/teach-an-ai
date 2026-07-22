export interface LessonDef {
  id: string;
  title: string;
  description: string;
  category: "Programming" | "Science" | "General Knowledge";
  icon: "dice" | "loop" | "branch" | "var" | "func" | "recursion";
  xpReward: number;
  estimatedMinutes: number;
  openingMisconception: string;
  keyPoints: string[];
  followUpQuestions: string[];
}

export const LESSON_CATALOG: LessonDef[] = [
  {
    id: "variables",
    title: "Variables in Programming",
    description: "How values are stored and change over time.",
    category: "Programming",
    icon: "var",
    xpReward: 40,
    estimatedMinutes: 4,
    openingMisconception: "I think a variable is just a fixed label that never changes once you write it down.",
    keyPoints: ["store", "value", "change", "memory", "name"],
    followUpQuestions: [
      "So once I set a variable, it can never be different later?",
      "Is a variable the same thing as the value inside it?",
      "Can two variables hold the same value at once?",
    ],
  },
  {
    id: "if-statements",
    title: "If Statements",
    description: "Teaching branching logic and conditions.",
    category: "Programming",
    icon: "branch",
    xpReward: 35,
    estimatedMinutes: 4,
    openingMisconception: "I think an if statement runs every line inside it no matter what.",
    keyPoints: ["condition", "true", "false", "branch", "else"],
    followUpQuestions: [
      "So the code inside always runs, even if the condition is false?",
      "What happens if none of my conditions are true?",
      "Can I check more than one condition at a time?",
    ],
  },
  {
    id: "loops",
    title: "Loops and Iteration",
    description: "Why and how actions repeat.",
    category: "Programming",
    icon: "loop",
    xpReward: 35,
    estimatedMinutes: 4,
    openingMisconception: "I thought loops just repeat forever with no way to stop them.",
    keyPoints: ["repeat", "condition", "stop", "iterate", "count"],
    followUpQuestions: [
      "So a loop never knows when to stop on its own?",
      "What is the difference between a loop that counts and one that waits for a condition?",
      "Can a loop stop itself early?",
    ],
  },
  {
    id: "functions",
    title: "Functions and Return Values",
    description: "Packaging logic and handing back results.",
    category: "Programming",
    icon: "func",
    xpReward: 45,
    estimatedMinutes: 5,
    openingMisconception: "I thought a function just runs code but never gives anything back.",
    keyPoints: ["return", "input", "output", "reuse", "parameter"],
    followUpQuestions: [
      "So a function can never send a result back to whoever called it?",
      "Does a function need to take an input to be useful?",
      "Can I use the same function more than once?",
    ],
  },
  {
    id: "recursion",
    title: "Recursion",
    description: "Functions that call themselves, and when to stop.",
    category: "Programming",
    icon: "recursion",
    xpReward: 55,
    estimatedMinutes: 6,
    openingMisconception: "I thought recursion just repeats forever until the program crashes.",
    keyPoints: ["base case", "call itself", "stop", "smaller", "return"],
    followUpQuestions: [
      "So recursion never has a way to stop?",
      "What happens if a function calls itself without ever changing anything?",
      "Is recursion just a fancy loop?",
    ],
  },
  {
    id: "probability",
    title: "Probability Basics",
    description: "The fundamentals of probability and how it's used in real life.",
    category: "General Knowledge",
    icon: "dice",
    xpReward: 40,
    estimatedMinutes: 5,
    openingMisconception: "I think probability tells you exactly what will happen every time.",
    keyPoints: ["chance", "likelihood", "outcome", "random", "percent"],
    followUpQuestions: [
      "So if something has a 90 percent chance, it always happens?",
      "Can something with a low chance still happen?",
      "How is probability different from a guarantee?",
    ],
  },
];

export function pickLessonOfTheDay(completedIds: string[]): LessonDef {
  const remaining = LESSON_CATALOG.filter((l) => !completedIds.includes(l.id));
  const pool = remaining.length ? remaining : LESSON_CATALOG;
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  return pool[dayIndex % pool.length];
}

export function getLesson(id: string) {
  return LESSON_CATALOG.find((l) => l.id === id) ?? null;
}
