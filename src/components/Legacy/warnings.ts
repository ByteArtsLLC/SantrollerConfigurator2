import type { TFunction } from 'i18next';

// A message from the importer, as a translation key and its params. A param can itself be a
// message (eg the name of a device), which is translated before being put into the outer one.
export interface LegacyWarning {
  key: string;
  params?: Record<string, LegacyWarningParam>;
}

export type LegacyWarningParam = string | number | LegacyWarning;

export function legacyWarning(
  key: string,
  params?: Record<string, LegacyWarningParam>
): LegacyWarning {
  return params ? { key, params } : { key };
}

// The import couldn't be done at all. `warning` is the translatable reason.
export class LegacyImportError extends Error {
  constructor(
    readonly warning: LegacyWarning,
    message: string
  ) {
    super(message);
    this.name = 'LegacyImportError';
  }
}

// The translatable reason for an error thrown while importing
export function legacyErrorReason(e: unknown): LegacyWarningParam {
  return e instanceof LegacyImportError ? e.warning : `${e}`;
}

export function translateLegacyWarning(t: TFunction, warning: LegacyWarningParam): string {
  if (typeof warning !== 'object') {
    return `${warning}`;
  }
  const params = Object.fromEntries(
    Object.entries(warning.params ?? {}).map(([name, value]) => [
      name,
      typeof value === 'object' ? translateLegacyWarning(t, value) : value,
    ])
  );
  return t(warning.key, params) as string;
}
