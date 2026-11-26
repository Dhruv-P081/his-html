/* Shared access-mapping UI (Section 10): assignment editor, revoke, effective permissions. */
(function () {
  const { db, save, $, $$, icon, esc, drawer, field, showErrors, badge, L, toast, audit, me, nowStamp, uid, today, confirm, assignmentUsable, ctxKey, permsFor, tupleText, fmtDate, can } = UI;

  function overlaps(a, b) { return (!a.to || !b.from || b.from <= a.to) && (!b.to || !a.from || a.from <= b.to); }

  /* MAP-01..04, MAP-10..11, MAP-13..14, MAP-16 */
  function assignmentDrawer(existing, userId, onDone) {
    const a = existing ? Object.assign({}, existing) : { userId: userId || '', companyId: '', branchId: '', deptId: '', clinicId: null, warehouseId: null, roleId: '', from: today(), to: '', isDefault: false };
    const privOk = can('admin.security.users', 'admin');
    drawer({ title: existing ? 'Edit assignment' : 'New access assignment', sub: 'Each assignment is one explicit tuple: user, company, branch, department, optional clinic, optional warehouse and role.', wide: true,
      body: `<div class="err-summary hidden" style="margin-bottom:14px"></div><div class="form-grid">
        <div class="field full"><label for="mUser">User<span class="req">*</span></label><select class="input" id="mUser" ${existing || userId ? 'disabled' : ''}><option value="">Select user</option>${db.users.filter(u => u.status !== 'Inactive' || u.id === a.userId).map(u => `<option value="${u.id}" ${a.userId === u.id ? 'selected' : ''}>${esc(u.displayName)} · ${esc(u.login)}${u.status !== 'Active' ? ' (' + u.status + ')' : ''}</option>`).join('')}</select><div class="err hidden" data-err="mUser"></div></div>
        <div class="field"><label for="mCo">Company<span class="req">*</span></label><select class="input" id="mCo"></select><div class="err hidden" data-err="mCo"></div></div>
        <div class="field"><label for="mBr">Branch<span class="req">*</span></label><select class="input" id="mBr"></select><div class="err hidden" data-err="mBr"></div></div>
        <div class="field"><label for="mDp">Department<span class="req">*</span></label><select class="input" id="mDp"></select><div class="err hidden" data-err="mDp"></div></div>
        <div class="field"><label for="mCl">Clinic or specialty</label><select class="input" id="mCl"></select><div class="hint">Blank means no clinic, never all clinics.</div><div class="err hidden" data-err="mCl"></div></div>
        <div class="field"><label for="mWh">Warehouse</label><select class="input" id="mWh"></select><div class="hint">Blank means no warehouse access.</div><div class="err hidden" data-err="mWh"></div></div>
        <div class="field"><label for="mRole">Role<span class="req">*</span></label><select class="input" id="mRole"></select><div class="err hidden" data-err="mRole"></div></div>
        ${field({ id: 'mFrom', label: 'Effective from', type: 'date', req: true, value: a.from, hint: 'Dates are inclusive, in the branch timezone.' })}
        ${field({ id: 'mTo', label: 'Effective to', type: 'date', value: a.to, hint: 'Blank = open-ended.' })}
        <label class="check full"><input type="checkbox" id="mDef" ${a.isDefault ? 'checked' : ''}> Make this the user's default context (each user has one default)</label>
        ${field({ id: 'mReason', label: 'Reason for change', type: 'textarea', req: true, full: true })}
        <div class="full" id="mCheck"></div></div>`,
      foot: `<span class="grow req-ref">MAP-02 · MAP-03 · MAP-13</span><button class="btn" data-close>Cancel</button><button class="btn primary" id="mSave">${existing ? 'Save assignment' : 'Grant access'}</button>`,
      onMount: (el, close) => {
        const s = id => $('#' + id, el);
        const opt = (list, val, ph) => `<option value="">${ph}</option>` + list.map(x => `<option value="${x[0]}" ${val === x[0] ? 'selected' : ''} ${x[2] ? 'disabled' : ''}>${esc(x[1])}</option>`).join('');
        function cascade() {
          s('mCo').innerHTML = opt(db.companies.map(c => [c.id, c.code + ' · ' + c.name + (c.status !== 'Active' ? ' (inactive)' : ''), c.status !== 'Active']), a.companyId, 'Select company');
          s('mBr').innerHTML = opt(db.branches.filter(b => b.companyId === a.companyId).map(b => [b.id, b.name + (b.status !== 'Active' ? ' (inactive)' : ''), b.status !== 'Active']), a.branchId, a.companyId ? 'Select branch' : 'Select company first');
          s('mDp').innerHTML = opt(db.departments.filter(d => d.branchId === a.branchId).map(d => [d.id, d.code + ' · ' + d.name + (d.status !== 'Active' ? ' (inactive)' : ''), d.status !== 'Active']), a.deptId, a.branchId ? 'Select department' : 'Select branch first');
          const dep = L.dept(a.deptId);
          s('mCl').innerHTML = opt((dep ? dep.clinicIds : []).map(id => [id, L.clName(id) + (L.clinic(id).status !== 'Active' ? ' (inactive)' : ''), L.clinic(id).status !== 'Active']), a.clinicId || '', dep && dep.clinicIds.length ? 'No clinic' : 'Department has no clinic links');
          s('mWh').innerHTML = opt(db.warehouses.filter(w => w.branchId === a.branchId).map(w => [w.id, w.code + ' · ' + w.name + (w.status !== 'Active' ? ' (inactive)' : ''), w.status !== 'Active']), a.warehouseId || '', 'No warehouse');
          s('mRole').innerHTML = opt(db.roles.filter(r => r.scope === 'System' || r.companyId === a.companyId).map(r => [r.id, r.code + ' · ' + r.name + (r.status !== 'Active' ? ' (inactive)' : r.privileged && !privOk ? ' (beyond your grant authority)' : ''), r.status !== 'Active' || (r.privileged && !privOk)]), a.roleId, 'Select role');
          check();
        }
        function check() {
          const u = L.user(s('mUser').value || a.userId);
          const same = db.assignments.filter(x => x.id !== a.id && x.userId === (u || {}).id && x.status === 'Active' && ctxKey(x) === ctxKey(a));
          s('mCheck').innerHTML = u && a.deptId ? `<div class="banner info">${icon('info')}<span>Context: <b>${esc(tupleText(a))}</b>. ${same.length ? `${u.displayName} already has ${same.length} role(s) here: ${esc(same.map(x => L.rName(x.roleId)).join(', '))}. Their actions combine only within this exact context.` : 'No other role in this exact context.'}</span></div>` : '';
        }
        // Changing a parent clears incompatible children (ADM-08, MAP-10)
        s('mUser').addEventListener('change', () => { a.userId = s('mUser').value; check(); });
        s('mCo').addEventListener('change', () => { a.companyId = s('mCo').value; a.branchId = a.deptId = a.roleId = ''; a.clinicId = a.warehouseId = null; cascade(); });
        s('mBr').addEventListener('change', () => { a.branchId = s('mBr').value; a.deptId = ''; a.clinicId = a.warehouseId = null; cascade(); });
        s('mDp').addEventListener('change', () => { a.deptId = s('mDp').value; a.clinicId = null; cascade(); });
        s('mCl').addEventListener('change', () => { a.clinicId = s('mCl').value || null; check(); });
        s('mWh').addEventListener('change', () => { a.warehouseId = s('mWh').value || null; check(); });
        s('mRole').addEventListener('change', () => { a.roleId = s('mRole').value; });
        cascade();
        s('mSave').addEventListener('click', () => {
          const errs = {}; a.userId = s('mUser').value || a.userId; a.from = s('mFrom').value; a.to = s('mTo').value; a.isDefault = s('mDef').checked;
          const reason = s('mReason').value.trim();
          if (!a.userId) errs.mUser = 'Select the user.';
          if (!a.companyId) errs.mCo = 'Select the company.';
          if (!a.branchId) errs.mBr = 'Select the branch.';
          if (!a.deptId) errs.mDp = 'Select the department.';
          if (!a.roleId) errs.mRole = 'Select the role.';
          if (!a.from) errs.mFrom = 'Effective from is required.';
          if (a.to && a.from && a.to < a.from) errs.mTo = 'Effective to must be on or after effective from.';
          if (!reason) errs.mReason = 'A reason is required.';
          // MAP-02: revalidate ownership on save, never rely on the dropdowns.
          const b = L.branch(a.branchId), d = L.dept(a.deptId), w = a.warehouseId && L.wh(a.warehouseId), r = L.role(a.roleId);
          if (b && b.companyId !== a.companyId) errs.mBr = 'Branch does not belong to the company.';
          if (d && d.branchId !== a.branchId) errs.mDp = 'Department does not belong to the branch.';
          if (a.clinicId && d && !d.clinicIds.includes(a.clinicId)) errs.mCl = 'Clinic is not linked to this department.';
          if (w && w.branchId !== a.branchId) errs.mWh = 'Warehouse must belong to the same branch.';
          if (r && r.scope === 'Company' && r.companyId !== a.companyId) errs.mRole = 'This company role cannot be used in another company.';
          const dup = db.assignments.find(x => x.id !== a.id && x.userId === a.userId && x.roleId === a.roleId && x.status === 'Active' && ctxKey(x) === ctxKey(a) && overlaps(x, a));
          if (dup) errs.mRole = `Duplicate: the same role already exists for this exact context from ${fmtDate(dup.from)}${dup.to ? ' to ' + fmtDate(dup.to) : ''}.`;
          if (!showErrors(el, errs)) return;
          const rec = existing || { id: uid('as'), status: 'Active' };
          const before = Object.assign({}, rec);
          if (a.isDefault) db.assignments.filter(x => x.userId === a.userId && x.id !== rec.id).forEach(x => x.isDefault = false);
          Object.assign(rec, a, { grantor: me().displayName, reason, at: nowStamp() });
          if (!existing) db.assignments.push(rec);
          save();
          audit(existing ? 'Assignment edited' : 'Assignment granted', 'Access mapping', { id: rec.id, label: `${L.user(rec.userId).login} / ${tupleText(rec, true)} / ${r.code}` },
            existing ? [['Effective from', before.from, rec.from], ['Effective to', before.to || 'open', rec.to || 'open'], ['Default', before.isDefault ? 'Yes' : 'No', rec.isDefault ? 'Yes' : 'No']].filter(c => c[1] !== c[2]) : [['Role', '', r.name], ['Context', '', tupleText(rec, true)], ['Effective from', '', rec.from]], { reason });
          audit(existing ? 'Assignment edited' : 'Assignment granted', 'User', { id: rec.userId, label: L.user(rec.userId).login }, [['Assignment', '', `${tupleText(rec, true)} / ${r.code}`]], { reason });
          close(); toast(existing ? 'Assignment saved' : `Access granted. It authorizes from ${fmtDate(rec.from)}.`); onDone && onDone();
        });
      } });
  }

  /* MAP-08 */
  function revoke(a, onDone) {
    confirm({ title: 'Revoke this assignment?', body: `${esc(L.uName(a.userId))} loses <b>${esc(L.rName(a.roleId))}</b> in ${esc(tupleText(a))}.`,
      impact: ['Stops authorizing on the next protected request', 'A context switch cannot restore it', 'Grant and revocation history is kept', a.isDefault ? 'This is the default context: the user will be asked to choose another one' : null].filter(Boolean),
      reason: true, confirm: 'Revoke',
      onConfirm: (reason) => { a.status = 'Inactive'; a.revokedAt = nowStamp(); a.revokedBy = me().displayName; a.revokeReason = reason; save();
        audit('Assignment revoked', 'Access mapping', { id: a.id, label: `${L.user(a.userId).login} / ${tupleText(a, true)} / ${L.role(a.roleId).code}` }, [['Status', 'Active', 'Revoked']], { reason });
        audit('Assignment revoked', 'User', { id: a.userId, label: L.user(a.userId).login }, [['Assignment', `${tupleText(a, true)} / ${L.role(a.roleId).code}`, 'Revoked']], { reason });
        toast('Assignment revoked'); onDone && onDone(); } });
  }

  /* MAP-07 */
  function effective(userId, ctx) {
    const asg = db.assignments.filter(a => a.userId === userId && ctxKey(a) === ctxKey(ctx));
    const perms = permsFor(userId, ctx);
    const src = {};
    asg.filter(a => assignmentUsable(a).ok).forEach(a => Object.entries(L.role(a.roleId).perms).forEach(([o, acts]) => acts.forEach(k => { (src[o + '|' + k] = src[o + '|' + k] || []).push(L.role(a.roleId).code); })));
    const rows = Object.entries(perms).map(([o, acts]) => [UI.optionById(o), acts]);
    const blocked = asg.filter(a => !assignmentUsable(a).ok);
    drawer({ title: 'Effective permissions', sub: `${esc(L.uName(userId))} · ${esc(tupleText(ctx))}`, wide: true,
      body: `${blocked.length ? `<div class="banner warn" style="margin-bottom:12px">${icon('triangle-alert')}<span>${blocked.length} assignment(s) in this context do not authorize now: ${blocked.map(a => esc(L.rName(a.roleId) + ' (' + assignmentUsable(a).why + ')')).join(', ')}.</span></div>` : ''}
        ${rows.length ? `<table class="tbl"><thead><tr><th>Module</th><th>Screen</th><th>Allowed actions and source role</th></tr></thead><tbody>${rows.map(([o, acts]) => `<tr><td>${esc((db.modules.find(m => m.id === o.moduleId) || {}).name)}</td><td><b>${esc(o.name)}</b></td><td><div class="chips">${acts.map(k => `<span class="chip" title="${esc((src[o.id + '|' + k] || []).join(', '))}">${esc(db.ACTIONS[k])} <span class="small muted">${esc((src[o.id + '|' + k] || []).join(', '))}</span></span>`).join('')}</div></td></tr>`).join('')}</tbody></table>`
        : `<div class="empty">${icon('lock')}<b>No permissions in this context</b><span>The user would see the "no authorized modules" message here.</span></div>`}
        <div class="small muted" style="margin-top:10px">Only roles from assignments with exactly this tuple are combined. Warehouse screens need an assignment with a warehouse.</div>` });
  }

  window.Mapping = { assignmentDrawer, revoke, effective };
})();
