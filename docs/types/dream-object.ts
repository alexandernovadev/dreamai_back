/**
 * Objeto onírico: cosas materiales o simbólicas en el relato (llaves, vehículos,
 * armas, teléfonos, regalos…). Complementa personajes y lugares en la lectura onírica.
 */
export interface DreamObject {
  id: string;
  name: string;
  description?: string;
  catalogObjectId?: string;
  imageUri?: string;
}
