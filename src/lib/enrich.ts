import type { EnrichedVerleihvorgaenge } from '@/types/enriched';
import type { Kunden, Skateboards, Verleihvorgaenge } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface VerleihvorgaengeMaps {
  kundenMap: Map<string, Kunden>;
  skateboardsMap: Map<string, Skateboards>;
}

export function enrichVerleihvorgaenge(
  verleihvorgaenge: Verleihvorgaenge[],
  maps: VerleihvorgaengeMaps
): EnrichedVerleihvorgaenge[] {
  return verleihvorgaenge.map(r => ({
    ...r,
    kundeName: resolveDisplay(r.fields.kunde, maps.kundenMap, 'kunde_firstname'),
    skateboardName: resolveDisplay(r.fields.skateboard, maps.skateboardsMap, 'bezeichnung'),
  }));
}
