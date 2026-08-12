import { useEffect, useState } from "react";
import "./App.css";

type ExtensionStatus = "loading" | "active" | "idle";

function isLinkedInUrl(url?: string) {
  if (!url) return false;

  try {
    const hostname = new URL(url).hostname;
    return hostname === "linkedin.com" || hostname.endsWith(".linkedin.com");
  } catch {
    return false;
  }
}

function App() {
  const [status, setStatus] = useState<ExtensionStatus>("loading");

  useEffect(() => {
    let isMounted = true;

    async function updateStatus() {
      const [activeTab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (isMounted) {
        setStatus(isLinkedInUrl(activeTab?.url) ? "active" : "idle");
      }
    }

    void updateStatus().catch(() => {
      if (isMounted) setStatus("idle");
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const isActive = status === "active";
  const isLoading = status === "loading";

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
          {isLoading ? "Checking" : isActive ? "Active" : "Idle"}
        </p>
        <h1>{isLoading ? "One moment…" : isActive ? "Feed blocked" : "Standing by"}</h1>
        <p className="status__message">
          {isLoading
            ? "Checking the current tab."
            : isActive
              ? "LinkedIn feed visits are redirected to Jobs."
              : "Open LinkedIn to activate feed blocking."}
        </p>
      </section>
    </main>
  );
}

export default App;
