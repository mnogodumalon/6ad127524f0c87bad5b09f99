import type { Skateboards, Verleihvorgaenge } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { MediaThumbnail } from '@/components/widgets/MediaViewer';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface SkateboardsDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Skateboards;
  /** 1:N „Verleihvorgänge" (skateboard): VOLLE Liste — der Block filtert auf diesen Record. */
  verleihvorgaengeList: Verleihvorgaenge[];
  /** Zeilen-Klick → overlay.push auf das Verleihvorgaenge-Detail (nie der Edit-Dialog). */
  onOpenVerleihvorgaenge: (record: Verleihvorgaenge) => void;
  /** Kontextuelles „+": öffnet den Verleihvorgaenge-Dialog mit diesem Record vorgesetzt. */
  onAddVerleihvorgaenge?: () => void;
}

export function SkateboardsDetails({
  record,
  verleihvorgaengeList,
  onOpenVerleihvorgaenge,
  onAddVerleihvorgaenge,
}: SkateboardsDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('skateboards', 'bezeichnung')} value={record.fields.bezeichnung} format="text" />
        <RecordField label={fieldLabel('skateboards', 'marke')} value={record.fields.marke} format="text" />
        <RecordField label={fieldLabel('skateboards', 'typ')} value={record.fields.typ} format="pill" />
        <RecordField label={fieldLabel('skateboards', 'deckbreite')} value={record.fields.deckbreite} format="text" />
        <RecordField label={fieldLabel('skateboards', 'zustand')} value={record.fields.zustand} format="pill" />
        <RecordField label={fieldLabel('skateboards', 'preis_pro_tag')} value={record.fields.preis_pro_tag} format="text" />
        <RecordField label={fieldLabel('skateboards', 'verfuegbar')} value={record.fields.verfuegbar} format="bool" />
        <RecordField label={fieldLabel('skateboards', 'foto')} className="md:col-span-2">
          {record.fields.foto ? (
            <MediaThumbnail src={record.fields.foto as string} fit="contain" className="max-h-64 w-full rounded-lg" />
          ) : '—'}
        </RecordField>
        <RecordField label={fieldLabel('skateboards', 'bemerkungen')} value={record.fields.bemerkungen} format="longtext" className="md:col-span-2" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('verleihvorgaenge')}
        items={verleihvorgaengeList.filter(r => extractRecordId(r.fields.skateboard) === record.record_id)}
        map={r => ({ name: appLabel('verleihvorgaenge'), meta: r.fields.ausleihdatum })}
        onOpen={onOpenVerleihvorgaenge}
        onAdd={onAddVerleihvorgaenge}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.SKATEBOARDS} recordId={record.record_id} readOnly={!perms.canWrite('skateboards')} />
    </>
  );
}
