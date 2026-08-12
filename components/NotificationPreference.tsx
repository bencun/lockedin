import { useEffect, useState } from 'react';
import {
  NOTIFICATION_PERMISSION,
  REDIRECT_NOTIFICATION_ID,
} from '@/utils/notifications';
import '@/assets/notification-preference.css';

function NotificationPreference() {
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function refreshPermission() {
      const enabled = await browser.permissions.contains(
        NOTIFICATION_PERMISSION,
      );
      if (isMounted) setIsEnabled(enabled);
    }

    function handlePermissionChange() {
      void refreshPermission();
    }

    void refreshPermission().catch(() => {
      if (isMounted) setIsEnabled(false);
    });

    browser.permissions.onAdded.addListener(handlePermissionChange);
    browser.permissions.onRemoved.addListener(handlePermissionChange);

    return () => {
      isMounted = false;
      browser.permissions.onAdded.removeListener(handlePermissionChange);
      browser.permissions.onRemoved.removeListener(handlePermissionChange);
    };
  }, []);

  async function toggleNotifications() {
    if (isEnabled === null || isUpdating) return;

    setIsUpdating(true);

    try {
      if (isEnabled) {
        await browser.notifications
          .clear(REDIRECT_NOTIFICATION_ID)
          .catch(() => false);
        await browser.permissions.remove(NOTIFICATION_PERMISSION);
      } else {
        await browser.permissions.request(NOTIFICATION_PERMISSION);
      }

      setIsEnabled(await browser.permissions.contains(NOTIFICATION_PERMISSION));
    } finally {
      setIsUpdating(false);
    }
  }

  const status =
    isEnabled === null
      ? 'Checking permission…'
      : isEnabled
        ? 'Native redirect alerts are on.'
        : 'The LOCK toolbar badge still appears.';

  return (
    <section className="notification-preference">
      <div className="notification-preference__copy">
        <h2>Native notifications</h2>
        <p>{status}</p>
      </div>
      <button
        className="notification-preference__switch"
        type="button"
        role="switch"
        aria-checked={isEnabled ?? false}
        aria-label={`${isEnabled ? 'Disable' : 'Enable'} native notifications`}
        disabled={isEnabled === null || isUpdating}
        onClick={() => void toggleNotifications()}
      >
        <span aria-hidden="true" />
      </button>
    </section>
  );
}

export default NotificationPreference;
