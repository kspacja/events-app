import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { mainCategory, type OccurrenceListing } from '@events/contract/listing';
import { currentEventDay, eventDayOf, localDayOf, localMinutesOf, weekdayIndex, type CalendarDay } from '@events/time';
import { EventGallery } from '@/features/eventPage/components/EventGallery';
import {
  AccessibleIcon,
  BookIcon,
  CalendarIcon,
  CapIcon,
  CarIcon,
  ChevronIcon,
  ClipIcon,
  ClockIcon,
  HeartHandIcon,
  HelpIcon,
  HourglassIcon,
  InfoIcon,
  MailIcon,
  PeopleIcon,
  PhoneIcon,
  PinIcon,
  TicketIcon,
} from '@/features/eventPage/components/icons';
import { SaveButton } from '@/features/eventPage/components/SaveButton';
import { SimilarEvents } from '@/features/eventPage/components/SimilarEvents';
import { VenueMapLoader } from '@/features/eventPage/components/VenueMapLoader';
import styles from '@/features/eventPage/components/EventPage.module.css';
import { eventChips, monogram } from '@/features/eventPage/eventChips';
import { loadEventPage } from '@/features/eventPage/eventPageSource';
import { durationLabel, EVENT_PAGE_LABELS as LABELS, participantsLabel } from '@/features/eventPage/labels';
import { DAY_SHORT_NAMES } from '@/features/events/labels';
import { eventPageHref, organizerHref, TERM_PARAM } from '@/features/schoolSearch/searchHref';
import { formatPrice } from '@/features/schools/eventDetails/eventFacts';
import { SCHOOLS_PATH } from '@/features/schools/schoolsHref';
import { formatClock, formatDay, formatLocalTime } from '@/lib/format';
import { firstValue } from '@/lib/searchParams';

export async function generateMetadata({ params }: PageProps<'/wydarzenie/[id]'>): Promise<Metadata> {
  const page = await loadEventPage((await params).id);
  return { title: page?.occurrences[0].event.title ?? LABELS.schools };
}

/** The asked occurrence; else the next one; else, for an event that is over, the last. */
function chosenOccurrence(occurrences: readonly OccurrenceListing[], asked: string | undefined, today: CalendarDay) {
  return (
    occurrences.find(({ occurrenceId }) => occurrenceId === asked) ??
    occurrences.find(({ startsAt }) => eventDayOf(startsAt) >= today) ??
    occurrences[occurrences.length - 1]
  );
}

/** "10:00–11:00", or just the start without a known length. */
function hoursLabel(startsAt: string, durationMinutes: number | undefined): string {
  if (!durationMinutes) return formatLocalTime(startsAt);
  return `${formatLocalTime(startsAt)}–${formatClock((localMinutesOf(startsAt) + durationMinutes) % (24 * 60))}`;
}

function Fact({ icon, children }: { readonly icon: ReactNode; readonly children: ReactNode }) {
  return (
    <li className={styles.fact}>
      <span className={styles.factIcon}>{icon}</span>
      <span>{children}</span>
    </li>
  );
}

function Fold({ icon, title, children }: { readonly icon: ReactNode; readonly title: string; readonly children: ReactNode }) {
  return (
    <details className={styles.fold}>
      <summary className={styles.foldSummary}>
        <span className={styles.foldIcon}>{icon}</span>
        <span className={styles.foldTitle}>{title}</span>
        <span className={styles.foldChevron}>
          <ChevronIcon />
        </span>
      </summary>
      <div className={styles.foldBody}>{children}</div>
    </details>
  );
}

export default async function EventPage({ params, searchParams }: PageProps<'/wydarzenie/[id]'>) {
  const { id } = await params;
  const page = await loadEventPage(id);
  if (!page) notFound();

  const today = currentEventDay(new Date());
  const current = chosenOccurrence(page.occurrences, firstValue((await searchParams)[TERM_PARAM]), today);
  const past = eventDayOf(current.startsAt) < today;
  const others = page.occurrences.filter(
    ({ occurrenceId, startsAt }) => occurrenceId !== current.occurrenceId && eventDayOf(startsAt) >= today,
  );
  const { event, venue, price, startsAt } = current;
  const details = page.details;
  const photos = [event.imageUrl, ...(details?.gallery ?? [])].filter((url): url is string => Boolean(url));
  const paragraphs = event.description?.split(/\n\s*\n/) ?? [];

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <nav aria-label={LABELS.breadcrumbs} className={styles.breadcrumbs}>
          <ol>
            <li>
              <Link href={`${SCHOOLS_PATH}/miesiac`}>{LABELS.schools}</Link>
            </li>
            <li>{venue.city}</li>
            <li aria-current="page">{mainCategory(event).label}</li>
          </ol>
        </nav>

        <div className={styles.layout} data-past={past || undefined}>
          <header className={styles.header}>
            <h1 className={styles.title}>{event.title}</h1>
            {event.organizer ? (
              <Link href={organizerHref(event.organizer.slug)} className={styles.organizer}>
                <span className={styles.logo} aria-hidden="true">
                  {monogram(event.organizer.name)}
                </span>
                {event.organizer.name}
              </Link>
            ) : null}
            <ul className={styles.chips}>
              {details?.specialNeeds ? (
                <li className={styles.specialNeeds}>
                  <HeartHandIcon />
                  {LABELS.specialNeeds}
                </li>
              ) : null}
              {eventChips(event).map((chip) => (
                <li key={chip} className={styles.chip}>
                  {chip}
                </li>
              ))}
            </ul>
          </header>

          <div className={styles.galleryArea}>
            <EventGallery photos={photos} video={details?.video} past={past} />
          </div>

          <aside className={styles.aside}>
            <section className={styles.card} aria-labelledby="term">
              <h2 id="term" className={styles.cardTitle} data-past={past || undefined}>
                <span className={styles.dot} aria-hidden="true" />
                {past ? LABELS.term : LABELS.terms}
              </h2>
              <ul className={styles.facts}>
                <Fact icon={<CalendarIcon />}>
                  <strong className={styles.date}>{formatDay(localDayOf(startsAt), 'EEEE, d MMMM yyyy')}</strong>
                </Fact>
                <Fact icon={<ClockIcon />}>
                  <span className={styles.time}>{hoursLabel(startsAt, details?.durationMinutes)}</span>
                </Fact>
                {details?.durationMinutes ? <Fact icon={<HourglassIcon />}>{durationLabel(details.durationMinutes)}</Fact> : null}
              </ul>
              {others.length > 0 ? (
                <div className={styles.otherTerms}>
                  <p className={styles.smallLabel}>{LABELS.otherTerms}</p>
                  <ul>
                    {others.map((other) => {
                      const day = eventDayOf(other.startsAt);
                      return (
                        <li key={other.occurrenceId}>
                          <Link href={eventPageHref(event.id, other.occurrenceId)} className={styles.term} scroll={false}>
                            {DAY_SHORT_NAMES[weekdayIndex(day)]} {formatDay(day, 'd.MM')} · {formatLocalTime(other.startsAt)}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
              <ul className={styles.facts} data-divided>
                {price ? <Fact icon={<TicketIcon />}>{formatPrice(price)}</Fact> : null}
                {details?.maxParticipants ? <Fact icon={<PeopleIcon />}>{participantsLabel(details.maxParticipants)}</Fact> : null}
                {details?.guardians ? <Fact icon={<PeopleIcon />}>{details.guardians}</Fact> : null}
                {details?.reservationRequired ? <Fact icon={<InfoIcon />}>{LABELS.reservation}</Fact> : null}
              </ul>
              {past ? (
                <p className={styles.pastNote}>{LABELS.past}</p>
              ) : (
                <div className={styles.actions}>
                  {/* No action yet, as in the details dialog (stage 3.9) */}
                  <button type="button" className={styles.contact}>
                    {LABELS.contact}
                  </button>
                  <SaveButton />
                </div>
              )}
              {details?.contact ? (
                <div className={styles.person}>
                  <p className={styles.smallLabel}>{LABELS.contactPerson}</p>
                  <p className={styles.personName}>
                    {details.contact.name}
                    <span>{details.contact.role}</span>
                  </p>
                  <ul className={styles.facts}>
                    <Fact icon={<MailIcon />}>
                      <a href={`mailto:${details.contact.email}`}>{details.contact.email}</a>
                    </Fact>
                    <Fact icon={<PhoneIcon />}>
                      <a href={`tel:${details.contact.phone.replaceAll(' ', '')}`}>{details.contact.phone}</a>
                    </Fact>
                  </ul>
                </div>
              ) : null}
            </section>

            <section className={styles.card} aria-labelledby="location">
              <h2 id="location" className={styles.cardTitle}>
                <PinIcon />
                {LABELS.location}
              </h2>
              <VenueMapLoader lat={venue.lat} lng={venue.lng} label={LABELS.map(venue.name)} />
              <ul className={styles.facts}>
                <Fact icon={<PinIcon />}>
                  {venue.name}, {venue.address}, {venue.city}
                </Fact>
                {/* TBD: travel time from the teacher's school, still being designed */}
                <Fact icon={<CarIcon />}>
                  <span className={styles.tbd}>{LABELS.travelTime}</span>
                </Fact>
              </ul>
            </section>
          </aside>

          <div className={styles.body}>
            {paragraphs.length > 0 ? (
              <section className={styles.about} aria-label={LABELS.about}>
                {paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ) : null}
            {details?.arrivalNote ? (
              <p className={styles.arrival}>
                <InfoIcon />
                {details.arrivalNote}
              </p>
            ) : null}

            {details && details.learningGoals.length > 0 ? (
              <section aria-labelledby="goals">
                <h2 id="goals" className={styles.sectionTitle}>
                  <span className={styles.sectionIcon}>
                    <CapIcon />
                  </span>
                  {LABELS.goals}
                </h2>
                <ul className={styles.goals}>
                  {details.learningGoals.map((goal) => (
                    <li key={goal}>{goal}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {details?.curriculum ? (
              <section className={styles.curriculum} aria-labelledby="curriculum">
                <span className={styles.sectionIcon}>
                  <BookIcon />
                </span>
                <div>
                  <h2 id="curriculum" className={styles.curriculumTitle}>
                    {LABELS.curriculum}
                  </h2>
                  <p className={styles.curriculumArea}>
                    {details.curriculum.area} · {details.curriculum.grades}
                  </p>
                  <p className={styles.curriculumText}>{details.curriculum.description}</p>
                </div>
              </section>
            ) : null}

            {details && details.materials.length > 0 ? (
              <section aria-labelledby="materials">
                <h2 id="materials" className={styles.sectionTitle}>
                  <span className={styles.sectionIcon}>
                    <ClipIcon />
                  </span>
                  {LABELS.materials}
                </h2>
                <ul className={styles.materials}>
                  {details.materials.map(({ label, url }) => (
                    <li key={label}>
                      <a href={url}>{label}</a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {details ? (
              <div className={styles.folds}>
                {details.practicalInfo.length > 0 ? (
                  <Fold icon={<InfoIcon />} title={LABELS.practical}>
                    <ul>
                      {details.practicalInfo.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </Fold>
                ) : null}
                {details.accessibility.length > 0 ? (
                  <Fold icon={<AccessibleIcon />} title={LABELS.accessibility}>
                    <ul>
                      {details.accessibility.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </Fold>
                ) : null}
                {details.faq.length > 0 ? (
                  <Fold icon={<HelpIcon />} title={LABELS.faq}>
                    <dl className={styles.faq}>
                      {details.faq.map(({ question, answer }) => (
                        <div key={question}>
                          <dt>{question}</dt>
                          <dd>{answer}</dd>
                        </div>
                      ))}
                    </dl>
                  </Fold>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {page.similar.length > 0 ? <SimilarEvents listings={page.similar} /> : null}
      </div>
    </main>
  );
}
