import { defineContentScript } from 'wxt/utils/define-content-script';

export default defineContentScript({
  matches: ['https://*.github.io/*/callback*'],
  runAt: 'document_start',
  main() {
    const params = new URLSearchParams(location.hash.slice(1) || location.search.slice(1));
    if (params.has('code') && params.has('state')) {
      browser.runtime.sendMessage({ type: 'OAUTH_CALLBACK', params: params.toString() });
    }
  },
});
