'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import type { EventPageDetails } from '@events/contract/event-page';
import { EVENT_PAGE_LABELS as LABELS } from '../labels';
import styles from './EventGallery.module.css';

interface EventGalleryProps {
  readonly photos: readonly string[];
  readonly video?: EventPageDetails['video'];
  /** A past occurrence: the photos fade, as in the details dialog. */
  readonly past: boolean;
}

function PlayIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="rgb(0 0 0 / 55%)" />
      <path d="M10 8.5v7l6-3.5z" fill="#fff" />
    </svg>
  );
}

/** The main photo with thumbnails under it; a thumbnail swaps the main photo, the video tile opens the video. */
export function EventGallery({ photos, video, past }: EventGalleryProps) {
  const [current, setCurrent] = useState(0);
  const videoRef = useRef<HTMLDialogElement>(null);
  const main = photos[current];

  return (
    <section className={styles.gallery} aria-label={LABELS.gallery} data-past={past || undefined}>
      <div className={styles.main}>
        {main ? <Image src={main} alt="" fill unoptimized sizes="(max-width: 960px) 100vw, 640px" className={styles.image} loading="eager" /> : null}
      </div>
      {photos.length > 1 || video ? (
        <ul className={styles.thumbs}>
          {photos.map((photo, index) => (
            <li key={photo}>
              <button
                type="button"
                className={styles.thumb}
                aria-pressed={index === current}
                aria-label={LABELS.showPhoto(index + 1)}
                onClick={() => setCurrent(index)}
              >
                {/* Eager: the first shares the main photo's address, which Next would flag as a lazy LCP */}
                <Image src={photo} alt="" fill unoptimized sizes="120px" className={styles.image} loading="eager" />
              </button>
            </li>
          ))}
          {video ? (
            <li>
              <button type="button" className={styles.thumb} aria-label={LABELS.playVideo(video.title)} onClick={() => videoRef.current?.showModal()}>
                <Image src={video.posterUrl} alt="" fill unoptimized sizes="120px" className={styles.image} />
                <span className={styles.play}>
                  <PlayIcon />
                </span>
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
      {video ? (
        <dialog
          ref={videoRef}
          className={styles.video}
          aria-label={video.title}
          onClick={(event) => {
            // A click on the backdrop lands on the dialog itself
            if (event.target === event.currentTarget) videoRef.current?.close();
          }}
        >
          <div className={styles.videoFrame}>
            <Image src={video.posterUrl} alt="" fill unoptimized sizes="800px" className={styles.image} />
            {/* Prototype: no file yet */}
            <p className={styles.videoSoon}>{LABELS.videoSoon}</p>
            <button type="button" className={styles.videoClose} onClick={() => videoRef.current?.close()} aria-label={LABELS.closeVideo}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
        </dialog>
      ) : null}
    </section>
  );
}
