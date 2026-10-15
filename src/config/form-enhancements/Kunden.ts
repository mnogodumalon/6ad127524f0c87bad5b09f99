// Auto-generated. Per-entity form-enhancements config for "Kunden".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [{"row": ["kunde_firstname", "kunde_lastname"], "cols": "1fr 1fr"}, "geburtsdatum", {"row": ["email", "telefon"], "cols": "1fr 1fr"}, "instagram_profil", {"row": ["strasse", "hausnummer"], "cols": "2fr 1fr"}, {"row": ["plz", "ort"], "cols": "1fr 2fr"}, "schutzausruestung"],
  defaults: {},
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
