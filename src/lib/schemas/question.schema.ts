import { z } from 'zod';

/**
 * Skilldares — Question Schemas
 *
 * Single source of truth for content shapes. TypeScript types are derived
 * via z.infer<> — never hand-write a parallel interface.
 *
 * Content JSON lives in data/questions/{multiple-choice,speed-order,speed-select}.json
 * and is validated by scripts/validate-content.ts at build time.
 */

// ---------- Multiple Choice (rounds 1–15) ----------

export const MultipleChoiceQuestionSchema = z
  .object({
    prompt: z.string().min(1, 'prompt must not be empty'),
    options: z
      .array(z.string().min(1))
      .length(4, 'options must contain exactly 4 entries'),
    correctIndex: z.number().int().min(0).max(3),
    funnyWrongIndex: z.number().int().min(0).max(3),
    menuRefs: z.array(z.string().min(1)),
  })
  .refine((q) => q.funnyWrongIndex !== q.correctIndex, {
    message: 'funnyWrongIndex must differ from correctIndex',
    path: ['funnyWrongIndex'],
  });

export type MultipleChoiceQuestion = z.infer<typeof MultipleChoiceQuestionSchema>;

export const MultipleChoicePoolSchema = z
  .array(MultipleChoiceQuestionSchema)
  .min(1, 'pool must contain at least 1 question');

export type MultipleChoicePool = z.infer<typeof MultipleChoicePoolSchema>;

// ---------- Speed Type A — Drag-to-Order (rounds 16–30, ~50%) ----------

export const SpeedOrderFactorSchema = z.enum(['price', 'ABV']);
export type SpeedOrderFactor = z.infer<typeof SpeedOrderFactorSchema>;

export const SpeedOrderItemSchema = z.object({
  name: z.string().min(1),
  factorValue: z.number().nonnegative(),
});

export type SpeedOrderItem = z.infer<typeof SpeedOrderItemSchema>;

export const SpeedOrderQuestionSchema = z.object({
  prompt: z.string().min(1),
  factor: SpeedOrderFactorSchema,
  /**
   * Items in their CORRECT order (sorted by factorValue ascending if applicable
   * to the prompt — e.g., "cheapest first"). The app shuffles for display and
   * compares the user's submitted order against this canonical sequence.
   * 3–5 items per FR12.
   */
  items: z.array(SpeedOrderItemSchema).min(3).max(5),
  menuRefs: z.array(z.string().min(1)),
});

export type SpeedOrderQuestion = z.infer<typeof SpeedOrderQuestionSchema>;

export const SpeedOrderPoolSchema = z.array(SpeedOrderQuestionSchema).min(1);
export type SpeedOrderPool = z.infer<typeof SpeedOrderPoolSchema>;

// ---------- Speed Type B — Multi-Select (rounds 16–30, ~50%) ----------

export const SpeedSelectCriteriaTypeSchema = z.enum([
  'items-in-dish',
  'items-gf',
  'items-in-section',
]);
export type SpeedSelectCriteriaType = z.infer<typeof SpeedSelectCriteriaTypeSchema>;

export const SpeedSelectQuestionSchema = z
  .object({
    prompt: z.string().min(1),
    criteriaType: SpeedSelectCriteriaTypeSchema,
    /** Exactly 6 items shown in the grid (FR19 updated 2026-05-24 from 5 → 6). */
    items: z.array(z.string().min(1)).length(6),
    /**
     * Subset of `items` that satisfies the criteria. At least 1, up to 5 — the
     * remaining slot is reserved for an obviously-wrong joke item (see
     * funnyWrongIndex). Each entry MUST be one of the strings in `items`.
     */
    correctSet: z.array(z.string().min(1)).min(1).max(5),
    /**
     * Index (0-5) of the obviously-wrong joke item — analogous to MC's
     * funnyWrongIndex. Not used by runtime (speed rounds have no hint
     * mechanic); preserved for content-authoring traceability and any
     * future hint/highlight feature.
     */
    funnyWrongIndex: z.number().int().min(0).max(5),
    menuRefs: z.array(z.string().min(1)),
  })
  .refine((q) => q.correctSet.every((c) => q.items.includes(c)), {
    message: 'correctSet entries must all appear in items',
    path: ['correctSet'],
  })
  .refine((q) => new Set(q.correctSet).size === q.correctSet.length, {
    message: 'correctSet must not contain duplicates',
    path: ['correctSet'],
  })
  .refine((q) => !q.correctSet.includes(q.items[q.funnyWrongIndex]!), {
    message: 'funnyWrongIndex must point to an item NOT in correctSet',
    path: ['funnyWrongIndex'],
  });

export type SpeedSelectQuestion = z.infer<typeof SpeedSelectQuestionSchema>;

export const SpeedSelectPoolSchema = z.array(SpeedSelectQuestionSchema).min(1);
export type SpeedSelectPool = z.infer<typeof SpeedSelectPoolSchema>;

// ---------- Game-level discriminated union (in-memory game state) ----------

/**
 * Wrapper schema matching the in-game representation of a question.
 *
 * Content JSON files are flat single-type pools (multiple-choice.json,
 * speed-order.json, speed-select.json); this schema describes how those
 * questions appear in the reducer's GameState.questions array — wrapped
 * with a `type` discriminator so the UI can route to QuestionMC /
 * QuestionOrder / QuestionSelect at render time.
 *
 * Source of truth for the GameQuestion type — gameReducer.ts re-exports
 * it for backward compat with existing import sites.
 */
export const GameQuestionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('mc'), question: MultipleChoiceQuestionSchema }),
  z.object({ type: z.literal('order'), question: SpeedOrderQuestionSchema }),
  z.object({ type: z.literal('select'), question: SpeedSelectQuestionSchema }),
]);

export type GameQuestion = z.infer<typeof GameQuestionSchema>;
