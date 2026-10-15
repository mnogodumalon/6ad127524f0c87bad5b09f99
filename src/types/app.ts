import { lookupLabel } from '@/i18n';

// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
/** A raw record URL (applookup reference). NEVER render this directly
 *  in JSX — it is a URL, not a display value. Show the enriched `*Name`
 *  field or resolve it via the entity map instead. Assignable to/from
 *  string everywhere; the `& {}` keeps the alias NAME visible in tsc
 *  error messages (a plain primitive alias gets normalized away). */
export type RecordUrl = string & {};
export type GeoLocation = { lat: number; long: number; info?: string };

export type AttachmentType = 'file' | 'note' | 'url' | 'json';
export interface Attachment {
  id: string;
  type: AttachmentType;
  label: string | null;
  value: string | null;
  active: boolean;
  createdat?: string | null;
  updatedat?: string | null;
}

export interface AttachmentInput {
  type: AttachmentType;
  label?: string;
  value: string;
  active?: boolean;
}

export interface Skateboards {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    bezeichnung?: string;
    marke?: string;
    typ?: LookupValue;
    deckbreite?: number;
    zustand?: LookupValue;
    preis_pro_tag?: number;
    verfuegbar?: boolean;
    foto?: string;
    bemerkungen?: string;
  };
}

export interface Kunden {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    kunde_firstname?: string;
    kunde_lastname?: string;
    geburtsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    email?: string;
    telefon?: string;
    instagram_profil?: string;
    strasse?: string;
    hausnummer?: string;
    plz?: string;
    ort?: string;
    schutzausruestung?: LookupValue[];
  };
}

export interface Verleihvorgaenge {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    kunde?: RecordUrl; // applookup -> URL zu 'Kunden' Record
    skateboard?: RecordUrl; // applookup -> URL zu 'Skateboards' Record
    ausleihdatum?: string; // Format: YYYY-MM-DD oder ISO String
    geplante_rueckgabe?: string; // Format: YYYY-MM-DD oder ISO String
    tatsaechliche_rueckgabe?: string; // Format: YYYY-MM-DD oder ISO String
    kaution?: number;
    gesamtpreis?: number;
    status?: LookupValue;
    zustand_rueckgabe?: LookupValue;
    bemerkungen?: string;
  };
}

export interface Skateparks {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    parkname?: string;
    strasse?: string;
    hausnummer?: string;
    plz?: string;
    ort?: string;
    standort?: GeoLocation; // { lat, long, info }
    oeffnungszeiten?: string;
    ansprechperson?: string;
    bemerkungen?: string;
  };
}

export const APP_IDS = {
  SKATEBOARDS: '6ad12739611489deef692845',
  KUNDEN: '6ad1273e3580fb147eb0f851',
  VERLEIHVORGAENGE: '6ad1273ec5892a2621bd28db',
  SKATEPARKS: '6ad1273f612df2d2d9f2b8aa',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'skateboards': {
    typ: [{ key: "street", get label() { return lookupLabel('skateboards', 'typ', "street") ?? "Street"; } }, { key: "longboard", get label() { return lookupLabel('skateboards', 'typ', "longboard") ?? "Longboard"; } }, { key: "anfaenger_set", get label() { return lookupLabel('skateboards', 'typ', "anfaenger_set") ?? "Anfänger-Set"; } }, { key: "elektro", get label() { return lookupLabel('skateboards', 'typ', "elektro") ?? "Elektro"; } }, { key: "cruiser", get label() { return lookupLabel('skateboards', 'typ', "cruiser") ?? "Cruiser"; } }],
    zustand: [{ key: "neu", get label() { return lookupLabel('skateboards', 'zustand', "neu") ?? "Neu"; } }, { key: "gut", get label() { return lookupLabel('skateboards', 'zustand', "gut") ?? "Gut"; } }, { key: "gebraucht", get label() { return lookupLabel('skateboards', 'zustand', "gebraucht") ?? "Gebraucht"; } }, { key: "reparaturbeduerftig", get label() { return lookupLabel('skateboards', 'zustand', "reparaturbeduerftig") ?? "Reparaturbedürftig"; } }],
  },
  'kunden': {
    schutzausruestung: [{ key: "knieschoner", get label() { return lookupLabel('kunden', 'schutzausruestung', "knieschoner") ?? "Knieschoner"; } }, { key: "ellbogenschoner", get label() { return lookupLabel('kunden', 'schutzausruestung', "ellbogenschoner") ?? "Ellbogenschoner"; } }, { key: "handgelenkschoner", get label() { return lookupLabel('kunden', 'schutzausruestung', "handgelenkschoner") ?? "Handgelenkschoner"; } }, { key: "helm", get label() { return lookupLabel('kunden', 'schutzausruestung', "helm") ?? "Helm"; } }],
  },
  'verleihvorgaenge': {
    status: [{ key: "reserviert", get label() { return lookupLabel('verleihvorgaenge', 'status', "reserviert") ?? "Reserviert"; } }, { key: "verliehen", get label() { return lookupLabel('verleihvorgaenge', 'status', "verliehen") ?? "Verliehen"; } }, { key: "zurueckgegeben", get label() { return lookupLabel('verleihvorgaenge', 'status', "zurueckgegeben") ?? "Zurückgegeben"; } }, { key: "ueberfaellig", get label() { return lookupLabel('verleihvorgaenge', 'status', "ueberfaellig") ?? "Überfällig"; } }],
    zustand_rueckgabe: [{ key: "einwandfrei", get label() { return lookupLabel('verleihvorgaenge', 'zustand_rueckgabe', "einwandfrei") ?? "Einwandfrei"; } }, { key: "leichte_gebrauchsspuren", get label() { return lookupLabel('verleihvorgaenge', 'zustand_rueckgabe', "leichte_gebrauchsspuren") ?? "Leichte Gebrauchsspuren"; } }, { key: "beschaedigt", get label() { return lookupLabel('verleihvorgaenge', 'zustand_rueckgabe', "beschaedigt") ?? "Beschädigt"; } }],
  },
};

// Optimistic LookupValue writes: never re-type a label — resolve the schema
// option instead (its label is a locale-aware getter; falls back to the key).
// WRONG: status: { key: 'offen', label: 'Offen' }   (frozen in one language)
// RIGHT: status: lookupOption('<appKey>', 'status', 'offen')
export function lookupOption(app: string, field: string, key: string): LookupValue {
  return LOOKUP_OPTIONS[app]?.[field]?.find(o => o.key === key) ?? { key, label: key };
}

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'skateboards': {
    'bezeichnung': 'string/text',
    'marke': 'string/text',
    'typ': 'lookup/select',
    'deckbreite': 'number',
    'zustand': 'lookup/radio',
    'preis_pro_tag': 'number',
    'verfuegbar': 'bool',
    'foto': 'file',
    'bemerkungen': 'string/textarea',
  },
  'kunden': {
    'kunde_firstname': 'string/text',
    'kunde_lastname': 'string/text',
    'geburtsdatum': 'date/date',
    'email': 'string/email',
    'telefon': 'string/tel',
    'instagram_profil': 'string/url',
    'strasse': 'string/text',
    'hausnummer': 'string/text',
    'plz': 'string/text',
    'ort': 'string/text',
    'schutzausruestung': 'multiplelookup/checkbox',
  },
  'verleihvorgaenge': {
    'kunde': 'applookup/select',
    'skateboard': 'applookup/select',
    'ausleihdatum': 'date/date',
    'geplante_rueckgabe': 'date/date',
    'tatsaechliche_rueckgabe': 'date/date',
    'kaution': 'number',
    'gesamtpreis': 'number',
    'status': 'lookup/select',
    'zustand_rueckgabe': 'lookup/radio',
    'bemerkungen': 'string/textarea',
  },
  'skateparks': {
    'parkname': 'string/text',
    'strasse': 'string/text',
    'hausnummer': 'string/text',
    'plz': 'string/text',
    'ort': 'string/text',
    'standort': 'geo',
    'oeffnungszeiten': 'string/text',
    'ansprechperson': 'string/text',
    'bemerkungen': 'string/textarea',
  },
};

export const HUB_TOPOLOGY: Record<string, { field: string; entity: string }[]> = {
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateSkateboards = StripLookup<Skateboards['fields']>;
export type CreateKunden = StripLookup<Kunden['fields']>;
export type CreateVerleihvorgaenge = StripLookup<Verleihvorgaenge['fields']>;
export type CreateSkateparks = StripLookup<Skateparks['fields']>;