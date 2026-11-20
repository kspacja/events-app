'use client';

import { useId, useLayoutEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { OccurrenceListing } from '@events/contract/listing';
import { eventDayOf, localDayOf, type CalendarDay } from '@events/time';
import { formatDay, formatLocalTime } from '@/lib/format';
import { eventPageHref, organizerHref } from '@/features/schoolSearch/searchHref';
import { eventFacts, formatPrice } from './eventFacts';
import { closeEventDetails, dropEventParam, EVENT_PARAM } from './eventParam';
import { EVENT_DETAILS_LABELS as LABELS } from './labels';
import styles from './EventDetailsDialog.module.css';

/** Opens for `?wydarzenie=` when the month has that occurrence; Esc, the close button and the backdrop close it. */
export function EventDetailsDialog({ listings, today }: { readonly listings: readonly OccurrenceListing[]; readonly today: CalendarDay }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const id = useSearchParams().get(EVENT_PARAM);
  const listing = id ? listings.find(({ occurrenceId }) => occurrenceId === id) : undefined;

  // Before paint, so a closing dialog never shows empty for a frame
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (listing && !dialog.open) dialog.showModal();
    if (!listing && dialog.open) dialog.close();
    // An occurrence this month does not show (another month, filtered out): drop it from the address
    if (id && !listing) dropEventParam();
  }, [id, listing]);

  if (!listing) return <dialog ref={ref} className={styles.dialog} />;

  const { event, venue, startsAt, price } = listing;
  const day = formatDay(localDayOf(startsAt), 'EEEE, d MMMM');
  const paragraphs = event.description?.split(/\n\s*\n/) ?? [];
  // A day already gone, as in the month's faded days
  const past = eventDayOf(startsAt) < today;

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      // Esc: the URL decides, so closing goes through it
      onCancel={(cancel) => {
        cancel.preventDefault();
        closeEventDetails();
      }}
      // Closed by the browser itself (a second Esc may skip cancel): bring the address along
      onClose={() => {
        if (new URL(window.location.href).searchParams.has(EVENT_PARAM)) closeEventDetails();
      }}
      // A click on the backdrop lands on the dialog itself
      onClick={(click) => {
        if (click.target === click.currentTarget) closeEventDetails();
      }}
    >
      <article className={styles.content} data-past={past || undefined}>
        <div className={styles.photo}>
          {event.imageUrl ? <Image src={event.imageUrl} alt="" fill unoptimized sizes="720px" className={styles.image} /> : null}
          <button type="button" className={styles.close} onClick={closeEventDetails} aria-label={LABELS.close}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          <header className={styles.header}>
            <h2 id={titleId} className={styles.title}>
              <Link href={eventPageHref(event.id)} className={styles.titleLink}>
                {event.title}
              </Link>
            </h2>
            <p className={styles.when}>
              {day} · <span className={styles.time}>{formatLocalTime(startsAt)}</span>
              {price ? (
                <>
                  {' · '}
                  <span className={styles.price}>{formatPrice(price)}</span>
                </>
              ) : null}
            </p>
            <p className={styles.where}>
              {venue.name}, {venue.address}, {venue.city}
            </p>
            {event.organizer ? (
              <p className={styles.organizer}>
                {LABELS.organizer}{' '}
                <Link href={organizerHref(event.organizer.slug)} className={styles.organizerLink}>
                  {event.organizer.name}
                </Link>
              </p>
            ) : null}
          </header>

          {paragraphs.length > 0 ? (
            <section className={styles.about} aria-label={LABELS.about}>
              {paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ) : null}

          <dl className={styles.facts}>
            {eventFacts(listing).map(({ label, value }) => (
              <div key={label} className={styles.fact}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <footer className={styles.footer}>
          <Link href={eventPageHref(event.id)} className={styles.more}>
            {LABELS.more}
          </Link>
          {past ? (
            <p className={styles.past}>{LABELS.past}</p>
          ) : (
            // No action yet: chat or another way of contact comes later (stage 3.9); Clarity shows who clicks
            <button type="button" className={styles.contact}>
              {LABELS.contact}
            </button>
          )}
        </footer>
      </article>
    </dialog>
  );
}
