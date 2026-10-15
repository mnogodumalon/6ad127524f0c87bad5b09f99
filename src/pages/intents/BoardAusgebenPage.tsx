/**
 * Board ausgeben — 3-Schritt-Wizard.
 * Steps: 1) Reservierten Verleihvorgang auswählen → 2) Board wählen → 3) Übergabe bestätigen.
 * Reads: verleihvorgaenge (nur Status reserviert), skateboards, kunden (Namen).
 * Writes: verleihvorgaenge.status = verliehen, skateboards.verfuegbar = false (useBoardAusgebenFlow).
 * Composes: IntentWizardShell, EntitySelectStep, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldDate } from '@/lib/journey';
import { useBoardAusgebenFlow } from '@/lib/journey/flows/BoardAusgeben';
import { tx } from '@/i18n';

function shortDate(iso: string | null): string {
  if (!iso) return '?';
  try {
    return format(parseISO(iso), 'dd.MM.yyyy');
  } catch {
    return iso;
  }
}

export default function BoardAusgebenPage() {
  const [step, setStep] = useState(1);
  const flow = useBoardAusgebenFlow({
    steps: { verleihvorgaenge: 1, skateboards: 2 },
    items: {
      verleihvorgaenge: (r, ctx) => ({
        id: r.id,
        title: ctx.ref('kunde') ?? tx('Ohne Kunde'),
        subtitle: tx`${ctx.ref('skateboard') ?? tx('Ohne Board')} · ${shortDate(fieldDate(r, 'ausleihdatum'))} – ${shortDate(fieldDate(r, 'geplante_rueckgabe'))}`,
      }),
    },
  });

  const vorgang = flow.pick('verleihvorgaenge');

  return (
    <IntentWizardShell
      title={tx('Board ausgeben')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Ein reserviertes Skateboard an den Kunden übergeben.'),
        needs: [tx('Name des Kunden oder das reservierte Board')],
      }}
    >
      <WizardStep label={tx('Verleihvorgang')} description={tx('Welche Reservierung wird jetzt abgeholt?')}>
        <EntitySelectStep
          {...flow.picks.verleihvorgaenge.select}
          selectedId={vorgang.selectedId}
          onSelect={vorgang.onSelect}
          avatar="initials"
          searchPlaceholder={tx('Reservierung suchen …')}
          emptyText={tx('Keine reservierten Verleihvorgänge vorhanden.')}
        />
      </WizardStep>
      <WizardStep label={tx('Board')} description={tx('Welches Skateboard wird übergeben?')}>
        {vorgang.selectedId ? (
          <div className="space-y-4">
            <EntitySelectStep
              {...flow.picks.skateboards.select}
              {...flow.pick('skateboards')}
              avatar="initials"
              searchPlaceholder={tx('Board suchen …')}
              emptyText={tx('Keine Skateboards vorhanden.')}
            />
            <StepNav onBack={() => setStep(1)} onNext={() => flow.validateStep(2)} nextStepLabel={tx('Prüfen')} />
          </div>
        ) : (
          <StepNav onBack={() => setStep(1)} nextDisabled>
            {tx('Dieser Schritt braucht die Auswahl aus Schritt 1.')}
          </StepNav>
        )}
      </WizardStep>
      <WizardStep label={tx('Übergabe bestätigen')} needs={['verleihvorgaenge', 'skateboards']}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            confirmLabel={tx('Board übergeben')}
            whatHappensNext={tx('Der Verleihvorgang steht danach auf „Verliehen“ und das Board ist nicht mehr verfügbar.')}
          />
        )}
      </WizardStep>
      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          title={tx('Board übergeben')}
          verb="updated"
          actions={{ copy: false, print: false }}
          next={[
            { label: tx('Rückgabe erfassen'), href: '#/intents/rueckgabe-erfassen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          whatHappensNext={tx('Wenn das Board zurückkommt, erfasst du die Rückgabe im Ablauf „Rückgabe erfassen“.')}
        />
      )}
    </IntentWizardShell>
  );
}
