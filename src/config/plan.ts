// The orchestrator's plan, as far as the running app needs it
// (docs/orchestrator/SPEC.md). Generated — do not edit; regenerated on every
// build and update from the stored plan. Without a plan every map is empty.
//
//   SYSTEM_ASSIGNED entity → fields a tool fills when a record is CREATED — the
//                   value does not exist before; dialogs hide these on create and
//                   the form-polish sets no default on them. A scheduled or
//                   update-triggered tool owns its field but is NOT in here.
//   PLAN_SENTENCES  slug → the plan in the owner's words (flows' field page)
//
// The runtime write guard (FLOW_WRITES/OWNERSHIP, planGuard.ts) left on
// 23.09.2026: a flow page composes against its generated hook, whose submit
// plan IS the Schreibliste — there is no way to spell a write outside it.

export const SYSTEM_ASSIGNED: Record<string, string[]> = {
  "verleihvorgaenge": [
    "gesamtpreis"
  ]
};

export const PLAN_SENTENCES: Record<string, string[]> = {
  "verleih-anlegen": [
    "Legt an: kunden, verleihvorgaenge",
    "Automatisch: status (fester Wert „reserviert“)"
  ],
  "board-ausgeben": [
    "Ändert: skateboards, verleihvorgaenge",
    "Automatisch: status (fester Wert „verliehen“), verfuegbar (fester Wert „false“)"
  ],
  "rueckgabe-erfassen": [
    "Ändert: skateboards, verleihvorgaenge",
    "Automatisch: tatsaechliche_rueckgabe (heutiges Datum, automatisch), status (fester Wert „zurueckgegeben“), verfuegbar (fester Wert „true“)"
  ]
};

export const PLAN_SUMMARY = "Die Anwendung verwaltet den Verleih von Skateboards: Boards, Kunden und jeden Verleihvorgang vom Reservieren bis zur Rückgabe. Zusätzlich gibt es eine Übersicht der Skateparks, in denen ihr präsent seid. Jeder Kunde kann optional einen Instagram-Profil-Link hinterlegen.";

/** slug → the lists a flow writes (the plan's Schreibliste). The nav leaves a
 *  flow out for a user who may not write one of them (lib/permissions.ts). */
export const FLOW_ENTITIES: Record<string, string[]> = {
  "verleih-anlegen": [
    "kunden",
    "verleihvorgaenge"
  ],
  "board-ausgeben": [
    "skateboards",
    "verleihvorgaenge"
  ],
  "rueckgabe-erfassen": [
    "skateboards",
    "verleihvorgaenge"
  ]
};
