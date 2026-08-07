import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { schedulerUrl, type OpenSchedulerOptions } from '@/lib/booking';

/**
 * Calendly's inline widget, hosted on our own page.
 *
 * Why embed rather than link out: the funnel is book-then-pay, so picking a
 * slot is the MIDDLE of the journey, not the end. Sent to calendly.com the
 * visitor lands on Calendly's confirmation screen holding an unpaid slot with
 * nothing telling them to come back, and the only way to return them is a
 * "Redirect to an external site" setting in the Calendly dashboard — config
 * living outside this repo that no test can see is missing and no reviewer can
 * check. Embedded, the hand-back is `onScheduled` below: ordinary code.
 *
 * The widget posts a message when the booking is made. That message is the only
 * signal we get client-side; the authoritative record still arrives separately
 * as the invitee webhook, which is what actually creates the pending booking.
 * So `onScheduled` may fire slightly BEFORE the booking row exists — the page
 * it hands off to has to tolerate that, and /consult/book does.
 */

const WIDGET_SCRIPT = 'https://assets.calendly.com/assets/external/widget.js';

/** Calendly posts several event types; this is the only one we act on. */
const SCHEDULED_EVENT = 'calendly.event_scheduled';

const CALENDLY_ORIGIN = /^https:\/\/([a-z0-9-]+\.)?calendly\.com$/;

/**
 * Reads the event name out of a postMessage, tolerating the shapes Calendly
 * has used. Some widget versions post an object; others post the same object
 * JSON-encoded, and a strict `data.event` read silently sees nothing at all —
 * which looks exactly like "the booking never happened".
 */
function parsed(data: unknown): Record<string, unknown> | null {
  if (typeof data === 'string') {
    try {
      return parsed(JSON.parse(data));
    } catch {
      return null;
    }
  }
  return data && typeof data === 'object'
    ? (data as Record<string, unknown>)
    : null;
}

function eventNameOf(data: unknown): string | null {
  const name = parsed(data)?.event;
  return typeof name === 'string' ? name : null;
}

/** What we tell the backend about the slot the visitor just took. */
export interface ScheduledEventDetails {
  inviteeUri?: string;
  eventUri?: string;
  startsAt?: string;
  endsAt?: string;
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

/**
 * Digs the useful identifiers out of Calendly's message.
 *
 * Written to survive not finding them. Calendly has moved this payload around
 * between embed versions, and everything here is an optimisation: the backend
 * creates a payable booking from the prospect id alone, and the webhook fills
 * in whatever the browser could not see. Throwing — or refusing to report —
 * because a nested key moved would trade a complete record for a broken
 * checkout, which is the wrong way round.
 */
function detailsOf(data: unknown): ScheduledEventDetails {
  const payload = parsed(parsed(data)?.payload) ?? {};
  const invitee = parsed(payload.invitee) ?? {};
  const event = parsed(payload.event) ?? {};

  return {
    inviteeUri: str(invitee.uri),
    eventUri: str(event.uri),
    startsAt: str(event.start_time) ?? str(payload.start_time),
    endsAt: str(event.end_time) ?? str(payload.end_time),
  };
}

/**
 * Whether a message is Calendly telling us a slot was taken.
 *
 * The provenance check is deliberately NOT origin-only. Calendly's own
 * documented snippet checks the event name and nothing else, which means the
 * origin is not something they guarantee — and a check stricter than the
 * provider's contract fails closed, i.e. the visitor books and simply never
 * moves on. So a message is accepted if it came from the widget's own frame OR
 * from a calendly.com origin. Both are far stronger than trusting any sender:
 * without one of them an arbitrary page could fake a booking and march someone
 * to checkout for a slot that does not exist.
 */
function isCalendlyScheduledEvent(
  event: MessageEvent,
  frame: HTMLIFrameElement | null,
): boolean {
  if (eventNameOf(event.data) !== SCHEDULED_EVENT) return false;

  const fromWidgetFrame =
    frame?.contentWindow != null && event.source === frame.contentWindow;

  return fromWidgetFrame || CALENDLY_ORIGIN.test(event.origin);
}

/** Loads the widget script once per document, reusing it across mounts. */
function loadWidgetScript(): Promise<void> {
  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${WIDGET_SCRIPT}"]`,
  );
  if (existing) {
    return existing.dataset.loaded === 'true'
      ? Promise.resolve()
      : new Promise((resolve, reject) => {
          existing.addEventListener('load', () => resolve());
          existing.addEventListener('error', () =>
            reject(new Error('Calendly widget failed to load')),
          );
        });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = WIDGET_SCRIPT;
    script.async = true;
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
      resolve();
    });
    script.addEventListener('error', () =>
      reject(new Error('Calendly widget failed to load')),
    );
    document.head.appendChild(script);
  });
}

interface CalendlyWidgetApi {
  initInlineWidget(options: {
    url: string;
    parentElement: HTMLElement;
    prefill?: { name?: string; email?: string };
  }): void;
}

export interface CalendlyEmbedProps extends OpenSchedulerOptions {
  /**
   * Fired once the visitor has picked a time and confirmed it, with whatever
   * identifiers the message carried. May be empty — see detailsOf.
   */
  onScheduled: (details: ScheduledEventDetails) => void;
  /**
   * Fired when the widget cannot be shown at all. The caller should offer the
   * off-site link as a fallback — a visitor who cannot see a calendar is a lost
   * sale, and a blank box tells them nothing.
   */
  onUnavailable?: (error: Error) => void;
}

export function CalendlyEmbed({
  onScheduled,
  onUnavailable,
  ...options
}: CalendlyEmbedProps) {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  // Held in a ref so the effect below does not re-run — and re-mount the
  // widget — every time the parent re-renders with a new closure.
  const onScheduledRef = useRef(onScheduled);
  onScheduledRef.current = onScheduled;

  const url = schedulerUrl(options);
  const { name, email } = options;

  useEffect(() => {
    let cancelled = false;

    loadWidgetScript()
      .then(() => {
        if (cancelled || !container.current) return;
        const calendly = (window as unknown as { Calendly?: CalendlyWidgetApi })
          .Calendly;
        if (!calendly) throw new Error('Calendly widget did not initialise');

        calendly.initInlineWidget({
          url,
          parentElement: container.current,
          prefill: { name, email },
        });
        setReady(true);
      })
      .catch((error: Error) => {
        if (!cancelled) onUnavailable?.(error);
      });

    return () => {
      cancelled = true;
    };
    // Deliberately keyed on the URL alone. Re-initialising the widget resets
    // the visitor's place in it, so a re-render must not be able to trigger it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const name = eventNameOf(event.data);

      // Every calendly.* message is logged, not just the one we act on. When
      // this hand-off breaks the symptom is silence — the visitor books and
      // nothing happens — and without this the only way to tell "no message
      // arrived" from "a message arrived and was rejected" is to rebuild the
      // component with logging in it.
      if (name?.startsWith('calendly.')) {
        console.info('[calendly]', name, { origin: event.origin });
      }

      const frame = container.current?.querySelector('iframe') ?? null;
      if (isCalendlyScheduledEvent(event, frame)) {
        onScheduledRef.current(detailsOf(event.data));
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    // The widget container must be LAID OUT — real width, real height — before
    // initInlineWidget runs, and must stay that way.
    //
    // Calendly picks its layout once, at init, by measuring
    // `parentElement.offsetWidth`, and below roughly 680px it switches to the
    // narrow single-column date picker meant for phones. It was previously
    // initialised while the container still carried `hidden`, so it measured a
    // `display: none` element, read 0, and locked into that narrow layout —
    // which is why the date picker came out squashed on a full-width desktop
    // card. Nothing later un-does that: the choice is not re-made on reveal.
    //
    // So the loading state is an OVERLAY rather than a swap. The container is
    // never removed from layout, and the spinner sits on top of it until the
    // widget has drawn itself, which also stops the visitor watching it build.
    //
    // The height is definite (`h-[700px]`) rather than a minimum. Calendly
    // sizes its iframe to `height: 100%`, and a percentage height resolves
    // against nothing on a parent that only has `min-height`.
    <div className="relative min-h-[700px]">
      <div
        ref={container}
        data-testid="calendly-inline-widget"
        className="h-[700px] min-w-[320px]"
      />
      {!ready && (
        <div
          data-testid="calendly-loading"
          className="absolute inset-0 z-10 flex items-center justify-center gap-3 bg-white text-navy-muted"
        >
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading available times…</span>
        </div>
      )}
    </div>
  );
}
