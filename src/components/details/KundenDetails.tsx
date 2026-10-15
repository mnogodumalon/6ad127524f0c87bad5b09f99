import type { Kunden, Verleihvorgaenge } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface KundenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Kunden;
  /** 1:N „Verleihvorgänge" (kunde): VOLLE Liste — der Block filtert auf diesen Record. */
  verleihvorgaengeList: Verleihvorgaenge[];
  /** Zeilen-Klick → overlay.push auf das Verleihvorgaenge-Detail (nie der Edit-Dialog). */
  onOpenVerleihvorgaenge: (record: Verleihvorgaenge) => void;
  /** Kontextuelles „+": öffnet den Verleihvorgaenge-Dialog mit diesem Record vorgesetzt. */
  onAddVerleihvorgaenge?: () => void;
}

export function KundenDetails({
  record,
  verleihvorgaengeList,
  onOpenVerleihvorgaenge,
  onAddVerleihvorgaenge,
}: KundenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('kunden', 'kunde_firstname')} value={record.fields.kunde_firstname} format="text" />
        <RecordField label={fieldLabel('kunden', 'kunde_lastname')} value={record.fields.kunde_lastname} format="text" />
        <RecordField label={fieldLabel('kunden', 'geburtsdatum')} value={record.fields.geburtsdatum} format="date" />
        <RecordField label={fieldLabel('kunden', 'email')} value={record.fields.email} format="email" />
        <RecordField label={fieldLabel('kunden', 'telefon')} value={record.fields.telefon} format="text" />
        <RecordField label={fieldLabel('kunden', 'instagram_profil')} value={record.fields.instagram_profil} format="url" />
        <RecordField label={fieldLabel('kunden', 'strasse')} value={record.fields.strasse} format="text" />
        <RecordField label={fieldLabel('kunden', 'hausnummer')} value={record.fields.hausnummer} format="text" />
        <RecordField label={fieldLabel('kunden', 'plz')} value={record.fields.plz} format="text" />
        <RecordField label={fieldLabel('kunden', 'ort')} value={record.fields.ort} format="text" />
        <RecordField label={fieldLabel('kunden', 'schutzausruestung')} value={Array.isArray(record.fields.schutzausruestung) ? record.fields.schutzausruestung.map((v: unknown) => (v && typeof v === 'object' && 'label' in v) ? (v as {label: unknown}).label : v).join(', ') : null} format="text" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('verleihvorgaenge')}
        items={verleihvorgaengeList.filter(r => extractRecordId(r.fields.kunde) === record.record_id)}
        map={r => ({ name: appLabel('verleihvorgaenge'), meta: r.fields.ausleihdatum })}
        onOpen={onOpenVerleihvorgaenge}
        onAdd={onAddVerleihvorgaenge}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.KUNDEN} recordId={record.record_id} readOnly={!perms.canWrite('kunden')} />
    </>
  );
}
