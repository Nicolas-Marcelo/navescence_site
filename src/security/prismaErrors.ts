interface PrismaLikeError {
  code?: string;
  meta?: unknown;
}

export function getPrismaCode(
  error: unknown,
): string | null {
  if (
    !error ||
    typeof error !== "object"
  ) {
    return null;
  }

  const candidate =
    error as PrismaLikeError;

  return typeof candidate.code ===
    "string"
    ? candidate.code
    : null;
}

export function isUniqueViolation(
  error: unknown,
): boolean {
  return (
    getPrismaCode(
      error,
    ) === "P2002"
  );
}

export function isForeignKeyViolation(
  error: unknown,
): boolean {
  return (
    getPrismaCode(
      error,
    ) === "P2003"
  );
}

export function isRecordNotFound(
  error: unknown,
): boolean {
  return (
    getPrismaCode(
      error,
    ) === "P2025"
  );
}