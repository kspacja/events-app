import type { SearchChange } from './searchQuery';

export interface FilterOption {
  readonly id: string;
  readonly label: string;
  readonly hint?: string;
  readonly pressed: boolean;
  readonly change: SearchChange;
}

export interface InputLimits {
  readonly min?: string;
  readonly max?: string;
}

export type CustomRangeOutcome =
  | { readonly change: SearchChange }
  | { readonly error: string };

export interface CustomRangeDefinition {
  readonly inputType: 'date' | 'time';
  readonly from: string;
  readonly to: string;
  readonly labels: {
    readonly heading: string;
    readonly from: string;
    readonly to: string;
    readonly submit: string;
  };
  readonly limits?: (
    from: string,
    to: string,
  ) => { readonly from: InputLimits; readonly to: InputLimits };
  readonly validate: (from: string, to: string) => CustomRangeOutcome;
}

export interface FilterDefinition {
  readonly chipLabel: string;
  readonly dialogLabel: string;
  readonly presetsLabel: string;
  /** Rendered before the presets, e.g. "any time". */
  readonly clear?: FilterOption;
  readonly presets: readonly FilterOption[];
  readonly custom?: CustomRangeDefinition;
  /** Remounts the panel (resetting the custom form) when it changes. */
  readonly resetKey: string;
}
