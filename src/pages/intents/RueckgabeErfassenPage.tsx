/**
 * Rückgabe erfassen — 4-Schritt-Wizard.
 * Steps: 1) Offenen Verleihvorgang wählen → 2) Zustand bei Rückgabe → 3) Bemerkungen → 4) Prüfen & abschließen.
 * Reads: verleihvorgaenge (verliehen/überfällig), skateboards. Writes: verleihvorgaenge (update), skateboards (update, verfügbar).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldDate, fieldLookup, fieldRef } from '@/lib/journey';
import { useRueckgabeErfassenFlow } from '@/lib/journey/flows/RueckgabeErfassen';
import { tx } from '@/i18n';

function shortDate(iso: string | null): string {
  return iso ? format(parseISO(iso), 'dd.MM.yyyy') : '—';
}

export default function RueckgabeErfassenPage() {
  const [step, setStep] = useState(1);
  const flow = useRueckgabeErfassenFlow({
    steps: { verleihvorgaenge: 1, skateboards: 1, zustand_rueckgabe: 2, bemerkungen: 3 },
    items: {
      verleihvorgaenge: (r, ctx) => {
        const status = fieldLookup(r, 'status');
        return {
          id: r.id,
          title: ctx.ref('skateboard') ?? tx('Skateboard'),
          subtitle: tx`${ctx.ref('kunde') ?? tx('Unbekannt')} · ${shortDate(fieldDate(r, 'ausleihdatum'))} bis ${shortDate(fieldDate(r, 'geplante_rueckgabe'))}`,
          status: status ?? undefined,
        };
      },
    },
  });

  const vorgang = flow.targets.verleihvorgaenge;
  const pickVorgang = flow.pick('verleihvorgaenge');
  const onPickVorgang = (id: string) => {
    pickVorgang.onSelect(id);
    // the board of the Vorgang becomes available again — it is part of the same return
    const rec = flow.picks.verleihvorgaenge.recordOf(id);
    const boardId = rec ? fieldRef(rec, 'skateboard') : null;
    if (boardId && flow.picks.skateboards.recordOf(boardId)) flow.targets.skateboards.onSelect(boardId);
  };

  const needsPick = (_n: number, children: React.ReactNode) =>
    vorgang.selectedId ? children : (
      <StepNav onBack={() => setStep(1)} nextDisabled>
        {tx('Dieser Schritt braucht die Auswahl aus Schritt 1.')}
      </StepNav>
    );

  return (
    <IntentWizardShell
      title={tx('Rückgabe erfassen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Ein verliehenes Board zurücknehmen und seinen Zustand festhalten.'),
        needs: [tx('Das zurückgegebene Board'), tx('Eindruck vom Zustand')],
      }}
    >
      <WizardStep label={tx('Verleihvorgang')} description={tx('Welches Board wird gerade zurückgebracht?')}>
        <EntitySelectStep
          {...flow.picks.verleihvorgaenge.select}
          selectedId={pickVorgang.selectedId}
          onSelect={onPickVorgang}
          avatar="none"
          searchPlaceholder={tx('Nach Bemerkung suchen …')}
          emptyText={tx('Aktuell ist kein Board verliehen oder überfällig.')}
        />
      </WizardStep>
      <WizardStep label={tx('Zustand')} description={tx('In welchem Zustand kommt das Board zurück?')}>
        {needsPick(2, (
          <div className="space-y-4">
            {!flow.targets.skateboards.selectedId && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{tx('Zu diesem Vorgang ist kein Board hinterlegt — welches Board kommt zurück?')}</p>
                <EntitySelectStep
                  {...flow.picks.skateboards.select}
                  {...flow.pick('skateboards')}
                  avatar="none"
                />
              </div>
            )}
            <Bound form={flow.forms.verleihvorgaenge} name="zustand_rueckgabe" allowClear />
            <StepNav
              onBack={() => setStep(1)}
              onNext={() => flow.validateStep(2)}
              nextStepLabel={tx('Bemerkungen')}
            />
          </div>
        ))}
      </WizardStep>
      <WizardStep label={tx('Bemerkungen')} description={tx('Gibt es etwas Besonderes zu notieren? Danach prüfst du alles.')}>
        {needsPick(3, (
          <div className="space-y-4">
            <Bound form={flow.forms.verleihvorgaenge} name="bemerkungen" rows={4} />
            <StepNav
              onBack={() => setStep(2)}
              onNext={() => flow.validateStep(3)}
              nextStepLabel={tx('Prüfen')}
            />
          </div>
        ))}
      </WizardStep>
      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[{ key: 'rueckgabe-heute', label: tx('Zurückgegeben am'), value: format(new Date(), 'dd.MM.yyyy') }]}
            whatHappensNext={tx('Der Vorgang gilt als zurückgegeben und das Board ist sofort wieder verfügbar.')}
          />
        )}
      </WizardStep>
      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          title={tx('Rückgabe erfasst')}
          next={[
            { label: tx('Weiteres Board zurücknehmen'), onClick: () => { flow.reset(); setStep(1); } },
            { label: tx('Neuen Verleih anlegen'), href: '#/intents/verleih-anlegen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          whatHappensNext={tx('Das Board ist wieder verfügbar und kann neu verliehen werden.')}
        />
      )}
    </IntentWizardShell>
  );
}
