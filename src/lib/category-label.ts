import type { Dictionary } from "@/lib/i18n/dictionaries/es";

// Companies are seeded with these category names in Spanish. Showing them through the dictionary keeps the
// screen in the person's language; a category the company created itself is shown exactly as written.
const SYSTEM: Record<string, keyof Dictionary> = {
  Materiales: "expCatMaterials", Herramientas: "expCatTools", Combustible: "expCatFuel", Permisos: "expCatPermits", Subcontratistas: "expCatSubs",
  Equipos: "expCatEquipment", Alquiler: "expCatRental", Comidas: "expCatMeals", Transporte: "expCatTransport", Oficina: "expCatOffice", Otros: "expCatOther",
};

export function categoryLabel(name: string | null | undefined, t: (key: keyof Dictionary) => string): string {
  if (!name) return "";
  const key = SYSTEM[name];
  return key ? t(key) : name;
}
