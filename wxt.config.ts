import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifestVersion: 3,
  manifest: ({ browser }) => ({
    name: "LockedIn",
    description: "Blocks the LinkedIn feed and redirects it to LinkedIn Jobs.",
    permissions: ["declarativeNetRequestWithHostAccess", "webNavigation"],
    host_permissions: ["*://*.linkedin.com/*"],
    declarative_net_request: {
      rule_resources: [
        {
          id: "linkedin_feed_redirect",
          enabled: true,
          path: "rules.json",
        },
      ],
    },
    ...(browser === "firefox" && {
      browser_specific_settings: {
        gecko: {
          id: "lockedin@bencun.dev",
          data_collection_permissions: {
            required: ["none"],
          },
        },
      },
    }),
    web_accessible_resources: [],
  }),
});
