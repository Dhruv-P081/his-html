/* English / Arabic switch for the staff portal prototype.
 *
 * SOW V4: "The user interface supports English and Arabic with right-to-left layouts."
 * Architecture v1.3: all text through i18next; layout tested in right-to-left.
 *
 * The prototype screens are written in English. When Arabic is on, this file sets
 * <html lang="ar" dir="rtl"> and swaps every UI string for its Arabic text from
 * window.I18N_AR (assets/i18n-ar.js), plus the translation overrides saved in
 * Administration > App Settings > Language. Numbers inside a string are matched as
 * {n}, so "6 rules" uses the "{n} rules" entry. Data that people type (names, notes,
 * codes) is not in the dictionary and stays as entered.
 *
 * In the real build this is react-i18next with translation keys; the dictionary
 * here is the same idea for a static prototype.
 *
 * Loaded after data-settings.js and i18n-ar.js, before ui.js. Exposes window.I18N.
 */
(function () {
  const LANG_KEY = 'orbit.lang';
  const DB_KEY = 'orbit.proto.db.v2';
  const AR = window.I18N_AR || {};

  function config() {
    let saved = null;
    try { const d = JSON.parse(localStorage.getItem(DB_KEY) || 'null'); saved = d && d.appSettings && d.appSettings.language; } catch (e) { /* ignore */ }
    const seed = (window.SEED && window.SEED.appSettings && window.SEED.appSettings.language) || {};
    return Object.assign({ default: 'en', arabic: true, overrides: {} }, seed, saved || {});
  }
  const cfg = config();
  const OV = cfg.overrides || {};
  let lang = localStorage.getItem(LANG_KEY) || cfg.default || 'en';
  if (!cfg.arabic) lang = 'en';
  if (lang !== 'ar') lang = 'en';

  const html = document.documentElement;
  html.setAttribute('lang', lang);
  html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

  const NUM = /\d+(?:[.,:/]\d+)*/g;
  const hasLatin = (s) => /[A-Za-z]/.test(s);

  function lookup(seg) {
    if (!seg) return null;
    if (OV[seg]) return OV[seg];
    if (AR[seg]) return AR[seg];
    const nums = [];
    const t = seg.replace(NUM, (m) => { nums.push(m); return '{n}'; });
    if (!nums.length) return null;
    const v = OV[t] || AR[t];
    if (!v) return null;
    let i = 0;
    return v.replace(/\{n\}/g, () => (i < nums.length ? nums[i++] : ''));
  }

  /* Translate one string. Keeps the surrounding spaces. Falls back to
   * translating each " · " part on its own. Returns null when nothing matched. */
  function tr(s) {
    if (s == null) return null;
    const m = String(s).match(/^(\s*)([\s\S]*?)(\s*)$/);
    const core = m[2].replace(/\s+/g, ' ');
    if (!core || !hasLatin(core)) return null;
    let v = lookup(core);
    if (v == null && core.indexOf('·') >= 0) {
      let changed = false;
      v = core.split(/(\s*·\s*)/).map((p) => {
        if (!p || /^\s*·\s*$/.test(p)) return p;
        const x = lookup(p.trim());
        if (x != null) { changed = true; return x; }
        return p;
      }).join('');
      if (!changed) v = null;
    }
    if (v == null && /:$/.test(core)) { const x = lookup(core.slice(0, -1).trim()); if (x != null) v = x + ':'; }
    return v == null ? null : m[1] + v + m[3];
  }

  /* t('Save') for code that builds strings itself (toasts, confirms, CSV headers). */
  function t(s) { if (lang !== 'ar') return s; const v = tr(s); return v == null ? s : v; }

  const SKIP = 'script,style,textarea,code,pre,[translate="no"],.notranslate,[contenteditable="true"]';
  const ATTRS = ['placeholder', 'title', 'aria-label', 'data-tip'];

  function doText(n) {
    const p = n.parentElement;
    if (!p || p.closest(SKIP)) return;
    const orig = n.nodeValue;
    if (!orig || !hasLatin(orig)) return;
    const v = tr(orig);
    if (v == null || v === orig) return;
    // An <option> without a value uses its text as the value: keep the English one.
    if (p.tagName === 'OPTION' && !p.hasAttribute('value')) p.setAttribute('value', orig.trim());
    n.nodeValue = v;
  }
  function doAttrs(el) {
    if (el.closest && el.closest(SKIP)) return;
    for (const a of ATTRS) {
      const o = el.getAttribute && el.getAttribute(a);
      if (!o || !hasLatin(o)) continue;
      const v = tr(o);
      if (v != null && v !== o) el.setAttribute(a, v);
    }
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1) { if (root.matches(SKIP)) return; doAttrs(root); }
    const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.nodeType === 1 && n.matches(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    let n;
    while ((n = w.nextNode())) { if (n.nodeType === 3) doText(n); else doAttrs(n); }
  }
  function translateTitle() { const v = tr(document.title); if (v != null && v !== document.title) document.title = v; }

  if (lang === 'ar') {
    const mo = new MutationObserver((list) => {
      for (const r of list) {
        if (r.type === 'childList') r.addedNodes.forEach(walk);
        else if (r.type === 'characterData') doText(r.target);
        else if (r.type === 'attributes') doAttrs(r.target);
      }
    });
    mo.observe(html, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    const full = () => { walk(document.body); translateTitle(); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', full); else full();
    new MutationObserver(translateTitle).observe(document.head || html, { childList: true, subtree: true, characterData: true });
  }

  function set(next) {
    localStorage.setItem(LANG_KEY, next === 'ar' ? 'ar' : 'en');
    location.reload();
  }

  /* A small EN / AR switch button. Hidden when Arabic is turned off in App Settings. */
  function switchHtml(cls) {
    if (!cfg.arabic) return '';
    const other = lang === 'ar' ? 'en' : 'ar';
    return `<button type="button" class="lang-btn ${cls || ''}" data-lang-switch="${other}" translate="no" title="${other === 'ar' ? 'العربية' : 'English'}" aria-label="${other === 'ar' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}">${other === 'ar' ? 'ع' : 'EN'}</button>`;
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('[data-lang-switch]');
    if (b) { e.preventDefault(); set(b.getAttribute('data-lang-switch')); }
  });

  window.I18N = { lang, rtl: lang === 'ar', t, tr, set, switchHtml, config: cfg, dict: AR };
})();
