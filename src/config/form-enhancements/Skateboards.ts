// Auto-generated. Per-entity form-enhancements config for "Skateboards".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [{"row": ["bezeichnung", "marke"], "cols": "2fr 1fr"}, {"row": ["typ", "zustand"], "cols": "1fr 1fr"}, {"row": ["preis_pro_tag", "deckbreite"], "cols": "1fr 1fr"}, "verfuegbar", "bemerkungen"],
  defaults: {
    'zustand': { kind: 'lookup', key: 'neu', label: 'Neu' },
    'verfuegbar': { kind: 'literal', value: true },
  },
  computed: {},
  numberFields: {
    'deckbreite': { max: 20 },
  },
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
