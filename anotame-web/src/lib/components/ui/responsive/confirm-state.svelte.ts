/**
 * Reactive state store for the global adaptive confirm dialog.
 * Separated from the Svelte component to avoid $state in <script module>.
 */

type ConfirmRequest = {
  title: string;
  description: string;
};

let _resolve: ((value: boolean) => void) | null = null;
let _open = $state(false);
let _title = $state('');
let _description = $state('');

export const confirmState = {
  get open() { return _open; },
  set open(v: boolean) { _open = v; },
  get title() { return _title; },
  get description() { return _description; },
};

export function adaptiveConfirm(opts: ConfirmRequest): Promise<boolean> {
  // Mobile: use native confirm
  if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
    return Promise.resolve(window.confirm(opts.description));
  }

  // Desktop: open AlertDialog
  return new Promise<boolean>((resolve) => {
    _title = opts.title;
    _description = opts.description;
    _resolve = resolve;
    _open = true;
  });
}

export function resolveConfirm(value: boolean) {
  _open = false;
  _resolve?.(value);
  _resolve = null;
}
