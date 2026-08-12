import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifestVersion: 3,
  hooks: {
    'build:manifestGenerated': (wxt, manifest) => {
      if (wxt.config.command !== 'serve') return;

      // WXT adds this for content-script hot reloads. LockedIn has no content
      // scripts, and its LinkedIn host permission already exposes matching URLs.
      manifest.permissions = manifest.permissions?.filter(
        (permission) => permission !== 'tabs',
      );
    },
  },
  manifest: ({ browser }) => ({
    name: 'LockedIn',
    description:
      'Blocks the LinkedIn feed and redirects it to Jobs. Not affiliated with or endorsed by LinkedIn.',
    permissions: ['declarativeNetRequestWithHostAccess', 'storage'],
    optional_permissions: ['notifications'],
    host_permissions: ['*://*.linkedin.com/*'],
    externally_connectable: {
      ids: [],
      matches: [],
    },
    declarative_net_request: {
      rule_resources: [
        {
          id: 'linkedin_feed_redirect',
          enabled: true,
          path: 'rules.json',
        },
      ],
    },
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: '{1ff02bf8-347e-4470-bcc6-ecfba080f103}',
          data_collection_permissions: {
            required: ['none'],
          },
        },
      },
    }),
    web_accessible_resources: [],
  }),
});
