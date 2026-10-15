import type { Verleihvorgaenge } from './app';

export type EnrichedVerleihvorgaenge = Verleihvorgaenge & {
  kundeName: string;
  skateboardName: string;
};
