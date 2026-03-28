import { Schema, Types } from 'mongoose';

/** Expone `id` string y oculta `_id` / `__v` en respuestas JSON (API estable). */
export function applyIdJsonSchema(schema: Schema): void {
  schema.set('toJSON', {
    virtuals: true,
    transform: (_doc, ret: Record<string, unknown>) => {
      const idVal = ret._id;
      if (idVal != null) {
        if (idVal instanceof Types.ObjectId) {
          ret.id = idVal.toHexString();
        } else if (typeof idVal === 'string') {
          ret.id = idVal;
        } else {
          ret.id = '';
        }
        delete ret._id;
      }
      delete ret.__v;
      return ret;
    },
  });
}
