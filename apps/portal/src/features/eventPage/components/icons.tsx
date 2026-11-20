import type { ReactNode } from 'react';

/** Line icons of the event page, 20px, in the current colour. */
function Icon({ children }: { readonly children: ReactNode }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const CalendarIcon = () => (
  <Icon>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Icon>
);
export const ClockIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Icon>
);
export const HourglassIcon = () => (
  <Icon>
    <path d="M6.5 3.5h11M6.5 20.5h11M7.5 3.5c0 5 9 6 9 8.5s-9 3.5-9 8.5M16.5 3.5c0 5-9 6-9 8.5s9 3.5 9 8.5" />
  </Icon>
);
export const TicketIcon = () => (
  <Icon>
    <path d="M3.5 8.5V6h17v2.5a2.5 2.5 0 0 0 0 5V16h-17v-2.5a2.5 2.5 0 0 0 0-5z" />
    <path d="M13 6v10" strokeDasharray="2 2" />
  </Icon>
);
export const PeopleIcon = () => (
  <Icon>
    <circle cx="9" cy="8.5" r="3" />
    <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5M16 6a3 3 0 0 1 0 6M17.5 14.5c1.9.6 3 2.3 3 4.5" />
  </Icon>
);
export const InfoIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5M12 8h.01" />
  </Icon>
);
export const MailIcon = () => (
  <Icon>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
    <path d="m4 7 8 6 8-6" />
  </Icon>
);
export const PhoneIcon = () => (
  <Icon>
    <path d="M5 4h3.5l1.5 4-2 1.5a11 11 0 0 0 6.5 6.5L16 14l4 1.5V19a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4z" />
  </Icon>
);
export const PinIcon = () => (
  <Icon>
    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Icon>
);
export const CarIcon = () => (
  <Icon>
    <path d="M5 16.5V12l1.8-4.5h10.4L19 12v4.5M5 12h14M7.5 16.5v2M16.5 16.5v2" />
    <circle cx="8" cy="14.3" r=".6" />
    <circle cx="16" cy="14.3" r=".6" />
  </Icon>
);
export const CapIcon = () => (
  <Icon>
    <path d="m2.5 9 9.5-4.5L21.5 9 12 13.5z" />
    <path d="M6.5 11v4.5c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3V11M21.5 9v5" />
  </Icon>
);
export const BookIcon = () => (
  <Icon>
    <path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5c-3.5-.5-6.5 0-8.5 1.5zM12 6.5v13" />
  </Icon>
);
export const ClipIcon = () => (
  <Icon>
    <path d="m20 11.5-8 8a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7L9.7 17.2a1.7 1.7 0 0 1-2.4-2.4l7.5-7.5" />
  </Icon>
);
export const HelpIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.5M12 16.8h.01" />
  </Icon>
);
export const AccessibleIcon = () => (
  <Icon>
    <circle cx="12" cy="4.5" r="1.5" />
    <path d="M9 21a5 5 0 0 1-.5-9.8M11 8v6h5l2.5 5M11 11h5" />
  </Icon>
);
export const HeartHandIcon = () => (
  <Icon>
    <path d="M12 19s-6.5-4-6.5-8.6A3.7 3.7 0 0 1 12 8.1a3.7 3.7 0 0 1 6.5 2.3C18.5 15 12 19 12 19z" />
  </Icon>
);
export const ChevronIcon = () => (
  <Icon>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);
