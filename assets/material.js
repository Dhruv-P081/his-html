/* Material Management helpers shared by the docs/html/material/ pages (window.Material).
 * Load after kit.js. Uses db.items, db.stock, db.vendors, db.warehouses and the material* keys. */
(function () {
  const { db, save, esc, icon, $, $$, can, me, session, L, R, nowStamp, field } = window.UI;
  const K = window.Kit;
  const pad = (n, w) => String(n).padStart(w || 2, '0');

  /* Right-align table headers over numeric columns (UI.table only sets the class on the cells). */
  (function alignNumHeads() {
    const fix = () => document.querySelectorAll('table.tbl').forEach(t => {
      const row = t.tBodies[0] && [...t.tBodies[0].rows].find(r => r.cells.length > 1); const head = t.tHead && t.tHead.rows[0];
      if (!row || !head || head.cells.length !== row.cells.length) return;
      [...row.cells].forEach((td, i) => { const on = td.classList.contains('num'); if (head.cells[i].classList.contains('num') !== on) head.cells[i].classList.toggle('num', on); });
    });
    new MutationObserver(fix).observe(document.documentElement, { childList: true, subtree: true });
  })();
  const css = document.createElement('style');
  css.textContent = '.nw{white-space:nowrap}.mm-lbl{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.mm-var-neg{color:var(--error);font-weight:700}.mm-var-pos{color:var(--success);font-weight:700}.mm-chk{display:flex;flex-direction:column;gap:6px;max-height:240px;overflow:auto}';
  document.head.appendChild(css);

  /* ---------- Status badges (adds procurement words to Kit.status) ---------- */
  const EXTRA = { 'PO raised': 'ok', 'In transit': 'violet', 'Counting': 'info', 'Partially issued': 'warn', 'Partially received': 'info', 'Pending': 'warn', 'Below min': 'warn', 'Above max': 'info', 'Near expiry': 'warn' };
  const st = (s, tone) => K.status(s, tone || EXTRA[s]);

  /* ---------- People and context ---------- */
  const meName = () => (me() || {}).displayName || '';
  const ctx = () => (session() || {}).ctx || {};
  const ctxWh = () => ctx().warehouseId || '';
  const wh = (id) => L.wh(id) || {};
  const whName = (id) => (L.wh(id) || {}).name || '';
  const deptName = (id) => L.dName(id);
  const wardName = (id) => (K.ward(id) || {}).name || '';
  /* Stores the user may work with. A user whose context store is a Main Store sees every active store of the
   * company; a sub store or pharmacy user sees only the stores of their own assignments (MAP-06). */
  function stores(opt) {
    const c = ctx();
    const cw = L.wh(c.warehouseId);
    const active = db.warehouses.filter(w => w.status === 'Active' && w.companyId === c.companyId);
    if (cw && cw.type === 'Main Store') return active;
    const mine = new Set(window.UI.contextsFor((me() || {}).id).filter(x => x.warehouseId && (!opt || (window.UI.permsFor(me().id, x)[opt] || []).length)).map(x => x.warehouseId));
    return active.filter(w => mine.has(w.id));
  }
  const storeOpts = (opt, all) => (all ? db.warehouses.filter(w => w.companyId === ctx().companyId) : stores(opt)).map(w => [w.id, w.name + (w.status !== 'Active' ? ' (inactive)' : '')]);
  const isMainCtx = () => (L.wh(ctxWh()) || {}).type === 'Main Store';

  /* ---------- Items ---------- */
  const item = (id) => K.item(id) || {};
  const itemLabel = (id) => { const x = item(id); return x.code ? `${x.code} · ${x.name}` : 'Unknown item'; };
  const itemCell = (id, sub) => { const x = item(id); return `<div class="cell-main"><b>${esc(x.name || 'Unknown item')}</b><span class="mono">${esc(x.code || '')}</span>${sub ? ` · <span>${sub}</span>` : ''}</div>`; };
  const itemOpts = (filter) => db.items.filter(x => x.status !== 'Inactive' && (!filter || filter(x))).map(x => [x.id, `${x.code} · ${x.name}`]);
  const vendorName = (id) => (K.vendor(id) || {}).name || '';
  const vendorOpts = () => db.vendors.filter(v => v.status !== 'Inactive').map(v => [v.id, v.name + (v.status === 'On hold' ? ' (on hold)' : '')]);
  const total = (lines, q, p) => lines.reduce((s, l) => s + Number(l[q || 'qty'] || 0) * Number(l[p || 'price'] || 0), 0);
  const round3 = (n) => Math.round(n * 1000) / 1000;

  /* ---------- Stock ---------- */
  const batches = (itemId, whId) => db.stock.filter(s => s.itemId === itemId && s.warehouseId === whId && s.qty > 0).sort((a, b) => String(a.expiry).localeCompare(String(b.expiry)));
  const onHand = (itemId, whId) => K.stockOf(itemId, whId);
  const usable = (itemId, whId) => batches(itemId, whId).filter(s => !s.expiry || s.expiry >= db.TODAY).reduce((n, s) => n + s.qty, 0);
  /* First expiry, first out: allocate a quantity across the non-expired batches of a store. */
  function fefo(itemId, whId, qty) {
    const out = []; let left = Number(qty || 0);
    batches(itemId, whId).filter(s => !s.expiry || s.expiry >= db.TODAY).forEach(s => { if (left <= 0) return; const q = Math.min(left, s.qty); out.push({ stockId: s.id, itemId, batch: s.batch, expiry: s.expiry, qty: q, cost: s.cost }); left -= q; });
    return { lines: out, short: left };
  }
  /* Reduce a batch (by stock id). Returns false if not enough. */
  function deduct(stockId, qty) { const s = db.stock.find(x => x.id === stockId); if (!s || s.qty < qty) return false; s.qty -= qty; return true; }
  function nextStockId() { const max = db.stock.reduce((m, s) => Math.max(m, parseInt(String(s.id).replace(/\D/g, ''), 10) || 0), 0); return 'sk_' + pad(max + 1, 4); }
  /* Add to a batch in a store (merges the same item, store and batch). */
  function addStock(itemId, whId, batch, expiry, qty, cost) {
    let s = db.stock.find(x => x.itemId === itemId && x.warehouseId === whId && x.batch === batch);
    if (s) s.qty += Number(qty); else { s = { id: nextStockId(), itemId, warehouseId: whId, batch, expiry, qty: Number(qty), cost: Number(cost) }; db.stock.push(s); }
    return s;
  }
  const expTone = (e) => !e ? '' : e < db.TODAY ? 'Expired' : e <= K.addDays(db.TODAY, 90) ? 'Near expiry' : '';

  /* ---------- Valuation ---------- */
  const receipts = () => db.materialReceipts || [];
  /* FIFO: each batch is valued at its own receipt price (the cost layer it came in on). */
  function layerCost(s) { const r = receipts().find(x => x.itemId === s.itemId && x.batch === s.batch); return r ? r.price : Number(s.cost || 0); }
  /* Weighted average: all receipts of the item in the last 12 months. */
  const wacCache = {};
  function wac(itemId) {
    if (wacCache[itemId] != null) return wacCache[itemId];
    const from = K.addDays(db.TODAY, -365);
    const rs = receipts().filter(r => r.itemId === itemId && r.date >= from);
    const q = rs.reduce((n, r) => n + r.qty, 0);
    return (wacCache[itemId] = q ? rs.reduce((n, r) => n + r.qty * r.price, 0) / q : Number(item(itemId).cost || 0));
  }
  const resetCache = () => Object.keys(wacCache).forEach(k => delete wacCache[k]);
  const fifoValue = (rows) => rows.reduce((n, s) => n + s.qty * layerCost(s), 0);
  const wavgValue = (rows) => rows.reduce((n, s) => n + s.qty * wac(s.itemId), 0);
  const method = () => (db.materialSettings || {}).valuation || 'FIFO';
  const methodName = (m) => (m || method()) === 'WAVG' ? 'Weighted average' : 'FIFO';
  const bookValue = (rows) => method() === 'WAVG' ? wavgValue(rows) : fifoValue(rows);
  /* Record a cost layer when stock is received. */
  function addReceipt(o) { db.materialReceipts = db.materialReceipts || []; db.materialReceipts.push(Object.assign({ id: 'mrc_' + Date.now().toString(36) + Math.floor(Math.random() * 99) }, o)); resetCache(); }

  /* ---------- Reorder levels ---------- */
  /* Explicit levels from the Reorder Level master, plus the item min/max for the Main Store. */
  function levels() {
    const out = [];
    const seen = new Set();
    (db.materialReorder || []).filter(r => (r.status || 'Active') === 'Active').forEach(r => {
      const x = db.items.find(i => i.code === r.item); const w = db.warehouses.find(w => w.name === r.store);
      if (!x || !w) return; seen.add(x.id + '|' + w.id);
      out.push({ itemId: x.id, whId: w.id, min: +r.min, max: +r.max, src: r.code });
    });
    db.items.filter(x => x.status !== 'Inactive' && x.min != null && x.type !== 'Reagent').forEach(x => { if (!seen.has(x.id + '|wh_01')) out.push({ itemId: x.id, whId: 'wh_01', min: +x.min, max: +x.max, src: 'Item master' }); });
    return out;
  }
  /* Open quantity on approved or pending POs for an item into a store. */
  function onOrder(itemId, whId) {
    return (db.materialPOs || []).filter(p => p.warehouseId === whId && /Approved|Pending approval|Partially received|Draft/.test(p.status)).reduce((n, p) => n + p.lines.filter(l => l.itemId === itemId).reduce((m, l) => m + Math.max(0, l.qty - (l.received || 0)), 0), 0);
  }
  function alerts(whId) {
    return levels().filter(l => !whId || l.whId === whId).map(l => {
      const q = onHand(l.itemId, l.whId); const oo = onOrder(l.itemId, l.whId);
      return Object.assign({}, l, { onHand: q, onOrder: oo, suggest: Math.max(0, l.max - q - oo), status: q <= 0 ? 'Out of stock' : q < l.min ? 'Below min' : q > l.max ? 'Above max' : 'OK' });
    }).filter(a => a.status === 'Out of stock' || a.status === 'Below min');
  }

  /* ---------- Approvals ---------- */
  const levelsFor = (amount, list) => list.filter(l => amount >= l.from);
  /* Next level waiting, or null when fully approved. */
  function nextLevel(docu, list, amount) { const need = levelsFor(amount, list); const done = (docu.approvals || []).filter(a => a.decision === 'Approved').length; return done < need.length ? need[done] : null; }
  /* canAct(opt, action, doc): permission plus no self-approval. */
  function canAct(opt, action, docu, by) {
    if (!can(opt, action)) return { ok: false, why: 'Needs ' + action[0].toUpperCase() + action.slice(1) + ' permission' };
    const maker = by || (docu && (docu.createdBy || docu.requestedBy));
    if (docu && maker && maker === meName()) return { ok: false, why: 'You raised this document. Another user must approve it (no self-approval).' };
    if (docu && (docu.approvals || []).some(a => a.by === meName() && a.decision === 'Approved') && action === 'approve') return { ok: false, why: 'You already approved an earlier level. A different approver is needed.' };
    return { ok: true, why: '' };
  }
  /* Button that is disabled with a reason when not allowed. */
  function btn(o) {
    const a = o.allow == null ? { ok: true } : (typeof o.allow === 'object' ? o.allow : { ok: !!o.allow, why: o.why || '' });
    return `<button class="btn ${o.cls || ''}" ${o.id ? `id="${o.id}"` : ''} ${o.data || ''} ${a.ok ? '' : `disabled title="${esc(a.why || 'Not allowed')}"`}>${o.icon ? icon(o.icon) : ''}${esc(o.label)}</button>`;
  }
  /* Approval cycle timeline. */
  function approvalTrail(docu, list, amount, created) {
    const need = levelsFor(amount, list);
    const ap = docu.approvals || [];
    const rows = [`<div class="tl-item ok"><b>Raised</b><div class="meta">${esc(created || docu.createdBy || docu.requestedBy || '')} · ${esc(window.UI.fmtDate(docu.createdAt || docu.at || docu.date))}</div></div>`];
    need.forEach((l, i) => {
      const a = ap[i];
      if (a) rows.push(`<div class="tl-item ${a.decision === 'Approved' ? 'ok' : 'err'}"><b>Level ${l.level}: ${esc(l.name)}</b> ${st(a.decision)}<div class="meta">${esc(a.by)} · ${esc(window.UI.fmtDate(a.at))}</div>${a.note ? `<div class="small" style="margin-top:3px">${esc(a.note)}</div>` : ''}</div>`);
      else rows.push(`<div class="tl-item mute"><b>Level ${l.level}: ${esc(l.name)}</b> <span class="small muted">${/Cancelled|Rejected/.test(docu.status) ? 'Not required' : i === ap.length && docu.status === 'Pending approval' ? 'Waiting' : 'Not started'}</span><div class="meta">${l.from ? 'Required from ' + K.money(l.from) : 'Always required'}</div></div>`);
    });
    if (ap.length > need.length) ap.slice(need.length).forEach(a => rows.push(`<div class="tl-item err"><b>${esc(a.decision)}</b><div class="meta">${esc(a.by)} · ${esc(window.UI.fmtDate(a.at))}</div>${a.note ? `<div class="small">${esc(a.note)}</div>` : ''}</div>`));
    return `<div class="timeline">${rows.join('')}</div>`;
  }

  /* ---------- Line editor ----------
   * lineEditor(host, { lines, price: bool, priceKey, wh: () => storeId (shows on hand), items: filter, onChange(valid), readonly })
   * Returns { get(): lines, valid(): bool, set(lines) } */
  function lineEditor(host, o) {
    let lines = (o.lines || []).map(l => Object.assign({}, l));
    if (!lines.length) lines.push({ itemId: '', qty: '', price: '' });
    const pk = o.priceKey || 'price';
    const draw = () => {
      const w = o.wh ? o.wh() : '';
      const opts = itemOpts(o.items);
      host.innerHTML = `<div class="table-wrap"><table class="tbl compact"><thead><tr><th style="width:42%">Item</th>${w ? '<th class="num">On hand</th>' : ''}<th style="width:110px">Quantity</th>${o.price ? `<th style="width:120px">Unit price</th><th class="num">Line total</th>` : ''}<th></th></tr></thead><tbody>
        ${lines.map((l, i) => { const x = item(l.itemId); return `<tr data-i="${i}">
          <td><select class="input" data-k="itemId" aria-label="Item, line ${i + 1}"><option value="">Select item</option>${opts.map(op => `<option value="${op[0]}" ${op[0] === l.itemId ? 'selected' : ''}>${esc(op[1])}</option>`).join('')}</select>${x.uom ? `<div class="xs muted" style="margin-top:3px">UOM ${esc(x.uom)} · ${esc(x.category || x.type || '')}</div>` : ''}</td>
          ${w ? `<td class="num">${l.itemId ? K.num(onHand(l.itemId, w)) : ''}</td>` : ''}
          <td><input class="input" type="number" min="1" step="1" data-k="qty" value="${esc(l.qty)}" aria-label="Quantity, line ${i + 1}"></td>
          ${o.price ? `<td><input class="input" type="number" min="0" step="0.001" data-k="${pk}" value="${esc(l[pk])}" aria-label="Unit price, line ${i + 1}"></td><td class="num">${K.money((+l.qty || 0) * (+l[pk] || 0), false)}</td>` : ''}
          <td class="actions"><button class="btn xs ghost" data-rm="${i}" aria-label="Remove line ${i + 1}" ${lines.length < 2 ? 'disabled' : ''}>${icon('trash-2')}</button></td></tr>`; }).join('')}
        </tbody>${o.price ? `<tfoot><tr><td colspan="${w ? 4 : 3}" style="text-align:end"><b>Total</b></td><td class="num"><b>${K.money(total(lines, 'qty', pk))}</b></td><td></td></tr></tfoot>` : ''}</table></div>
        <div class="row" style="margin-top:8px"><button class="btn sm" data-add>${icon('plus')} Add line</button><span class="grow"></span><span class="small muted">${lines.filter(l => l.itemId).length} item line(s)</span></div>`;
      $$('[data-k]', host).forEach(inp => inp.addEventListener('change', () => {
        const i = +inp.closest('tr').dataset.i, k = inp.dataset.k;
        lines[i][k] = k === 'itemId' ? inp.value : inp.value === '' ? '' : Number(inp.value);
        if (k === 'itemId' && o.price && (lines[i][pk] === '' || lines[i][pk] == null)) lines[i][pk] = item(inp.value).cost || '';
        draw();
      }));
      $$('[data-k="qty"],[data-k="' + pk + '"]', host).forEach(inp => inp.addEventListener('input', () => { const i = +inp.closest('tr').dataset.i; lines[i][inp.dataset.k] = inp.value === '' ? '' : Number(inp.value); o.onChange && o.onChange(valid()); }));
      $$('[data-rm]', host).forEach(b => b.addEventListener('click', () => { lines.splice(+b.dataset.rm, 1); draw(); }));
      $('[data-add]', host).addEventListener('click', () => { lines.push({ itemId: '', qty: '', [pk]: '' }); draw(); });
      o.onChange && o.onChange(valid());
    };
    const clean = () => lines.filter(l => l.itemId);
    function valid() {
      const c = clean();
      if (!c.length) return false;
      if (c.some(l => !(+l.qty > 0))) return false;
      if (o.price && c.some(l => !(+l[pk] >= 0) || l[pk] === '')) return false;
      if (new Set(c.map(l => l.itemId)).size !== c.length) return false;
      return true;
    }
    draw();
    return { get: () => clean().map(l => Object.assign({}, l, { qty: +l.qty }, o.price ? { [pk]: +l[pk] } : {})), valid, set: (ls) => { lines = ls.map(l => Object.assign({}, l)); if (!lines.length) lines.push({ itemId: '', qty: '' }); draw(); }, redraw: draw,
      problems: () => { const c = clean(); const p = []; if (!c.length) p.push('Add at least one item line.'); if (c.some(l => !(+l.qty > 0))) p.push('Every line needs a quantity above zero.'); if (new Set(c.map(l => l.itemId)).size !== c.length) p.push('An item appears on more than one line.'); return p; } };
  }

  /* ---------- Barcode (Code 128 style bars, for labels) ---------- */
  function barcode(text, h) {
    h = h || 46;
    let x = 6; const bars = [];
    const s = String(text);
    const seq = [2, 1, 1, 2, 3, 2];
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      for (let k = 0; k < 6; k++) { const w = 1 + ((c >> k) & 1) + (k === 0 ? 1 : 0); if (k % 2 === 0) bars.push(`<rect x="${x}" y="2" width="${w}" height="${h}" fill="#111"/>`); x += w + (seq[k] % 2); }
    }
    bars.push(`<rect x="${x}" y="2" width="2" height="${h}" fill="#111"/>`); x += 8;
    return `<svg viewBox="0 0 ${x} ${h + 16}" width="${Math.min(260, x * 1.4)}" height="${h + 16}" role="img" aria-label="Barcode ${esc(s)}"><rect width="${x}" height="${h + 16}" fill="#fff"/><rect x="0" y="2" width="2" height="${h}" fill="#111"/>${bars.join('')}<text x="${x / 2}" y="${h + 14}" text-anchor="middle" font-size="10" font-family="monospace" fill="#111">${esc(s)}</text></svg>`;
  }
  /* Item labels: one per batch line, with copies. */
  function printLabels(rows, title) {
    K.printDoc({ title: title || 'Barcode labels', sub: 'Item and batch labels, 50 x 30 mm',
      html: `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">${rows.map(r => `<div style="border:1px dashed #999;border-radius:6px;padding:8px;text-align:center"><div style="font-weight:700;font-size:11px;line-height:1.3">${esc(item(r.itemId).name)}</div><div style="font-size:10px;color:#444">${esc(item(r.itemId).code)} · Batch ${esc(r.batch)} · Exp ${esc(window.UI.fmtDate(r.expiry))}</div>${barcode(item(r.itemId).code + '|' + r.batch)}<div style="font-size:10px">${esc(r.note || '')}</div></div>`).join('')}</div>` });
  }

  /* Standard document print: header block, lines table, signatures. */
  function docPrint(o) {
    K.printDoc({ title: o.title, sub: o.sub || 'Material Management',
      html: `<div style="display:flex;justify-content:space-between;gap:20px;margin-bottom:14px"><div><h3 style="margin:0 0 4px">${esc(o.heading || o.title)}</h3>${(o.left || []).map(([k, v]) => `<div><span style="color:#555">${esc(k)}:</span> <b>${esc(v)}</b></div>`).join('')}</div><div style="text-align:end">${(o.right || []).map(([k, v]) => `<div><span style="color:#555">${esc(k)}:</span> <b>${esc(v)}</b></div>`).join('')}</div></div>
        <table><thead><tr>${o.columns.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${o.rows.map(r => `<tr>${r.map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody>${o.foot ? `<tfoot><tr>${o.foot.map(v => `<td><b>${esc(v)}</b></td>`).join('')}</tr></tfoot>` : ''}</table>
        ${o.note ? `<p style="margin-top:12px;color:#333">${esc(o.note)}</p>` : ''}
        <div class="doc-sign" style="display:grid;grid-template-columns:repeat(${(o.sign || ['Prepared by', 'Approved by']).length},1fr);gap:24px;margin-top:40px">${(o.sign || ['Prepared by', 'Approved by']).map(s => `<div style="border-top:1px solid #999;padding-top:6px;font-size:11px;color:#555">${esc(s)}</div>`).join('')}</div>` });
  }

  /* Grouped bar chart: groupBars({ labels, series: [{ name, color, values }], height, fmt }) */
  function groupBars(o) {
    const all = o.series.reduce((a, s) => a.concat(s.values), []);
    if (!all.some(v => v > 0)) return `<div class="empty">${icon('chart-column')}<b>No movement in this period</b><span>Receipts and issues of your stores will appear here.</span></div>`;
    return K.fitChart(groupSvg, o, `<div class="legend" style="margin-top:6px">${o.series.map(s => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>`);
  }
  function groupSvg(o) {
    const W = o.width || 640, H = o.height || 200, Lm = 48, T = 10, B = 26, n = o.labels.length, k = o.series.length;
    const all = o.series.reduce((a, s) => a.concat(s.values), []);
    const max = Math.max.apply(null, all.concat([1])) * 1.1, bw = (W - Lm - 10) / n, fmt = o.fmt || ((v) => K.num(v));
    const y = (v) => T + (H - T - B) * (1 - v / max);
    const step = Math.max(1, Math.ceil(n / Math.max(2, Math.min(8, Math.floor((W - Lm) / 56)))));
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.title || 'Bar chart')}">
      ${[0, 0.5, 1].map(f => `<line class="grid-l" x1="${Lm}" x2="${W - 10}" y1="${y(max * f)}" y2="${y(max * f)}"/><text class="axis-t" x="${Lm - 6}" y="${y(max * f) + 3}" text-anchor="end">${esc(fmt(max * f))}</text>`).join('')}
      ${o.labels.map((lb, i) => o.series.map((s, j) => { const v = s.values[i] || 0; const w = bw * 0.7 / k; const x = Lm + i * bw + bw * 0.15 + j * w; return v ? `<rect x="${x.toFixed(1)}" y="${y(v).toFixed(1)}" width="${(w - 1).toFixed(1)}" height="${(H - B - y(v)).toFixed(1)}" rx="3" fill="${s.color}"><title>${esc(s.name)} ${esc(lb)}: ${esc(fmt(v))}</title></rect>` : ''; }).join('') + ((i % step === 0 && n - 1 - i >= step) || i === n - 1 ? `<text class="axis-t" x="${Lm + i * bw + bw / 2}" y="${H - 8}" text-anchor="middle">${esc(lb)}</text>` : '')).join('')}
    </svg>`;
  }

  /* ---------- Small view helpers ---------- */
  const kv = (rows, cls) => `<dl class="kv ${cls || ''}">${rows.filter(Boolean).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v == null || v === '' ? '<span class="mute">-</span>' : v}</dd>`).join('')}</dl>`;
  const selectField = (o) => field(Object.assign({ type: 'select' }, o));
  const docNo = (prefix, key) => K.nextNo(prefix, db[key]);
  /* Count pending items per status for Kit.tabs. */
  const counts = (list, fn) => list.reduce((m, x) => { const k = fn(x); m[k] = (m[k] || 0) + 1; return m; }, {});
  function openFromQuery(list, fn) { const q = window.UI.param('id'); if (q) { const r = list.find(x => x.id === q || x.no === q); if (r) setTimeout(() => fn(r), 50); } }

  window.Material = { st, meName, ctx, ctxWh, wh, whName, deptName, wardName, stores, storeOpts, isMainCtx, item, itemLabel, itemCell, itemOpts, vendorName, vendorOpts, total, round3,
    batches, onHand, usable, fefo, deduct, addStock, expTone, layerCost, wac, fifoValue, wavgValue, method, methodName, bookValue, addReceipt, resetCache,
    levels, onOrder, alerts, levelsFor, nextLevel, canAct, btn, approvalTrail, lineEditor, barcode, printLabels, docPrint, groupBars, kv, selectField, docNo, counts, openFromQuery };
})();
