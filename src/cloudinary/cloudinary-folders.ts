/**
 * Estructura de carpetas en Cloudinary (todas bajo un prefijo raíz, p. ej. `dreamia`).
 * - Sueños: `{root}/dreams`
 * - Catálogo (futuro): `{root}/catalog/characters|locations|objects`
 */

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
export const UPLOAD_CONTEXT = {
  DREAMS: 'dreams',
  CHARACTERS: 'characters',
  LOCATIONS: 'locations',
  OBJECTS: 'objects',
} as const;

export type UploadContext =
  (typeof UPLOAD_CONTEXT)[keyof typeof UPLOAD_CONTEXT];

export function resolveFolderForContext(
  rootPrefix: string,
  context: UploadContext,
): string {
  const base = rootPrefix.replace(/\/+$/, '');
  switch (context) {
    case UPLOAD_CONTEXT.DREAMS:
      return `${base}/dreams`;
    case UPLOAD_CONTEXT.CHARACTERS:
      return `${base}/catalog/characters`;
    case UPLOAD_CONTEXT.LOCATIONS:
      return `${base}/catalog/locations`;
    case UPLOAD_CONTEXT.OBJECTS:
      return `${base}/catalog/objects`;
    default: {
      const _exhaustive: never = context;
      return _exhaustive;
    }
  }
}
