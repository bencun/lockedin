import { REDIRECT_COUNT_KEY } from '@/utils/lockedIn';

const LINKEDIN_JOBS_URL = 'https://www.linkedin.com/jobs';
const DEFAULT_ACTION_TITLE = 'LockedIn status';
const REDIRECT_ACTION_TITLE = 'LOCK IN! Feed redirected to Jobs.';
const REDIRECT_NOTIFICATION_ID = 'lockedin-redirect';
const REDIRECT_CONFIRMATION_MS = 3_000;
const REDIRECT_PENDING_MS = 15_000;

const pendingRedirects = new Map<number, number>();
const badgeTimeouts = new Map<number, ReturnType<typeof setTimeout>>();
let countUpdateQueue = Promise.resolve();

function isLinkedInFeed(url: string) {
  try {
    const parsedUrl = new URL(url);
    const isLinkedIn =
      parsedUrl.hostname === 'linkedin.com' ||
      parsedUrl.hostname.endsWith('.linkedin.com');
    const isFeed =
      parsedUrl.pathname === '/feed' || parsedUrl.pathname.startsWith('/feed/');

    return isLinkedIn && isFeed;
  } catch {
    return false;
  }
}

function isLinkedInJobsUrl(url?: string) {
  if (!url) return false;

  try {
    const parsedUrl = new URL(url);
    const isLinkedIn =
      parsedUrl.hostname === 'linkedin.com' ||
      parsedUrl.hostname.endsWith('.linkedin.com');
    const isJobs =
      parsedUrl.pathname === '/jobs' || parsedUrl.pathname.startsWith('/jobs/');

    return isLinkedIn && isJobs;
  } catch {
    return false;
  }
}

function incrementRedirectCount(): Promise<number> {
  const update = countUpdateQueue.then(async () => {
    const stored = await browser.storage.local.get(REDIRECT_COUNT_KEY);
    const currentCount =
      typeof stored[REDIRECT_COUNT_KEY] === 'number'
        ? stored[REDIRECT_COUNT_KEY]
        : 0;
    const redirectCount = currentCount + 1;

    await browser.storage.local.set({ [REDIRECT_COUNT_KEY]: redirectCount });

    return redirectCount;
  });

  countUpdateQueue = update.then(
    () => undefined,
    () => undefined,
  );

  return update;
}

function clearBadge(tabId: number) {
  badgeTimeouts.delete(tabId);

  void Promise.all([
    browser.action.setBadgeText({ tabId, text: '' }),
    browser.action.setTitle({ tabId, title: DEFAULT_ACTION_TITLE }),
  ]).catch(() => {
    // The tab may have closed before the badge was cleared.
  });
}

function showRedirectConfirmation(tabId: number) {
  const existingTimeout = badgeTimeouts.get(tabId);
  if (existingTimeout) clearTimeout(existingTimeout);

  void Promise.all([
    browser.action.setBadgeBackgroundColor({ color: '#168a54', tabId }),
    browser.action.setBadgeText({ tabId, text: 'LOCK' }),
    browser.action.setTitle({ tabId, title: REDIRECT_ACTION_TITLE }),
  ]).catch(() => {
    // The tab may have closed before the badge was shown.
  });

  void browser.notifications
    .create(REDIRECT_NOTIFICATION_ID, {
      type: 'basic',
      iconUrl: browser.runtime.getURL('/icon/128.png'),
      title: 'LOCK IN!',
      message: 'LinkedIn feed blocked. Jobs opened.',
    })
    .catch(() => {
      // The browser or operating system may have notifications disabled.
    });

  badgeTimeouts.set(
    tabId,
    setTimeout(() => clearBadge(tabId), REDIRECT_CONFIRMATION_MS),
  );
}

function redirectFeed(tabId: number, frameId: number, url: string) {
  if (frameId !== 0 || !isLinkedInFeed(url)) return;

  pendingRedirects.set(tabId, Date.now());

  void browser.tabs.update(tabId, { url: LINKEDIN_JOBS_URL }).catch(() => {
    pendingRedirects.delete(tabId);
  });
}

async function confirmRedirect(tabId: number, frameId: number, url: string) {
  if (frameId !== 0 || !isLinkedInJobsUrl(url)) return;

  const redirectStartedAt = pendingRedirects.get(tabId);
  if (redirectStartedAt === undefined) return;

  pendingRedirects.delete(tabId);

  if (Date.now() - redirectStartedAt > REDIRECT_PENDING_MS) return;

  showRedirectConfirmation(tabId);

  const tab = await browser.tabs.get(tabId).catch(() => undefined);
  if (!tab || tab.incognito) return;

  await incrementRedirectCount();
}

export default defineBackground(() => {
  browser.webNavigation.onBeforeNavigate.addListener((details) => {
    redirectFeed(details.tabId, details.frameId, details.url);
  });

  browser.webNavigation.onHistoryStateUpdated.addListener((details) => {
    redirectFeed(details.tabId, details.frameId, details.url);
  });

  browser.webNavigation.onCommitted.addListener((details) => {
    void confirmRedirect(details.tabId, details.frameId, details.url);
  });

  browser.tabs.onRemoved.addListener((tabId) => {
    pendingRedirects.delete(tabId);

    const badgeTimeout = badgeTimeouts.get(tabId);
    if (badgeTimeout) clearTimeout(badgeTimeout);
    badgeTimeouts.delete(tabId);
  });
});
