type DatabaseErrorLike =
  | {
      code?: string | null;
      message?: string | null;
    }
  | null
  | undefined;

// Postgres and PostgREST codes that mean the deployed schema does not match the
// code: missing table/column/function, unknown column in the schema cache, or a
// check constraint that rejects a value the code relies on.
const SCHEMA_DRIFT_CODES = new Set([
  '42P01', // undefined_table
  '42703', // undefined_column
  '42883', // undefined_function
  '23514', // check_violation
  'PGRST204', // column not found in the schema cache
  'PGRST205', // table not found in the schema cache
]);

export const DATABASE_OUT_OF_DATE_MESSAGE =
  'Checkout is temporarily unavailable because the store database is missing a required update. Please contact support.';

export function isSchemaDriftError(error: DatabaseErrorLike): boolean {
  const code = String(error?.code ?? '').trim().toUpperCase();
  return code !== '' && SCHEMA_DRIFT_CODES.has(code);
}

/**
 * Logs the database code and message without leaking the raw Postgres error to
 * the client. Codes survive even when Supabase wraps a trigger or constraint
 * failure, so schema drift is distinguishable from a transient outage.
 */
export function logDatabaseError(
  scope: string,
  error: DatabaseErrorLike,
  meta?: Record<string, unknown>
): void {
  console.error(scope, {
    ...meta,
    code: error?.code ?? null,
    message: error?.message ?? null,
  });
}
