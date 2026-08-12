const LINKEDIN_JOBS_URL = "https://www.linkedin.com/jobs";

function isLinkedInFeed(url: string) {
  try {
    const parsedUrl = new URL(url);
    const isLinkedIn =
      parsedUrl.hostname === "linkedin.com" ||
      parsedUrl.hostname.endsWith(".linkedin.com");
    const isFeed =
      parsedUrl.pathname === "/feed" ||
      parsedUrl.pathname.startsWith("/feed/");

    return isLinkedIn && isFeed;
  } catch {
    return false;
  }
}

function redirectFeed(tabId: number, frameId: number, url: string) {
  if (frameId !== 0 || !isLinkedInFeed(url)) return;

  void browser.tabs.update(tabId, { url: LINKEDIN_JOBS_URL }).catch(() => {
    // The tab may have closed before the redirect completed.
  });
}

export default defineBackground(() => {
  browser.webNavigation.onBeforeNavigate.addListener((details) => {
    redirectFeed(details.tabId, details.frameId, details.url);
  });

  browser.webNavigation.onHistoryStateUpdated.addListener((details) => {
    redirectFeed(details.tabId, details.frameId, details.url);
  });
});
