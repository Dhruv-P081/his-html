/* Radiology (RIS, SOW V4 Module 6) seed data. Loaded after data-core.js.
 * Own keys (prefix rad): radiologyTemplates, radiologyRejectReasons, radiologyPrep, radiologyBodyParts, radiologyCalls, radiologyDispatch.
 * Shared keys it works on (as data-core.js allows): orders (type 'rad') status and radiology workflow fields:
 *   acceptedAt/By, scheduledAt, room, performedAt/By, contrastGiven, repeats, report { templateId, technique, findings, impression,
 *   critical, criticalText, attachment, author, authoredAt, verifiedBy, verifiedAt, approvedBy, approvedAt, signature },
 *   rejectReason, cancelReason. Statuses: Ordered, Scheduled, Performed, Reported, Approved (+ Rejected, Cancelled). */
(function () {
  const S = window.SEED, T = S.TODAY;
  const pad = (n, w) => String(n).padStart(w || 2, '0');
  const addDays = (d, n) => { const x = new Date(d + 'T00:00:00'); x.setDate(x.getDate() + n); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };
  const plusMin = (s, m) => { const d = new Date(s.replace(' ', 'T')); d.setMinutes(d.getMinutes() + m); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };

  const radiologyTemplates = [
    ['TPL-CXR-N', 'Chest X-ray, normal', 'X-ray', 'Chest', 'Single PA erect view of the chest.', 'The lungs are clear. No focal consolidation, pleural effusion or pneumothorax. Cardiomediastinal silhouette is within normal limits. Bony thorax is intact.', 'Normal chest radiograph.'],
    ['TPL-XR-KN', 'Knee X-ray', 'X-ray', 'Knee', 'AP and lateral views of the knee.', 'No acute fracture or dislocation. Joint spaces are preserved. No joint effusion. Soft tissues are unremarkable.', 'No acute bony abnormality.'],
    ['TPL-US-AB', 'Ultrasound abdomen', 'Ultrasound', 'Abdomen', 'Real-time grey-scale and colour Doppler ultrasound of the abdomen.', 'Liver is normal in size and echotexture with no focal lesion. Gallbladder is well distended with no calculi. CBD is not dilated. Pancreas, spleen and both kidneys are unremarkable. No free fluid.', 'Normal abdominal ultrasound.'],
    ['TPL-US-OB', 'Obstetric ultrasound', 'Ultrasound', 'Pelvis', 'Transabdominal obstetric ultrasound.', 'Single live intrauterine pregnancy. Foetal heart rate [ ] bpm. Biometry consistent with [ ] weeks [ ] days. Placenta [ ], not low lying. Liquor volume normal.', 'Single live intrauterine pregnancy, growth appropriate for dates.'],
    ['TPL-CT-HD', 'CT head without contrast', 'CT', 'Head', 'Axial CT images of the brain without intravenous contrast.', 'No intracranial haemorrhage, mass effect or midline shift. Grey-white matter differentiation is preserved. Ventricles and sulci are normal for age. No skull fracture.', 'No acute intracranial abnormality.'],
    ['TPL-CT-AP', 'CT abdomen and pelvis with contrast', 'CT', 'Abdomen', 'Axial CT of the abdomen and pelvis after intravenous contrast (portal venous phase), with coronal reformats.', 'Solid organs enhance normally. No lymphadenopathy. Bowel loops are of normal calibre. No free fluid or free air. Urinary bladder is unremarkable.', 'No acute abdominal or pelvic abnormality.'],
    ['TPL-MR-KN', 'MRI knee', 'MRI', 'Knee', 'Multiplanar multisequence MRI of the knee without contrast.', 'Menisci: [ ]. Cruciate ligaments are intact. Collateral ligaments are intact. Articular cartilage is preserved. No bone marrow oedema. Small physiological joint fluid.', '[ ]'],
    ['TPL-MR-BR', 'MRI brain', 'MRI', 'Head', 'Multiplanar multisequence MRI of the brain including DWI.', 'No restricted diffusion. No space-occupying lesion. Ventricles are normal in size. No abnormal signal in the brain parenchyma. Major intracranial flow voids are preserved.', 'Normal MRI brain.'],
    ['TPL-MG', 'Mammography, BI-RADS', 'Mammography', 'Breast', 'Bilateral CC and MLO digital mammography views.', 'Breast composition: ACR category [ ]. No suspicious mass, architectural distortion or suspicious calcifications. Axillae are unremarkable.', 'BI-RADS 1: Negative. Routine screening recommended.'],
  ].map(([code, name, modality, bodyPart, technique, findings, impression], i) => ({ id: 'rt_' + pad(i + 1), code, name, modality, bodyPart, technique, findings, impression, status: 'Active' }));

  const radiologyRejectReasons = [
    ['DUP', 'Duplicate request', 'Reject'], ['WRONG', 'Incorrect exam requested for the clinical question', 'Reject'],
    ['NOINFO', 'Insufficient clinical information', 'Reject'], ['PREG', 'Pregnancy not excluded', 'Reject'],
    ['CONTR', 'Contrast allergy or renal function not cleared', 'Reject'], ['MRSAFE', 'MRI safety screening failed (implant)', 'Reject'],
    ['MOTION', 'Patient motion', 'Repeat'], ['POSIT', 'Positioning error', 'Repeat'], ['EXPO', 'Exposure error', 'Repeat'], ['ARTEF', 'Artefact (metal or jewellery)', 'Repeat'],
  ].map(([code, name, type], i) => ({ id: 'rj_' + pad(i + 1), code, name, type, status: 'Active' }));

  const radiologyPrep = [
    ['PREP-XR', 'Plain X-ray', 'X-ray', 'XR-CH, XR-KN, XR-WR', 0, 'Remove jewellery, metal objects and clothing with metal over the area. Tell the technologist if you might be pregnant.'],
    ['PREP-USAB', 'Ultrasound abdomen', 'Ultrasound', 'US-AB', 6, 'Do not eat for 6 hours before the scan. You may drink small amounts of water. Take your usual medicines with a sip of water.'],
    ['PREP-USPL', 'Ultrasound pelvis', 'Ultrasound', 'US-PL', 0, 'Drink 1 litre of water one hour before the scan and do not empty your bladder until the scan is finished.'],
    ['PREP-USOB', 'Obstetric ultrasound', 'Ultrasound', 'US-OB', 0, 'Drink 2 to 3 glasses of water one hour before the scan (first trimester). Bring your antenatal card.'],
    ['PREP-CTC', 'CT with contrast', 'CT', 'CT-AB', 4, 'Do not eat for 4 hours before the scan. A recent creatinine (within 30 days) is needed. Stop metformin for 48 hours after the scan if advised by your doctor. Tell us about any allergy to iodine contrast.'],
    ['PREP-CTNC', 'CT without contrast', 'CT', 'CT-HD', 0, 'No special preparation. Remove hairpins, earrings and dentures before a head scan.'],
    ['PREP-CTCA', 'CT coronary angiography', 'CT', 'CT-CA', 4, 'No caffeine, tea or energy drinks for 12 hours. Do not eat for 4 hours. Your heart rate may be slowed with medicine before the scan. Bring a list of your medicines.'],
    ['PREP-MR', 'MRI (all)', 'MRI', 'MR-KN, MR-BR', 0, 'Complete the MRI safety form. Tell us about pacemakers, implants, metal fragments or recent surgery. Remove all metal, cards and watches. The scan takes 30 to 45 minutes.'],
    ['PREP-MG', 'Mammography', 'Mammography', 'MG-BL', 0, 'Do not use deodorant, powder or lotion on the breasts or underarms on the day. Book 7 to 10 days after the start of your period if possible. Bring previous mammograms.'],
  ].map(([code, name, modality, exams, fasting, instructions], i) => ({ id: 'rp_' + pad(i + 1), code, name, modality, exams, fasting, instructions, status: 'Active' }));

  const radiologyBodyParts = [
    ['HEAD', 'Head and brain', 'Head and neck', false, 'Axial, coronal'], ['NECK', 'Neck and soft tissues', 'Head and neck', false, 'AP, lateral'],
    ['CHEST', 'Chest', 'Thorax', false, 'PA, lateral'], ['BREAST', 'Breast', 'Thorax', true, 'CC, MLO'], ['ABD', 'Abdomen', 'Abdomen and pelvis', false, 'Supine, erect'],
    ['PELV', 'Pelvis', 'Abdomen and pelvis', false, 'AP'], ['CSPINE', 'Cervical spine', 'Spine', false, 'AP, lateral, odontoid'], ['LSPINE', 'Lumbar spine', 'Spine', false, 'AP, lateral'],
    ['SHOULD', 'Shoulder', 'Upper limb', true, 'AP, axial, Y-view'], ['WRIST', 'Wrist', 'Upper limb', true, 'PA, lateral, scaphoid'], ['HIP', 'Hip', 'Lower limb', true, 'AP, frog lateral'], ['KNEE', 'Knee', 'Lower limb', true, 'AP, lateral, skyline'],
  ].map(([code, name, region, laterality, views], i) => ({ id: 'rb_' + pad(i + 1), code, name, region, laterality, views, status: 'Active' }));

  /* ---------- Workflow fields on the seeded radiology orders ---------- */
  const tplFor = (code) => { const ex = S.radExams.find(x => x.code === code) || {}; return radiologyTemplates.find(t => t.modality === ex.modality && t.bodyPart === ex.bodyPart) || radiologyTemplates.find(t => t.modality === ex.modality); };
  const rooms = { 'X-ray': 'X-ray Room 1', Ultrasound: 'US Room 2', CT: 'CT Suite', MRI: 'MRI Suite', Mammography: 'Mammo Room' };
  const techs = ['Bilal Qureshi', 'Rania Khalil', 'Vinod Menon'];
  const st = ['Ordered', 'Scheduled', 'Performed', 'Reported', 'Approved'];
  const radOrders = S.orders.filter(o => o.type === 'rad');
  const snap = {}; radOrders.forEach(o => { snap[o.id] = JSON.parse(JSON.stringify(o)); });
  radOrders.forEach((o, i) => {
    const k = st.indexOf(o.status), ex = S.radExams.find(x => x.code === o.code) || {};
    if (k >= 1) { o.acceptedAt = plusMin(o.orderedAt, 6); o.acceptedBy = 'Rania Khalil'; o.scheduledAt = plusMin(o.orderedAt, 40 + (i % 3) * 20); o.room = rooms[ex.modality] || 'Radiology'; }
    if (k >= 2) { o.performedAt = plusMin(o.scheduledAt, 10); o.performedBy = techs[i % 3]; o.contrastGiven = !!ex.contrast; o.repeats = i % 4 === 0 ? [{ code: 'MOTION', reason: 'Patient motion', at: o.performedAt }] : []; }
    if (k >= 3) {
      const t = tplFor(o.code) || {};
      const FILL = { 'TPL-MG': ['B (scattered fibroglandular density)'], 'TPL-US-OB': ['148', '22', '3', 'posterior'], 'TPL-MR-KN': ['Medial and lateral menisci are intact', 'No internal derangement of the knee.'] };
      const fill = (txt) => { const q = (FILL[t.code] || []).slice(); return String(txt || '').replace(/\[ \]/g, () => q.shift() || 'normal'); };
      o.report = { templateId: t.id, technique: t.technique, findings: fill(t.findings), impression: fill(t.impression), critical: false, criticalText: '', attachment: null,
        author: 'Dr. Sana Rizvi', authoredAt: plusMin(o.performedAt, 45) };
    }
    if (k === 4) Object.assign(o.report, { verifiedBy: 'Dr. Omar Kassem', verifiedAt: plusMin(o.report.authoredAt, 20), approvedBy: 'Dr. Mahmoud Saleh', approvedAt: plusMin(o.report.authoredAt, 35), signature: 'Dr. Mahmoud Saleh, Consultant Radiologist' });
  });
  // One reported study already verified (waiting for consultant approval), one with a critical finding
  const rep = radOrders.filter(o => o.status === 'Reported');
  if (rep[0]) Object.assign(rep[0].report, { verifiedBy: 'Dr. Omar Kassem', verifiedAt: plusMin(rep[0].report.authoredAt, 15) });
  const ctHead = radOrders.find(o => o.code === 'CT-AB' && o.patientId === 'pt_001');
  if (ctHead) {
    ctHead.priority = 'Urgent';
    ctHead.status = 'Reported';
    Object.assign(ctHead, { scheduledAt: T + ' 14:30', performedAt: T + ' 14:52', room: 'CT Suite' });
    const t = tplFor('CT-AB');
    ctHead.report = { templateId: t.id, technique: t.technique, findings: 'Free intraperitoneal air under the diaphragm and adjacent to the gastric antrum. Moderate free fluid in the pelvis. Thickened gastric antral wall. No bowel obstruction.', impression: 'Pneumoperitoneum, likely perforated peptic ulcer. Urgent surgical review.', critical: true, criticalText: 'Pneumoperitoneum (free air), suspected viscus perforation', attachment: null, author: 'Dr. Sana Rizvi', authoredAt: T + ' 15:40' };
  }
  const usAb = radOrders.find(o => o.status === 'Approved' && o.code === 'US-AB');
  if (usAb) Object.assign(usAb.report, { critical: true, criticalText: 'Acute cholecystitis with gallbladder wall thickening and pericholecystic fluid', findings: 'Distended gallbladder with multiple calculi, the largest 14 mm impacted at the neck. Wall thickened to 6 mm with pericholecystic fluid. Positive sonographic Murphy sign. CBD 5 mm.', impression: 'Acute calculous cholecystitis.' });
  // One rejected request
  const mg = radOrders.find(o => o.status === 'Ordered' && o.code === 'MG-BL');
  if (mg) Object.assign(mg, { status: 'Rejected', rejectCode: 'DUP', rejectReason: 'Duplicate request: screening mammogram done 3 months ago at this hospital', rejectedBy: 'Rania Khalil', rejectedAt: plusMin(mg.orderedAt, 20) });

  const radiologyCalls = [];
  if (usAb) radiologyCalls.push({ id: 'rc_01', orderId: usAb.id, finding: usAb.report.criticalText, at: plusMin(usAb.report.approvedAt, 6), by: 'Dr. Mahmoud Saleh', to: (S.doctors.find(d => d.id === usAb.by) || {}).name || 'Treating doctor', role: 'Treating doctor', phone: 'Ext. 4120', outcome: 'Reached', readBack: true, notes: 'Surgical referral requested by the doctor.', kind: 'Call' });
  [[-1, 'pt_016', 'CT-HD', 'Acute subdural haematoma, 9 mm, with midline shift', 'Dr. Aisha Al-Mansour', 9], [-3, 'pt_025', 'XR-CH', 'Large right tension pneumothorax', 'Dr. Aisha Al-Mansour', 6], [-6, 'pt_037', 'US-PL', 'Ectopic pregnancy with haemoperitoneum', 'Dr. Priya Nair', 12]]
    .forEach(([d, pt, test, finding, to, mins], i) => radiologyCalls.push({ id: 'rc_' + pad(i + 2), orderId: null, patientId: pt, test, finding, at: `${addDays(T, d)} ${pad(11 + i * 2)}:${pad(12 + i * 7)}`, by: 'Dr. Mahmoud Saleh', to, role: 'Treating doctor', phone: 'Ext. ' + (4300 + i * 11), outcome: 'Reached', readBack: true, notes: '', kind: 'Call', minsToNotify: mins }));

  const radiologyDispatch = [];
  radOrders.filter(o => o.status === 'Approved').forEach((o, i) => {
    const p = S.patients.find(x => x.id === o.patientId) || {};
    radiologyDispatch.push({ id: 'rd_' + pad(radiologyDispatch.length + 1), orderId: o.id, channel: 'Patient app', to: p.mobile || p.mrn, at: plusMin(o.report.approvedAt, 3), by: 'System (auto-release)', status: 'Delivered', note: '' });
    if (i === 0) radiologyDispatch.push({ id: 'rd_' + pad(radiologyDispatch.length + 1), orderId: o.id, channel: 'Referring doctor', to: (S.doctors.find(d => d.id === o.by) || {}).name || '', at: plusMin(o.report.approvedAt, 3), by: 'System (auto-release)', status: 'Delivered', note: 'EMR inbox' });
  });

  /* Kept as a patch too, applied once by radiology.js when the stored database was created without this file. */
  const radiologyOrderPatch = {};
  radOrders.forEach(o => { const b = snap[o.id], d = {}; Object.keys(o).forEach(k => { if (JSON.stringify(o[k]) !== JSON.stringify(b[k])) d[k] = o[k]; }); if (Object.keys(d).length) radiologyOrderPatch[o.id] = d; });
  Object.assign(S, { radiologyOrderPatch, radiologyTemplates, radiologyRejectReasons, radiologyPrep, radiologyBodyParts, radiologyCalls, radiologyDispatch });
})();
