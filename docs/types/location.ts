/** Tipo de escenario; la descripción libre refina el matiz. */
export type LocationSetting = "URBAN" | "NATURE" | "INDOOR" | "ABSTRACT";

/** Un lugar dentro del sueño (puede haber varios por segmento). */
export interface Location {
  id: string;
  /** Si el lugar enlaza con el catálogo recurrente (misma idea que en personajes/objetos). */
  catalogLocationId?: string;
  isFamiliar: boolean;
  setting: LocationSetting;
  name: string;
  description: string;
  imageUri?: string;
}
