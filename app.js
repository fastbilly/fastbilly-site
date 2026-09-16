// FastBilly hub — light interactions
(function () {
  const root = document.documentElement;
  const btn = document.getElementById('themeToggle');
  const label = document.getElementById('themeLabel');
  const sync = () => { if (label) label.textContent = root.getAttribute('data-theme') === 'light' ? 'Light' : 'Dark'; };
  sync();
  if (btn) btn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    sync();
  });

  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
