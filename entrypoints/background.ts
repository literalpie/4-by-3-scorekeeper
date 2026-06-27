import { createClient } from '../lib/auth';

export default defineBackground(() => {
  let client: Awaited<ReturnType<typeof createClient>> | null = null;

  browser.runtime.onMessage.addListener(async (msg) => {
    if (msg.type === 'SIGN_IN') {
      if (!client) client = createClient();
      const url = await client.authorize(msg.handle);
      const tab = await browser.tabs.create({ url: url.href });
      await browser.storage.local.set({ pendingHandle: msg.handle, pendingTabId: tab.id });
      await browser.storage.local.remove('authResult');
    }

    if (msg.type === 'OAUTH_CALLBACK') {
      try {
        if (!client) client = createClient();
        const params = new URLSearchParams(msg.params);
        const { session } = await client.callback(params);
        const { pendingHandle, pendingTabId } = await browser.storage.local.get(['pendingHandle', 'pendingTabId']);
        await browser.storage.local.set({
          authResult: { handle: pendingHandle || session.did, did: session.did },
        });
        await browser.storage.local.remove(['pendingHandle', 'pendingTabId']);
        if (pendingTabId) browser.tabs.remove(pendingTabId as number);
      } catch (err) {
        console.error('[auth] callback error:', err);
      }
    }

    if (msg.type === 'SIGN_OUT') {
      try {
        if (!client) client = createClient();
        await client.revoke(msg.did);
      } catch {}
      await browser.storage.local.remove('authResult');
    }
  });
});
