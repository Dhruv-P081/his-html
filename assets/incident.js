/* Incident Management helpers (window.Inc), shared by the pages in incident/. Load after kit.js. */
(function () {

  /* Right-align the header of numeric columns (UI.table only sets the class on body cells). */
  if (!UI.table.numHeads) { const t0 = UI.table; UI.table = function (host, o) { const r = t0.apply(this, arguments); ((o && o.columns) || []).forEach((c, i) => { if (/\bnum\b/.test(c.cls || '')) { const th = host.querySelector('th[data-c="' + i + '"]'); if (th) th.classList.add('num'); } }); return r; }; UI.table.numHeads = true; }
  const { db, save, esc, icon, $, $$, can, toast, audit, drawer, confirm, field, showErrors, me, nowStamp, fmtDate } = window.UI;
  const T = db.TODAY;
  const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];
  const STATUSES = ['Open', 'In Progress', 'Hold', 'Closed'];
  const OUTCOMES = ['Substantiated: system issue', 'Substantiated: individual practice', 'Substantiated: equipment fault', 'Not substantiated', 'Resolved: no harm, learning shared', 'Referred to another committee'];
  const SEV_TONE = { Low: 'neutral', Medium: 'info', High: 'warn', Critical: 'err' };
  const ST_TONE = { Open: 'warn', 'In Progress': 'info', Hold: 'violet', Closed: 'ok' };
  const list = (k) => db[k] || [];
  const meName = () => (me() || {}).displayName || 'User';
  const stamp = () => T + ' ' + nowStamp().slice(11, 16);

  const cat = (code) => list('incidentCategories').find(c => c.code === code);
  const typ = (code) => list('incidentTypes').find(t => t.code === code);
  const catName = (code) => (cat(code) || {}).name || code || 'Not set';
  const typeName = (code) => (typ(code) || {}).name || code || 'Not set';
  const member = (code) => list('incidentTeam').find(m => m.code === code);
  const memberName = (code) => (member(code) || {}).name || code;
  const mine = () => { const u = me(); return u ? list('incidentTeam').find(m => m.userId === u.id && m.status !== 'Inactive') : null; };
  const isMember = () => !!mine();
  const canAssign = () => { const m = mine(); return !!m && m.canAssign && can('incident.register', 'edit'); };
  const canClose = () => { const m = mine(); return !!m && m.canClose && can('incident.case', 'approve'); };
  const canWork = (c) => { const m = mine(); return !!m && can('incident.case', 'edit') && (m.canAssign || (c && c.assigned.includes(m.code))); };
  const myCases = () => { const m = mine(); return m ? list('incidentCases').filter(c => c.assigned.includes(m.code) && c.status !== 'Closed') : []; };

  const sevBadge = (s) => `<span class="badge b-${SEV_TONE[s] || 'neutral'}">${esc(s || 'Not set')}</span>`;
  const statusBadge = (s) => Kit.status(s, ST_TONE[s] || 'neutral');
  const ageDays = (c) => { const end = c.status === 'Closed' && c.closedAt ? c.closedAt.slice(0, 10) : T; return Math.max(0, Math.round((new Date(end + 'T00:00:00') - new Date(c.reportedAt.slice(0, 10) + 'T00:00:00')) / 864e5)); };
  const BUCKETS = ['0-7 days', '8-14 days', '15-30 days', 'Over 30 days'];
  const bucket = (d) => d <= 7 ? BUCKETS[0] : d <= 14 ? BUCKETS[1] : d <= 30 ? BUCKETS[2] : BUCKETS[3];
  const reporter = (c) => c.anonymous ? `<span style="white-space:nowrap">${icon('eye-off', 'mute')} Anonymous reporter</span>` : esc(c.reporterName || '');
  const statusCfg = (name) => list('incidentStatuses').find(s => s.name === name && s.status !== 'Inactive');
  const nextStatuses = (cur) => { const s = statusCfg(cur); const raw = s && s.allowedNext ? String(s.allowedNext).split(',').map(x => x.trim()).filter(Boolean) : STATUSES.filter(x => x !== cur); return raw.filter(x => STATUSES.includes(x) && x !== cur); };
  const log = (c, action, from, to, reason) => { c.history.push({ at: stamp(), by: meName(), action, from: from || '', to: to || '', reason: reason || '' }); };

  /* Status change: every change needs a reason; closing needs an outcome. */
  function changeStatus(c, to, onDone) {
    const from = c.status;
    if (to === 'Closed') {
      if (!canClose()) { toast('Only IMT members with close rights and Approve permission can close an incident.', 'err'); return; }
      const openA = c.actions.filter(a => a.status !== 'Done').length, openE = c.enquiries.filter(e => e.status !== 'Responded').length;
      drawer({ title: 'Close ' + c.no, sub: 'Record the outcome and the closure summary. This is shown in the case history.',
        body: `${openA || openE ? `<div class="banner warn" style="margin-bottom:12px">${icon('triangle-alert')}<span>${openA ? openA + ' open action' + (openA > 1 ? 's' : '') : ''}${openA && openE ? ' and ' : ''}${openE ? openE + ' enquiry' + (openE > 1 ? ' enquiries' : '') + ' without a response' : ''}. You can still close, but say why in the summary.</span></div>` : ''}
          <div class="err-summary hidden"></div><div class="form-grid">
          ${field({ id: 'clOut', label: 'Outcome', type: 'select', req: true, full: true, options: OUTCOMES.map(x => [x, x]) })}
          ${field({ id: 'clSum', label: 'Closure summary', type: 'textarea', req: true, full: true, max: 1000, hint: 'Findings, root cause and learning shared.' })}
          ${field({ id: 'clWhy', label: 'Reason for closing', req: true, full: true, max: 200, placeholder: 'For example: investigation complete, actions assigned' })}</div>`,
        foot: `<button class="btn" data-close>Cancel</button><span class="grow"></span><button class="btn primary" id="clGo" disabled>${icon('lock')} Close incident</button>`,
        onMount: (el, close) => {
          const go = $('#clGo', el);
          const sync = () => { go.disabled = !($('#clOut', el).value && $('#clSum', el).value.trim().length >= 10 && $('#clWhy', el).value.trim().length >= 3); };
          $$('input,select,textarea', el).forEach(i => { i.addEventListener('input', sync); i.addEventListener('change', sync); });
          go.addEventListener('click', () => {
            const out = $('#clOut', el).value, sum = $('#clSum', el).value.trim(), why = $('#clWhy', el).value.trim();
            Object.assign(c, { status: 'Closed', outcome: out, closureSummary: sum, closedAt: stamp(), closedBy: meName(), holdReason: '' });
            log(c, 'Status changed', from, 'Closed', why + '. Outcome: ' + out);
            save(); audit('Incident closed', 'Incident', { id: c.id, label: c.no }, [['Status', from, 'Closed'], ['Outcome', '', out]], { reason: why });
            close(); toast(c.no + ' closed'); onDone && onDone(c);
          });
        } });
      return;
    }
    if (!canWork(c)) { toast('Only the IMT lead or an assigned investigator can change the status.', 'err'); return; }
    const reopen = from === 'Closed';
    if (reopen && !canClose()) { toast('Only IMT members with close rights can reopen an incident.', 'err'); return; }
    confirm({ title: `${reopen ? 'Reopen' : 'Move'} ${c.no} to ${to}?`, tone: to === 'Hold' || reopen ? 'warn' : 'primary', icon: to === 'Hold' ? 'circle-pause' : 'circle-play',
      body: `Status changes from <b>${esc(from)}</b> to <b>${esc(to)}</b>. The reason is saved in the case history.`, confirm: reopen ? 'Reopen' : 'Change status', reason: true,
      onConfirm: (why) => {
        c.status = to;
        if (to === 'Hold') c.holdReason = why; else c.holdReason = '';
        if (reopen) { c.outcome = ''; c.closedAt = ''; c.closedBy = ''; }
        log(c, reopen ? 'Reopened' : 'Status changed', from, to, why);
        save(); audit(reopen ? 'Incident reopened' : 'Incident status changed', 'Incident', { id: c.id, label: c.no }, [['Status', from, to]], { reason: why });
        toast(`${c.no} is now ${to}`); onDone && onDone(c);
      } });
  }

  /* Review and categorize: confirm or correct category, type and severity. */
  function categorize(c, onDone) {
    if (!canAssign()) { toast('Only IMT members with assign rights can categorize.', 'err'); return; }
    drawer({ title: 'Review and categorize ' + c.no, sub: c.reviewed ? 'Change the categorization. The change is kept in the history.' : 'Confirm or correct what the reporter selected.',
      body: `<div class="card card-pad" style="margin-bottom:14px;background:var(--soft)"><div class="small b">Reported as</div><div class="small">${esc(catName(c.reporterCategoryCode))} · reporter severity ${esc(c.reporterSeverity || 'not given')}</div><div class="small muted" style="margin-top:6px">${esc(c.description)}</div></div>
        <div class="err-summary hidden"></div><div class="form-grid">
        ${field({ id: 'cgCat', label: 'Category', type: 'select', req: true, value: c.categoryCode, options: list('incidentCategories').filter(x => x.status !== 'Inactive').map(x => [x.code, x.name]) })}
        <div class="field"><label for="cgTyp">Type<span class="req">*</span></label><select class="input" id="cgTyp"></select></div>
        ${field({ id: 'cgSev', label: 'Severity', type: 'select', req: true, value: c.severity, options: SEVERITIES.map(x => [x, x]) })}
        ${field({ id: 'cgWhy', label: 'Review note', max: 200, placeholder: 'Optional', full: true })}</div>`,
      foot: `<button class="btn" data-close>Cancel</button><span class="grow"></span><button class="btn primary" id="cgGo">${icon('check')} Save categorization</button>`,
      onMount: (el, close) => {
        const fillTypes = () => { const cc = $('#cgCat', el).value; $('#cgTyp', el).innerHTML = `<option value="">Select type</option>` + list('incidentTypes').filter(t => t.categoryCode === cc && t.status !== 'Inactive').map(t => `<option value="${t.code}" ${t.code === c.typeCode ? 'selected' : ''}>${esc(t.name)}</option>`).join(''); sync(); };
        const sync = () => { $('#cgGo', el).disabled = !($('#cgCat', el).value && $('#cgTyp', el).value && $('#cgSev', el).value); };
        $('#cgCat', el).addEventListener('change', fillTypes); $('#cgTyp', el).addEventListener('change', sync); $('#cgSev', el).addEventListener('change', sync);
        fillTypes();
        $('#cgGo', el).addEventListener('click', () => {
          const nc = $('#cgCat', el).value, nt = $('#cgTyp', el).value, ns = $('#cgSev', el).value, note = $('#cgWhy', el).value.trim();
          const ch = [];
          if (nc !== c.categoryCode) ch.push(['Category', catName(c.categoryCode), catName(nc)]);
          if (nt !== c.typeCode) ch.push(['Type', typeName(c.typeCode), typeName(nt)]);
          if (ns !== c.severity) ch.push(['Severity', c.severity, ns]);
          Object.assign(c, { categoryCode: nc, typeCode: nt, severity: ns, reviewed: true, categorizedBy: meName(), categorizedAt: stamp() });
          log(c, 'Reviewed and categorized', ch.map(x => x[0] + ': ' + x[1]).join('; '), typeName(nt) + ' · ' + ns, note);
          save(); audit('Incident categorized', 'Incident', { id: c.id, label: c.no }, ch, { reason: note });
          close(); toast(c.no + ' categorized'); onDone && onDone(c);
        });
      } });
  }

  /* Assign investigators from the Incident Management Team. */
  function assign(c, onDone) {
    if (!canAssign()) { toast('Only IMT members with assign rights can assign investigators.', 'err'); return; }
    const team = list('incidentTeam').filter(m => m.status !== 'Inactive');
    drawer({ title: 'Assign investigators · ' + c.no, sub: `${esc(catName(c.categoryCode))} · ${esc(typeName(c.typeCode))}`,
      body: `<div class="list-rows">${team.map(m => { const load = list('incidentCases').filter(x => x.status !== 'Closed' && x.assigned.includes(m.code)).length; const fit = m.scope === 'All categories' || m.scope.includes(catName(c.categoryCode)); return `<div><label class="check grow"><input type="checkbox" value="${m.code}" ${c.assigned.includes(m.code) ? 'checked' : ''}> <span><b>${esc(m.name)}</b><div class="xs muted">${esc(m.role)} · ${esc(m.scope)}</div></span></label>${fit ? '<span class="badge b-ok nodot">Scope match</span>' : ''}<span class="tag">${load} open</span></div>`; }).join('')}</div>
        <div class="field" style="margin-top:14px"><label for="asNote">Note to investigators</label><textarea class="input" id="asNote" maxlength="300" placeholder="Optional"></textarea></div>
        <div class="small muted" style="margin-top:8px">${icon('bell-ring')} Assigned investigators are notified (rule NTF-ASG).</div>`,
      foot: `<button class="btn" data-close>Cancel</button><span class="grow"></span><button class="btn primary" id="asGo">${icon('user-round-check')} Save assignment</button>`,
      onMount: (el, close) => {
        const go = $('#asGo', el);
        const sel = () => $$('input[type=checkbox]:checked', el).map(i => i.value);
        const sync = () => { go.disabled = !sel().length; };
        $$('input[type=checkbox]', el).forEach(i => i.addEventListener('change', sync)); sync();
        go.addEventListener('click', () => {
          const now = sel(), added = now.filter(x => !c.assigned.includes(x)), removed = c.assigned.filter(x => !now.includes(x));
          if (!added.length && !removed.length) { close(); return; }
          const before = c.assigned.map(memberName).join(', ');
          c.assigned = now;
          added.forEach(x => log(c, 'Investigator assigned', '', memberName(x), $('#asNote', el).value.trim()));
          removed.forEach(x => log(c, 'Investigator removed', memberName(x), '', ''));
          if (!c.reviewed) { c.reviewed = true; c.categorizedBy = meName(); c.categorizedAt = stamp(); }
          save(); audit('Incident investigators assigned', 'Incident', { id: c.id, label: c.no }, [['Investigators', before, now.map(memberName).join(', ')]]);
          close(); toast('Investigators updated'); onDone && onDone(c);
        });
      } });
  }

  window.Inc = { T, SEVERITIES, STATUSES, OUTCOMES, BUCKETS, cat, typ, catName, typeName, member, memberName, mine, isMember, canAssign, canClose, canWork, myCases,
    sevBadge, statusBadge, ageDays, bucket, reporter, statusCfg, nextStatuses, log, changeStatus, categorize, assign, meName, stamp };
})();
