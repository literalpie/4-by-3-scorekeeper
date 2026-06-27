import { createSignal, onCleanup, createMemo } from 'solid-js';
import './App.css';

const GAME_DOMAIN = 'www.hankgreen.com';

export default function App() {
  const [handle, setHandle] = createSignal('');
  const [session, setSession] = createSignal<{ handle: string; did: string } | null>(null);
  const [error, setError] = createSignal('');
  const [loading, setLoading] = createSignal(false);
  const [submitted, setSubmitted] = createSignal(false);

  const [gameUrl, setGameUrl] = createSignal('');
  const [score, setScore] = createSignal('');
  const [playedAt, setPlayedAt] = createSignal('');
  const [gameData, setGameData] = createSignal('');
  const [pendingScore, setPendingScore] = createSignal<any>(null);
  const [isOnGamePage, setIsOnGamePage] = createSignal(false);

  const showPreview = createMemo(() => isOnGamePage() && pendingScore() && !submitted());

  const fillFromPending = () => {
    const ps = pendingScore();
    if (!ps) return;
    setGameUrl(ps.gameUrl || '');
    setScore(ps.score || '');
    setPlayedAt(ps.playedAt || new Date().toISOString());
    setGameData(ps.gameData ? JSON.stringify(ps.gameData, null, 2) : '');
    browser.storage.local.remove('pendingScore');
    setPendingScore(null);
  };

  const onStorageChanged = (changes: Record<string, any>) => {
    if (changes.authResult) {
      setSession(changes.authResult.newValue || null);
      setLoading(false);
    }
    if (changes.pendingScore) {
      setPendingScore(changes.pendingScore.newValue || null);
    }
  };
  browser.storage.onChanged.addListener(onStorageChanged);
  onCleanup(() => browser.storage.onChanged.removeListener(onStorageChanged));

  Promise.all([
    browser.storage.local.get(['authResult', 'pendingScore']),
    browser.tabs?.query({ active: true, currentWindow: true }).catch(() => []),
  ]).then(([r, tabs]) => {
    if (r.authResult) setSession(r.authResult as any);
    if (r.pendingScore) setPendingScore(r.pendingScore as any);
    const tab = tabs?.[0];
    if (tab?.url) {
      const u = new URL(tab.url);
      if (u.hostname === GAME_DOMAIN && u.pathname.startsWith('/fourbythree/')) {
        setIsOnGamePage(true);
      }
    }
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

  const submitScore = async (fields: Record<string, any>) => {
    setError('');
    const s = session();
    if (!s) return;
    setLoading(true);
    try {
      const result = await browser.runtime.sendMessage({
        type: 'CREATE_SCORE',
        did: s.did,
        fields,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setSubmitted(true);
        browser.storage.local.remove('pendingScore');
        setPendingScore(null);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const submitManual = () => {
    const fields: Record<string, any> = {
      gameUrl: gameUrl(),
      score: score(),
      playedAt: playedAt() || new Date().toISOString(),
    };
    if (gameData()) fields.gameData = JSON.parse(gameData());
    submitScore(fields);
  };

  const submitScraped = () => {
    const ps = pendingScore();
    if (!ps) return;
    submitScore(ps);
  };

  const switchToManual = () => {
    fillFromPending();
    setSubmitted(false);
  };

  return (
    <div class="container">
      <div class="app-header">AT Proto Score Keeper</div>
      {showPreview() ? (
        <ScoredPreview data={pendingScore()} signedIn={!!session()} onSubmit={submitScraped} onEdit={switchToManual} loading={loading()} handle={handle()} onHandleChange={setHandle} onSignIn={signIn} />
      ) : submitted() ? (
        <div class="success">
          <h1>Score submitted!</h1>
          <p>Record saved to your AT Protocol repository.</p>
          <button onClick={() => { setSubmitted(false); setGameUrl(''); setScore(''); setGameData(''); setPlayedAt(''); }}>
            Submit another
          </button>
        </div>
      ) : session() ? (
        <>
          <div class="session-header">
            <span class="handle">@{session()!.handle}</span>
            <button class="text-btn" onClick={signOut}>Sign out</button>
          </div>

          <hr />

          <form class="score-form" onSubmit={(e) => { e.preventDefault(); submitManual(); }}>
            <label class="field">
              <span class="field-label">Game URL</span>
              <input type="url" value={gameUrl()} onInput={(e) => setGameUrl(e.currentTarget.value)} placeholder="https://example.com/game" />
            </label>
            <label class="field">
              <span class="field-label">Score</span>
              <input type="text" inputMode="numeric" value={score()} onInput={(e) => setScore(e.currentTarget.value)} placeholder="e.g. 155" />
            </label>
            <label class="field">
              <span class="field-label">Played at</span>
              <input type="datetime-local" value={playedAt().slice(0, 16)} onInput={(e) => setPlayedAt(new Date(e.currentTarget.value).toISOString())} />
            </label>
            <label class="field">
              <span class="field-label">Game data <span class="opt">optional</span></span>
              <textarea value={gameData()} onInput={(e) => setGameData(e.currentTarget.value)} placeholder='{"achievements":[...], "breakdown":{...}}' rows={3} spellcheck={false} />
            </label>
            <button class="primary" type="submit" disabled={loading()}>{loading() ? 'Submitting...' : 'Submit Score'}</button>
          </form>
        </>
      ) : (
        <>
          <h1>Sign in to AT Protocol</h1>
          <form class="inline-signin" onSubmit={(e) => { e.preventDefault(); signIn(); }}>
            <input value={handle()} onInput={(e) => setHandle(e.currentTarget.value)} placeholder="alice.bsky.social" disabled={loading()} />
            <button type="submit" disabled={loading() || !handle()}>{loading() ? 'Signing in...' : 'Sign in'}</button>
          </form>
        </>
      )}

      {error() && <p class="error">{error()}</p>}
    </div>
  );
}

function ScoredPreview(props: { data: any; signedIn: boolean; onSubmit: () => void; onEdit: () => void; loading: boolean; handle: string; onHandleChange: (v: string) => void; onSignIn: () => void }) {
  const data = () => props.data;
  const gd = () => data()?.gameData as Record<string, unknown> | undefined;
  const breakdown = () => (gd()?.breakdown as Record<string, number>) || {};
  const achievements = () => (gd()?.achievements as string[]) || [];
  const puzzleDate = () => (gd()?.puzzleDate as string) || '';
  const today = () => new Date().toISOString().slice(0, 10);
  const isPastPuzzle = () => puzzleDate() && puzzleDate() < today();

  return (
    <>
      <h1>Score from 4×3</h1>
      {isPastPuzzle() && <span class="past-badge">Past puzzle</span>}

      <div class="preview-score">{data()?.score || '?'}</div>

      <div class="preview-detail">
        <span class="preview-label">URL</span>
        <span class="preview-value">{data()?.gameUrl || ''}</span>
      </div>
      <div class="preview-detail">
        <span class="preview-label">Puzzle date</span>
        <span class="preview-value">{puzzleDate() || '?'}</span>
      </div>
      <div class="preview-detail">
        <span class="preview-label">Played</span>
        <span class="preview-value">{data()?.playedAt ? new Date(data().playedAt).toLocaleString() : ''}</span>
      </div>

      {Object.keys(breakdown()).length > 0 && (
        <>
          <hr />
          <div class="preview-section-title">Breakdown</div>
          {Object.entries(breakdown()).map(([label, delta]) => (
            <div class="preview-detail">
              <span class="preview-label">{label}</span>
              <span class="preview-value" classList={{ 'delta-pos': delta > 0, 'delta-neg': delta < 0 }}>
                {delta > 0 ? '+' : ''}{delta}
              </span>
            </div>
          ))}
        </>
      )}

      {achievements().length > 0 && (
        <>
          <hr />
          <div class="preview-section-title">Achievements</div>
          {achievements().map((a) => (
            <div class="preview-achievement">{a}</div>
          ))}
        </>
      )}

      <hr />

      {props.signedIn ? (
        <button class="primary" onClick={props.onSubmit} disabled={props.loading}>
          {props.loading ? 'Submitting...' : 'Submit to AT Protocol'}
        </button>
      ) : (
        <form class="inline-signin" onSubmit={(e) => { e.preventDefault(); props.onSignIn(); }}>
          <input value={props.handle} onInput={(e) => props.onHandleChange(e.currentTarget.value)} placeholder="alice.bsky.social" disabled={props.loading} />
          <button type="submit" disabled={props.loading || !props.handle}>{props.loading ? 'Signing in...' : 'Sign in'}</button>
        </form>
      )}
      <button class="secondary" onClick={props.onEdit}>
        Edit manually
      </button>
    </>
  );
}
