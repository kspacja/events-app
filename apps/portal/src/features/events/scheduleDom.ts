// Contract between DayColumn/OccurrenceCard (writers) and DayStrip (reader); CSS modules match the same attributes.
export const SCHEDULE_DOM = {
  sectionId: 'program',
  inRangeAttr: 'data-in-range',
  weekendAttr: 'data-weekend',
  mutedAttr: 'data-muted',
  anyColumnSelector: '[data-in-range]',
  inRangeColumnSelector: '[data-in-range="true"]',
  activeCardSelector: 'article[data-muted="false"]',
} as const;

export function columnAttributes(inRange: boolean, isWeekend: boolean) {
  return {
    [SCHEDULE_DOM.inRangeAttr]: inRange,
    [SCHEDULE_DOM.weekendAttr]: isWeekend,
  };
}

export function cardAttributes(muted: boolean) {
  return { [SCHEDULE_DOM.mutedAttr]: muted };
}
