import type { Skateparks } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { usePermissions } from '@/lib/permissions';
import { MapRouteLinks } from '@/components/widgets/MapWidget';

export interface SkateparksDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Skateparks;
}

export function SkateparksDetails({
  record,
}: SkateparksDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('skateparks', 'parkname')} value={record.fields.parkname} format="text" />
        <RecordField label={fieldLabel('skateparks', 'strasse')} value={record.fields.strasse} format="text" />
        <RecordField label={fieldLabel('skateparks', 'hausnummer')} value={record.fields.hausnummer} format="text" />
        <RecordField label={fieldLabel('skateparks', 'plz')} value={record.fields.plz} format="text" />
        <RecordField label={fieldLabel('skateparks', 'ort')} value={record.fields.ort} format="text" />
        <RecordField label={fieldLabel('skateparks', 'standort')}>
          {record.fields.standort ? (
            <div className="space-y-1">
              <div>{record.fields.standort.info ?? `${record.fields.standort.lat}, ${record.fields.standort.long}`}</div>
              {/* Directions links — the map popup is hover-fleeting; the overlay
                  is the only mobile-reachable place for navigation. */}
              <MapRouteLinks lat={record.fields.standort.lat} long={record.fields.standort.long} />
            </div>
          ) : '—'}
        </RecordField>
        <RecordField label={fieldLabel('skateparks', 'oeffnungszeiten')} value={record.fields.oeffnungszeiten} format="text" />
        <RecordField label={fieldLabel('skateparks', 'ansprechperson')} value={record.fields.ansprechperson} format="text" />
        <RecordField label={fieldLabel('skateparks', 'bemerkungen')} value={record.fields.bemerkungen} format="longtext" className="md:col-span-2" />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.SKATEPARKS} recordId={record.record_id} readOnly={!perms.canWrite('skateparks')} />
    </>
  );
}
