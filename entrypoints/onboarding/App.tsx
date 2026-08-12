import NotificationPreference from '@/components/NotificationPreference';
import PrivacyLink from '@/components/PrivacyLink';

function App() {
  return (
    <main className="onboarding">
      <header className="brand">
        <span className="brand__mark" aria-hidden="true">
          L
        </span>
        <span>LockedIn</span>
      </header>

      <section className="intro">
        <p className="eyebrow">One quick setup step</p>
        <h1>Pin LockedIn to see when it keeps you focused.</h1>
        <p className="lead">
          Browsers do not allow extensions to pin themselves. Pinning keeps the
          icon visible so you can see the green <strong>LOCK</strong> badge
          after a redirect.
        </p>
      </section>

      <div className="toolbar-demo" aria-label="Toolbar badge preview">
        <span className="toolbar-demo__address">Address bar</span>
        <span className="toolbar-demo__extension">
          <span className="toolbar-demo__icon">L</span>
          <span className="toolbar-demo__badge">LOCK</span>
        </span>
      </div>

      <ol className="steps">
        <li>
          <span>1</span>
          <p>Open your browser’s Extensions menu near the address bar.</p>
        </li>
        <li>
          <span>2</span>
          <p>Find LockedIn and choose “Pin” or “Pin to toolbar.”</p>
        </li>
        <li>
          <span>3</span>
          <p>The icon will now flash LOCK whenever the feed is redirected.</p>
        </li>
      </ol>

      <section className="notification-card">
        <NotificationPreference />
      </section>

      <button
        className="done-button"
        type="button"
        onClick={() => window.close()}
      >
        Got it
      </button>

      <p className="disclaimer">
        Independent extension. Not affiliated with or endorsed by LinkedIn.
      </p>
      <PrivacyLink className="privacy-link" />
    </main>
  );
}

export default App;
