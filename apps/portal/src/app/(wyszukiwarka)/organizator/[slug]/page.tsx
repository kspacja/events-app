import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { OccurrenceListing } from '@events/contract/listing';
import type { OrganizerProfile } from '@events/contract/search';
import { currentEventDay } from '@events/time';
import Link from 'next/link';
import { GlobeIcon, MailIcon, PhoneIcon, PinIcon } from '@/features/eventPage/components/icons';
import { DirectionsLink } from '@/features/eventPage/components/DirectionsLink';
import { VenueMapLoader } from '@/features/eventPage/components/VenueMapLoader';
import { monogram, traitLabels } from '@/features/eventPage/eventChips';
import { BackToCalendar } from '@/features/schoolSearch/components/BackToCalendar';
import { ResultsList } from '@/features/schoolSearch/components/ResultsList';
import styles from '@/features/schoolSearch/components/SearchPage.module.css';
import { countLabel, SEARCH_LABELS } from '@/features/schoolSearch/labels';
import { keywordsHref } from '@/features/schoolSearch/searchHref';
import { findOrganizer, loadSearchResults } from '@/features/schoolSearch/searchSource';

export async function generateMetadata({ params }: PageProps<'/organizator/[slug]'>): Promise<Metadata> {
  const found = await findOrganizer((await params).slug);
  return { title: found?.organizer.name ?? SEARCH_LABELS.organizers };
}

/** "Klasy 1–3, Klasy 4–6 · fizyka, chemia": every age group and subject of the organizer's upcoming events. */
function forSchoolsLabel(listings: readonly OccurrenceListing[]): string | null {
  const collect = (trait: 'ages' | 'subjects') => [...new Set(listings.flatMap(({ event }) => event.school?.[trait] ?? []))];
  const parts = [traitLabels('ages', collect('ages')), traitLabels('subjects', collect('subjects'))].filter((labels) => labels.length > 0);
  return parts.length > 0 ? parts.map((labels) => labels.join(', ')).join(' · ') : null;
}

function About({ name, profile, forSchools }: { readonly name: string; readonly profile?: OrganizerProfile; readonly forSchools: string | null }) {
  return (
    <section className={styles.aside} aria-labelledby="about">
      <h2 id="about" className="visually-hidden">
        {SEARCH_LABELS.aboutOrganizer}
      </h2>
      <div className={styles.identity}>
        <span className={styles.logo} aria-hidden="true">
          {monogram(name)}
        </span>
        <div>
          <p className={styles.identityName}>{name}</p>
          {profile ? <p className={styles.identityKind}>{profile.kind}</p> : null}
        </div>
      </div>
      {profile ? (
        <>
          {profile.description ? <p className={styles.description}>{profile.description}</p> : null}
          <ul className={styles.contact}>
            {profile.website ? (
              <li>
                <GlobeIcon />
                <a href={profile.website} aria-label={`${SEARCH_LABELS.website}: ${profile.website}`}>
                  {profile.website.replace(/^https?:\/\//, '')}
                </a>
              </li>
            ) : null}
            {profile.email ? (
              <li>
                <MailIcon />
                <a href={`mailto:${profile.email}`}>{profile.email}</a>
              </li>
            ) : null}
            {profile.phone ? (
              <li>
                <PhoneIcon />
                <a href={`tel:${profile.phone.replaceAll(' ', '')}`}>{profile.phone}</a>
              </li>
            ) : null}
          </ul>
        </>
      ) : (
        <p className={styles.description}>{SEARCH_LABELS.organizerSoon}</p>
      )}
      {forSchools ? (
        <p className={styles.forSchools}>
          <strong>{SEARCH_LABELS.forSchools}</strong>
          {forSchools}
        </p>
      ) : null}
    </section>
  );
}

function Location({ name, profile }: { readonly name: string; readonly profile: OrganizerProfile }) {
  return (
    <section className={styles.aside} aria-labelledby="location">
      <h2 id="location" className={styles.asideTitle}>
        <PinIcon />
        {SEARCH_LABELS.location}
      </h2>
      <VenueMapLoader lat={profile.lat} lng={profile.lng} label={SEARCH_LABELS.map(name)} />
      <p className={styles.address}>
        <PinIcon />
        <span>
          {profile.address}, {profile.postalCode}{' '}
          <Link href={keywordsHref(profile.city, null)}>{profile.city}</Link>
        </span>
      </p>
      <DirectionsLink lat={profile.lat} lng={profile.lng} />
    </section>
  );
}

/** The organizer's upcoming events on the left; who they are, how to reach them and where on the right. */
export default async function OrganizerPage({ params }: PageProps<'/organizator/[slug]'>) {
  const { slug } = await params;
  const [found, listings] = await Promise.all([findOrganizer(slug), loadSearchResults({ by: 'organizer', organizer: slug })]);
  if (!found) notFound();
  const { organizer, profile } = found;
  const moment = new Date();

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <BackToCalendar />
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>{organizer.name}</h1>
            <p className={styles.lead}>{countLabel(listings.length)}</p>
          </div>
        </header>
        <div className={styles.columns}>
          <section aria-labelledby="upcoming">
            <h2 id="upcoming" className={styles.sectionTitle}>
              {SEARCH_LABELS.upcoming}
            </h2>
            {listings.length > 0 ? (
              <ResultsList listings={listings} today={currentEventDay(moment)} now={moment.getTime()} showOrganizer={false} />
            ) : (
              <p className={styles.empty}>{SEARCH_LABELS.empty}</p>
            )}
          </section>
          <div className={styles.asideStack}>
            <About name={organizer.name} profile={profile} forSchools={forSchoolsLabel(listings)} />
            {profile ? <Location name={organizer.name} profile={profile} /> : null}
          </div>
        </div>
      </div>
    </main>
  );
}
