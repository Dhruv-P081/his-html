/* Radiology module helpers (window.Rad). Load after kit.js and lab.js on radiology pages. */
(function () {
  const { db, save, esc, fmtDate, nowStamp } = window.UI;
  /* Apply the seeded radiology workflow fields once to a stored database created before data-radiology.js was loaded. */
  if (db.radiologyOrderPatch && !db.radiologyOrderPatchDone) {
    (db.orders || []).forEach(o => { const p = db.radiologyOrderPatch[o.id]; if (p && o.type === 'rad') Object.assign(o, JSON.parse(JSON.stringify(p))); });
    db.radiologyOrderPatchDone = true; save();
  }
  const orders = () => (db.orders || []).filter(o => o.type === 'rad');
  const exam = (code) => (db.radExams || []).find(x => x.code === code) || { code, name: code, modality: 'Other', bodyPart: '', price: 0 };
  const acc = (o) => 'R' + String(o.no || o.id).replace(/\D/g, '');
  const STAGES = [['new', 'New', 'b-info'], ['scheduled', 'Scheduled', 'b-info'], ['performed', 'To report', 'b-warn'], ['reported', 'To verify', 'b-warn'], ['verified', 'To approve', 'b-violet'], ['final', 'Approved', 'b-ok'], ['rejected', 'Rejected', 'b-err'], ['cancelled', 'Cancelled', 'b-err']];
  function stageKey(o) {
    switch (o.status) {
      case 'Ordered': return 'new';
      case 'Scheduled': return 'scheduled';
      case 'Performed': return 'performed';
      case 'Reported': return o.report && o.report.verifiedAt ? 'verified' : 'reported';
      case 'Approved': return 'final';
      case 'Rejected': return 'rejected';
      case 'Cancelled': return 'cancelled';
      default: return 'new';
    }
  }
  const stageBadge = (o) => { const s = STAGES.find(x => x[0] === stageKey(o)); return `<span class="badge ${s[2]}">${esc(s[1])}</span>${o.report && o.report.draft && o.status === 'Performed' ? ' <span class="badge b-neutral nodot">Draft</span>' : ''}${o.report && o.report.critical ? ' <span class="flag-c">Critical</span>' : ''}`; };
  const isOpen = (o) => !/Approved|Rejected|Cancelled/.test(o.status);
  /* Report TAT target by priority (order to approved report). */
  const target = (o) => (o.priority === 'STAT' ? 1 : o.priority === 'Urgent' ? 4 : 24) * 60;
  function tat(o) {
    const used = o.report && o.report.approvedAt ? Math.max(0, window.Lab.mins(o.orderedAt, o.report.approvedAt)) : isOpen(o) ? window.Lab.clockMins(o.orderedAt) : 0, t = target(o);
    return { target: t, used, pct: used / t, late: used > t, done: !!(o.report && o.report.approvedAt) };
  }
  function tatCell(o) {
    if (/Rejected|Cancelled/.test(o.status)) return '<span class="mute">-</span>';
    const t = tat(o), tone = t.late ? 'err' : t.pct > 0.75 ? 'warn' : 'ok', d = window.Lab.dur;
    return `<div style="min-width:104px;white-space:nowrap"><div class="small ${t.late ? 'flag-h' : ''}">${d(t.used)} <span class="mute">/ ${d(t.target)}</span></div><div class="progress ${tone}" style="margin-top:4px"><i style="width:${Math.min(100, Math.max(4, Math.round(t.pct * 100)))}%"></i></div></div>`;
  }
  const MOD_ICON = { 'X-ray': 'scan-line', Ultrasound: 'audio-waveform', CT: 'circle-dot', MRI: 'magnet', Mammography: 'scan-face' };
  const modTag = (m) => `<span class="tag">${window.UI.icon(MOD_ICON[m] || 'scan')} ${esc(m)}</span>`;
  function prepFor(o) {
    const list = (db.radiologyPrep || []).filter(p => p.status !== 'Inactive');
    return list.find(p => String(p.exams || '').split(/[,\s]+/).includes(o.code)) || list.find(p => p.modality === exam(o.code).modality) || null;
  }
  const templatesFor = (o) => { const ex = exam(o.code); const l = (db.radiologyTemplates || []).filter(t => t.status !== 'Inactive'); return l.filter(t => t.modality === ex.modality).sort((a, b) => (b.bodyPart === ex.bodyPart) - (a.bodyPart === ex.bodyPart)); };
  const side = (o) => o.laterality || (exam(o.code).laterality ? 'Right' : '');

  function instructionsHtml(o, prep) {
    const p = window.Kit.pt(o.patientId) || {}, ex = exam(o.code);
    return `<div style="font-weight:800;font-size:14px;margin-bottom:6px">Preparation for your ${esc(ex.name)}</div>
      <div style="font-size:12px;margin-bottom:10px"><b>Patient:</b> ${esc(p.name || '')} · ${esc(p.mrn || '')}${o.scheduledAt ? ` · <b>Appointment:</b> ${esc(fmtDate(o.scheduledAt))}, ${esc(o.room || 'Radiology')}` : ''}</div>
      ${prep ? `${prep.fasting ? `<div style="padding:8px 10px;background:#FDF1DC;border-radius:6px;margin-bottom:8px"><b>Fasting:</b> do not eat for ${esc(prep.fasting)} hours before the exam.</div>` : ''}<div style="font-size:13px;line-height:1.6">${esc(prep.instructions)}</div>` : '<div>No special preparation is needed.</div>'}
      <ul style="font-size:12px;margin-top:12px;line-height:1.6"><li>Arrive 15 minutes early and bring your Civil ID and insurance card.</li><li>Tell the staff if you are or might be pregnant.</li><li>Radiology reception: +965 2222 4400 (Sunday to Thursday, 7:30 to 21:00).</li></ul>`;
  }

  function reportHtml(o) {
    const p = window.Kit.pt(o.patientId) || {}, ex = exam(o.code), e = window.Kit.enc(o.encounterId) || {}, r = o.report || {};
    const final = o.status === 'Approved';
    const block = (t, v) => v ? `<div style="margin-top:10px"><div style="font-weight:800;font-size:11px;letter-spacing:.08em;color:#555">${t}</div><div style="font-size:12.5px;line-height:1.55;white-space:pre-wrap">${esc(v)}</div></div>` : '';
    return `<div style="text-align:center;font-weight:800;font-size:13px;letter-spacing:.12em;margin:-2px 0 10px">DEPARTMENT OF RADIOLOGY AND MEDICAL IMAGING</div>
      <table style="width:100%;border-collapse:collapse;font-size:11.5px;margin-bottom:10px"><tr>
        <td style="padding:3px 0;width:50%"><b>Patient:</b> ${esc(p.name || '')}<br><b>MRN:</b> ${esc(p.mrn || '')} · <b>Civil ID:</b> ${esc(p.civilId || '-')}<br><b>Sex / age:</b> ${esc(window.Kit.sexAge(p))}</td>
        <td style="padding:3px 0"><b>Accession:</b> ${esc(acc(o))} · <b>Order:</b> ${esc(o.no)}<br><b>Referred by:</b> ${esc(window.Kit.docName(o.by))} · ${esc(e.type || 'OPD')} ${esc(e.no || '')}<br><b>Exam date:</b> ${esc(fmtDate(o.performedAt || ''))} · ${esc(o.room || '')}</td></tr></table>
      <div style="font-weight:800;font-size:14px;border-bottom:1px solid #ccc;padding-bottom:6px">${esc(ex.name)}${side(o) ? ' (' + esc(side(o)) + ')' : ''} <span style="font-weight:600;color:#666;font-size:12px">${esc(ex.modality)}</span> ${final ? '' : '<span style="color:#A55A06;font-size:11px">PRELIMINARY, NOT APPROVED</span>'}</div>
      ${r.critical ? `<div style="margin-top:10px;padding:8px 10px;border:1px solid #C0261B;border-radius:6px;color:#C0261B;font-weight:700">Critical finding: ${esc(r.criticalText || '')}</div>` : ''}
      ${block('CLINICAL INFORMATION', o.notes || window.Kit.enc(o.encounterId) && window.Kit.enc(o.encounterId).complaint || '')}${block('TECHNIQUE', r.technique)}${block('FINDINGS', r.findings)}${block('IMPRESSION', r.impression)}
      ${r.attachment ? `<div style="margin-top:8px;font-size:11px;color:#555">Attachment: ${esc(r.attachment.name)}</div>` : ''}
      <div style="display:flex;justify-content:space-between;gap:16px;margin-top:22px;padding-top:10px;border-top:1px solid #ccc;font-size:11.5px">
        <div>Reported by: <b>${esc(r.author || '-')}</b><br>Verified by: <b>${esc(r.verifiedBy || '-')}</b></div>
        <div style="text-align:end">${final ? `<span style="font-family:'Brush Script MT',cursive;font-size:20px;color:#16325C">${esc((r.approvedBy || '').replace(/^Dr\.\s*/, ''))}</span><br>Electronically signed by <b>${esc(r.signature || r.approvedBy || '')}</b><br>${esc(fmtDate(r.approvedAt || ''))}` : '<b style="color:#A55A06">Awaiting radiologist approval</b>'}</div></div>
      <div style="margin-top:10px;font-size:10px;color:#777">Images are available in the hospital PACS. Electronically signed reports are valid without a handwritten signature.</div>`;
  }

  window.Rad = { orders, exam, acc, STAGES, stageKey, stageBadge, isOpen, tat, tatCell, modTag, prepFor, templatesFor, side, instructionsHtml, reportHtml };
})();
