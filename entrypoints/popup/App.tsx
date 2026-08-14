import { useEffect, useState } from 'react';
import NotificationPreference from '@/components/NotificationPreference';
import PrivacyLink from '@/components/PrivacyLink';
import {
  PAUSE_DURATION_MS,
  PAUSE_UNTIL_KEY,
  REDIRECT_COUNT_KEY,
} from '@/utils/lockedIn';
import './App.css';

type ExtensionStatus = 'loading' | 'active' | 'idle' | 'paused';

function formatRemainingTime(remainingSeconds: number) {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function isLinkedInUrl(url?: string) {
  if (!url) return false;

  try {
    const hostname = new URL(url).hostname;
    return hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com');
  } catch {
    return false;
  }
}

function App() {
  const [status, setStatus] = useState<ExtensionStatus>('loading');
  const [redirectCount, setRedirectCount] = useState<number | null>(null);
  const [pauseUntil, setPauseUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [isUpdatingPause, setIsUpdatingPause] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function updateStatus() {
      const [[activeTab], stored] = await Promise.all([
        browser.tabs.query({
          active: true,
          currentWindow: true,
        }),
        browser.storage.local.get([REDIRECT_COUNT_KEY, PAUSE_UNTIL_KEY]),
      ]);

      if (isMounted) {
        setStatus(isLinkedInUrl(activeTab?.url) ? 'active' : 'idle');
        setRedirectCount(
          typeof stored[REDIRECT_COUNT_KEY] === 'number'
            ? stored[REDIRECT_COUNT_KEY]
            : 0,
        );
        setPauseUntil(
          typeof stored[PAUSE_UNTIL_KEY] === 'number' &&
            stored[PAUSE_UNTIL_KEY] > Date.now()
            ? stored[PAUSE_UNTIL_KEY]
            : null,
        );
      }
    }

    void updateStatus().catch(() => {
      if (isMounted) setStatus('idle');
    });

    function handleStorageChange(
      changes: Record<string, Browser.storage.StorageChange>,
      areaName: string,
    ) {
      const nextCount = changes[REDIRECT_COUNT_KEY]?.newValue;
      const nextPauseUntil = changes[PAUSE_UNTIL_KEY]?.newValue;

      if (isMounted && areaName === 'local' && typeof nextCount === 'number') {
        setRedirectCount(nextCount);
      }

      if (isMounted && areaName === 'local' && changes[PAUSE_UNTIL_KEY]) {
        setNow(Date.now());
        setPauseUntil(
          typeof nextPauseUntil === 'number' && nextPauseUntil > Date.now()
            ? nextPauseUntil
            : null,
        );
      }
    }

    browser.storage.onChanged.addListener(handleStorageChange);

    return () => {
      isMounted = false;
      browser.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (pauseUntil === null) return;

    const updateTimer = () => {
      const currentTime = Date.now();
      setNow(currentTime);

      if (currentTime >= pauseUntil) setPauseUntil(null);
    };

    updateTimer();
    const timer = window.setInterval(updateTimer, 250);

    return () => window.clearInterval(timer);
  }, [pauseUntil]);

  async function togglePause() {
    if (status === 'loading' || isUpdatingPause) return;

    setIsUpdatingPause(true);

    try {
      if (pauseUntil !== null && pauseUntil > Date.now()) {
        await browser.storage.local.remove(PAUSE_UNTIL_KEY);
        setPauseUntil(null);
      } else {
        const nextPauseUntil = Date.now() + PAUSE_DURATION_MS;
        await browser.storage.local.set({
          [PAUSE_UNTIL_KEY]: nextPauseUntil,
        });
        setNow(Date.now());
        setPauseUntil(nextPauseUntil);
      }
    } finally {
      setIsUpdatingPause(false);
    }
  }

  const isPaused = pauseUntil !== null && pauseUntil > now;
  const displayStatus: ExtensionStatus = isPaused ? 'paused' : status;
  const isActive = displayStatus === 'active';
  const isLoading = status === 'loading';
  const remainingSeconds = isPaused
    ? Math.max(0, Math.ceil((pauseUntil - now) / 1_000))
    : 0;

  return (
    <main className={`popup popup--${displayStatus}`}>
      <header className="brand">
        <span className="brand__mark" aria-hidden="true">
          L
        </span>
        <span className="brand__name">LockedIn</span>
      </header>

      <section className="status" aria-live="polite">
        <div className="status__indicator" aria-hidden="true">
          <span className="status__dot" />
          <span className="status__ring" />
        </div>

        <p className="status__label">
          {isLoading
            ? 'Checking'
            : isPaused
              ? 'Paused'
              : isActive
                ? 'Active'
                : 'Idle'}
        </p>
        <h1>
          {isLoading
            ? 'One moment…'
            : isPaused
              ? 'Feed available'
              : isActive
                ? 'Feed blocked'
                : 'Standing by'}
        </h1>
        <p className="status__message">
          {isLoading
            ? 'Checking the current tab.'
            : isPaused
              ? 'LinkedIn feed visits are temporarily allowed.'
              : isActive
                ? 'LinkedIn feed visits are redirected to Jobs.'
                : 'Open LinkedIn to activate feed blocking.'}
        </p>
      </section>

      <section className="pause-control">
        <div className="pause-control__copy">
          <h2>{isPaused ? 'Blocking is paused' : 'Pause for 5 minutes'}</h2>
          <p>
            {isPaused ? (
              <>
                <time dateTime={`PT${remainingSeconds}S`}>
                  {formatRemainingTime(remainingSeconds)}
                </time>{' '}
                remaining
              </>
            ) : (
              'Temporarily allow LinkedIn feed visits.'
            )}
          </p>
        </div>
        <button
          className="pause-control__switch"
          type="button"
          role="switch"
          aria-checked={isPaused}
          aria-label={
            isPaused
              ? 'Resume feed blocking now'
              : 'Pause feed blocking for 5 minutes'
          }
          disabled={isLoading || isUpdatingPause}
          onClick={() => void togglePause()}
        >
          <span aria-hidden="true" />
        </button>
      </section>

      <section className="counter">
        <span className="counter__value">
          {redirectCount === null ? '—' : redirectCount.toLocaleString()}
        </span>
        <span className="counter__label">
          {redirectCount === 1 ? 'redirect' : 'redirects'} since install
        </span>
      </section>

      <NotificationPreference />

      <footer>
        <p className="disclaimer">
          Independent extension. Not affiliated with or endorsed by LinkedIn.
        </p>
        <PrivacyLink className="privacy-link" />
      </footer>
    </main>
  );
}

export default App;
