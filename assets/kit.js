/* Shared building blocks for module screens (Reception, EMR, Lab, Finance ...).
 * Load order on a module page: icons.js, data.js, data-core.js, data-<module>.js, ui.js, kit.js.
 * Everything here renders HTML strings or mounts into a host element, using UI helpers. */
(function () {
  const { db, save, esc, icon, $, $$, initials, fmtDate, drawer, confirm, toast, audit, me, today, nowStamp, uid, table, field, showErrors, can, R } = window.UI;
  const pad = (n, w) => String(n).padStart(w || 2, '0');

  /* ---------- Formatting ---------- */
  const money = (n, cur) => (cur === false ? '' : (cur || 'KWD') + ' ') + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  const num = (n, d) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  const time = (s) => (s && s.length > 10 ? s.slice(11, 16) : '');
  const dt = (s) => fmtDate(s);
  const day = (s) => fmtDate(String(s || '').slice(0, 10));
  function minsSince(s) { if (!s) return 0; const d = new Date(s.replace(' ', 'T')); return Math.max(0, Math.round((Date.now() - d) / 60000)); }
  /* "Today 10:30" style for the prototype date (SEED.TODAY), otherwise a date. */
  function when(s) { if (!s) return ''; return s.slice(0, 10) === db.TODAY ? 'Today ' + time(s) : fmtDate(s); }
  function addDays(d, n) { const x = new Date(d + 'T00:00:00'); x.setDate(x.getDate() + n); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; }
  /* Next document number for a list, for example nextNo('ORD-', db.orders, 'no'). */
  function nextNo(prefix, list, key) {
    key = key || 'no';
    const max = (list || []).reduce((m, x) => { const v = String(x[key] || ''); if (!v.startsWith(prefix)) return m; const n = parseInt(v.slice(prefix.length).replace(/\D/g, ''), 10); return isNaN(n) ? m : Math.max(m, n); }, 0);
    return prefix + (max + 1);
  }

  /* ---------- Lookups ---------- */
  const by = (k, id) => (db[k] || []).find(x => x.id === id);
  const pt = (id) => by('patients', id);
  const doc = (id) => by('doctors', id);
  const enc = (id) => by('encounters', id);
  const item = (id) => by('items', id);
  const bed = (id) => by('beds', id);
  const ward = (id) => by('wards', id);
  const payer = (id) => by('payers', id);
  const plan = (id) => by('plans', id);
  const vendor = (id) => by('vendors', id);
  const docName = (id) => (doc(id) || {}).name || '';
  const ptName = (id) => (pt(id) || {}).name || '';
  const age = (p) => (p && p.dob ? window.UI.ageOf(p.dob) : '');
  const sexAge = (p) => p ? [p.gender ? p.gender[0] : '', age(p)].filter(Boolean).join(' · ') : '';
  const payerLabel = (p) => p && p.payerId ? `${(payer(p.payerId) || {}).name || ''}${p.planId ? ' · ' + ((plan(p.planId) || {}).name || '') : ''}` : 'Cash (self-pay)';
  const stockOf = (itemId, whId) => (db.stock || []).filter(s => s.itemId === itemId && (!whId || s.warehouseId === whId)).reduce((n, s) => n + Number(s.qty || 0), 0);

  /* ---------- Status badges ---------- */
  const TONES = {
    ok: ['Completed', 'Paid', 'Verified', 'Approved', 'Dispensed', 'Done', 'Discharged', 'Closed', 'Received', 'Posted', 'Active', 'Given', 'Vacant', 'Available', 'Reported', 'Accepted', 'Settled', 'Cleared', 'Present', 'Matched', 'Reconciled', 'Sent', 'Arrived', 'Delivered', 'Open period'],
    info: ['Booked', 'Ordered', 'Scheduled', 'In progress', 'In consultation', 'Checked in', 'Collected', 'Submitted', 'Admitted', 'Occupied', 'Pending verification', 'Interim', 'In batch', 'Draft', 'Under treatment', 'Under observation', 'Performed', 'Partially received', 'Issued', 'Confirmed', 'In transit', 'PO raised', 'Partially issued', 'Counting'],
    warn: ['Waiting', 'Waiting for doctor', 'Pending', 'Pending approval', 'Unpaid', 'Partially paid', 'Hold', 'On hold', 'Due', 'Expiring', 'Low stock', 'Cleaning', 'Discharge planned', 'Pending billing', 'Late', 'Overdue', 'Resulted', 'Query', 'Short', 'Reorder', 'Partially matched', 'Not submitted', 'Open', 'Below min'],
    err: ['Cancelled', 'Rejected', 'Missed', 'Critical', 'Expired', 'No-show', 'Absent', 'Out of stock', 'Blocked', 'Denied', 'Failed', 'Variance', 'Mismatch', 'Refused', 'Held', 'Escalated'],
    violet: ['Reserved', 'Referred', 'Transferred', 'In batch review', 'Leave', 'Temporary alias'],
  };
  const TONE_OF = {}; Object.entries(TONES).forEach(([t, list]) => list.forEach(s => { TONE_OF[s] = t; }));
  function status(s, tone) { const t = tone || TONE_OF[s] || 'neutral'; return `<span class="badge b-${t}">${esc(s)}</span>`; }
  function triage(level) { const names = { 1: 'Resuscitation', 2: 'Emergent', 3: 'Urgent', 4: 'Less urgent', 5: 'Non-urgent' }; return `<span class="pri pri-${level}" title="ESI ${level}: ${names[level] || ''}">${level}</span>`; }
  function priority(p) { return p === 'STAT' ? '<span class="badge b-err">STAT</span>' : p === 'Urgent' ? '<span class="badge b-warn">Urgent</span>' : '<span class="badge b-neutral nodot">Routine</span>'; }

  /* ---------- Patient UI ---------- */
  function avatar(p, cls) { return `<span class="avatar ${cls || ''} ${p && p.gender === 'Female' ? 'av-f' : 'av-m'}">${initials(p ? p.name : '?')}</span>`; }
  function patientCell(p, sub) {
    if (!p) return '<span class="muted">Unknown patient</span>';
    return `<div class="row" style="gap:10px">${avatar(p, 'sm')}<div class="cell-main"><b>${esc(p.name)}${p.vip ? ' <span class="badge b-violet nodot">VIP</span>' : ''}</b><span style="white-space:nowrap"><span class="mono">${esc(p.mrn)}</span> · ${esc(sexAge(p))}${sub ? ' · ' + sub : ''}</span></div></div>`;
  }
  /* Patient banner shown at the top of every clinical screen. */
  function patientBanner(p, e, extra) {
    if (!p) return '';
    const b = e && e.bedId ? bed(e.bedId) : null;
    const flags = (p.allergies || []).map(a => `<span class="badge allergy">${icon('triangle-alert')} ${esc(a)}</span>`).join('') || '<span class="badge b-ok">No known allergies</span>';
    return `<div class="pt-banner">
      ${avatar(p)}
      <div style="min-width:0">
        <div class="pt-name">${esc(p.name)} ${p.nameAr ? `<span class="muted small" dir="rtl" style="font-weight:600">${esc(p.nameAr)}</span>` : ''} ${p.alias ? status('Temporary alias') : ''}</div>
        <div class="pt-meta"><span><b>${esc(p.mrn)}</b></span><span>${esc(sexAge(p))}${p.dob ? ' · DOB ' + esc(fmtDate(p.dob)) : ''}</span>${p.civilId ? `<span>Civil ID <b>${esc(p.civilId)}</b></span>` : ''}${p.bloodGroup ? `<span>Blood <b>${esc(p.bloodGroup)}</b></span>` : ''}<span>${esc(payerLabel(p))}</span>
        ${e ? `<span>${esc(e.type)} <b>${esc(e.no)}</b>${e.doctorId ? ' · ' + esc(docName(e.doctorId)) : ''}${b ? ' · Bed <b>' + esc(b.no) + '</b>' : ''}</span>` : ''}</div>
      </div>
      <div class="pt-flags">${flags}${(p.chronic || []).slice(0, 2).map(c => `<span class="tag">${esc(c)}</span>`).join('')}${extra || ''}</div>
    </div>`;
  }
  /* pickPatient({ title, filter(p), onPick(p) }): search the MPI in a drawer. */
  function pickPatient(o) {
    o = o || {};
    drawer({ title: o.title || 'Find patient', sub: 'Search by name, MRN, Civil ID or mobile number.',
      body: `<div class="search" style="margin-bottom:12px">${icon('search')}<input class="input" id="ppQ" placeholder="Name, MRN, Civil ID or mobile" autocomplete="off"></div><div id="ppList" class="card"></div>`,
      foot: can('reception.reg.patient', 'add') ? `<a class="btn" href="${R('reception/patients.html?new=1')}">${icon('user-plus')} Register a new patient</a><span class="grow"></span><button class="btn" data-close>Cancel</button>` : `<button class="btn" data-close>Cancel</button>`,
      onMount: (el, close) => {
        const q = $('#ppQ', el), host = $('#ppList', el);
        const draw = () => {
          const s = q.value.trim().toLowerCase();
          const list = (db.patients || []).filter(p => (!o.filter || o.filter(p)) && (!s || [p.name, p.mrn, p.civilId, p.mobile, p.nameAr].join(' ').toLowerCase().includes(s))).slice(0, 12);
          host.innerHTML = list.length ? `<div class="list-rows pad">${list.map(p => `<div class="click" data-id="${p.id}" style="cursor:pointer">${patientCell(p)}<span class="grow"></span><span class="small muted">${esc(p.mobile || '')}</span>${icon('chevron-right', 'mute')}</div>`).join('')}</div>`
            : `<div class="empty">${icon('search')}<b>No patient found</b><span>Check the spelling or search by MRN or Civil ID.</span></div>`;
          $$('[data-id]', host).forEach(r => r.addEventListener('click', () => { close(); o.onPick && o.onPick(pt(r.dataset.id)); }));
        };
        q.addEventListener('input', draw); draw();
      } });
  }

  /* ---------- Cards and charts ---------- */
  /* kpi(label, value, { icon, foot, delta: '+4%' | '-2%' | '0', unit, tone }) */
  const kLen = (v, u) => String(v).replace(/<[^>]*>/g, '').length + (u ? String(u).length * 0.55 : 0);
  function kpi(label, value, o) {
    o = o || {};
    const d = o.delta != null ? `<span class="delta ${String(o.delta).startsWith('-') ? (o.goodDown ? 'up' : 'down') : String(o.delta) === '0' ? 'flat' : (o.goodDown ? 'down' : 'up')}">${esc(o.delta)}</span>` : '';
    return `<div class="card kpi"${o.href ? ` onclick="location.href='${o.href}'" style="cursor:pointer"` : ''}><div class="k-label">${o.icon ? icon(o.icon) : ''}${esc(label)}</div><div class="k-value${kLen(value, o.unit) > 13 ? ' xl' : kLen(value, o.unit) > 9 ? ' l' : ''}">${value}${o.unit ? `<small>${esc(o.unit)}</small>` : ''}</div>${o.foot || d ? `<div class="k-foot">${d}${o.foot ? esc(o.foot) : ''}</div>` : ''}</div>`;
  }
  const PALETTE = ['#2F6BC5', '#0E9F6E', '#E0670E', '#7C4DDB', '#D23F6A', '#0891B2', '#B98900'];
  /* lineChart({ labels: [...], series: [{ name, color, values: [...] }], height, band: [lo, hi], min, max, unit }) */
  /* Charts are drawn at the card's real width (see fitCharts below), so labels keep their
   * normal size instead of shrinking with a fixed 820-unit viewBox. */
  const CHARTS = [];
  function fitWrap(render, o, svg, after) {
    if (o.width) return svg + (after || '');
    CHARTS.push({ render, o });
    return `<div class="chart-fit" data-ck="${CHARTS.length - 1}">${svg}</div>${after || ''}`;
  }
  function fitCharts() {
    document.querySelectorAll('.chart-fit').forEach(el => {
      const c = CHARTS[+el.dataset.ck], w = Math.round(el.clientWidth);
      if (!c || !w || +el.dataset.w === w) return;
      el.dataset.w = w;
      const o = Object.assign({}, c.o, { width: Math.max(260, w) });
      el.innerHTML = c.render(o);
    });
  }
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => fitCharts());
    new MutationObserver(() => { document.querySelectorAll('.chart-fit:not([data-ro])').forEach(el => { el.dataset.ro = 1; ro.observe(el); }); fitCharts(); })
      .observe(document.documentElement, { childList: true, subtree: true });
  }
  function lineChart(o) {
    const legend = o.series.length > 1 ? `<div class="legend" style="margin-top:6px">${o.series.map((s, si) => `<span><i style="background:${s.color || PALETTE[si % PALETTE.length]}"></i>${esc(s.name)}</span>`).join('')}</div>` : '';
    return fitWrap(lineSvg, o, lineSvg(o), legend);
  }
  function barChart(o) { return fitWrap(barSvg, o, barSvg(o)); }
  /* fitChart(render, o): any module chart drawn by render(o) at o.width follows the card width. */
  function fitChart(render, o, after) { return fitWrap(render, o, render(o), after); }
  function lineSvg(o) {
    const W = o.width || 820, H = o.height || 200, L = 36, Rr = 10, T = 12, B = 26;
    const all = o.series.reduce((a, s) => a.concat(s.values.filter(v => v != null)), []).concat(o.band || []);
    let min = o.min != null ? o.min : Math.min.apply(null, all), max = o.max != null ? o.max : Math.max.apply(null, all);
    if (min === max) { min -= 1; max += 1; }
    const span = max - min; if (o.min == null) min -= span * 0.08; if (o.max == null) max += span * 0.08;
    const n = o.labels.length, x = (i) => L + (n <= 1 ? 0 : i * (W - L - Rr) / (n - 1)), y = (v) => T + (H - T - B) * (1 - (v - min) / (max - min));
    const ticks = 4, grid = Array.from({ length: ticks + 1 }, (_, i) => min + (max - min) * i / ticks);
    const step = Math.max(1, Math.ceil(n / Math.max(2, Math.min(8, Math.floor((W - L) / 64)))));
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.title || 'Trend chart')}">
      ${o.band ? `<rect x="${L}" y="${y(o.band[1])}" width="${W - L - Rr}" height="${Math.max(0, y(o.band[0]) - y(o.band[1]))}" fill="#0E9F6E" opacity=".07"/>` : ''}
      ${grid.map(g => `<line class="grid-l" x1="${L}" x2="${W - Rr}" y1="${y(g)}" y2="${y(g)}"/><text class="axis-t" x="${L - 6}" y="${y(g) + 3}" text-anchor="end">${Math.round(g * 10) / 10}</text>`).join('')}
      ${o.labels.map((lb, i) => i % step === 0 || i === n - 1 ? `<text class="axis-t" x="${x(i)}" y="${H - 8}" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}">${esc(lb)}</text>` : '').join('')}
      ${o.series.map((s, si) => { const c = s.color || PALETTE[si % PALETTE.length]; const pts = s.values.map((v, i) => v == null ? null : [x(i), y(v)]).filter(Boolean);
        return `<path class="ln" stroke="${c}" d="${pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')}"/>${pts.map(p => `<circle class="dot" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.2" fill="${c}"/>`).join('')}`; }).join('')}
    </svg>`;
  }
  /* barChart({ labels, values, height, color, unit }) vertical bars */
  function barSvg(o) {
    const W = o.width || 820, H = o.height || 190, L = 30, T = 10, B = 26, n = o.labels.length;
    const raw = Math.max.apply(null, o.values.concat([1])) * 1.05, mag = Math.pow(10, Math.floor(Math.log10(raw))), max = [1, 2, 2.5, 5, 10].map(f => f * mag).find(v => v >= raw) || raw, bw = (W - L - 10) / n, bstep = Math.max(1, Math.ceil(n / Math.max(2, Math.floor((W - L) / 46))));
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.title || 'Bar chart')}">
      ${[0, 0.5, 1].map(f => `<line class="grid-l" x1="${L}" x2="${W - 10}" y1="${T + (H - T - B) * (1 - f)}" y2="${T + (H - T - B) * (1 - f)}"/><text class="axis-t" x="${L - 6}" y="${T + (H - T - B) * (1 - f) + 3}" text-anchor="end">${Math.round(max * f)}</text>`).join('')}
      ${o.values.map((v, i) => { const h = (H - T - B) * v / max; return `<rect x="${L + i * bw + bw * 0.18}" y="${T + (H - T - B) - h}" width="${bw * 0.64}" height="${h}" rx="4" fill="${(o.colors && o.colors[i]) || o.color || '#2F6BC5'}"><title>${esc(o.labels[i])}: ${v}</title></rect>${i % bstep === 0 ? `<text class="axis-t" x="${L + i * bw + bw / 2}" y="${H - 8}" text-anchor="middle">${esc(o.labels[i])}</text>` : ''}`; }).join('')}
    </svg>`;
  }
  /* barList([[label, value, tone?]], { max, fmt }) horizontal bars */
  function barList(rows, o) {
    o = o || {};
    const max = o.max || Math.max.apply(null, rows.map(r => r[1]).concat([1]));
    return `<div class="bars">${rows.map(r => `<div class="b-row"><span>${esc(r[0])}</span><div class="progress ${r[2] || ''}"><i style="width:${Math.max(2, Math.round(100 * r[1] / max))}%"></i></div><span class="num">${o.fmt ? o.fmt(r[1]) : esc(r[1])}</span></div>`).join('')}</div>`;
  }
  /* donut([[label, value, color]]) */
  function donut(rows, o) {
    o = o || {};
    const total = rows.reduce((s, r) => s + r[1], 0) || 1, R0 = 52, C = 2 * Math.PI * R0;
    let off = 0;
    return `<div class="row" style="gap:18px;align-items:center"><svg viewBox="0 0 140 140" width="${o.size || 132}" height="${o.size || 132}" role="img" aria-label="${esc(o.title || 'Share chart')}"><circle cx="70" cy="70" r="${R0}" fill="none" stroke="var(--soft)" stroke-width="16"/>
      ${rows.map((r, i) => { const len = C * r[1] / total; const s = `<circle cx="70" cy="70" r="${R0}" fill="none" stroke="${r[2] || PALETTE[i % PALETTE.length]}" stroke-width="16" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 70 70)"/>`; off += len; return s; }).join('')}
      <text x="70" y="68" text-anchor="middle" style="font-size:20px;font-weight:800;fill:var(--ink)">${esc(o.center != null ? o.center : total)}</text><text x="70" y="86" text-anchor="middle" style="font-size:10px;font-weight:700;fill:var(--mute)">${esc(o.centerLabel || 'Total')}</text></svg>
      <div class="stack tight">${rows.map((r, i) => `<div class="row small" style="gap:8px"><i class="pill-dot" style="background:${r[2] || PALETTE[i % PALETTE.length]}"></i><span class="grow">${esc(r[0])}</span><b>${esc(o.fmt ? o.fmt(r[1]) : r[1])}</b></div>`).join('')}</div></div>`;
  }

  /* ---------- Tabs ---------- */
  /* tabs(host, [{ id, label, count, icon }], activeId, onChange(id)) */
  function tabs(host, list, active, onChange) {
    const draw = () => {
      host.innerHTML = `<div class="tabs" role="tablist">${list.map(t => `<button role="tab" data-t="${t.id}" class="${t.id === active ? 'on' : ''}" aria-selected="${t.id === active}">${t.icon ? icon(t.icon) : ''}${esc(t.label)}${t.count != null ? `<span class="count">${t.count}</span>` : ''}</button>`).join('')}</div>`;
      $$('[data-t]', host).forEach(b => b.addEventListener('click', () => { active = b.dataset.t; draw(); onChange(active); }));
    };
    draw();
    return { set: (id) => { active = id; draw(); onChange(id); } };
  }
  /* seg(host, [[value, label, icon?]], active, onChange) segmented control */
  function seg(host, list, active, onChange) {
    const draw = () => { host.innerHTML = `<div class="seg">${list.map(([v, l, ic]) => `<button data-v="${esc(v)}" class="${v === active ? 'on' : ''}">${ic ? icon(ic) : ''}${esc(l)}</button>`).join('')}</div>`; $$('[data-v]', host).forEach(b => b.addEventListener('click', () => { active = b.dataset.v; draw(); onChange(active); })); };
    draw();
  }

  /* ---------- Notes, scope and print ---------- */
  function scopeNote(text, ref) { return `<span class="scope-note">${icon('info')}${esc(text)}${ref ? ` <span class="req-ref">${esc(ref)}</span>` : ''}</span>`; }
  function phase2(text) { return `<div class="banner info">${icon('calendar-clock')}<span>${esc(text || 'This function is in the SOW V4 2nd phase scope. Shown for context only.')}</span></div>`; }
  /* printDoc({ title, sub, html }) shows a printable document (label, wristband, report, receipt). */
  function printDoc(o) {
    const br = window.UI.L.branch((window.UI.session() || {}).ctx ? window.UI.session().ctx.branchId : '') || {};
    const el = document.createElement('div');
    el.className = 'modal wide';
    el.innerHTML = `<div class="row" style="margin-bottom:12px"><h2 class="grow" style="margin:0">${esc(o.title)}</h2><button class="icon-btn" data-x aria-label="Close">${icon('x')}</button></div>
      <div class="print-sheet" id="printArea"><div class="row" style="border-bottom:2px solid ${UI.themeColours((db.appSettings || {}).theme).primary};padding-bottom:8px;margin-bottom:12px"><img src="${esc(UI.brandLogo())}" alt="" style="width:34px;height:34px;object-fit:contain"><div class="grow"><b style="font-size:14px">${esc(br.name || UI.brandName())}</b><div style="font-size:11px;color:#555">${esc(o.sub || '')}</div></div><div style="font-size:11px;color:#555;text-align:end">Printed ${esc(fmtDate(nowStamp()))}<br>by ${esc((me() || {}).displayName || '')}</div></div>${o.html}</div>
      <div class="m-foot"><button class="btn" data-x>Close</button>${o.extra || ''}<button class="btn primary" data-p>${icon('printer')} Print</button></div>`;
    const scrim = document.createElement('div'); scrim.className = 'scrim';
    document.body.appendChild(scrim); document.body.appendChild(el);
    const close = () => { scrim.remove(); el.remove(); };
    scrim.addEventListener('click', close); $$('[data-x]', el).forEach(b => b.addEventListener('click', close));
    $('[data-p]', el).addEventListener('click', () => {
      const w = window.open('', '_blank', 'width=900,height=700');
      if (!w) { toast('Allow pop-ups to print.', 'err'); return; }
      w.document.write(`<html><head><title>${esc(o.title)}</title><style>body{font-family:Manrope,Arial,sans-serif;font-size:12.5px;color:#111;padding:24px}table{width:100%;border-collapse:collapse}td,th{border-bottom:1px solid #ddd;padding:6px;text-align:start}img{max-width:40px}</style></head><body>${$('#printArea', el).innerHTML}</body></html>`);
      w.document.close(); w.focus(); w.print();
    });
    return close;
  }
  function csv(name, header, rows) {
    const safe = (v) => { let s = String(v == null ? '' : v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };   // formula neutralising
    const text = [header].concat(rows).map(r => r.map(safe).join(',')).join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv' })); a.download = name + '.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  /* ---------- Report catalogue (SOW Annexure B: 10 reports per module) ----------
   * reportCatalog(host, { module: 'lab', opt: 'lab.reports', reports: [{ id, title, purpose, filters: [{ id, label, type: 'date'|'select', options }],
   *   columns: [label...], rows: (filterValues) => [[...]], totals: (rows) => [...] }] }) */
  function reportCatalog(host, o) {
    const canPrint = can(o.opt, 'print');
    host.innerHTML = `<div class="banner info" style="margin-bottom:14px">${icon('info')}<span>SOW V4 Annexure B allows ${o.allowance || 10} reports for this module. Titles, layouts and filters below are proposals until Tibbi approves each report definition.</span></div>
      <div class="grid rep-grid">${o.reports.map((r, i) => `<div class="card card-pad" style="display:flex;flex-direction:column;gap:8px"><div class="row"><span class="req-ref">R${pad(i + 1)}</span><span class="grow"></span><span class="tag">${r.filters ? r.filters.length : 0} filters</span></div><b style="font-size:14px">${esc(r.title)}</b><span class="small muted grow">${esc(r.purpose || '')}</span><div><button class="btn sm" data-r="${i}">${icon('play')} Run report</button></div></div>`).join('')}</div>`;
    $$('[data-r]', host).forEach(b => b.addEventListener('click', () => run(o.reports[+b.dataset.r])));
    function run(r) {
      const vals = {};
      (r.filters || []).forEach(f => { vals[f.id] = f.value != null ? f.value : (f.type === 'date' ? (f.id === 'from' ? addDays(db.TODAY, -30) : db.TODAY) : ''); });
      drawer({ title: r.title, sub: esc(r.purpose || ''), wide: true,
        body: `<div class="form-grid c4" id="rf">${(r.filters || []).map(f => f.type === 'select' ? field({ id: 'f_' + f.id, label: f.label, type: 'select', options: f.options, value: vals[f.id], placeholder: 'All' }) : field({ id: 'f_' + f.id, label: f.label, type: f.type || 'text', value: vals[f.id] })).join('')}</div>
          <div class="row" style="margin:12px 0"><button class="btn primary sm" id="rRun">${icon('play')} Run</button><span class="grow"></span><button class="btn sm" id="rCsv" ${canPrint ? '' : 'disabled title="Needs Print permission"'}>${icon('file-spreadsheet')} Excel (CSV)</button><button class="btn sm" id="rPrint" ${canPrint ? '' : 'disabled title="Needs Print permission"'}>${icon('printer')} PDF / Print</button></div>
          <div class="card" id="rOut"></div>`,
        onMount: (el) => {
          let rows = [];
          const go = () => {
            (r.filters || []).forEach(f => { vals[f.id] = $('#f_' + f.id, el).value; });
            rows = r.rows(vals) || [];
            const tot = r.totals ? r.totals(rows) : null;
            const fl = (r.filters || []).map(f => { const v = vals[f.id]; const sel = f.type === 'select' && v ? (f.options.find(op => String(Array.isArray(op) ? op[0] : op) === String(v)) || []) : null; return `${f.label}: ${!v ? 'All' : f.type === 'date' ? fmtDate(v) : sel ? (Array.isArray(sel) ? sel[1] : sel) : v}`; }).join(' · ');
            $('#rOut', el).innerHTML = `<div class="report-meta"><div><b>Generated by</b>${esc((me() || {}).displayName)}</div><div><b>Generated at</b>${esc(fmtDate(nowStamp()))} (Asia/Kuwait)</div><div><b>Filters</b>${esc(fl || 'None')}</div><div><b>Rows</b>${rows.length}</div></div>
              <div class="table-wrap"><table class="tbl compact"><thead><tr>${r.columns.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.map(row => `<tr>${row.map(v => typeof v === 'number' ? `<td class="num">${num(v, Number.isInteger(v) ? 0 : 3)}</td>` : `<td>${esc(v)}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${r.columns.length}"><div class="empty">${icon('search')}<b>No data for these filters</b></div></td></tr>`}</tbody>${tot ? `<tfoot><tr>${tot.map(v => typeof v === 'number' ? `<td class="num">${num(v, Number.isInteger(v) ? 0 : 3)}</td>` : `<td>${esc(v)}</td>`).join('')}</tr></tfoot>` : ''}</table></div>`;
          };
          $('#rRun', el).addEventListener('click', go);
          $('#rCsv', el).addEventListener('click', () => { csv(r.title.replace(/\W+/g, '_'), r.columns, rows); audit('Report exported', 'Report', { id: r.id, label: r.title }, [['Format', '', 'CSV']]); });
          $('#rPrint', el).addEventListener('click', () => printDoc({ title: r.title, sub: r.purpose, html: $('#rOut', el).innerHTML }));
          go();
        } });
    }
  }

  /* ---------- Generic master data screen ----------
   * masters(host, { opt, defs: [{ id, title, icon, key (db key), fields: [{ key, label, type: 'text'|'number'|'select'|'textarea'|'date'|'check', options, req, full }],
   *   columns: [key...] (defaults to the first 4 fields), code: 'code' (unique key field), note }] }) */
  function masters(host, o) {
    let cur = o.defs[0].id;
    host.innerHTML = `<div class="split" style="grid-template-columns:260px minmax(0,1fr)"><div class="card list-pane" id="mList"></div><div id="mBody" style="min-width:0"></div></div>`;
    const list = $('#mList', host), body = $('#mBody', host);
    const drawList = () => {
      list.innerHTML = `<div class="card-head"><h3>${icon('database')} Masters</h3></div>${o.defs.map(d => `<div class="qitem ${d.id === cur ? 'on' : ''}" data-m="${d.id}">${icon(d.icon || 'list')}<div class="grow"><b style="font-size:13px">${esc(d.title)}</b>${d.phase2 ? '<div class="xs mute">2nd phase</div>' : ''}</div><span class="tag">${(db[d.key] || []).length}</span></div>`).join('')}`;
      $$('[data-m]', list).forEach(n => n.addEventListener('click', () => { cur = n.dataset.m; drawList(); drawBody(); }));
    };
    const drawBody = () => {
      const d = o.defs.find(x => x.id === cur);
      if (!db[d.key]) { db[d.key] = []; }
      const cols = (d.columns || d.fields.slice(0, 4).map(f => f.key));
      const canAdd = can(o.opt, 'add'), canEdit = can(o.opt, 'edit');
      body.innerHTML = `<div class="card"><div class="card-head"><div><h3>${icon(d.icon || 'list')} ${esc(d.title)}</h3>${d.note ? `<div class="small muted" style="margin-top:2px">${esc(d.note)}</div>` : ''}</div><div class="actions">${d.phase2 ? '<span class="badge b-info">2nd phase</span>' : ''}<button class="btn primary sm" id="mAdd" ${canAdd ? '' : 'disabled title="Needs Add permission"'}>${icon('plus')} Add</button></div></div><div id="mTbl"></div></div>`;
      const t = table($('#mTbl', body), {
        columns: cols.map(k => { const f = d.fields.find(x => x.key === k) || { key: k, label: k }; return { label: f.label, sort: (r) => r[k], render: (r) => f.type === 'check' ? (r[k] ? icon('check') : '<span class="mute">-</span>') : f.type === 'number' && f.money ? money(r[k]) : k === (d.code || 'code') ? `<span class="mono">${esc(r[k])}</span>` : esc(r[k]) }; })
          .concat([{ label: 'Status', render: (r) => status(r.status || 'Active') }, { label: '', cls: 'actions', render: (r) => `<button class="btn xs" data-e="${r.id}" ${canEdit ? '' : 'disabled'}>${icon('pencil')} Edit</button>` }]),
        rows: () => db[d.key], search: (r) => d.fields.map(f => r[f.key]).join(' '), searchPlaceholder: 'Search ' + d.title.toLowerCase(),
        filters: [{ label: 'Status', options: [['Active', 'Active'], ['Inactive', 'Inactive']], test: (r, v) => (r.status || 'Active') === v }],
        afterDraw: (tb) => $$('[data-e]', tb).forEach(b => b.addEventListener('click', () => edit(d, db[d.key].find(x => x.id === b.dataset.e)))),
        empty: 'No records yet',
      });
      $('#mAdd', body).addEventListener('click', () => edit(d, null));
      function edit(d, rec) {
        const isNew = !rec;
        drawer({ title: (isNew ? 'Add ' : 'Edit ') + d.title.replace(/s$/, '').toLowerCase(), sub: d.title,
          body: `<div class="err-summary hidden"></div><div class="form-grid">${d.fields.map(f => f.type === 'check' ? `<label class="check ${f.full ? 'full' : ''}"><input type="checkbox" id="m_${f.key}" ${rec && rec[f.key] ? 'checked' : ''}> ${esc(f.label)}</label>` : field({ id: 'm_' + f.key, label: f.label, type: f.type, options: f.options ? f.options.map(x => Array.isArray(x) ? x : [x, x]) : undefined, value: rec ? rec[f.key] : (f.default != null ? f.default : ''), req: f.req, full: f.full || f.type === 'textarea' })).join('')}
            ${!isNew ? `<div class="field"><label>Status</label><select class="input" id="m_status"><option ${rec.status !== 'Inactive' ? 'selected' : ''}>Active</option><option ${rec.status === 'Inactive' ? 'selected' : ''}>Inactive</option></select></div>` : ''}</div>`,
          foot: `<button class="btn" data-close>Cancel</button><button class="btn primary" id="mSave">${isNew ? 'Add' : 'Save changes'}</button>`,
          onMount: (el, close) => $('#mSave', el).addEventListener('click', () => {
            const v = {}; const errs = {};
            d.fields.forEach(f => { const i = $('#m_' + f.key, el); v[f.key] = f.type === 'check' ? i.checked : f.type === 'number' ? (i.value === '' ? '' : Number(i.value)) : i.value.trim(); if (f.req && (v[f.key] === '' || v[f.key] == null)) errs['m_' + f.key] = f.label + ' is required.'; });
            const ck = d.code || 'code';
            if (v[ck] && db[d.key].some(x => x !== rec && String(x[ck]).toUpperCase() === String(v[ck]).toUpperCase())) errs['m_' + ck] = 'This code is already used.';
            if (!showErrors(el, errs)) return;
            const changes = [];
            if (isNew) { rec = Object.assign({ id: uid(d.id.slice(0, 3)), status: 'Active' }, v); db[d.key].push(rec); }
            else { d.fields.forEach(f => { if (String(rec[f.key]) !== String(v[f.key])) changes.push([f.label, String(rec[f.key] == null ? '' : rec[f.key]), String(v[f.key])]); }); Object.assign(rec, v); const st = $('#m_status', el).value; if (st !== (rec.status || 'Active')) changes.push(['Status', rec.status || 'Active', st]); rec.status = st; }
            save(); audit(isNew ? 'Created ' + d.title.toLowerCase() : 'Updated ' + d.title.toLowerCase(), d.title, { id: rec.id, label: rec[ck] || rec.name || rec.id }, changes);
            close(); toast(isNew ? 'Added' : 'Saved'); t.redraw(); drawList();
          }) });
      }
    };
    drawList(); drawBody();
  }

  /* ---------- Small form helpers ---------- */
  function opts(list, val, lab) { return list.map(x => { const v = typeof x === 'object' ? x[val || 'id'] : x; const l = typeof x === 'object' ? x[lab || 'name'] : x; return [v, l]; }); }
  function sumBy(list, f) { return list.reduce((s, x) => s + Number(f(x) || 0), 0); }
  function groupBy(list, f) { return list.reduce((m, x) => { const k = f(x); (m[k] = m[k] || []).push(x); return m; }, {}); }

  window.Kit = { money, num, time, dt, day, when, minsSince, addDays, nextNo, by, pt, doc, enc, item, bed, ward, payer, plan, vendor, docName, ptName, age, sexAge, payerLabel, stockOf,
    status, triage, priority, avatar, patientCell, patientBanner, pickPatient, kpi, lineChart, barChart, fitChart, barList, donut, PALETTE, tabs, seg, scopeNote, phase2, printDoc, csv,
    reportCatalog, masters, opts, sumBy, groupBy };
})();
