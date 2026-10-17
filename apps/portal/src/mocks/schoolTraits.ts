import type { FilterSelection } from '@/features/schools/schoolFilters';

/** Prototype: school traits of the sample events, keyed by filter param; only MSW knows them, the contract does not. */
export const SAMPLE_SCHOOL_TRAITS: Readonly<Record<string, FilterSelection>> = {
  'wro-school-concert': { wiek: ['przedszkole', '1-3', '4-6'], przedmiot: ['muzyka'], grupa: ['ponad-60'], rodzaj: ['cykliczne'] },
  'krk-school-history': { wiek: ['4-6', '7-8', 'ponadpodstawowe'], przedmiot: ['historia', 'wos'], grupa: ['30-60'], rodzaj: ['cykliczne'] },
  'wro-school-museum': { wiek: ['4-6', '7-8'], przedmiot: ['plastyka', 'historia'], grupa: ['do-30'], rodzaj: ['cykliczne'] },
  'wro-school-science': { wiek: ['4-6'], przedmiot: ['fizyka', 'przyroda'], grupa: ['30-60'], rodzaj: ['jednorazowe'] },
  'wro-school-ceramics': { wiek: ['1-3', '4-6'], przedmiot: ['plastyka', 'technika'], grupa: ['do-30'], rodzaj: ['cykliczne'] },
  'wro-school-organ': { wiek: ['4-6', '7-8'], przedmiot: ['muzyka', 'fizyka'], grupa: ['30-60'], rodzaj: ['jednorazowe'] },
  'wro-school-walk': { wiek: ['1-3', '4-6', '7-8'], przedmiot: ['historia', 'geografia'], grupa: ['do-30'], rodzaj: ['cykliczne'] },
  'gdn-school-port': { wiek: ['7-8', 'ponadpodstawowe'], przedmiot: ['geografia', 'historia'], grupa: ['30-60'], rodzaj: ['calodzienne'] },
  'poz-school-photo': { wiek: ['7-8'], przedmiot: ['plastyka', 'informatyka'], grupa: ['do-30'], rodzaj: ['jednorazowe'] },
  'wro-school-theatre': { wiek: ['przedszkole'], przedmiot: ['polski'], grupa: ['30-60'], rodzaj: ['cykliczne'] },
  'wro-school-botany': { wiek: ['przedszkole', '1-3', '4-6'], przedmiot: ['biologia', 'przyroda'], grupa: ['30-60'], rodzaj: ['cykliczne'] },
  'krk-school-maths': { wiek: ['1-3', '4-6'], przedmiot: ['matematyka'], grupa: ['do-30'], rodzaj: ['cykliczne'] },
  'gdn-school-physics': { wiek: ['7-8', 'ponadpodstawowe'], przedmiot: ['fizyka'], grupa: ['30-60'], rodzaj: ['jednorazowe'] },
  'gdn-school-film': { wiek: ['ponadpodstawowe'], przedmiot: ['historia', 'wos'], grupa: ['ponad-60'], rodzaj: ['jednorazowe'] },
  'wro-school-sports': { wiek: ['1-3', '4-6', '7-8'], przedmiot: ['wf'], grupa: ['ponad-60'], rodzaj: ['calodzienne'] },
  'wro-school-coding': { wiek: ['4-6', '7-8', 'ponadpodstawowe'], przedmiot: ['informatyka', 'matematyka'], grupa: ['do-30'], rodzaj: ['cykliczne'] },
  'poz-school-writing': { wiek: ['7-8', 'ponadpodstawowe'], przedmiot: ['polski'], grupa: ['do-30'], rodzaj: ['jednorazowe'] },
  'wro-school-chemistry': { wiek: ['7-8', 'ponadpodstawowe'], przedmiot: ['chemia'], grupa: ['ponad-60'], rodzaj: ['jednorazowe'] },
  'krk-school-english': { wiek: ['4-6', '7-8'], przedmiot: ['angielski', 'historia'], grupa: ['do-30'], rodzaj: ['cykliczne'] },
};
