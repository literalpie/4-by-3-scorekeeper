import { defineContentScript } from 'wxt/utils/define-content-script';

export default defineContentScript({
  matches: ['https://www.hankgreen.com/fourbythree/*'],
  main() {
    browser.storage.local.remove('pendingScore').catch(() => {});

    const mbody = document.getElementById('mbody');
    if (!mbody) return;

    const modal = document.getElementById('modal');

    const observer = new MutationObserver(() => {
      if (mbody.querySelector('#tallyCount') || mbody.querySelector('h2')) {
        if (modalOpen(modal)) {
          storeScore(mbody);
        }
      } else {
        browser.storage.local.remove('pendingScore').catch(() => {});
      }
    });

    observer.observe(mbody, { childList: true, subtree: true });

    if (modalOpen(modal)) {
      const tc = mbody.querySelector('#tallyCount');
      const h2 = mbody.querySelector('h2');
      if (tc || h2) storeScore(mbody);
    }
  },
});

function modalOpen(modal: HTMLElement | null): boolean {
  return modal?.style.display === 'flex';
}

function puzzleDate(): string {
  const m = location.hash.match(/^#d=(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  return new Date().toISOString().slice(0, 10);
}

function cleanGameUrl(): string {
  return location.origin + location.pathname.replace(/\/[^/]*\.html$/, '/');
}

function storeScore(mbody: HTMLElement) {
  const scoreEl = mbody.querySelector('#tallyCount');
  const listEl = mbody.querySelector('#tallyList');

  if (scoreEl && listEl) {
    const score = scoreEl.textContent || '0';
    const achievements: string[] = [];
    const breakdown: Record<string, number> = {};

    listEl.querySelectorAll('.tally-row').forEach((row) => {
      const label = row.querySelector('.tr-label')?.textContent || '';
      const deltaText = row.querySelector('.tr-delta')?.textContent || '';
      const delta = deltaText ? parseInt(deltaText.replace(/[+−-]/g, ''), 10) || 0 : 0;
      const isNeg = deltaText.startsWith('-') || row.classList.contains('neg');
      const type = row.classList.contains('ach') ? 'ach' : isNeg ? 'neg' : 'pos';

      if (type === 'ach') {
        achievements.push(label);
      } else {
        const d = isNeg ? -delta : delta;
        breakdown[label] = (breakdown[label] || 0) + d;
      }
    });

    const gameData: Record<string, unknown> = {
      total: parseInt(score, 10) || 0,
      won: true,
      achievements,
      breakdown,
      puzzleDate: puzzleDate(),
    };

    browser.storage.local.set({
      pendingScore: { gameUrl: cleanGameUrl(), score, playedAt: new Date().toISOString(), gameData },
    }).catch(() => {});
    return;
  }

  const scoreDiv = mbody.querySelector('.score');
  if (scoreDiv) {
    browser.storage.local.set({
      pendingScore: {
        gameUrl: cleanGameUrl(),
        score: '0',
        playedAt: new Date().toISOString(),
        gameData: { won: false, mistakes: scoreDiv.textContent || '', puzzleDate: puzzleDate() },
      },
    }).catch(() => {});
  }
}
