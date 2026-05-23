/**
 * Skilldares — Build-time content validator.
 *
 * Run by `npm run prebuild` (i.e., automatically before `npm run build`).
 * Walks data/questions/ and data/messages/, validates each JSON file
 * against the appropriate Zod schema, exits 0 on success, 1 on any failure.
 *
 * If data/questions/ or data/messages/ does not exist (which is the case
 * before Stories 1.4-1.5 author content), the script prints a friendly note
 * and exits 0.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  MultipleChoicePoolSchema,
  SpeedOrderPoolSchema,
  SpeedSelectPoolSchema,
} from '../src/lib/schemas/question.schema';
import {
  MessagePoolIdSchema,
  MessagePoolSchema,
} from '../src/lib/schemas/message.schema';
import type { ZodType } from 'zod';

const QUESTIONS_DIR = join(process.cwd(), 'data', 'questions');
const MESSAGES_DIR = join(process.cwd(), 'data', 'messages');

const QUESTION_SCHEMAS: Record<string, ZodType> = {
  'multiple-choice.json': MultipleChoicePoolSchema,
  'speed-order.json': SpeedOrderPoolSchema,
  'speed-select.json': SpeedSelectPoolSchema,
};

interface ValidationFailure {
  file: string;
  message: string;
}

function exists(path: string): boolean {
  try {
    statSync(path);
    return true;
  } catch {
    return false;
  }
}

function listJsonFiles(dir: string): string[] {
  if (!exists(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.json'));
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function validate(
  schema: ZodType,
  data: unknown,
  filePath: string,
  failures: ValidationFailure[],
): boolean {
  const result = schema.safeParse(data);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const pathStr = issue.path.length > 0 ? issue.path.join('.') : '(root)';
      failures.push({
        file: filePath,
        message: `[${pathStr}] ${issue.message}`,
      });
    }
    return false;
  }
  return true;
}

function validateQuestions(failures: ValidationFailure[]): void {
  if (!exists(QUESTIONS_DIR)) {
    console.log(`ℹ️  No data/questions/ directory yet — skipping question validation.`);
    return;
  }
  const files = listJsonFiles(QUESTIONS_DIR);
  if (files.length === 0) {
    console.log(`ℹ️  data/questions/ is empty — skipping question validation.`);
    return;
  }
  for (const filename of files) {
    const schema = QUESTION_SCHEMAS[filename];
    const filePath = join(QUESTIONS_DIR, filename);
    if (!schema) {
      failures.push({
        file: filePath,
        message: `Unknown question file. Expected one of: ${Object.keys(QUESTION_SCHEMAS).join(', ')}.`,
      });
      continue;
    }
    let data: unknown;
    try {
      data = readJson(filePath);
    } catch (err) {
      failures.push({
        file: filePath,
        message: `JSON parse error: ${(err as Error).message}`,
      });
      continue;
    }
    const ok = validate(schema, data, filePath, failures);
    if (ok) console.log(`✓ ${filename} — validated`);
  }
}

function validateMessages(failures: ValidationFailure[]): void {
  if (!exists(MESSAGES_DIR)) {
    console.log(`ℹ️  No data/messages/ directory yet — skipping message validation.`);
    return;
  }
  const files = listJsonFiles(MESSAGES_DIR);
  if (files.length === 0) {
    console.log(`ℹ️  data/messages/ is empty — skipping message validation.`);
    return;
  }
  for (const filename of files) {
    const poolId = filename.replace(/\.json$/, '');
    const filePath = join(MESSAGES_DIR, filename);
    const poolIdResult = MessagePoolIdSchema.safeParse(poolId);
    if (!poolIdResult.success) {
      failures.push({
        file: filePath,
        message: `Unknown message pool name '${poolId}'. Expected one of: ${MessagePoolIdSchema.options.join(', ')}.`,
      });
      continue;
    }
    let data: unknown;
    try {
      data = readJson(filePath);
    } catch (err) {
      failures.push({
        file: filePath,
        message: `JSON parse error: ${(err as Error).message}`,
      });
      continue;
    }
    const ok = validate(MessagePoolSchema, data, filePath, failures);
    if (ok) console.log(`✓ ${filename} — validated as MessagePool`);
  }
}

function main(): void {
  console.log('🔎 Validating Skilldares content…');
  const failures: ValidationFailure[] = [];
  validateQuestions(failures);
  validateMessages(failures);
  if (failures.length === 0) {
    console.log('✅ Content validation passed.');
    process.exit(0);
  }
  console.error(`\n❌ Content validation FAILED (${failures.length} issue(s)):\n`);
  for (const f of failures) {
    console.error(`  ${f.file}:\n    ${f.message}\n`);
  }
  process.exit(1);
}

main();
