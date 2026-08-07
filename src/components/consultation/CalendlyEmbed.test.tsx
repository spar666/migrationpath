import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

/**
 * Layout of the embed container, which is not cosmetic.
 *
 * Calendly chooses its layout ONCE, at `initInlineWidget`, by measuring
 * `parentElement.offsetWidth`, and below roughly 680px it renders the narrow
 * single-column date picker built for phones. That choice is never revisited.
 *
 * So the container has to be laid out at its true width before the widget is
 * initialised. It previously was not — it carried Tailwind's `hidden` while
 * loading, so Calendly measured a `display: none` element, read 0, and drew the
 * squashed mobile date picker inside a full-width desktop card.
 *
 * jsdom does not apply Tailwind, so there is no computed `display` to assert
 * on. These check the thing Tailwind compiles FROM: the class, and the presence
 * of the element in the layout at the moment Calendly looks at it.
 */

vi.mock('@/lib/booking', () => ({
  schedulerUrl: () => 'https://calendly.com/migrationpath/consult',
}));

/** What the container looked like at the instant Calendly measured it. */
let containerAtInit: { className: string; isConnected: boolean } | null = null;
const initInlineWidget = vi.fn(
  (options: { parentElement: HTMLElement; url: string }) => {
    containerAtInit = {
      className: options.parentElement.className,
      isConnected: options.parentElement.isConnected,
    };
    // Stand in for the iframe the real widget injects.
    options.parentElement.appendChild(document.createElement('iframe'));
  },
);

const { CalendlyEmbed } = await import('./CalendlyEmbed');

describe('CalendlyEmbed container layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    containerAtInit = null;
    document.head.querySelectorAll('script').forEach((s) => s.remove());
    (window as unknown as { Calendly?: unknown }).Calendly = {
      initInlineWidget,
    };
  });

  /** The component loads the widget script itself; resolve it immediately. */
  function resolveWidgetScript() {
    const script = document.head.querySelector('script');
    script?.dispatchEvent(new Event('load'));
  }

  it('is NOT display:none when Calendly measures it', async () => {
    render(
      <CalendlyEmbed prospectId="prospect-1" onScheduled={() => {}} />,
    );
    resolveWidgetScript();

    await waitFor(() => expect(initInlineWidget).toHaveBeenCalled());

    // The regression, exactly: `hidden` here is display:none, offsetWidth 0,
    // and a permanently squashed date picker.
    expect(containerAtInit).not.toBeNull();
    expect(containerAtInit!.className).not.toMatch(/\bhidden\b/);
    expect(containerAtInit!.isConnected).toBe(true);
  });

  it('gives the container a definite height, not just a minimum', async () => {
    // Calendly sizes its iframe to `height: 100%`, which resolves against
    // nothing on a parent that only carries `min-height`.
    render(
      <CalendlyEmbed prospectId="prospect-1" onScheduled={() => {}} />,
    );
    resolveWidgetScript();

    await waitFor(() => expect(initInlineWidget).toHaveBeenCalled());

    expect(containerAtInit!.className).toMatch(/\bh-\[700px\]/);
    expect(containerAtInit!.className).toMatch(/\bmin-w-\[320px\]/);
  });

  it('shows the spinner OVER the widget rather than in place of it', async () => {
    // The loading state has to be an overlay. A spinner that occupies its own
    // block in the flow is what pushed the container out of layout and caused
    // the zero-width measurement — so `absolute` here is load-bearing, not
    // styling, and the container must be present from the very first render.
    render(<CalendlyEmbed prospectId="prospect-1" onScheduled={() => {}} />);

    const loader = screen.getByTestId('calendly-loading');
    expect(loader.className).toMatch(/\babsolute\b/);
    expect(loader.className).toMatch(/\binset-0\b/);
    expect(screen.getByTestId('calendly-inline-widget')).toBeInTheDocument();

    resolveWidgetScript();

    await waitFor(() =>
      expect(screen.queryByTestId('calendly-loading')).toBeNull(),
    );
    expect(screen.getByTestId('calendly-inline-widget')).toBeInTheDocument();
  });
});
