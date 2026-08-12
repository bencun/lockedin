import { useEffect, useState } from 'react';
import NotificationPreference from '@/components/NotificationPreference';
import { REDIRECT_COUNT_KEY } from '@/utils/lockedIn';
import './App.css';

type ExtensionStatus = 'loading' | 'active' | 'idle';

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

  useEffect(() => {
    let isMounted = true;

    async function updateStatus() {
      const [[activeTab], stored] = await Promise.all([
        browser.tabs.query({
          active: true,
          currentWindow: true,
        }),
        browser.storage.local.get(REDIRECT_COUNT_KEY),
      ]);

      if (isMounted) {
        setStatus(isLinkedInUrl(activeTab?.url) ? 'active' : 'idle');
        setRedirectCount(
          typeof stored[REDIRECT_COUNT_KEY] === 'number'
            ? stored[REDIRECT_COUNT_KEY]
            : 0,
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

      if (isMounted && areaName === 'local' && typeof nextCount === 'number') {
        setRedirectCount(nextCount);
      }
    }

    browser.storage.onChanged.addListener(handleStorageChange);

    return () => {
      isMounted = false;
      browser.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const isActive = status === 'active';
  const isLoading = status === 'loading';

  return (
    <main className={`popup popup--${status}`}>
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
          {isLoading ? 'Checking' : isActive ? 'Active' : 'Idle'}
        </p>
        <h1>
          {isLoading
            ? 'One moment…'
            : isActive
              ? 'Feed blocked'
              : 'Standing by'}
        </h1>
        <p className="status__message">
          {isLoading
            ? 'Checking the current tab.'
            : isActive
              ? 'LinkedIn feed visits are redirected to Jobs.'
              : 'Open LinkedIn to activate feed blocking.'}
        </p>
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
      </footer>
    </main>
  );
}

export default App;
