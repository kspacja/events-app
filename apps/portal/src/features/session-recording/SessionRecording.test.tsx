import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionRecording } from './SessionRecording';
import { SESSION_RECORDING_LABELS as LABELS } from './labels';

const clarityTag = () => document.head.querySelector('script[src^="https://www.clarity.ms/tag/"]');

afterEach(() => {
  localStorage.clear();
  clarityTag()?.remove();
  delete window.clarity;
});

describe('SessionRecording', () => {
  it('asks first and loads nothing before an answer', () => {
    render(<SessionRecording projectId="abc123" />);

    expect(screen.getByRole('button', { name: LABELS.accept })).toBeInTheDocument();
    expect(clarityTag()).toBeNull();
  });

  it('loads Clarity after a yes and does not ask again', async () => {
    const { unmount } = render(<SessionRecording projectId="abc123" />);
    await userEvent.click(screen.getByRole('button', { name: LABELS.accept }));

    expect(clarityTag()).toHaveAttribute('src', 'https://www.clarity.ms/tag/abc123');
    expect(screen.queryByRole('button', { name: LABELS.accept })).not.toBeInTheDocument();

    unmount();
    render(<SessionRecording projectId="abc123" />);
    expect(screen.queryByRole('button', { name: LABELS.accept })).not.toBeInTheDocument();
  });

  it('records nothing after a no', async () => {
    render(<SessionRecording projectId="abc123" />);
    await userEvent.click(screen.getByRole('button', { name: LABELS.decline }));

    expect(clarityTag()).toBeNull();
    expect(screen.queryByRole('button', { name: LABELS.decline })).not.toBeInTheDocument();
  });
});
