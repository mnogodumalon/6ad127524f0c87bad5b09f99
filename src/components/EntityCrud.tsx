/**
 * EntityCrud — pre-generated CRUD + overlay plumbing for the dashboard.
 * Compose it; NEVER re-roll dialog state, submit handlers, an overlay stack
 * or a RecordOverlayHost in the page — this file owns all of it.
 *
 * API at a glance:
 *   const data = useDashboardData();
 *   const crud = useEntityCrud(data, {
 *     // optional — the ONE semantic slot on the overlay: the record's next
 *     // workflow step. Return undefined for types without one.
 *     footer: (top) => top.type === 'skateboards'
 *       ? { label: …, onClick: () => … }
 *       : undefined,
 *   });
 *
 *   `top.type` is the SAME camelCase key as `crud.<entity>` — one spelling
 *   per entity, everywhere in this API.
 *   …
 *   crud.skateboards.openCreate({ …defaults })   // create dialog, prefilled — defaults are
 *                                       // shape-tolerant: bare lookup keys / record ids are fine
 *   crud.skateboards.openEdit(record)            // edit dialog (recordId + defaults wired)
 *   crud.skateboards.openDetail(record)          // record overlay — pass the RAW record,
 *                                       // enrichment is resolved inside
 *   crud.overlay                         // RecordOverlayStack<OverlayItem> for drills:
 *                                       // push / pop / replace / close
 *   crud.enriched.skateboards              // the display-ready array for EVERY entity —
 *                                       // Enriched* where relations exist, the raw array
 *                                       // otherwise. Reuse these; never call enrich*()
 *                                       // in the page, and never guess which entity has
 *                                       // one: they all do.
 *   {crud.surfaces}                      // render ONCE at the end of the page JSX:
 *                                       // all entity dialogs + the overlay host
 *
 * Built in (do NOT re-implement): optimistic update + Rückgängig counter-write
 * on edit, fetchAll-on-error, edit-from-overlay, and per-entity overlay bodies
 * (RecordHeader + <{Entity}Details> with every relation reachable and the
 * contextual "+" prefilled; list-field back-references additionally get a
 * "choose existing" picker that links an EXISTING record — built in, do not
 * re-roll). Drag writes (onEventDrop/onCardMove) stay YOURS:
 * optimistic setter first, PATCH in background, undoToast with counter-write.
 *
 * Overlay content per entity (the host renders these — you never compose
 * Details blocks yourself):
 *   skateboards: bezeichnung, marke, typ, deckbreite, zustand, preis_pro_tag, verfuegbar, foto, …  ·  ← verleihvorgaenge (list + contextual +)
 *   kunden: kunde_firstname, kunde_lastname, geburtsdatum, email, telefon, instagram_profil, strasse, hausnummer, …  ·  ← verleihvorgaenge (list + contextual +)
 *   verleihvorgaenge: kunde, skateboard, ausleihdatum, geplante_rueckgabe, tatsaechliche_rueckgabe, kaution, gesamtpreis, status, …  ·  → kunden · → skateboards
 *   skateparks: parkname, strasse, hausnummer, plz, ort, standort, oeffnungszeiten, ansprechperson, …
 */
import { useState, useMemo, type ReactNode } from 'react';
import type { Skateboards, Kunden, Verleihvorgaenge, Skateparks } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { enrichVerleihvorgaenge } from '@/lib/enrich';
import type { EnrichedVerleihvorgaenge } from '@/types/enriched';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  useRecordOverlayStack, RecordOverlayHost, RecordHeader,
  type RecordOverlayStack,
} from '@/components/widgets/RecordView';
import { SkateboardsDialog, type SkateboardsDialogDefaults } from '@/components/dialogs/SkateboardsDialog';
import { SkateboardsDetails } from '@/components/details/SkateboardsDetails';
import { KundenDialog, type KundenDialogDefaults } from '@/components/dialogs/KundenDialog';
import { KundenDetails } from '@/components/details/KundenDetails';
import { VerleihvorgaengeDialog, type VerleihvorgaengeDialogDefaults } from '@/components/dialogs/VerleihvorgaengeDialog';
import { VerleihvorgaengeDetails } from '@/components/details/VerleihvorgaengeDetails';
import { SkateparksDialog, type SkateparksDialogDefaults } from '@/components/dialogs/SkateparksDialog';
import { SkateparksDetails } from '@/components/details/SkateparksDetails';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { t, appLabel } from '@/i18n';
import { undoToast } from '@/lib/polish';
import { usePermissions } from '@/lib/permissions';
import { toast } from 'sonner';
import { formatDate } from '@/lib/formatters';

// The overlay union — one branch per entity, `record` typed the way the data
// flows: Enriched* where enrichment exists, the raw record type otherwise.
// The host resolves enrichment itself; pages pass raw records everywhere.
export type OverlayItem =
  | { type: 'skateboards'; record: Skateboards }
  | { type: 'kunden'; record: Kunden }
  | { type: 'verleihvorgaenge'; record: EnrichedVerleihvorgaenge }
  | { type: 'skateparks'; record: Skateparks };

/** The useDashboardData() return — pass it in, never re-fetch inside. */
export type EntityCrudData = ReturnType<typeof useDashboardData>;

export interface EntityCrudOptions {
  /** Per-type overlay footer — the record's next workflow step. */
  footer?: (top: OverlayItem) => ReactNode | { label: ReactNode; onClick: () => void } | undefined;
  placement?: 'side' | 'center';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface EntityCrudApi<TRecord, TDefaults> {
  /** Open the create dialog, optionally prefilled (shape-tolerant defaults). */
  openCreate: (defaults?: TDefaults) => void;
  /** Open the edit dialog for a record (recordId + defaults are wired). */
  openEdit: (record: TRecord) => void;
  /** Open the record overlay (raw record is fine — enrichment resolved inside). */
  openDetail: (record: TRecord) => void;
  /** May the signed-in user create/change records of this list? (the
   *  platform's rights — show a „+ Neu“ only when true; openCreate/openEdit
   *  refuse with a notice otherwise). */
  canWrite: boolean;
}

export interface EntityCrud {
  /** The overlay stack for drills: push / pop / replace / close. */
  overlay: RecordOverlayStack<OverlayItem>;
  /** Render ONCE at the end of the page JSX — all dialogs + the overlay host. */
  surfaces: ReactNode;
  skateboards: EntityCrudApi<Skateboards, SkateboardsDialogDefaults>;
  kunden: EntityCrudApi<Kunden, KundenDialogDefaults>;
  verleihvorgaenge: EntityCrudApi<Verleihvorgaenge, VerleihvorgaengeDialogDefaults>;
  skateparks: EntityCrudApi<Skateparks, SkateparksDialogDefaults>;
  /** The display-ready array per entity: Enriched* where an enrich function
   *  exists, the raw array otherwise. One key per entity so no page has to
   *  know which is which. Reuse these; never re-enrich in the page. */
  enriched: { skateboards: Skateboards[]; kunden: Kunden[]; verleihvorgaenge: EnrichedVerleihvorgaenge[]; skateparks: Skateparks[] };
}

export function useEntityCrud(data: EntityCrudData, options?: EntityCrudOptions): EntityCrud {
  const overlay = useRecordOverlayStack<OverlayItem>();
  // the platform's rights of the signed-in user (lib/permissions.ts) — unknown = allowed
  const perms = usePermissions();
  const refuse = () => { toast.error(t('perm_denied_title'), { description: t('perm_denied_desc') }); };
  const [skateboardsDialog, setSkateboardsDialog] = useState<{ defaults?: SkateboardsDialogDefaults; editing?: Skateboards } | null>(null);
  const [kundenDialog, setKundenDialog] = useState<{ defaults?: KundenDialogDefaults; editing?: Kunden } | null>(null);
  const [verleihvorgaengeDialog, setVerleihvorgaengeDialog] = useState<{ defaults?: VerleihvorgaengeDialogDefaults; editing?: Verleihvorgaenge } | null>(null);
  const [skateparksDialog, setSkateparksDialog] = useState<{ defaults?: SkateparksDialogDefaults; editing?: Skateparks } | null>(null);
  const enrichedVerleihvorgaenge = useMemo(() => enrichVerleihvorgaenge(data.verleihvorgaenge, { kundenMap: data.kundenMap, skateboardsMap: data.skateboardsMap }), [data.verleihvorgaenge, data.kundenMap, data.skateboardsMap]);

  function detailSkateboards(record: Skateboards, push = false) {
    const item: OverlayItem = { type: 'skateboards', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitSkateboards(fields: Skateboards['fields']) {
    const editing = skateboardsDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setSkateboards(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateSkateboard(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('skateboards')} — ${t('crud_updated')}`, async () => {
        data.setSkateboards(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateSkateboard(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createSkateboard(fields);
      undoToast(`${appLabel('skateboards')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailKunden(record: Kunden, push = false) {
    const item: OverlayItem = { type: 'kunden', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitKunden(fields: Kunden['fields']) {
    const editing = kundenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setKunden(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateKundenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('kunden')} — ${t('crud_updated')}`, async () => {
        data.setKunden(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateKundenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createKundenEntry(fields);
      undoToast(`${appLabel('kunden')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailVerleihvorgaenge(record: Verleihvorgaenge, push = false) {
    const rec = enrichedVerleihvorgaenge.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'verleihvorgaenge', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitVerleihvorgaenge(fields: Verleihvorgaenge['fields']) {
    const editing = verleihvorgaengeDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setVerleihvorgaenge(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateVerleihvorgaengeEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('verleihvorgaenge')} — ${t('crud_updated')}`, async () => {
        data.setVerleihvorgaenge(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateVerleihvorgaengeEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createVerleihvorgaengeEntry(fields);
      undoToast(`${appLabel('verleihvorgaenge')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailSkateparks(record: Skateparks, push = false) {
    const item: OverlayItem = { type: 'skateparks', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitSkateparks(fields: Skateparks['fields']) {
    const editing = skateparksDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setSkateparks(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateSkatepark(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('skateparks')} — ${t('crud_updated')}`, async () => {
        data.setSkateparks(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateSkatepark(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createSkatepark(fields);
      undoToast(`${appLabel('skateparks')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  const surfaces = (
    <>
      <SkateboardsDialog
        open={skateboardsDialog !== null}
        onClose={() => setSkateboardsDialog(null)}
        onSubmit={submitSkateboards}
        defaultValues={skateboardsDialog?.defaults}
        recordId={skateboardsDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Skateboards']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Skateboards']}
      />
      <KundenDialog
        open={kundenDialog !== null}
        onClose={() => setKundenDialog(null)}
        onSubmit={submitKunden}
        defaultValues={kundenDialog?.defaults}
        recordId={kundenDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Kunden']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Kunden']}
      />
      <VerleihvorgaengeDialog
        open={verleihvorgaengeDialog !== null}
        onClose={() => setVerleihvorgaengeDialog(null)}
        onSubmit={submitVerleihvorgaenge}
        defaultValues={verleihvorgaengeDialog?.defaults}
        recordId={verleihvorgaengeDialog?.editing?.record_id}
        kundenList={data.kunden}
        skateboardsList={data.skateboards}
        enablePhotoScan={AI_PHOTO_SCAN['Verleihvorgaenge']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Verleihvorgaenge']}
      />
      <SkateparksDialog
        open={skateparksDialog !== null}
        onClose={() => setSkateparksDialog(null)}
        onSubmit={submitSkateparks}
        defaultValues={skateparksDialog?.defaults}
        recordId={skateparksDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Skateparks']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Skateparks']}
      />
      <RecordOverlayHost
        overlay={overlay}
        placement={options?.placement}
        size={options?.size}
        footer={options?.footer}
        render={(top) => {
          if (top.type === 'skateboards') {
            return (
              <>
                <RecordHeader title={top.record.fields.bezeichnung ?? appLabel('skateboards')} subtitle={undefined} />
                <SkateboardsDetails
                  record={top.record}
                  verleihvorgaengeList={data.verleihvorgaenge}
                  onOpenVerleihvorgaenge={(r) => detailVerleihvorgaenge(r, true)}
                  onAddVerleihvorgaenge={perms.canWrite('verleihvorgaenge') ? () => setVerleihvorgaengeDialog({ defaults: { skateboard: createRecordUrl(APP_IDS.SKATEBOARDS, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'kunden') {
            return (
              <>
                <RecordHeader title={top.record.fields.kunde_firstname ?? appLabel('kunden')} subtitle={top.record.fields.geburtsdatum ? formatDate(top.record.fields.geburtsdatum) : undefined} />
                <KundenDetails
                  record={top.record}
                  verleihvorgaengeList={data.verleihvorgaenge}
                  onOpenVerleihvorgaenge={(r) => detailVerleihvorgaenge(r, true)}
                  onAddVerleihvorgaenge={perms.canWrite('verleihvorgaenge') ? () => setVerleihvorgaengeDialog({ defaults: { kunde: createRecordUrl(APP_IDS.KUNDEN, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'verleihvorgaenge') {
            return (
              <>
                <RecordHeader title={appLabel('verleihvorgaenge')} subtitle={top.record.fields.ausleihdatum ? formatDate(top.record.fields.ausleihdatum) : undefined} />
                <VerleihvorgaengeDetails
                  record={top.record}
                  kundenList={data.kunden}
                  onOpenKunden={(r) => detailKunden(r, true)}
                  skateboardsList={data.skateboards}
                  onOpenSkateboards={(r) => detailSkateboards(r, true)}
                />
              </>
            );
          }
          if (top.type === 'skateparks') {
            return (
              <>
                <RecordHeader title={top.record.fields.parkname ?? appLabel('skateparks')} subtitle={undefined} />
                <SkateparksDetails
                  record={top.record}
                />
              </>
            );
          }
          return null;
        }}
        canEdit={(top) => {
          if (top.type === 'skateboards') return perms.canWrite('skateboards');
          if (top.type === 'kunden') return perms.canWrite('kunden');
          if (top.type === 'verleihvorgaenge') return perms.canWrite('verleihvorgaenge');
          if (top.type === 'skateparks') return perms.canWrite('skateparks');
          return true;
        }}
        onEdit={(top) => {
          overlay.close();
          if (top.type === 'skateboards') setSkateboardsDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'kunden') setKundenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'verleihvorgaenge') setVerleihvorgaengeDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'skateparks') setSkateparksDialog({ editing: top.record, defaults: top.record.fields });
        }}
      />
    </>
  );

  return {
    overlay,
    surfaces,
    skateboards: {
      openCreate: (defaults?: SkateboardsDialogDefaults) => (perms.canWrite('skateboards') ? setSkateboardsDialog({ defaults }) : refuse()),
      openEdit: (record: Skateboards) => (perms.canWrite('skateboards') ? setSkateboardsDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Skateboards) => detailSkateboards(record, false),
      canWrite: perms.canWrite('skateboards'),
    },
    kunden: {
      openCreate: (defaults?: KundenDialogDefaults) => (perms.canWrite('kunden') ? setKundenDialog({ defaults }) : refuse()),
      openEdit: (record: Kunden) => (perms.canWrite('kunden') ? setKundenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Kunden) => detailKunden(record, false),
      canWrite: perms.canWrite('kunden'),
    },
    verleihvorgaenge: {
      openCreate: (defaults?: VerleihvorgaengeDialogDefaults) => (perms.canWrite('verleihvorgaenge') ? setVerleihvorgaengeDialog({ defaults }) : refuse()),
      openEdit: (record: Verleihvorgaenge) => (perms.canWrite('verleihvorgaenge') ? setVerleihvorgaengeDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Verleihvorgaenge) => detailVerleihvorgaenge(record, false),
      canWrite: perms.canWrite('verleihvorgaenge'),
    },
    skateparks: {
      openCreate: (defaults?: SkateparksDialogDefaults) => (perms.canWrite('skateparks') ? setSkateparksDialog({ defaults }) : refuse()),
      openEdit: (record: Skateparks) => (perms.canWrite('skateparks') ? setSkateparksDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Skateparks) => detailSkateparks(record, false),
      canWrite: perms.canWrite('skateparks'),
    },
    enriched: { skateboards: data.skateboards, kunden: data.kunden, verleihvorgaenge: enrichedVerleihvorgaenge, skateparks: data.skateparks },
  };
}
