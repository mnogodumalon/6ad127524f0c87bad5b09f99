/**
 * useVerleihAnlegenFlow — the plumbing of the flow « Verleih anlegen », generated from the plan.
 *
 * Writes `kunden` (only when the person fills it): asks `kunde_firstname`, `kunde_lastname`, `geburtsdatum`, `email`, `telefon`, `instagram_profil`, `schutzausruestung`.
Writes `verleihvorgaenge`: asks `kunde`, `skateboard`, `ausleihdatum`, `geplante_rueckgabe`, `kaution`; sets `status` itself; links `kunde` ← the created `kunden`.
 * The hook OWNS: the form(s) with exactly these fields and the plan's required
 * ingredients, one record search per picked field (columns and filter from
 * the plan), and the submit plan with its fixed and derived values. A page
 * that only calls `flow.submit.run()` cannot write a field the plan does not
 * know — there is no way to spell it.
 *
 * YOU decide what a person notices, through the options:
 *   steps     which wizard step asks which field (default: one step per pick,
 *             then one for the typed fields, then "Prüfen" = step 4)
 *   items     how a search hit is displayed per pick (title, subtitle, status …)
 *   initial   prefills for typed fields
 *   messages  the sentence for an empty required field, per field
 *
 *   const flow = useVerleihAnlegenFlow({
 *     steps: { kunde: 1, skateboard: 2, kunde_firstname: 3, kunde_lastname: 3, geburtsdatum: 3, email: 3, telefon: 3, instagram_profil: 3, schutzausruestung: 3, ausleihdatum: 3, geplante_rueckgabe: 3, kaution: 3 },
 *     items: { kunde: r => ({ id: r.id, title: fieldText(r, 'kunde_firstname') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.kunde.select} {...flow.pick('kunde')} />
 *     <EntitySelectStep {...flow.picks.skateboard.select} {...flow.pick('skateboard')} />
 *     <Bound form={flow.forms.kunden} name="kunde_firstname" />
 *     <Bound form={flow.forms.kunden} name="kunde_lastname" />
 *     <Bound form={flow.forms.kunden} name="geburtsdatum" />
 *     <Bound form={flow.forms.kunden} name="email" />
 *     <Bound form={flow.forms.kunden} name="telefon" />
 *     <Bound form={flow.forms.kunden} name="instagram_profil" />
 *     <Bound form={flow.forms.kunden} name="schutzausruestung" />
 *     <Bound form={flow.forms.verleihvorgaenge} name="ausleihdatum" />
 *     <Bound form={flow.forms.verleihvorgaenge} name="geplante_rueckgabe" />
 *     <Bound form={flow.forms.verleihvorgaenge} name="kaution" />
 *     <StepNav onNext={() => flow.validateStep(n)} />
 *     {!flow.submit.done && <SummaryStep forms={flow.formList} submit={flow.submit} />}
 *     {flow.submit.result && <SuccessStep result={flow.submit.result} forms={flow.formList} submit={flow.submit} />}
 *   </IntentWizardShell>
 */
import {
  useStepForm, useJourneySubmit, useRecordSearch,
  fieldText, fieldLookup, fieldLookups, fieldNumber, fieldDate, fieldRef,
  todayIso, nowIso, isEmptyValue, policyFixedValue, withPickPolicy, usePolicyVersion,
  type StepForm, type JourneyRecord, type RefContext, type SelectItemLike, type FormValues, type PlanStep, type SummaryItem,} from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { pickHint, whereSentence, type PickWhere } from '@/lib/journey/policy';
import { labelOf, optionsOf, type EntityKey } from '@/lib/journey/rules';
export type VerleihAnlegenFieldKey = 'ausleihdatum' | 'email' | 'geburtsdatum' | 'geplante_rueckgabe' | 'instagram_profil' | 'kaution' | 'kunde' | 'kunde_firstname' | 'kunde_lastname' | 'schutzausruestung' | 'skateboard' | 'telefon';

export interface VerleihAnlegenForms {
  kunden: StepForm<'kunden'>;
  verleihvorgaenge: StepForm<'verleihvorgaenge'>;
}

// Alias so the option generics stay readable.
type Key = VerleihAnlegenFieldKey;

export interface VerleihAnlegenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    kunde?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    skateboard?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"ausleihdatum": 3, "email": 3, "geburtsdatum": 3, "geplante_rueckgabe": 3, "instagram_profil": 3, "kaution": 3, "kunde": 1, "kunde_firstname": 3, "kunde_lastname": 3, "schutzausruestung": 3, "skateboard": 2, "telefon": 3};
export const VERLEIHANLEGEN_REVIEW_STEP = 4;

function fromPick<T>(pick: { recordOf(id: string): JourneyRecord | undefined }, form: StepForm, field: string, read: (r: JourneyRecord) => T): T | undefined {
  const id = form.get(field);
  const rec = typeof id === 'string' && id ? pick.recordOf(id) : undefined;
  return rec ? read(rec) : undefined;
}
function isoDaysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Returns T, not Partial<T>: a Record's index signature is already "maybe
// absent", and Partial<Record<string, string>> does not assign to the
// Record<string, string> useStepForm wants (tsc, live 23.09.2026 — eight
// errors, one per hook, caught only in the sandbox build).
function only<T extends Record<string, unknown>>(obj: T | undefined, keys: string[]): T | undefined {
  if (!obj) return undefined;
  const out: Record<string, unknown> = {};
  for (const k of keys) if (k in obj) out[k] = obj[k];
  return out as T;
}

function hasValues(form: StepForm): boolean {
  return form.keys.some(k => !isEmptyValue(form.values[k]));
}

export function useVerleihAnlegenFlow(options: VerleihAnlegenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const kunden = useStepForm('kunden', {
    fields: ["kunde_firstname", "kunde_lastname", "geburtsdatum", "email", "telefon", "instagram_profil", "schutzausruestung"],
    steps: only(steps, ["kunde_firstname", "kunde_lastname", "geburtsdatum", "email", "telefon", "instagram_profil", "schutzausruestung"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["kunde_firstname", "kunde_lastname", "geburtsdatum", "email", "telefon", "instagram_profil", "schutzausruestung"]),
    messages: only(options.messages as Record<string, string> | undefined, ["kunde_firstname", "kunde_lastname", "geburtsdatum", "email", "telefon", "instagram_profil", "schutzausruestung"]),
  });
  const verleihvorgaenge = useStepForm('verleihvorgaenge', {
    fields: ["kunde", "skateboard", "ausleihdatum", "geplante_rueckgabe", "kaution"],
    steps: only(steps, ["kunde", "skateboard", "ausleihdatum", "geplante_rueckgabe", "kaution"]) as Record<string, number>,
    // the plan builds a value from these — required here, whatever the app's base view says
    required: { ausleihdatum: true, geplante_rueckgabe: true, skateboard: true },
    initial: only(options.initial as FormValues | undefined, ["kunde", "skateboard", "ausleihdatum", "geplante_rueckgabe", "kaution"]),
    messages: only(options.messages as Record<string, string> | undefined, ["kunde", "skateboard", "ausleihdatum", "geplante_rueckgabe", "kaution"]),
  });
  const forms: VerleihAnlegenForms = { kunden, verleihvorgaenge };
  const formList: StepForm[] = [kunden, verleihvorgaenge];

  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    kunde: useRecordSearch(servicePort, 'kunden', withPickPolicy('kunde', {
      searchFields: ["kunde_firstname", "kunde_lastname", "email", "telefon"] as never,
      toItem: options.items?.kunde as never,
    })),
    skateboard: useRecordSearch(servicePort, 'skateboards', withPickPolicy('skateboard', {
      searchFields: ["bezeichnung", "marke"] as never,
      filter: "r.v_verfuegbar == True and r.v_zustand != 'reparaturbeduerftig'",
      where: (r: JourneyRecord) => r.fields["verfuegbar"] === true && (fieldLookup(r, "zustand")?.key ?? null) !== "reparaturbeduerftig",
      toItem: options.items?.skateboard as never,
    })),
  };
  // Whether a pick offers „Neu anlegen“ is the plan's call: off for the record
  // this flow changes, for multi picks, for a catalogue entity and for an
  // entity with its own flow. The page spreads `.select` and writes no `create=`.
  // what the person sees under the search field: the rule that narrows the
  // pick (the owner's, else the plan's) — and the link that changes it
  const hintFor = (key: string, entity: EntityKey, planned: PickWhere | null) => pickHint(key, planned,
    w => whereSentence(w, f => labelOf(entity, f), (f, v) => optionsOf(entity, f).find(o => o.key === String(v))?.label ?? String(v)),
    `#/verwaltung/anwendung?line=intent:verleih-anlegen:read:${entity}`);
  // a fixed value the flow sets itself, as a review row with the link that changes it
  const setting = (entity: EntityKey, field: string, value: unknown): SummaryItem => ({
    key: `setting:${entity}.${field}`, label: labelOf(entity, field),
    value: optionsOf(entity, field).find(o => o.key === String(value))?.label ?? String(value ?? ''),
    href: `#/verwaltung/anwendung?line=intent:verleih-anlegen:write:${entity}.${field}`,
  });
  const picks = {
    kunde: { ...searches.kunde, select: { ...searches.kunde.select, create: false as boolean, hint: hintFor('kunde', 'kunden', null as PickWhere | null) } },
    skateboard: { ...searches.skateboard, select: { ...searches.skateboard.select, create: false as boolean, hint: hintFor('skateboard', 'skateboards', {"conditions": [{"field": "verfuegbar", "op": "eq", "value": "true"}, {"field": "zustand", "op": "ne", "value": "reparaturbeduerftig"}], "mode": "all"} as PickWhere | null) } },
  };

  const kundenFilled = hasValues(kunden);
  const plan: PlanStep[] = [
    ...(kundenFilled ? [{
      key: 'kunden', entity: 'kunden', form: kunden,    } as PlanStep] : []),
    {
      key: 'verleihvorgaenge', entity: 'verleihvorgaenge', form: verleihvorgaenge, primary: true,      needs: [kundenFilled ? 'kunden' : null].filter((x): x is string => !!x),
      link: { ...(kundenFilled ? { kunde: 'kunden' } : {}) },

      values: (): FormValues => ({
        status: policyFixedValue('verleihvorgaenge', 'status') ?? "reserviert",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('verleihvorgaenge', 'status', policyFixedValue('verleihvorgaenge', 'status') ?? "reserviert")],
    },
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'verleih-anlegen' });

  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: VerleihAnlegenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return {
      selectedId: (typeof owner.get(field) === 'string' ? (owner.get(field) as string) : null) || null,
      // `field as never` collapsed the conditional SetArgs<E, never> to never and
      // no argument was assignable any more (tsc, live 23.09.2026); widen `set`
      // itself instead — the label stays a required third argument.
      onSelect: (id: string) => (owner.set as (k: string, v: unknown, l?: string) => void)(field, id, search?.labelOf(id)),
    };
  };
  /** Props for a multi-record pick step: {...flow.picks.x.select} {...flow.pickMany('x')} */
  const pickMany = (field: VerleihAnlegenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)));
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); };

  return {
    slug: 'verleih-anlegen' as const,
    draftKey: 'verleih-anlegen' as const,
    entity: 'verleihvorgaenge' as const,
    form: verleihvorgaenge,
    forms, formList, picks, submit, steps,    reviewStep: VERLEIHANLEGEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,
    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type VerleihAnlegenFlow = ReturnType<typeof useVerleihAnlegenFlow>;
