document.getElementById('btn')!.addEventListener('click', async () => {
  const val = 'Button clicked at ' + new Date().toISOString();
  await browser.storage.local.set({ testState: val });
  (document.getElementById('btn') as HTMLButtonElement).textContent = 'Done';
  document.getElementById('status')!.textContent = val;
});
