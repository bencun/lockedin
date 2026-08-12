export default defineContentScript({
  matches: ["*://*.linkedin.com/*"],
  runAt: "document_start",
  main() {
    const isFeed =
      window.location.pathname === "/feed" ||
      window.location.pathname.startsWith("/feed/");

    if (isFeed) {
      window.location.replace(`${window.location.origin}/jobs`);
    }
  },
});
