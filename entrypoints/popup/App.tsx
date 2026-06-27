import { createSignal, onCleanup } from 'solid-js';
import './App.css';

export default function App() {
  const [handle, setHandle] = createSignal('');
  const [session, setSession] = createSignal<{ handle: string; did: string } | null>(null);
  const [error, setError] = createSignal('');
  const [loading, setLoading] = createSignal(false);

  const [gameUrl, setGameUrl] = createSignal('https://example.com/game');
  const [score, setScore] = createSignal('1500');
  const [playedAt, setPlayedAt] = createSignal(new Date().toISOString());
  const [gameData, setGameData] = createSignal('');

  const onStorageChanged = (changes: Record<string, any>) => {
    if (changes.authResult) {
      setSession(changes.authResult.newValue || null);
      setLoading(false);
    }
  };
  browser.storage.onChanged.addListener(onStorageChanged);
  onCleanup(() => browser.storage.onChanged.removeListener(onStorageChanged));

  browser.storage.local.get('authResult').then((r) => {
    if (r.authResult) setSession(r.authResult as any);
  });

  const signIn = async () => {
    setError('');
    setLoading(true);
    try {
      await browser.runtime.sendMessage({ type: 'SIGN_IN', handle: handle() });
    } catch (e: any) {
      setLoading(false);
      setError(e.message);
    }
  };

  const signOut = async () => {
    const s = session();
    if (!s) return;
    try {
      await browser.runtime.sendMessage({ type: 'SIGN_OUT', did: s.did });
    } catch {}
    setSession(null);
  };

  const submitScore = async () => {
    setError('');
    const s = session();
    if (!s) return;
    try {
      const fields: Record<string, any> = {
        gameUrl: gameUrl(),
        score: score(),
        playedAt: playedAt(),
      };
      if (gameData()) fields.gameData = JSON.parse(gameData());
      const result = await browser.runtime.sendMessage({
        type: 'CREATE_SCORE',
        did: s.did,
        fields,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setGameUrl('');
        setScore('');
        setPlayedAt(new Date().toISOString());
        setGameData('');
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div class="container">
      {session() ? (
        <>
          <h1>@{session()!.handle}</h1>
          <button onClick={signOut}>Sign out</button>

          <hr />

          <input value={gameUrl()} onInput={(e) => setGameUrl(e.currentTarget.value)} placeholder="gameUrl" />
          <input value={score()} onInput={(e) => setScore(e.currentTarget.value)} placeholder="score" />
          <input value={playedAt()} onInput={(e) => setPlayedAt(e.currentTarget.value)} placeholder="playedAt (ISO timestamp)" />
          <textarea value={gameData()} onInput={(e) => setGameData(e.currentTarget.value)} placeholder="gameData (optional JSON)" rows={3} />
          <button onClick={submitScore}>Submit Score</button>
        </>
      ) : (
        <>
          <h1>Sign in to AT Protocol</h1>
          <input value={handle()} onInput={(e) => setHandle(e.currentTarget.value)} placeholder="alice.bsky.social" disabled={loading()} />
          <button onClick={signIn} disabled={loading() || !handle()}>{loading() ? 'Signing in...' : 'Sign in'}</button>
        </>
      )}

      {error() && <p class="error">{error()}</p>}

      <hr />
      <button onClick={() => browser.tabs.create({ url: browser.runtime.getURL('/test-page.html' as any) })}>
        Open Test Page
      </button>
    </div>
  );
}
