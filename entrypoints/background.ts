import { Client } from '@atproto/lex';
import { createClient } from '../lib/auth';
import { scoreRecord } from '../lib/records';

if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  const ls: Record<string, unknown> = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => store.clear(),
    get length() { return store.size; },
    key: (i: number) => [...store.keys()][i] ?? null,
  };
  globalThis.localStorage = ls as Storage;
}

export default defineBackground(() => {
  let client: ReturnType<typeof createClient> | null = null;

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

    if (msg.type === 'CREATE_SCORE') {
      try {
        if (!client) client = createClient();
        const session = await client.restore(msg.did);
        const lexClient = new Client(session);
        const result = await lexClient.create(scoreRecord, msg.fields);
        return { uri: result.uri, cid: result.cid };
      } catch (err) {
        return { error: String(err) };
      }
    }
  });
});
