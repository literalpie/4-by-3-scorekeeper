import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-solid'],
  manifest: {
    name: 'AT Proto Score Keeper',
    description: 'Save game scores to AT Protocol',
    permissions: ['storage', 'activeTab'],
    host_permissions: ['https://*.github.io/*', 'https://www.hankgreen.com/*'],
  },
});
