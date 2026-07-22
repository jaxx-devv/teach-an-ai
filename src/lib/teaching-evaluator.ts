import type { LessonDef } from "./lesson-catalog";

export interface EvaluationResult {
  understood: boolean;
  mascotReply: string;
}

type LessonLike = Pick<LessonDef, "title" | "openingMisconception" | "keyPoints" | "followUpQuestions">;

const UNDERSTOOD_TEMPLATES = [
  (anchor: string) => `Okay, I think it's actually clicking now. ${anchor} is not what I thought it was at all. Thank you for sticking with me through this.`,
  (anchor: string) => `Wait, going back over everything you've said, I think I finally get it. ${anchor} makes a lot more sense now.`,
  (anchor: string) => `Now that you've explained it a few different ways, I think I really understand ${anchor.toLowerCase()}.`,
];

const PARTIAL_ACKNOWLEDGEMENTS = [
  "Okay, that part makes sense. But I'm still fuzzy on something.",
  "I think I follow that bit. There's more to this though, right?",
  "That helps a little. I still don't think I have the full picture.",
];

/**
 * A single message can't prove understanding, so this requires coverage to
 * accumulate across the whole conversation (allExplanations), and requires
 * a minimum number of real exchanges before it will ever return true. A
 * beginner who mentions one related fact should not be treated as having
 * taught the whole concept.
 */
export function evaluateExplanation(
  lesson: LessonLike,
  latestExplanation: string,
  turnIndex: number,
  allExplanations: string[] = []
): EvaluationResult {
  const cumulativeText = [...allExplanations, latestExplanation].join(" ").toLowerCase();
  const totalWordCount = cumulativeText.trim().split(/\s+/).length;

  const meaningfulKeyPoints = lesson.keyPoints.filter((k) => k.length > 2);
  const coveredCount = meaningfulKeyPoints.filter((kw) => cumulativeText.includes(kw)).length;
  const coverageRatio = meaningfulKeyPoints.length > 0 ? coveredCount / meaningfulKeyPoints.length : 0;

  // Require real back-and-forth (at least 3 submitted explanations) AND
  // broad coverage of the concept's key points AND enough total content
  // that this couldn't just be one lucky sentence.
  const enoughTurns = turnIndex >= 2;
  const enoughCoverage = meaningfulKeyPoints.length >= 3 ? coverageRatio >= 0.75 : coverageRatio >= 1;
  const enoughDepth = totalWordCount >= 25;

  const understood = enoughTurns && enoughCoverage && enoughDepth;

  if (understood) {
    const anchor = lesson.keyPoints[0] ? capitalize(lesson.keyPoints[0]) : "This";
    const template = UNDERSTOOD_TEMPLATES[turnIndex % UNDERSTOOD_TEMPLATES.length];
    return { understood: true, mascotReply: template(anchor) };
  }

  // If they covered some ground but not enough yet, acknowledge progress
  // instead of just repeating a question, so it doesn't feel like the AI
  // ignored what was just said.
  if (coverageRatio > 0 && coverageRatio < 1 && turnIndex > 0) {
    const ack = PARTIAL_ACKNOWLEDGEMENTS[turnIndex % PARTIAL_ACKNOWLEDGEMENTS.length];
    const question = lesson.followUpQuestions[turnIndex % lesson.followUpQuestions.length];
    return { understood: false, mascotReply: `${ack} ${question}` };
  }

  const question = lesson.followUpQuestions[turnIndex % lesson.followUpQuestions.length];
  return { understood: false, mascotReply: question };
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
