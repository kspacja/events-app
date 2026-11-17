import type { LocalityId } from '@events/contract/localities';

/**
 * Prototype (stage 3.8): the SIMC id of each sample venue's Miejscowość, keyed by `venue.city`, which is unique in the sample.
 * Only MSW knows it; step B moves it into the venue itself.
 */
export const SAMPLE_VENUE_LOCALITIES: Readonly<Record<string, LocalityId>> = {
  Wrocław: '0986283',
  Kraków: '0950463',
  Gdańsk: '0933016',
  Poznań: '0969400',
  Kobierzyce: '0875425',
  Długołęka: '0873739',
  Sobótka: '0987294',
  Siechnice: '0881160',
};
