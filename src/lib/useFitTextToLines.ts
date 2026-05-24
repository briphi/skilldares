import { useLayoutEffect, type RefObject } from 'react';

export type UseFitTextToLinesOptions = {
  /** Smallest px size the font is allowed to shrink to. Default 12. */
  minFontSizePx?: number;
  /** Amount to decrement on each iteration. Default 1. */
  stepPx?: number;
};

/**
 * Skilldares — auto-shrink text to fit within a max line count.
 *
 * Measures the referenced element after render and iteratively reduces its
 * inline font-size until `el.scrollHeight` fits within `maxLines × line-height`.
 * Stops at `minFontSizePx` so the text never becomes unreadable.
 *
 * Pure CSS alternatives don't work for this use case: line-clamp truncates
 * with ellipsis (loses content), `clamp()` on font-size only reacts to
 * viewport not to content length. JS measurement is the right tool.
 *
 * Use with a remounting parent (e.g. `key={someId}`) so the layout-effect
 * fires fresh whenever the text content changes. The hook does NOT
 * re-measure on viewport resize — appropriate for short-lived overlays
 * (e.g. per-question feedback) where a rotation mid-display is rare.
 */
export function useFitTextToLines(
  ref: RefObject<HTMLElement | null>,
  maxLines: number,
  options: UseFitTextToLinesOptions = {},
): void {
  const { minFontSizePx = 12, stepPx = 1 } = options;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Clear any prior inline font-size so we re-measure against the CSS
    // default (important on subsequent renders if the ref stays mounted).
    el.style.fontSize = '';

    let fontSize = parseFloat(window.getComputedStyle(el).fontSize);

    const targetHeight = (): number => {
      const lh = parseFloat(window.getComputedStyle(el).lineHeight);
      // computed line-height may resolve to 'normal' (NaN) on some browsers;
      // estimate as 1.2× font-size in that case.
      const resolved = Number.isNaN(lh) ? fontSize * 1.2 : lh;
      return resolved * maxLines;
    };

    // Guard the loop with a hard iteration cap in case of pathological
    // unbreakable content (long URLs etc.) — we'd rather give up and let
    // the text overflow than spin.
    let iterations = 0;
    const maxIterations = 64;
    while (
      iterations++ < maxIterations &&
      el.scrollHeight > targetHeight() + 1 &&
      fontSize > minFontSizePx
    ) {
      fontSize -= stepPx;
      el.style.fontSize = `${fontSize}px`;
    }
  }, [ref, maxLines, minFontSizePx, stepPx]);
}
