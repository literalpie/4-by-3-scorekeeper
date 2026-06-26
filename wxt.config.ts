import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-solid'],
  manifest: {
    host_permissions: ['https://*.github.io/*'],
    web_accessible_resources: [
      {
        resources: ['callback.html'],
        matches: ['<all_urls>'],
      },
    ],
  },
});
