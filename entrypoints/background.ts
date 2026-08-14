import {
  PAUSE_ALARM_NAME,
  PAUSE_UNTIL_KEY,
  REDIRECT_COUNT_KEY,
  REDIRECT_RULESET_ID,
} from '@/utils/lockedIn';
import {
  NOTIFICATION_PERMISSION,
  REDIRECT_NOTIFICATION_ID,
} from '@/utils/notifications';

const LINKEDIN_JOBS_URL = 'https://www.linkedin.com/jobs';
const DEFAULT_ACTION_TITLE = 'LockedIn status';
const REDIRECT_ACTION_TITLE = 'LOCK IN! Feed redirected to Jobs.';
const PAUSED_ACTION_TITLE =
  'LockedIn paused. Feed blocking resumes automatically.';
const PAUSED_BADGE_TEXT = 'Ⅱ';
const PAUSED_BADGE_COLOR = '#d97706';
const REDIRECT_CONFIRMATION_MS = 3_000;
const REDIRECT_PENDING_MS = 15_000;

const pendingRedirects = new Map<number, number>();
const badgeTimeouts = new Map<number, ReturnType<typeof setTimeout>>();
let countUpdateQueue = Promise.resolve();
let pauseUpdateQueue = Promise.resolve();

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

async function getPauseUntil() {
  const stored = await browser.storage.local.get(PAUSE_UNTIL_KEY);
  const pauseUntil = stored[PAUSE_UNTIL_KEY];

  return typeof pauseUntil === 'number' ? pauseUntil : 0;
}

async function showPausedBadge(isPaused: boolean) {
  if (isPaused) {
    for (const timeout of badgeTimeouts.values()) clearTimeout(timeout);
    badgeTimeouts.clear();
  }

  const tabs = await browser.tabs.query({});
  const text = isPaused ? PAUSED_BADGE_TEXT : '';
  const title = isPaused ? PAUSED_ACTION_TITLE : DEFAULT_ACTION_TITLE;
  const updates = [
    browser.action.setBadgeText({ text }),
    browser.action.setTitle({ title }),
    ...tabs.flatMap((tab) => {
      if (tab.id === undefined) return [];

      const tabUpdates = [
        browser.action.setBadgeText({ tabId: tab.id, text }),
        browser.action.setTitle({ tabId: tab.id, title }),
      ];

      if (isPaused) {
        tabUpdates.push(
          browser.action.setBadgeBackgroundColor({
            color: PAUSED_BADGE_COLOR,
            tabId: tab.id,
          }),
        );
      }

      return tabUpdates;
    }),
  ];

  if (isPaused) {
    updates.push(
      browser.action.setBadgeBackgroundColor({ color: PAUSED_BADGE_COLOR }),
    );
  }

  await Promise.all(updates.map((update) => update.catch(() => undefined)));
}

function reconcilePauseState() {
  const update = pauseUpdateQueue.then(async () => {
    const pauseUntil = await getPauseUntil();

    if (pauseUntil > Date.now()) {
      pendingRedirects.clear();

      await browser.declarativeNetRequest.updateEnabledRulesets({
        disableRulesetIds: [REDIRECT_RULESET_ID],
      });
      await browser.alarms.create(PAUSE_ALARM_NAME, { when: pauseUntil });
      await showPausedBadge(true);
      return;
    }

    await showPausedBadge(false);
    await browser.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: [REDIRECT_RULESET_ID],
    });
    await browser.alarms.clear(PAUSE_ALARM_NAME);
  });

  pauseUpdateQueue = update.catch(() => undefined);

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

async function showRedirectNotification() {
  const notificationsEnabled = await browser.permissions.contains(
    NOTIFICATION_PERMISSION,
  );
  if (!notificationsEnabled) return;

  await browser.notifications.create(REDIRECT_NOTIFICATION_ID, {
    type: 'basic',
    iconUrl: browser.runtime.getURL('/icon/128.png'),
    title: 'LOCK IN!',
    message: 'LinkedIn feed blocked. Jobs opened.',
  });
}

function showRedirectConfirmation(tabId: number) {
  const existingTimeout = badgeTimeouts.get(tabId);
  if (existingTimeout) clearTimeout(existingTimeout);

  void Promise.all([
    browser.action.setBadgeBackgroundColor({ color: '#ff0000', tabId }),
    browser.action.setBadgeText({ tabId, text: 'LOCK' }),
    browser.action.setTitle({ tabId, title: REDIRECT_ACTION_TITLE }),
  ]).catch(() => {
    // The tab may have closed before the badge was shown.
  });

  void showRedirectNotification().catch(() => {
    // The browser or operating system may have notifications disabled.
  });

  badgeTimeouts.set(
    tabId,
    setTimeout(() => clearBadge(tabId), REDIRECT_CONFIRMATION_MS),
  );
}

async function redirectFeed(tabId: number, url: string) {
  if (!isLinkedInFeed(url)) return;
  if ((await getPauseUntil()) > Date.now()) return;

  const now = Date.now();
  const existingRedirect = pendingRedirects.get(tabId);
  if (
    existingRedirect !== undefined &&
    now - existingRedirect <= REDIRECT_PENDING_MS
  ) {
    return;
  }

  pendingRedirects.set(tabId, now);

  void browser.tabs.update(tabId, { url: LINKEDIN_JOBS_URL }).catch(() => {
    pendingRedirects.delete(tabId);
  });
}

async function confirmRedirect(tabId: number, url: string) {
  if (!isLinkedInJobsUrl(url)) return;

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
  void reconcilePauseState();

  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason !== 'install') return;

    void browser.tabs.create({
      url: browser.runtime.getURL('/onboarding.html'),
    });
  });

  browser.runtime.onStartup.addListener(() => {
    void reconcilePauseState();
  });

  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local' || !changes[PAUSE_UNTIL_KEY]) return;

    void reconcilePauseState();
  });

  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== PAUSE_ALARM_NAME) return;

    void reconcilePauseState();
  });

  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    const observedUrl = changeInfo.url ?? tab.pendingUrl;
    if (!observedUrl) return;

    if (isLinkedInFeed(observedUrl)) {
      void redirectFeed(tabId, observedUrl);
      return;
    }

    if (changeInfo.url && isLinkedInJobsUrl(changeInfo.url)) {
      void confirmRedirect(tabId, changeInfo.url);
    }
  });

  browser.tabs.onRemoved.addListener((tabId) => {
    pendingRedirects.delete(tabId);

    const badgeTimeout = badgeTimeouts.get(tabId);
    if (badgeTimeout) clearTimeout(badgeTimeout);
    badgeTimeouts.delete(tabId);
  });
});
