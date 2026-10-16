'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  applyOverrides,
  readOriginalValues,
  readStoredState,
  writeStoredState,
  type StoredState,
} from './applyOverrides';
import {
  CONTROL_GROUPS,
  asHexColor,
  channelsToHex,
  hexToChannels,
  slugify,
  themeCss,
  type Control,
  type Theme,
  type TokenOverrides,
} from './themeTokens';
import { FONT_KIND_LABELS, FONT_OPTIONS, fontOf, fontOption, fontStack } from './fontOptions';
import styles from './ThemeLab.module.css';

const ENDPOINT = '/api/theme-lab';
const ALL_TOKENS = CONTROL_GROUPS.flatMap((group) => group.controls.map((control) => control.token));
const OPEN_BY_DEFAULT = new Set(['Spacing', 'Typografia', 'Cienie', 'Promienie']);

function sameTokens(a: TokenOverrides, b: TokenOverrides): boolean {
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key]);
}

async function fetchThemes(): Promise<Theme[]> {
  const response = await fetch(ENDPOINT, { cache: 'no-store' });
  return response.ok ? ((await response.json()) as Theme[]) : [];
}

export default function ThemeLab() {
  const [open, setOpen] = useState(false);
  // Rendered client-only, so the document is there on the first render
  const [original] = useState(() => readOriginalValues(ALL_TOKENS));
  const [state, setState] = useState<StoredState>(readStoredState);
  const [themes, setThemes] = useState<readonly Theme[]>([]);
  const [status, setStatus] = useState('');

  const saved = themes.find((theme) => theme.slug === state.slug);
  const baseline = saved?.tokens ?? {};
  const dirty = !sameTokens(state.tokens, baseline);

  const reloadThemes = useCallback(async () => setThemes(await fetchThemes()), []);

  useEffect(() => {
    void fetchThemes().then(setThemes);
  }, []);

  useEffect(() => {
    applyOverrides(state.tokens);
    writeStoredState(state);
  }, [state]);

  useEffect(() => {
    function toggleOnShortcut(event: KeyboardEvent) {
      if (event.altKey && event.shiftKey && event.code === 'KeyT') setOpen((o) => !o);
    }
    window.addEventListener('keydown', toggleOnShortcut);
    return () => window.removeEventListener('keydown', toggleOnShortcut);
  }, []);

  function valueOf(token: string): string {
    return state.tokens[token] ?? original[token] ?? '';
  }

  function setToken(token: string, value: string) {
    setState((s) => {
      const rest = { ...s.tokens };
      delete rest[token];
      // Keep only real differences, so a theme file lists exactly what it changes; '' means "original"
      const isOriginal = value === '' || value === original[token];
      return { ...s, tokens: isOriginal ? rest : { ...rest, [token]: value } };
    });
  }

  function selectTheme(slug: string) {
    if (dirty && !window.confirm('Odrzucić niezapisane zmiany?')) return;
    const theme = themes.find((t) => t.slug === slug);
    setState({ slug: theme?.slug ?? null, tokens: theme?.tokens ?? {} });
  }

  async function put(name: string): Promise<void> {
    const response = await fetch(ENDPOINT, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, tokens: state.tokens }),
    });
    if (!response.ok) {
      setStatus('Nie udało się zapisać');
      return;
    }
    const theme = (await response.json()) as Theme;
    await reloadThemes();
    setState({ slug: theme.slug, tokens: theme.tokens });
    setStatus(`Zapisano „${theme.name}”`);
  }

  async function saveAs() {
    const name = window.prompt('Nazwa motywu', saved ? `${saved.name} (kopia)` : '')?.trim();
    if (!name) return;
    const slug = slugify(name);
    const existing = themes.find((t) => t.slug === slug);
    if (existing && existing.slug !== state.slug && !window.confirm(`Nadpisać motyw „${existing.name}”?`)) return;
    await put(name);
  }

  async function save() {
    if (saved) await put(saved.name);
    else await saveAs();
  }

  async function remove() {
    if (!saved || !window.confirm(`Usunąć motyw „${saved.name}”?`)) return;
    const response = await fetch(`${ENDPOINT}?slug=${encodeURIComponent(saved.slug)}`, { method: 'DELETE' });
    if (!response.ok) {
      setStatus('Nie udało się usunąć');
      return;
    }
    await reloadThemes();
    setState({ slug: null, tokens: {} });
    setStatus(`Usunięto „${saved.name}”`);
  }

  async function copyCss() {
    await navigator.clipboard.writeText(themeCss(state.tokens));
    setStatus('CSS skopiowany — wklej do tokens.css');
  }

  if (!open) {
    return (
      <button type="button" className={styles.toggle} onClick={() => setOpen(true)} title="Panel motywów (Alt+Shift+T)">
        Motyw{dirty ? ' •' : ''}
      </button>
    );
  }

  return (
    <aside className={styles.panel} aria-label="Panel motywów">
      <header className={styles.header}>
        <select
          className={styles.select}
          value={state.slug ?? ''}
          onChange={(event) => selectTheme(event.target.value)}
          aria-label="Motyw"
        >
          <option value="">Oryginał</option>
          {themes.map((theme) => (
            <option key={theme.slug} value={theme.slug}>
              {theme.name}
            </option>
          ))}
        </select>
        <button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label="Zamknij panel">
          ×
        </button>
      </header>

      <div className={styles.actions}>
        <button type="button" onClick={() => void save()} disabled={saved !== undefined && !dirty}>
          Zapisz{dirty ? ' •' : ''}
        </button>
        <button type="button" onClick={() => void saveAs()}>
          Zapisz jako…
        </button>
        <button type="button" onClick={() => setState((s) => ({ ...s, tokens: baseline }))} disabled={!dirty}>
          Reset
        </button>
        <button type="button" onClick={() => void remove()} disabled={!saved}>
          Usuń
        </button>
        <button type="button" onClick={() => void copyCss()}>
          Eksport CSS
        </button>
      </div>
      {status && (
        <p className={styles.status} role="status">
          {status}
        </p>
      )}

      <div className={styles.groups}>
        {CONTROL_GROUPS.map((group) => (
          <details key={group.title} className={styles.group} open={OPEN_BY_DEFAULT.has(group.title)}>
            <summary>{group.title}</summary>
            {group.controls.map((control) => (
              <ControlRow
                key={control.token}
                control={control}
                value={valueOf(control.token)}
                changed={control.token in state.tokens}
                onChange={(value) => setToken(control.token, value)}
                onReset={() => setToken(control.token, original[control.token] ?? '')}
              />
            ))}
          </details>
        ))}
      </div>
    </aside>
  );
}

interface ControlRowProps {
  readonly control: Control;
  readonly value: string;
  readonly changed: boolean;
  readonly onChange: (value: string) => void;
  readonly onReset: () => void;
}

function ControlRow({ control, value, changed, onChange, onReset }: ControlRowProps) {
  const id = `theme-lab${control.token}`;
  return (
    <div className={styles.row}>
      <label htmlFor={id} className={styles.label}>
        {control.label}
        {changed && (
          <button type="button" className={styles.reset} onClick={onReset} title="Przywróć oryginał">
            ↺
          </button>
        )}
      </label>
      <ControlInput id={id} control={control} value={value} changed={changed} onChange={onChange} />
    </div>
  );
}

interface ControlInputProps {
  readonly id: string;
  readonly control: Control;
  readonly value: string;
  readonly changed: boolean;
  readonly onChange: (value: string) => void;
}

function ControlInput({ id, control, value, changed, onChange }: ControlInputProps) {
  switch (control.kind) {
    case 'range': {
      const number = parseFloat(value);
      return (
        <span className={styles.range}>
          <input
            id={id}
            type="range"
            min={control.min}
            max={control.max}
            step={control.step}
            value={Number.isNaN(number) ? control.min : number}
            onChange={(event) => onChange(`${event.target.value}${control.unit}`)}
          />
          <output htmlFor={id}>{value}</output>
        </span>
      );
    }
    case 'color': {
      const hex = control.channels ? channelsToHex(value) : asHexColor(value);
      return (
        <span className={styles.color}>
          <input
            id={id}
            type="color"
            value={hex}
            onChange={(event) => onChange(control.channels ? hexToChannels(event.target.value) : event.target.value)}
          />
          <output htmlFor={id}>{hex}</output>
        </span>
      );
    }
    case 'font': {
      // The original stack resolves to a family name (e.g. DM Sans) that may also be on the list
      const selectedFont = changed ? fontOf(value) : undefined;
      return (
        <select
          id={id}
          className={styles.select}
          value={selectedFont?.family ?? ''}
          onChange={(event) => {
            const font = fontOption(event.target.value);
            onChange(font ? fontStack(font) : '');
          }}
        >
          <option value="">Oryginał</option>
          {control.kinds.map((kind) => (
            <optgroup key={kind} label={FONT_KIND_LABELS[kind]}>
              {FONT_OPTIONS.filter((font) => font.kind === kind).map((font) => (
                <option key={font.family} value={font.family}>
                  {font.family}
                  {font.noPolish ? ' (bez polskich znaków)' : ''}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      );
    }
  }
}
