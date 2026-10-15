import type { Verleihvorgaenge, Kunden, Skateboards } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { usePermissions } from '@/lib/permissions';

export interface VerleihvorgaengeDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Verleihvorgaenge;
  /** N:1-Ziel „Kunden": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  kundenList: Kunden[];
  /** Klick auf die Kunden-Relation → overlay.push auf dessen Detail. */
  onOpenKunden?: (record: Kunden) => void;
  /** N:1-Ziel „Skateboards": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  skateboardsList: Skateboards[];
  /** Klick auf die Skateboards-Relation → overlay.push auf dessen Detail. */
  onOpenSkateboards?: (record: Skateboards) => void;
}

export function VerleihvorgaengeDetails({
  record,
  kundenList,
  onOpenKunden,
  skateboardsList,
  onOpenSkateboards,
}: VerleihvorgaengeDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const kundeTarget = kundenList.find(r => r.record_id === extractRecordId(record.fields.kunde));
  const skateboardTarget = skateboardsList.find(r => r.record_id === extractRecordId(record.fields.skateboard));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('verleihvorgaenge', 'ausleihdatum')} value={record.fields.ausleihdatum} format="date" />
        <RecordField label={fieldLabel('verleihvorgaenge', 'geplante_rueckgabe')} value={record.fields.geplante_rueckgabe} format="date" />
        <RecordField label={fieldLabel('verleihvorgaenge', 'tatsaechliche_rueckgabe')} value={record.fields.tatsaechliche_rueckgabe} format="date" />
        <RecordField label={fieldLabel('verleihvorgaenge', 'kaution')} value={record.fields.kaution} format="text" />
        <RecordField label={fieldLabel('verleihvorgaenge', 'gesamtpreis')} value={record.fields.gesamtpreis} format="text" />
        <RecordField label={fieldLabel('verleihvorgaenge', 'status')} value={record.fields.status} format="pill" />
        <RecordField label={fieldLabel('verleihvorgaenge', 'zustand_rueckgabe')} value={record.fields.zustand_rueckgabe} format="pill" />
        <RecordField label={fieldLabel('verleihvorgaenge', 'bemerkungen')} value={record.fields.bemerkungen} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('verleihvorgaenge', 'kunde')}
          name={kundeTarget?.fields.kunde_firstname ?? '—'}
          meta={[kundeTarget?.fields.email, kundeTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={kundeTarget && onOpenKunden ? () => onOpenKunden!(kundeTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('verleihvorgaenge', 'skateboard')}
          name={skateboardTarget?.fields.bezeichnung ?? '—'}
          meta={[skateboardTarget?.fields.marke].filter(Boolean).join(' · ') || undefined}
          onClick={skateboardTarget && onOpenSkateboards ? () => onOpenSkateboards!(skateboardTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.VERLEIHVORGAENGE} recordId={record.record_id} readOnly={!perms.canWrite('verleihvorgaenge')} />
    </>
  );
}
