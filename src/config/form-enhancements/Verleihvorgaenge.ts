// Auto-generated. Per-entity form-enhancements config for "Verleihvorgänge".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [{"row": ["kunde", "skateboard"], "cols": "1fr 1fr"}, {"row": ["ausleihdatum", "geplante_rueckgabe"], "cols": "1fr 1fr"}, "status", "tatsaechliche_rueckgabe", {"row": ["kaution", "gesamtpreis"], "cols": "1fr 1fr"}, "zustand_rueckgabe", "bemerkungen"],
  defaults: {
    'ausleihdatum': { kind: 'today' },
    'geplante_rueckgabe': { kind: 'todayOffset', days: 3 },
    'status': { kind: 'lookup', key: 'reserviert', label: 'Reserviert' },
  },
  computed: {
    '_verleih_dauer_tage': { kind: 'dateDiff', from: 'ausleihdatum', to: 'geplante_rueckgabe', unit: 'days' },
  },
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
