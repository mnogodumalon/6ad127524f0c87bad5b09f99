/**
 * Verleih anlegen — 5-Schritt-Wizard.
 * Steps: 1) Kunde wählen oder neu anlegen → 2) Skateboard wählen → 3) Zeitraum → 4) Kaution → 5) Prüfen & anlegen.
 * Reads: kunden, skateboards, verleihvorgaenge (Belegung). Writes: kunden (optional, inline), verleihvorgaenge (status = reserviert).
 * Composes: IntentWizardShell, EntitySelectStep, AvailabilityRangePicker, Bound, Field, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { AvailabilityRangePicker } from '@/components/blocks/AvailabilityRangePicker';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldLookup, fieldNumber, useOccupancy } from '@/lib/journey';
import { useVerleihAnlegenFlow } from '@/lib/journey/flows/VerleihAnlegen';
import { formatCurrency } from '@/lib/formatters';
import { tx } from '@/i18n';

export default function VerleihAnlegenPage() {
  const [step, setStep] = useState(1);
  const flow = useVerleihAnlegenFlow({
    steps: { kunde: 1, kunde_firstname: 1, kunde_lastname: 1, skateboard: 2, ausleihdatum: 3, geplante_rueckgabe: 3, kaution: 4 },
    items: {
      kunde: k => ({
        id: k.id,
        title: `${fieldText(k, 'kunde_firstname')} ${fieldText(k, 'kunde_lastname')}`.trim(),
        subtitle: fieldText(k, 'email') || fieldText(k, 'telefon'),
      }),
      skateboard: s => {
        const preis = fieldNumber(s, 'preis_pro_tag');
        return {
          id: s.id,
          title: fieldText(s, 'bezeichnung'),
          subtitle: [fieldText(s, 'marke'), fieldLookup(s, 'typ')?.label].filter(Boolean).join(' · '),
          status: fieldLookup(s, 'zustand') ?? undefined,
          stats: preis != null ? [{ label: tx('Preis pro Tag'), value: formatCurrency(preis) }] : undefined,
        };
      },
    },
  });
  const verleih = flow.forms.verleihvorgaenge;
  const skateboardId = (verleih.get('skateboard') as string | null) || null;
  const belegung = useOccupancy(flow.port, 'verleihvorgaenge', { resource: skateboardId });

  return (
    <IntentWizardShell
      title={tx('Verleih anlegen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Skateboard für einen Kunden reservieren.'),
        needs: [tx('Name des Kunden'), tx('Gewünschtes Skateboard'), tx('Ausleih- und Rückgabedatum'), tx('Höhe der Kaution')],
      }}
    >
      <WizardStep label={tx('Kunde')} description={tx('Wer leiht aus? Such den Kunden oder leg ihn neu an.')}>
        <EntitySelectStep
          {...flow.picks.kunde.select}
          {...flow.pick('kunde')}
          avatar="initials"
          searchPlaceholder={tx('Name oder E-Mail …')}
        />
      </WizardStep>
      <WizardStep label={tx('Skateboard')} description={tx('Welches Board soll reserviert werden?')} needs={['kunde']}>
        <EntitySelectStep
          {...flow.picks.skateboard.select}
          {...flow.pick('skateboard')}
          avatar="none"
          searchPlaceholder={tx('Bezeichnung oder Marke …')}
        />
      </WizardStep>
      <WizardStep
        label={tx('Zeitraum')}
        description={tx('Ausleihe und geplante Rückgabe wählen — belegte Tage sind ausgegraut.')}
        needs={['skateboard']}
      >
        <div className="space-y-4">
          <AvailabilityRangePicker
            unit="days"
            {...verleih.range('ausleihdatum', 'geplante_rueckgabe', { blocked: belegung.blocked, unit: 'days' })}
            blocked={belegung.blocked}
          />
          <StepNav
            onBack={() => setStep(2)}
            onNext={() => flow.validateStep(3)}
            nextStepLabel={tx('Kaution')}
          />
        </div>
      </WizardStep>
      <WizardStep label={tx('Kaution')} description={tx('Wie viel Kaution hinterlegt der Kunde?')} needs={['ausleihdatum', 'geplante_rueckgabe']}>
        <div className="space-y-4">
          <Bound form={verleih} name="kaution" hint={tx('In Euro, z. B. 50')} />
          <StepNav
            onBack={() => setStep(3)}
            onNext={() => flow.validateStep(4)}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>
      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            items={[{ key: 'status', label: tx('Status'), value: tx('Reserviert') }]}
            whatHappensNext={tx('Der Verleih wird als reserviert angelegt. Die Ausgabe des Boards erfolgt im nächsten Ablauf.')}
          />
        )}
      </WizardStep>
      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          next={[
            { label: tx('Board ausgeben'), href: '#/intents/board-ausgeben' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          whatHappensNext={tx('Gib das Board bei Abholung mit „Board ausgeben“ aus.')}
        />
      )}
    </IntentWizardShell>
  );
}
