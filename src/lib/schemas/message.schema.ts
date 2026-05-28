import { z } from 'zod';

/**
 * Skilldares — Message Pool Schemas
 *
 * Each pool is a JSON file in data/messages/ containing an array of non-empty
 * strings. The picker (FR38) selects a pool by ID, then a message uniform-random
 * from that pool.
 */

export const MessagePoolIdSchema = z.enum([
  'pre-game-encouragement',
  'right-no-streak',
  'wrong-no-streak',
  'on-fire',
  'doing-bad',
  'streak-broken',
  'comeback',
  'new-high-score',
  'game-over',
]);

export type MessagePoolId = z.infer<typeof MessagePoolIdSchema>;

export const MessagePoolSchema = z
  .array(z.string().min(1, 'messages must not be empty strings'))
  .min(1, 'pool must contain at least 1 message');

export type MessagePool = z.infer<typeof MessagePoolSchema>;
