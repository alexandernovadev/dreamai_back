import type { TransformFnParams } from 'class-transformer';

/**
 * For `@Transform` on optional query booleans: maps true/false
 * strings, passes through booleans, otherwise undefined.
 */
export function transformOptionalBoolean({
  value,
}: TransformFnParams): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (value === true || value === 'true') {
    return true;
  }
  if (value === false || value === 'false') {
    return false;
  }
  return undefined;
}
