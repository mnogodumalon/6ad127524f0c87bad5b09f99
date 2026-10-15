import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { IconAlertTriangle, IconPlus, IconClock } from '@tabler/icons-react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import type { EnrichedVerleihvorgaenge } from '@/types/enriched';
import type { Skateboards } from '@/types/app';
import { LOOKUP_OPTIONS, lookupOption } from '@/types/app';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import { formatDate, lookupKey } from '@/lib/formatters';
import { useClock, gruss, namen, undoToast } from '@/lib/polish';
import { tx, appLabel } from '@/i18n';
import { DashboardGrid } from '@/components/DashboardGrid';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { WorkList } from '@/components/WorkList';
import { HeroBanner } from '@/components/HeroBanner';
import { Button } from '@/components/ui/button';
import { KanbanWidget, type KanbanCard, type KanbanColumn } from '@/components/widgets/KanbanWidget';
import { ChartWidget, type ChartRow } from '@/components/widgets/ChartWidget';

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const { skateboards, verleihvorgaenge, setVerleihvorgaenge, setSkateboards, fetchAll } = data;
  const clock = useClock();
  const [filterToday, setFilterToday] = useState(false);

  const crud = useEntityCrud(data, {
    footer: (top) => {
      if (top.type !== 'verleihvorgaenge') return undefined;
      const next = nextStatus(top.record);
      return next
        ? { label: next === 'verliehen' ? tx('Board ausgeben') : tx('Rückgabe erfassen'), onClick: () => advance(top.record) }
        : undefined;
    },
  });
  const enriched = crud.enriched.verleihvorgaenge;

  const today = format(clock, 'yyyy-MM-dd');
  const dueOf = (r: EnrichedVerleihvorgaenge) => (r.fields.geplante_rueckgabe ?? '').slice(0, 10);
  const isOut = (r: EnrichedVerleihvorgaenge) => {
    const k = lookupKey(r.fields.status);
    return k === 'verliehen' || k === 'ueberfaellig';
  };
  const isOverdue = (r: EnrichedVerleihvorgaenge) =>
    isOut(r) && (lookupKey(r.fields.status) === 'ueberfaellig' || (dueOf(r) !== '' && dueOf(r) < today));
  const isDueToday = (r: EnrichedVerleihvorgaenge) => isOut(r) && !isOverdue(r) && dueOf(r) === today;

  function nextStatus(r: { fields: { status?: { key: string } | undefined } }): string | undefined {
    const k = lookupKey(r.fields.status);
    if (k === 'reserviert') return 'verliehen';
    if (k === 'verliehen' || k === 'ueberfaellig') return 'zurueckgegeben';
    return undefined;
  }

  // ONE write path: status change (+ board availability), optimistic with undo.
  const applyStatus = async (r: EnrichedVerleihvorgaenge, newKey: string) => {
    const oldKey = lookupKey(r.fields.status) ?? 'reserviert';
    const boardId = extractRecordId(r.fields.skateboard);
    const setBoard = (verfuegbar: boolean) => {
      if (!boardId) return;
      setSkateboards(prev => prev.map(b => (b.record_id === boardId ? { ...b, fields: { ...b.fields, verfuegbar } } : b)));
    };
    const patch = async (key: string, verfuegbar: boolean | null, withDate: boolean) => {
      setVerleihvorgaenge(prev => prev.map(v => (v.record_id === r.record_id
        ? { ...v, fields: { ...v.fields, status: lookupOption('verleihvorgaenge', 'status', key), ...(withDate ? { tatsaechliche_rueckgabe: today } : {}) } }
        : v)));
      if (verfuegbar !== null) setBoard(verfuegbar);
      try {
        await LivingAppsService.updateVerleihvorgaengeEntry(r.record_id, {
          status: key,
          ...(withDate ? { tatsaechliche_rueckgabe: today } : {}),
        });
        if (verfuegbar !== null && boardId) await LivingAppsService.updateSkateboard(boardId, { verfuegbar });
      } catch {
        await fetchAll();
      }
    };
    const goesOut = newKey === 'verliehen';
    const comesBack = newKey === 'zurueckgegeben';
    await patch(newKey, goesOut ? false : comesBack ? true : null, comesBack);
    undoToast(
      tx`${r.kundeName} · ${r.skateboardName} — ${lookupOption('verleihvorgaenge', 'status', newKey).label}`,
      () => { void patch(oldKey, goesOut ? true : comesBack ? false : null, false); },
    );
  };

  const advance = (r: EnrichedVerleihvorgaenge) => {
    const next = nextStatus(r);
    if (next) void applyStatus(r, next);
  };

  const overdue = useMemo(() => enriched.filter(isOverdue), [enriched, today]); // eslint-disable-line react-hooks/exhaustive-deps
  const dueToday = useMemo(() => enriched.filter(isDueToday), [enriched, today]); // eslint-disable-line react-hooks/exhaustive-deps
  const workItems = [...overdue, ...dueToday];

  const columns = useMemo<KanbanColumn[]>(
    () => (LOOKUP_OPTIONS['verleihvorgaenge']?.['status'] ?? []).map(o => ({ key: o.key, label: o.label })),
    [],
  );
  const cards: KanbanCard[] = enriched
    .filter(r => !filterToday || isDueToday(r))
    .map(r => ({
      id: `verleih:${r.record_id}`,
      column: lookupKey(r.fields.status) ?? 'reserviert',
      title: r.skateboardName || '—',
      subtitle: `${r.kundeName || '—'} · ${formatDate(r.fields.geplante_rueckgabe)}`,
      tone: isOverdue(r) ? 'warning' : lookupKey(r.fields.status) === 'verliehen' ? 'primary' : 'default',
    }));

  const moveCard = (cardId: string, newColumn: string) => {
    const rid = cardId.split(':')[1];
    const r = enriched.find(v => v.record_id === rid);
    if (!r || lookupKey(r.fields.status) === newColumn) return;
    void applyStatus(r, newColumn);
  };

  const available = skateboards.filter(b => b.fields.verfuegbar !== false);
  const chartRows: ChartRow<Skateboards>[] = available.map(b => ({ id: `skateboard:${b.record_id}`, data: b }));

  const rowLine = (r: EnrichedVerleihvorgaenge, late: boolean) => (
    <>
      <span className={late ? 'font-medium text-destructive' : 'font-medium text-amber-600'}>
        {late ? tx('Überfällig') : tx('Heute fällig')}
      </span>
      <span className="text-muted-foreground"> · {r.kundeName} · {formatDate(r.fields.geplante_rueckgabe)}</span>
    </>
  );

  const first = overdue[0];
  const empty = enriched.length === 0;
  const context = overdue.length > 0
    ? tx`${namen(overdue.map(r => r.kundeName))} ${overdue.length === 1 ? 'hat' : 'haben'} ein Board noch nicht zurückgebracht.`
    : dueToday.length > 0
      ? tx`Heute bringen ${namen(dueToday.map(r => r.kundeName))} ihre Boards zurück.`
      : tx`Alles im Plan — ${available.length} von ${skateboards.length} Boards sind frei.`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight truncate">{gruss(clock)}</h1>
          <p className="text-sm text-muted-foreground">{empty ? tx('Lege dein erstes Board und deinen ersten Verleih an.') : context}</p>
        </div>
        {crud.verleihvorgaenge.canWrite && (
          <Button onClick={() => crud.verleihvorgaenge.openCreate({ status: 'reserviert' })}>
            <IconPlus size={16} className="shrink-0" />
            <span className="ml-1">{tx('Neuer Verleih')}</span>
          </Button>
        )}
      </div>

      <DashboardGrid
        variant="wide"
        hero={first && (
          <HeroBanner
            icon={<IconAlertTriangle size={18} />}
            action={{ label: tx('Rückgabe erfassen'), onClick: () => advance(first) }}
          >
            <b>{namen(overdue.map(r => r.kundeName))}</b> {tx('überfällig')} — {first.skateboardName}, {tx('fällig war')} {formatDate(first.fields.geplante_rueckgabe)}.
          </HeroBanner>
        )}
        kpis={
          <StatStrip>
            <StatStripItem
              title={tx('Frei verfügbar')}
              value={`${available.length} / ${skateboards.length}`}
              icon={<IconClock size={16} className="text-muted-foreground" />}
            />
            <StatStripItem
              title={tx('Heute fällig')}
              value={dueToday.length}
              tone={dueToday.length > 0 ? 'warning' : 'default'}
              onClick={() => setFilterToday(f => !f)}
              active={filterToday}
            />
          </StatStrip>
        }
        primary={
          <KanbanWidget
            cards={cards}
            columns={columns}
            defaultCollapsed={['zurueckgegeben']}
            onCardClick={card => {
              const r = verleihvorgaenge.find(v => v.record_id === card.id.split(':')[1]);
              if (r) crud.verleihvorgaenge.openDetail(r);
            }}
            onCardMove={moveCard}
            onAddCard={column => crud.verleihvorgaenge.openCreate({ status: column })}
          />
        }
        aside={
          <>
            <WorkList
              title={tx('Rückgaben heute & überfällig')}
              items={workItems.map(r => ({
                id: r.record_id,
                title: r.skateboardName || '—',
                secondLine: rowLine(r, isOverdue(r)),
                action: { label: tx('✓ Zurück'), onClick: () => advance(r) },
              }))}
              onItemClick={id => {
                const r = verleihvorgaenge.find(v => v.record_id === id);
                if (r) crud.verleihvorgaenge.openDetail(r);
              }}
              empty={{
                text: tx('Keine Rückgaben offen.'),
                action: crud.verleihvorgaenge.canWrite
                  ? { label: tx('Neuer Verleih'), onClick: () => crud.verleihvorgaenge.openCreate({ status: 'reserviert' }) }
                  : undefined,
              }}
            />
            <ChartWidget<Skateboards>
              title={tx('Verfügbare Boards nach Typ')}
              rows={chartRows}
              dimension={{ kind: 'category', accessor: r => r.data.fields.typ, label: tx('Typ') }}
              measure={{ aggregate: 'sum', label: tx('Boards frei'), value: () => 1, format: 'number' }}
            />
          </>
        }
      />
      {crud.surfaces}
    </div>
  );
}
