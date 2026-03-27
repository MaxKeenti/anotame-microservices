import { onMount } from 'svelte';

const MOBILE_BREAKPOINT = 768;

/**
 * Reactive hook that tracks whether the viewport is mobile-sized.
 * Uses `window.matchMedia` for efficient, debounce-free detection.
 *
 * Usage:
 *   let mobile = useIsMobile();
 *   // Access via mobile.current (reactive $state)
 */
export function useIsMobile() {
  let isMobile = $state<boolean>(false);

  onMount(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const onChange = () => {
      isMobile = mql.matches;
    };

    mql.addEventListener('change', onChange);
    onChange(); // initial check

    return () => {
      mql.removeEventListener('change', onChange);
    };
  });

  return {
    get current() {
      return isMobile;
    }
  };
}
