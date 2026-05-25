/**
 * Skilldares — Letter-grade calculation for the End screen.
 *
 * Maps a correct-answer percentage to a US-style 13-grade scale:
 *   A+ 97-100, A 93-96, A- 90-92, B+ 87-89, B 83-86, B- 80-82,
 *   C+ 77-79, C 73-76, C- 70-72, D+ 67-69, D 63-66, D- 60-62, F <60.
 *
 * Boundaries match the conventional school scale most US players will
 * recognize. Edge cases:
 *   - total === 0 → 'F' (defensive; production never produces a 0-question
 *     game thanks to the urlConfig fallback).
 *   - correct > total → clamps to A+ via the >= 97 branch.
 */

export type LetterGrade =
  | 'A+' | 'A' | 'A-'
  | 'B+' | 'B' | 'B-'
  | 'C+' | 'C' | 'C-'
  | 'D+' | 'D' | 'D-'
  | 'F';

export type GradeTier = 'a' | 'b' | 'c' | 'd' | 'f';

export function computeGrade(correct: number, total: number): LetterGrade {
  if (total <= 0) return 'F';
  const pct = (correct / total) * 100;
  if (pct >= 97) return 'A+';
  if (pct >= 93) return 'A';
  if (pct >= 90) return 'A-';
  if (pct >= 87) return 'B+';
  if (pct >= 83) return 'B';
  if (pct >= 80) return 'B-';
  if (pct >= 77) return 'C+';
  if (pct >= 73) return 'C';
  if (pct >= 70) return 'C-';
  if (pct >= 67) return 'D+';
  if (pct >= 63) return 'D';
  if (pct >= 60) return 'D-';
  return 'F';
}

/** Drops the +/- modifier so the grade can drive a small set of CSS
 *  color tiers. 'A+' / 'A' / 'A-' all map to 'a', etc. */
export function gradeTier(grade: LetterGrade): GradeTier {
  return grade[0]!.toLowerCase() as GradeTier;
}
