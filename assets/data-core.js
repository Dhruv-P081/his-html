/* Shared hospital data for every module of the prototype (dummy data only).
 * Loaded after data.js and before the module data files. Adds keys to window.SEED.
 *
 * Keys and owners (other modules read them; only the owner adds module-specific keys):
 *   doctors, nurses, patients, payers, plans, services, icd10       shared directories
 *   encounters (OPD, ER, IPD visits)                                 Reception creates, all read
 *   wards, beds                                                      Reception (ADT) and Nursing
 *   labTests, radExams                                               catalogues (Lab, Radiology masters)
 *   orders (lab, radiology, medication, diet, care)                  EMR creates; Lab, Radiology, Pharmacy, Nursing work them
 *   items, stock                                                     Pharmacy and Material Management
 *   vendors                                                          Material Management and Finance
 *   invoices                                                         Reception cashier, Pharmacy, Finance, Insurance
 *   vitals, allergiesMaster                                          EMR and Nursing
 */
(function () {
  const S = window.SEED;
  const TODAY = S.TODAY;                      // '2026-11-25'
  /* Deterministic pseudo-random numbers so the data is the same on every load. */
  let seed = 20261125;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pad = (n, w) => String(n).padStart(w || 2, '0');
  const addDays = (d, n) => { const x = new Date(d + 'T00:00:00'); x.setDate(x.getDate() + n); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };
  const at = (d, h, m) => `${d} ${pad(h)}:${pad(m)}`;

  /* ---------- Clinicians ---------- */
  const doctors = [
    { id: 'dr_01', userId: 'us_02', name: 'Dr. Khalid Al-Rashidi', specialty: 'Cardiology', clinicId: 'cl_01', deptId: 'dp_01', branchId: 'br_01', grade: 'Consultant', room: 'OPD 12', fee: 25, languages: ['Arabic', 'English'], admitting: true },
    { id: 'dr_02', userId: 'us_03', name: 'Dr. Noura Al-Enezi', specialty: 'Paediatrics', clinicId: 'cl_02', deptId: 'dp_02', branchId: 'br_01', grade: 'Specialist', room: 'OPD 4', fee: 20, languages: ['Arabic', 'English'], admitting: true },
    { id: 'dr_03', userId: 'us_14', name: 'Dr. James Miller', specialty: 'Cardiology', clinicId: 'cl_01', deptId: 'dp_01', branchId: 'br_01', grade: 'Consultant', room: 'OPD 14', fee: 30, languages: ['English'], admitting: true },
    { id: 'dr_04', userId: null, name: 'Dr. Hanan Al-Sabah', specialty: 'Internal Medicine', clinicId: 'cl_05', deptId: 'dp_01', branchId: 'br_01', grade: 'Consultant', room: 'OPD 8', fee: 25, languages: ['Arabic', 'English'], admitting: true },
    { id: 'dr_05', userId: null, name: 'Dr. Tariq Mahmoud', specialty: 'Orthopaedics', clinicId: 'cl_03', deptId: 'dp_01', branchId: 'br_01', grade: 'Specialist', room: 'OPD 9', fee: 20, languages: ['Arabic', 'English'], admitting: true },
    { id: 'dr_06', userId: null, name: 'Dr. Priya Nair', specialty: 'Obstetrics and Gynaecology', clinicId: 'cl_06', deptId: 'dp_01', branchId: 'br_01', grade: 'Consultant', room: 'OPD 6', fee: 30, languages: ['English', 'Hindi', 'Malayalam'], admitting: true },
    { id: 'dr_07', userId: null, name: 'Dr. Faisal Al-Otaibi', specialty: 'ENT', clinicId: 'cl_07', deptId: 'dp_01', branchId: 'br_01', grade: 'Specialist', room: 'OPD 11', fee: 20, languages: ['Arabic', 'English'], admitting: false },
    { id: 'dr_08', userId: null, name: 'Dr. Sameh Youssef', specialty: 'General Surgery', clinicId: 'cl_08', deptId: 'dp_01', branchId: 'br_01', grade: 'Consultant', room: 'OPD 15', fee: 30, languages: ['Arabic', 'English'], admitting: true },
    { id: 'dr_09', userId: null, name: 'Dr. Aisha Al-Mansour', specialty: 'Emergency Medicine', clinicId: null, deptId: 'dp_01', branchId: 'br_01', grade: 'Specialist', room: 'ER', fee: 15, languages: ['Arabic', 'English'], admitting: true },
    { id: 'dr_10', userId: 'us_13', name: 'Dr. Reem Al-Fadhli', specialty: 'Dermatology', clinicId: 'cl_04', deptId: 'dp_07', branchId: 'br_02', grade: 'Consultant', room: 'Hawalli 2', fee: 25, languages: ['Arabic', 'English'], admitting: false },
    { id: 'dr_11', userId: null, name: 'Dr. Mahmoud Saleh', specialty: 'Radiology', clinicId: null, deptId: 'dp_10', branchId: 'br_01', grade: 'Consultant', room: 'Radiology', fee: 0, languages: ['Arabic', 'English'], admitting: false },
    { id: 'dr_12', userId: null, name: 'Dr. Lina Haddad', specialty: 'Pathology', clinicId: null, deptId: 'dp_06', branchId: 'br_01', grade: 'Consultant', room: 'Laboratory', fee: 0, languages: ['Arabic', 'English', 'French'], admitting: false },
  ];
  const nurses = [
    { id: 'nu_01', userId: 'us_04', name: 'Maria Santos', grade: 'Charge Nurse', wardId: 'wd_01' },
    { id: 'nu_02', userId: null, name: 'Grace Fernandes', grade: 'Staff Nurse', wardId: 'wd_01' },
    { id: 'nu_03', userId: null, name: 'Anjali Menon', grade: 'Staff Nurse', wardId: 'wd_02' },
    { id: 'nu_04', userId: null, name: 'Joy Dela Cruz', grade: 'Staff Nurse', wardId: 'wd_03' },
    { id: 'nu_05', userId: null, name: 'Huda Al-Azmi', grade: 'Charge Nurse', wardId: 'wd_04' },
    { id: 'nu_06', userId: null, name: 'Mercy Thomas', grade: 'Staff Nurse', wardId: 'wd_02' },
  ];

  /* ---------- Payers ---------- */
  const payers = [
    { id: 'py_01', code: 'GIG', name: 'Gulf Insurance Group', type: 'Insurer', tpa: 'NAS Kuwait', status: 'Active', contact: 'claims@gig.example', creditDays: 45 },
    { id: 'py_02', code: 'WARBA', name: 'Warba Insurance', type: 'Insurer', tpa: 'Globemed Kuwait', status: 'Active', contact: 'medical@warba.example', creditDays: 60 },
    { id: 'py_03', code: 'KIC', name: 'Kuwait Insurance Company', type: 'Insurer', tpa: '', status: 'Active', contact: 'health@kic.example', creditDays: 45 },
    { id: 'py_04', code: 'AFYA', name: 'Afya (Retiree Health Insurance)', type: 'Government scheme', tpa: 'Gulf Insurance Group', status: 'Active', contact: 'afya@gov.example', creditDays: 90 },
    { id: 'py_05', code: 'KOC', name: 'KOC Corporate Account', type: 'Corporate', tpa: '', status: 'Active', contact: 'medical@koc.example', creditDays: 30 },
  ];
  const plans = [
    { id: 'pl_01', payerId: 'py_01', name: 'GIG Gold', copayPct: 10, deductible: 5, maxCopay: 20, limit: 25000, network: 'A', status: 'Active' },
    { id: 'pl_02', payerId: 'py_01', name: 'GIG Silver', copayPct: 20, deductible: 10, maxCopay: 30, limit: 10000, network: 'B', status: 'Active' },
    { id: 'pl_03', payerId: 'py_02', name: 'Warba Premium', copayPct: 0, deductible: 0, maxCopay: 0, limit: 50000, network: 'A', status: 'Active' },
    { id: 'pl_04', payerId: 'py_02', name: 'Warba Standard', copayPct: 15, deductible: 5, maxCopay: 25, limit: 15000, network: 'B', status: 'Active' },
    { id: 'pl_05', payerId: 'py_03', name: 'KIC Family', copayPct: 20, deductible: 5, maxCopay: 25, limit: 12000, network: 'B', status: 'Active' },
    { id: 'pl_06', payerId: 'py_04', name: 'Afya Retiree', copayPct: 0, deductible: 0, maxCopay: 0, limit: 30000, network: 'A', status: 'Active' },
    { id: 'pl_07', payerId: 'py_05', name: 'KOC Employees', copayPct: 0, deductible: 0, maxCopay: 0, limit: 0, network: 'A', status: 'Active' },
  ];

  /* ---------- Patients (Master Patient Index) ---------- */
  const male = ['Abdullah', 'Mohammed', 'Ahmad', 'Yousef', 'Fahad', 'Salem', 'Bader', 'Nasser', 'Hamad', 'Omar', 'Ali', 'Mishari', 'Rashed', 'Jassim', 'Ravi', 'Joseph', 'Imran', 'Sanjay', 'Mark', 'Hassan'];
  const female = ['Fatima', 'Maryam', 'Noura', 'Sara', 'Dana', 'Hessa', 'Latifa', 'Shaikha', 'Reem', 'Lulwa', 'Asma', 'Huda', 'Priya', 'Anna', 'Leah', 'Zainab', 'Amal', 'Rania', 'Mona', 'Jenny'];
  const family = ['Al-Ajmi', 'Al-Mutairi', 'Al-Enezi', 'Al-Shammari', 'Al-Kandari', 'Al-Rashidi', 'Al-Azmi', 'Al-Otaibi', 'Al-Hajri', 'Al-Dosari', 'Al-Sabah', 'Al-Fadhli', 'Bukhari', 'Pillai', 'Fernandes', 'Khan', 'Mathew', 'Hussain', 'Al-Saleh', 'Haddad'];
  const familyAr = { 'Al-Ajmi': 'العجمي', 'Al-Mutairi': 'المطيري', 'Al-Enezi': 'العنزي', 'Al-Shammari': 'الشمري', 'Al-Kandari': 'الكندري', 'Al-Rashidi': 'الرشيدي', 'Al-Azmi': 'العازمي', 'Al-Otaibi': 'العتيبي', 'Al-Hajri': 'الهاجري', 'Al-Dosari': 'الدوسري', 'Al-Sabah': 'الصباح', 'Al-Fadhli': 'الفضلي', 'Al-Saleh': 'الصالح' };
  const nat = ['Kuwaiti', 'Kuwaiti', 'Kuwaiti', 'Kuwaiti', 'Egyptian', 'Indian', 'Filipino', 'Syrian', 'Jordanian', 'Pakistani', 'Lebanese', 'British'];
  const allergyPool = ['Penicillin', 'Sulfa drugs', 'Aspirin', 'Latex', 'Peanuts', 'Iodine contrast', 'Codeine', 'Shellfish'];
  const chronicPool = ['Hypertension', 'Type 2 diabetes', 'Asthma', 'Hyperlipidaemia', 'Hypothyroidism', 'Chronic kidney disease stage 2', 'Atrial fibrillation', 'Osteoarthritis'];
  const areas = ['Salmiya', 'Hawalli', 'Jabriya', 'Mishref', 'Rumaithiya', 'Bayan', 'Surra', 'Kuwait City', 'Fahaheel', 'Farwaniya', 'Mangaf', 'Shuwaikh'];
  const patients = [];
  for (let i = 0; i < 64; i++) {
    const g = i % 2 === 0 ? 'Male' : 'Female';
    const first = g === 'Male' ? male[i % 20] : female[(i + 3) % 20];
    const fam = family[(i * 7) % 20];
    const age = i % 9 === 0 ? int(1, 12) : int(18, 84);
    const y = 2026 - age, mo = int(1, 12), d = int(1, 28);
    const n = nat[int(0, nat.length - 1)];
    const insured = rnd() < 0.62;
    const plan = insured ? pick(plans) : null;
    const al = rnd() < 0.3 ? [pick(allergyPool)] : [];
    if (al.length && rnd() < 0.25) al.push(pick(allergyPool.filter(x => x !== al[0])));
    const ch = age > 40 && rnd() < 0.6 ? [pick(chronicPool)].concat(rnd() < 0.4 ? [pick(chronicPool)] : []) : [];
    patients.push({
      id: 'pt_' + pad(i + 1, 3), mrn: 'MRN-' + (100240 + i * 17), civilId: String(2 + (y < 2000 ? 0 : 1)) + String(y).slice(2) + pad(mo) + pad(d) + String(int(10000, 99999)),
      name: `${first} ${fam}`, nameAr: familyAr[fam] ? `${familyAr[fam]}` : '', gender: g, dob: `${y}-${pad(mo)}-${pad(d)}`, nationality: n,
      mobile: '+965 ' + int(5, 9) + int(100, 999) + ' ' + int(1000, 9999), email: rnd() < 0.5 ? `${first.toLowerCase()}.${fam.toLowerCase().replace(/[^a-z]/g, '')}@mail.example` : '',
      bloodGroup: pick(['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-']), lang: n === 'Kuwaiti' || n === 'Egyptian' || n === 'Syrian' || n === 'Jordanian' || n === 'Lebanese' ? 'Arabic' : 'English',
      address: `Block ${int(1, 12)}, Street ${int(1, 40)}, House ${int(1, 90)}, ${pick(areas)}`,
      emergency: { name: `${pick(male)} ${fam}`, relation: pick(['Spouse', 'Son', 'Brother', 'Father', 'Daughter']), phone: '+965 ' + int(5, 9) + int(100, 999) + ' ' + int(1000, 9999) },
      allergies: al, chronic: ch, payerId: plan ? plan.payerId : null, planId: plan ? plan.id : null,
      policyNo: plan ? `${(payers.find(p => p.id === plan.payerId) || {}).code}-${int(100000, 999999)}` : '', policyTo: plan ? addDays(TODAY, int(-20, 340)) : '',
      vip: rnd() < 0.05, status: 'Active', registeredAt: at(addDays(TODAY, -int(5, 900)), int(8, 19), int(0, 59)), branchId: 'br_01',
    });
  }
  // Named patients used in walkthroughs
  Object.assign(patients[0], { name: 'Abdullah Al-Ajmi', nameAr: 'عبدالله العجمي', gender: 'Male', dob: '1968-03-14', allergies: ['Penicillin'], chronic: ['Hypertension', 'Type 2 diabetes'], payerId: 'py_01', planId: 'pl_01', policyNo: 'GIG-448120', policyTo: '2027-06-30', nationality: 'Kuwaiti', lang: 'Arabic' });
  Object.assign(patients[1], { name: 'Fatima Al-Mutairi', nameAr: 'فاطمة المطيري', gender: 'Female', dob: '1991-07-02', allergies: [], chronic: [], payerId: 'py_02', planId: 'pl_03', policyNo: 'WARBA-220931', policyTo: '2027-01-31', nationality: 'Kuwaiti', lang: 'Arabic' });
  Object.assign(patients[2], { name: 'Ravi Pillai', nameAr: '', gender: 'Male', dob: '1979-11-20', allergies: ['Sulfa drugs'], chronic: ['Hyperlipidaemia'], payerId: null, planId: null, policyNo: '', policyTo: '', nationality: 'Indian', lang: 'English' });
  Object.assign(patients[3], { name: 'Maryam Al-Enezi', nameAr: 'مريم العنزي', gender: 'Female', dob: '2019-05-11', allergies: ['Peanuts'], chronic: ['Asthma'], payerId: 'py_03', planId: 'pl_05', policyNo: 'KIC-781244', policyTo: '2026-12-31', nationality: 'Kuwaiti', lang: 'Arabic' });
  patients.push({ id: 'pt_unk1', mrn: 'MRN-TMP-0091', civilId: '', name: 'Unknown Male (ER-0091)', nameAr: '', gender: 'Male', dob: '', nationality: '', mobile: '', email: '', bloodGroup: '', lang: '', address: '', emergency: { name: '', relation: '', phone: '' }, allergies: [], chronic: [], payerId: null, planId: null, policyNo: '', policyTo: '', vip: false, status: 'Temporary alias', registeredAt: at(TODAY, 2, 14), branchId: 'br_01', alias: true });
  // A likely duplicate for the merge screen
  patients.push(Object.assign({}, patients[2], { id: 'pt_dup1', mrn: 'MRN-109988', name: 'Ravi K. Pillai', civilId: patients[2].civilId, mobile: patients[2].mobile, registeredAt: '2025-03-02 10:12', allergies: [], chronic: [], status: 'Active' }));

  /* ---------- Services (charge codes) and ICD-10 ---------- */
  const services = [
    ['SRV-CON-C', 'Consultation, consultant', 'Consultation', 30], ['SRV-CON-S', 'Consultation, specialist', 'Consultation', 20], ['SRV-CON-F', 'Follow-up consultation', 'Consultation', 10],
    ['SRV-ER-1', 'Emergency assessment, level 1-2', 'Emergency', 45], ['SRV-ER-3', 'Emergency assessment, level 3-5', 'Emergency', 25],
    ['SRV-ECG', 'ECG, 12 lead', 'Procedure', 12], ['SRV-ECHO', 'Echocardiography', 'Procedure', 60], ['SRV-NEB', 'Nebulization', 'Procedure', 6], ['SRV-DRS', 'Wound dressing', 'Procedure', 8], ['SRV-IVF', 'IV cannulation and fluids', 'Procedure', 15], ['SRV-INJ', 'Injection administration', 'Procedure', 4],
    ['SRV-BED-W', 'Ward bed, per day', 'Room', 60], ['SRV-BED-P', 'Private room, per day', 'Room', 120], ['SRV-BED-I', 'ICU bed, per day', 'Room', 350], ['SRV-NUR', 'Nursing care, per day', 'Room', 25],
    ['PKG-NVD', 'Normal delivery package', 'Package', 650], ['PKG-APP', 'Appendectomy package', 'Package', 1450], ['PKG-CHK', 'Executive health check', 'Package', 120],
  ].map(([code, name, category, price], i) => ({ id: 'sv_' + pad(i + 1), code, name, category, price, vat: 0, status: 'Active' }));
  const icd10 = [
    ['I10', 'Essential (primary) hypertension'], ['E11.9', 'Type 2 diabetes mellitus without complications'], ['E78.5', 'Hyperlipidaemia, unspecified'], ['J45.909', 'Asthma, uncomplicated'],
    ['J06.9', 'Acute upper respiratory infection, unspecified'], ['J02.9', 'Acute pharyngitis, unspecified'], ['R07.9', 'Chest pain, unspecified'], ['I20.9', 'Angina pectoris, unspecified'],
    ['I48.91', 'Atrial fibrillation, unspecified'], ['I21.4', 'Non-ST elevation myocardial infarction'], ['K35.80', 'Acute appendicitis, unspecified'], ['K21.9', 'Gastro-oesophageal reflux disease'],
    ['N39.0', 'Urinary tract infection, site not specified'], ['M54.5', 'Low back pain'], ['M17.11', 'Primary osteoarthritis, right knee'], ['S52.501A', 'Fracture of lower end of radius, initial'],
    ['L20.9', 'Atopic dermatitis, unspecified'], ['H66.90', 'Otitis media, unspecified'], ['A09', 'Infectious gastroenteritis and colitis'], ['R50.9', 'Fever, unspecified'],
    ['O80', 'Encounter for full-term uncomplicated delivery'], ['Z00.00', 'General adult medical examination'], ['E03.9', 'Hypothyroidism, unspecified'], ['D50.9', 'Iron deficiency anaemia'],
    ['J18.9', 'Pneumonia, unspecified organism'], ['R51.9', 'Headache, unspecified'], ['F41.1', 'Generalized anxiety disorder'], ['N18.2', 'Chronic kidney disease, stage 2'],
  ].map(([code, name]) => ({ code, name }));

  /* ---------- Catalogues ---------- */
  const labTests = [
    ['CBC', 'Complete Blood Count', 'Haematology', 'Whole blood', 'EDTA (lavender)', 4, 6], ['BMP', 'Basic Metabolic Panel', 'Chemistry', 'Serum', 'SST (gold)', 4, 9],
    ['LFT', 'Liver Function Test', 'Chemistry', 'Serum', 'SST (gold)', 6, 10], ['LIPID', 'Lipid Profile', 'Chemistry', 'Serum', 'SST (gold)', 6, 8],
    ['HBA1C', 'HbA1c', 'Chemistry', 'Whole blood', 'EDTA (lavender)', 24, 7], ['TSH', 'Thyroid Stimulating Hormone', 'Immunology', 'Serum', 'SST (gold)', 24, 9],
    ['TROP', 'Troponin I (high sensitivity)', 'Chemistry', 'Plasma', 'Lithium heparin (green)', 1, 14], ['CRP', 'C-Reactive Protein', 'Chemistry', 'Serum', 'SST (gold)', 4, 6],
    ['PT', 'Prothrombin Time / INR', 'Coagulation', 'Plasma', 'Sodium citrate (blue)', 2, 6], ['UA', 'Urinalysis', 'Clinical Pathology', 'Urine', 'Urine container', 2, 4],
    ['UCS', 'Urine Culture and Sensitivity', 'Microbiology', 'Urine', 'Sterile container', 72, 12], ['BCS', 'Blood Culture', 'Microbiology', 'Whole blood', 'Blood culture bottle', 120, 18],
    ['VITD', 'Vitamin D (25-OH)', 'Immunology', 'Serum', 'SST (gold)', 48, 15], ['FER', 'Ferritin', 'Immunology', 'Serum', 'SST (gold)', 24, 10],
    ['K', 'Potassium', 'Chemistry', 'Serum', 'SST (gold)', 2, 3], ['GLU', 'Glucose (fasting)', 'Chemistry', 'Plasma', 'Fluoride (grey)', 2, 3],
  ].map(([code, name, section, specimen, container, tatHours, price], i) => ({ id: 'lt_' + pad(i + 1), code, name, section, specimen, container, tatHours, price, status: 'Active' }));
  const labParams = {
    CBC: [['WBC', '10^9/L', 4.0, 11.0], ['Haemoglobin', 'g/dL', 12.0, 16.5], ['Platelets', '10^9/L', 150, 400], ['Neutrophils', '%', 40, 75]],
    BMP: [['Sodium', 'mmol/L', 135, 145], ['Potassium', 'mmol/L', 3.5, 5.1], ['Urea', 'mmol/L', 2.5, 7.8], ['Creatinine', 'umol/L', 60, 110], ['Glucose', 'mmol/L', 3.9, 7.8]],
    LIPID: [['Total cholesterol', 'mmol/L', 0, 5.2], ['LDL', 'mmol/L', 0, 3.4], ['HDL', 'mmol/L', 1.0, 3.0], ['Triglycerides', 'mmol/L', 0, 1.7]],
    HBA1C: [['HbA1c', '%', 4.0, 5.6]], TSH: [['TSH', 'mIU/L', 0.4, 4.0]], TROP: [['Troponin I', 'ng/L', 0, 26]], CRP: [['CRP', 'mg/L', 0, 5]],
    PT: [['PT', 'sec', 11, 13.5], ['INR', '', 0.8, 1.2]], K: [['Potassium', 'mmol/L', 3.5, 5.1]], GLU: [['Glucose', 'mmol/L', 3.9, 5.6]],
    LFT: [['ALT', 'U/L', 7, 56], ['AST', 'U/L', 10, 40], ['Bilirubin, total', 'umol/L', 3, 21], ['Albumin', 'g/L', 35, 50]],
    VITD: [['25-OH Vitamin D', 'nmol/L', 75, 250]], FER: [['Ferritin', 'ug/L', 30, 400]], UA: [['pH', '', 4.5, 8], ['Protein', '', 0, 0], ['Leucocytes', '/uL', 0, 10]],
  };
  const radExams = [
    ['XR-CH', 'X-ray chest PA', 'X-ray', 'Chest', 18, false], ['XR-KN', 'X-ray knee AP/lateral', 'X-ray', 'Knee', 18, true], ['XR-WR', 'X-ray wrist', 'X-ray', 'Wrist', 15, true],
    ['US-AB', 'Ultrasound abdomen', 'Ultrasound', 'Abdomen', 35, false], ['US-PL', 'Ultrasound pelvis', 'Ultrasound', 'Pelvis', 35, false], ['US-OB', 'Obstetric ultrasound', 'Ultrasound', 'Pelvis', 40, false],
    ['CT-HD', 'CT head without contrast', 'CT', 'Head', 90, false], ['CT-AB', 'CT abdomen and pelvis with contrast', 'CT', 'Abdomen', 160, false], ['CT-CA', 'CT coronary angiography', 'CT', 'Chest', 220, false],
    ['MR-KN', 'MRI knee', 'MRI', 'Knee', 180, true], ['MR-BR', 'MRI brain', 'MRI', 'Head', 200, false], ['MG-BL', 'Mammography, bilateral', 'Mammography', 'Breast', 55, false],
  ].map(([code, name, modality, bodyPart, price, laterality], i) => ({ id: 're_' + pad(i + 1), code, name, modality, bodyPart, price, laterality, contrast: /contrast\)?$|with contrast/.test(name) && !/without/.test(name), status: 'Active' }));

  /* ---------- Items (drugs, consumables, reagents) and stock ---------- */
  const drugRows = [
    ['DRG-001', 'Amlodipine', 'Norvasc', 'Tablet', '5 mg', 'Oral', 'Cardiovascular', '', 0.12], ['DRG-002', 'Metformin', 'Glucophage', 'Tablet', '500 mg', 'Oral', 'Antidiabetic', '', 0.06],
    ['DRG-003', 'Atorvastatin', 'Lipitor', 'Tablet', '20 mg', 'Oral', 'Lipid lowering', '', 0.25], ['DRG-004', 'Amoxicillin', 'Amoxil', 'Capsule', '500 mg', 'Oral', 'Antibiotic', '', 0.10],
    ['DRG-005', 'Amoxicillin/Clavulanate', 'Augmentin', 'Tablet', '625 mg', 'Oral', 'Antibiotic', '', 0.35], ['DRG-006', 'Azithromycin', 'Zithromax', 'Tablet', '500 mg', 'Oral', 'Antibiotic', '', 0.80],
    ['DRG-007', 'Paracetamol', 'Panadol', 'Tablet', '500 mg', 'Oral', 'Analgesic', '', 0.02], ['DRG-008', 'Ibuprofen', 'Brufen', 'Tablet', '400 mg', 'Oral', 'NSAID', '', 0.05],
    ['DRG-009', 'Omeprazole', 'Losec', 'Capsule', '20 mg', 'Oral', 'Gastrointestinal', '', 0.15], ['DRG-010', 'Salbutamol', 'Ventolin', 'Inhaler', '100 mcg', 'Inhaled', 'Respiratory', '', 2.10],
    ['DRG-011', 'Insulin glargine', 'Lantus', 'Pen', '100 U/mL', 'Subcutaneous', 'Antidiabetic', '', 9.50], ['DRG-012', 'Enoxaparin', 'Clexane', 'Injection', '40 mg', 'Subcutaneous', 'Anticoagulant', '', 3.40],
    ['DRG-013', 'Ceftriaxone', 'Rocephin', 'Injection', '1 g', 'Intravenous', 'Antibiotic', '', 1.80], ['DRG-014', 'Sodium chloride 0.9%', 'Normal saline', 'Infusion', '1000 mL', 'Intravenous', 'Fluids', '', 0.90],
    ['DRG-015', 'Morphine sulfate', 'Morphine', 'Injection', '10 mg/mL', 'Intravenous', 'Opioid analgesic', 'Schedule II', 1.20], ['DRG-016', 'Tramadol', 'Tramal', 'Capsule', '50 mg', 'Oral', 'Opioid analgesic', 'Schedule IV', 0.30],
    ['DRG-017', 'Diazepam', 'Valium', 'Tablet', '5 mg', 'Oral', 'Anxiolytic', 'Schedule IV', 0.12], ['DRG-018', 'Levothyroxine', 'Euthyrox', 'Tablet', '50 mcg', 'Oral', 'Thyroid', '', 0.05],
    ['DRG-019', 'Bisoprolol', 'Concor', 'Tablet', '5 mg', 'Oral', 'Cardiovascular', '', 0.14], ['DRG-020', 'Aspirin', 'Aspocid', 'Tablet', '75 mg', 'Oral', 'Antiplatelet', '', 0.03],
    ['DRG-021', 'Cetirizine', 'Zyrtec', 'Tablet', '10 mg', 'Oral', 'Antihistamine', '', 0.08], ['DRG-022', 'Ondansetron', 'Zofran', 'Injection', '4 mg', 'Intravenous', 'Antiemetic', '', 1.10],
    ['DRG-023', 'Hydrocortisone cream 1%', 'Dermacort', 'Cream', '15 g', 'Topical', 'Dermatological', '', 1.60], ['DRG-024', 'Paracetamol syrup', 'Calpol', 'Syrup', '120 mg/5 mL', 'Oral', 'Analgesic', '', 1.20],
    ['DRG-025', 'Losartan', 'Cozaar', 'Tablet', '50 mg', 'Oral', 'Cardiovascular', '', 0.18], ['DRG-026', 'Furosemide', 'Lasix', 'Injection', '20 mg', 'Intravenous', 'Diuretic', '', 0.70],
  ];
  const items = drugRows.map(([code, generic, brand, form, strength, route, category, schedule, cost], i) => ({
    id: 'it_' + pad(i + 1, 3), code, type: 'Drug', name: `${generic} ${strength} ${form.toLowerCase()}`, generic, brand, form, strength, route, category, schedule,
    uom: form === 'Infusion' || form === 'Syrup' || form === 'Cream' || form === 'Inhaler' || form === 'Pen' ? 'Each' : form === 'Injection' ? 'Vial' : form === 'Capsule' ? 'Capsule' : 'Tablet',
    cost, price: Math.round(cost * 1.45 * 1000) / 1000, min: int(100, 400), max: int(800, 2000), reorder: 0, manufacturer: pick(['Pfizer', 'GSK', 'Novartis', 'Sanofi', 'Julphar', 'Hikma', 'SPIMACO', 'AstraZeneca']), status: 'Active',
  }));
  [['CON-001', 'Syringe 5 mL', 'Consumable', 'Each', 0.05], ['CON-002', 'IV cannula 20G', 'Consumable', 'Each', 0.35], ['CON-003', 'Examination gloves (M), box 100', 'Consumable', 'Box', 2.20],
   ['CON-004', 'Gauze swab 10x10, pack 100', 'Consumable', 'Pack', 1.10], ['CON-005', 'Surgical mask, box 50', 'Consumable', 'Box', 1.50], ['CON-006', 'Urine container, sterile', 'Consumable', 'Each', 0.08],
   ['CON-007', 'EDTA tube (lavender)', 'Consumable', 'Each', 0.07], ['CON-008', 'SST tube (gold)', 'Consumable', 'Each', 0.09], ['CON-009', 'Adhesive dressing 10x12', 'Consumable', 'Each', 0.25],
   ['CON-010', 'Catheter Foley 16Fr', 'Consumable', 'Each', 0.90], ['REA-001', 'CBC reagent pack', 'Reagent', 'Kit', 85], ['REA-002', 'Chemistry calibrator set', 'Reagent', 'Kit', 140],
   ['GEN-001', 'A4 paper, ream', 'General', 'Ream', 1.30], ['GEN-002', 'Patient wristband', 'General', 'Each', 0.04]].forEach(([code, name, type, uom, cost], i) => items.push({
    id: 'it_' + pad(100 + i, 3), code, type, name, generic: '', brand: '', form: '', strength: '', route: '', category: type === 'Consumable' ? 'Medical consumables' : type === 'Reagent' ? 'Laboratory reagents' : 'General supplies', schedule: '',
    uom, cost, price: Math.round(cost * 1.3 * 1000) / 1000, min: int(50, 200), max: int(400, 1200), reorder: 0, manufacturer: pick(['3M', 'BD', 'B. Braun', 'Medline', 'Sysmex', 'Roche', 'Local supplier']), status: 'Active' }));
  const stock = [];
  const stockWh = { Drug: ['wh_01', 'wh_02', 'wh_03'], Consumable: ['wh_01', 'wh_04'], Reagent: ['wh_07'], General: ['wh_01'] };
  items.forEach((it) => (stockWh[it.type] || ['wh_01']).forEach((wh) => {
    const batches = int(1, 2);
    for (let b = 0; b < batches; b++) {
      const exp = addDays(TODAY, it.code === 'DRG-021' && b === 0 ? 24 : it.code === 'DRG-008' && wh === 'wh_03' ? -3 : int(40, 720));
      stock.push({ id: 'sk_' + pad(stock.length + 1, 4), itemId: it.id, warehouseId: wh, batch: `${it.code.split('-')[0]}${int(2401, 2612)}-${int(10, 99)}`, expiry: exp, qty: it.code === 'DRG-010' && wh === 'wh_03' ? 6 : int(wh === 'wh_01' ? 200 : 20, wh === 'wh_01' ? 3000 : 400), cost: it.cost });
    }
  }));

  /* ---------- Vendors ---------- */
  const vendors = [
    ['VEN-001', 'Al-Mutawa Medical Supplies', 'Medical consumables', 30], ['VEN-002', 'Gulf Pharma Distribution', 'Medicines', 60], ['VEN-003', 'Ali Abdulwahab Sons (Medical)', 'Medicines', 45],
    ['VEN-004', 'Sysmex Middle East', 'Laboratory reagents', 45], ['VEN-005', 'Kuwait Office Supplies', 'General supplies', 30], ['VEN-006', 'Boodai Medical Equipment', 'Equipment', 60],
    ['VEN-007', 'Yiaco Medical Company', 'Medicines', 60], ['VEN-008', 'Medline Gulf', 'Medical consumables', 30],
  ].map(([code, name, category, terms], i) => ({ id: 'vn_' + pad(i + 1), code, name, category, paymentTerms: terms, contact: `procurement${i + 1}@vendor.example`, phone: '+965 2' + int(100, 999) + ' ' + int(1000, 9999), status: i === 5 ? 'On hold' : 'Active', rating: int(3, 5) }));

  /* ---------- Wards and beds ---------- */
  const wards = [
    { id: 'wd_01', code: 'W3', name: 'Ward 3, Medical', floor: '3', type: 'General ward', branchId: 'br_01', deptId: 'dp_03', chargeNurse: 'nu_01', warehouseId: 'wh_04' },
    { id: 'wd_02', code: 'W4', name: 'Ward 4, Surgical', floor: '4', type: 'General ward', branchId: 'br_01', deptId: 'dp_03', chargeNurse: 'nu_06', warehouseId: null },
    { id: 'wd_03', code: 'PED', name: 'Paediatric Ward', floor: '2', type: 'Paediatric', branchId: 'br_01', deptId: 'dp_02', chargeNurse: 'nu_04', warehouseId: null },
    { id: 'wd_04', code: 'ICU', name: 'Intensive Care Unit', floor: '1', type: 'ICU', branchId: 'br_01', deptId: 'dp_03', chargeNurse: 'nu_05', warehouseId: null },
    { id: 'wd_05', code: 'PVT', name: 'Private Suites', floor: '5', type: 'Private', branchId: 'br_01', deptId: 'dp_03', chargeNurse: 'nu_02', warehouseId: null },
  ];
  const beds = [];
  const bedPlan = { wd_01: [12, 'Ward bed', 'SRV-BED-W'], wd_02: [10, 'Ward bed', 'SRV-BED-W'], wd_03: [8, 'Paediatric bed', 'SRV-BED-W'], wd_04: [6, 'ICU bed', 'SRV-BED-I'], wd_05: [6, 'Private room', 'SRV-BED-P'] };
  Object.entries(bedPlan).forEach(([wid, [n, type, svc]]) => {
    const w = wards.find(x => x.id === wid);
    for (let i = 1; i <= n; i++) beds.push({ id: `bd_${w.code}_${pad(i)}`, wardId: wid, room: w.code === 'PVT' || w.code === 'ICU' ? `${w.code}-${i}` : `${w.floor}${pad(Math.ceil(i / 2))}`, no: `${w.code}-${pad(i)}`, type, serviceCode: svc, status: 'Vacant', patientId: null, encounterId: null, gender: w.code === 'PED' ? 'Any' : (i % 2 ? 'Male' : 'Female') });
  });

  /* ---------- Encounters ---------- */
  const encounters = [];
  let token = 1;
  const complaints = { 'Cardiology': ['Chest tightness on exertion', 'Palpitations for 2 weeks', 'Follow-up of hypertension', 'Shortness of breath on climbing stairs'], 'Paediatrics': ['Fever and cough for 3 days', 'Ear pain', 'Vaccination visit', 'Rash on arms'], 'Internal Medicine': ['Diabetes follow-up', 'Fatigue and weight loss', 'Burning urination', 'Headache for 1 week'], 'Orthopaedics': ['Right knee pain', 'Low back pain', 'Wrist injury after fall'], 'Obstetrics and Gynaecology': ['Antenatal visit, 28 weeks', 'Irregular cycles'], 'ENT': ['Sore throat', 'Blocked nose'], 'General Surgery': ['Right lower abdominal pain', 'Inguinal swelling'], 'Dermatology': ['Itchy rash', 'Acne review'] };
  const opdStatus = ['Completed', 'Completed', 'Completed', 'Completed', 'In consultation', 'Waiting for doctor', 'Waiting for doctor', 'Checked in', 'Waiting for doctor', 'Booked'];
  const opdDocs = doctors.filter(d => d.clinicId && d.branchId === 'br_01');
  for (let i = 0; i < 30; i++) {
    const p = patients[(i * 3 + 4) % 60], d = opdDocs[i % opdDocs.length];
    const h = 8 + Math.floor(i / 3), m = (i % 3) * 20;
    const st = opdStatus[i % opdStatus.length];
    encounters.push({ id: 'en_' + pad(encounters.length + 1, 4), no: 'OP-26-' + (51200 + i), type: 'OPD', patientId: p.id, doctorId: d.id, clinicId: d.clinicId, deptId: d.deptId, branchId: 'br_01', start: at(TODAY, h, m), end: st === 'Completed' ? at(TODAY, h, m + 15) : '', status: st, token: 'C' + pad(token++, 3), visitType: i % 4 === 0 ? 'Follow-up' : 'New', payer: p.payerId ? 'Insurance' : 'Cash', complaint: pick(complaints[d.specialty] || ['General review']), source: i % 5 === 0 ? 'Walk-in' : 'Appointment' });
  }
  // OPD history (past visits) for clinical summaries
  for (let i = 0; i < 40; i++) {
    const p = patients[i % 20], d = opdDocs[(i * 5) % opdDocs.length], day = addDays(TODAY, -int(3, 300));
    encounters.push({ id: 'en_' + pad(encounters.length + 1, 4), no: 'OP-26-' + (49000 + i), type: 'OPD', patientId: p.id, doctorId: d.id, clinicId: d.clinicId, deptId: d.deptId, branchId: 'br_01', start: at(day, int(8, 18), pick([0, 15, 30, 45])), end: '', status: 'Completed', token: '', visitType: 'New', payer: p.payerId ? 'Insurance' : 'Cash', complaint: pick(complaints[d.specialty] || ['General review']), source: 'Appointment', diagnosis: pick(icd10).code });
  }
  // ER today
  const erRows = [[0, 2, 'Chest pain radiating to left arm', 'Resuscitation'], [8, 3, 'High fever and vomiting', 'Acute bay'], [12, 4, 'Laceration on right hand', 'Minor treatment'], [3, 3, 'Asthma attack', 'Acute bay'], [21, 5, 'Medication refill request', 'Fast track'], [33, 2, 'Road traffic accident, abdominal pain', 'Resuscitation'], [40, 4, 'Ankle sprain', 'Minor treatment']];
  erRows.forEach(([pi, lvl, c, area], i) => encounters.push({ id: 'en_' + pad(encounters.length + 1, 4), no: 'ER-26-' + (8800 + i), type: 'ER', patientId: i === 5 ? 'pt_unk1' : patients[pi].id, doctorId: 'dr_09', clinicId: null, deptId: 'dp_01', branchId: 'br_01', start: at(TODAY, 6 + i * 1, (i * 13) % 60), end: '', status: ['Under treatment', 'Under treatment', 'Waiting', 'Under observation', 'Discharged', 'Under treatment', 'Waiting'][i], triage: lvl, area, complaint: c, payer: 'Cash', arrival: pick(['Walk-in', 'Ambulance', 'Walk-in']), token: 'E' + pad(i + 1, 3) }));
  // IPD admissions (occupy beds)
  const ipdPlan = [[0, 'bd_W3_01', 'dr_01', 'I20.9', 'Unstable angina, rule out NSTEMI', -3], [6, 'bd_W3_02', 'dr_04', 'J18.9', 'Community-acquired pneumonia', -2], [10, 'bd_W3_04', 'dr_04', 'E11.9', 'Uncontrolled diabetes', -5], [14, 'bd_W3_05', 'dr_03', 'I48.91', 'New onset atrial fibrillation', -1],
    [18, 'bd_W3_07', 'dr_04', 'N39.0', 'Urosepsis', -4], [22, 'bd_W4_01', 'dr_08', 'K35.80', 'Acute appendicitis, post appendectomy', -1], [26, 'bd_W4_02', 'dr_05', 'S52.501A', 'Distal radius fracture, ORIF', -2], [30, 'bd_W4_05', 'dr_08', 'K21.9', 'Hernia repair, day 1', 0],
    [3, 'bd_PED_02', 'dr_02', 'J45.909', 'Acute asthma exacerbation', -1], [27, 'bd_PED_04', 'dr_02', 'A09', 'Gastroenteritis with dehydration', -2], [34, 'bd_ICU_01', 'dr_01', 'I21.4', 'NSTEMI, post angiography', -2], [38, 'bd_ICU_03', 'dr_04', 'J18.9', 'Severe pneumonia on oxygen', -6],
    [42, 'bd_PVT_01', 'dr_06', 'O80', 'Normal delivery, post partum day 1', -1], [46, 'bd_PVT_03', 'dr_03', 'I10', 'Hypertensive urgency', -1]];
  ipdPlan.forEach(([pi, bedId, docId, dx, reason, dayOff], i) => {
    const e = { id: 'en_' + pad(encounters.length + 1, 4), no: 'IP-26-' + (3100 + i), type: 'IPD', patientId: patients[pi].id, doctorId: docId, attendingId: docId, clinicId: (doctors.find(x => x.id === docId) || {}).clinicId, deptId: 'dp_01', branchId: 'br_01', start: at(addDays(TODAY, dayOff), int(9, 22), pick([0, 10, 30, 45])), end: '', status: i === 4 ? 'Discharge planned' : 'Admitted', bedId, admissionType: i % 3 === 0 ? 'Emergency' : 'Elective', diagnosis: dx, reason, payer: patients[pi].payerId ? 'Insurance' : 'Cash', expectedDischarge: addDays(TODAY, int(0, 4)), clearance: i === 4 ? 'Pending billing' : 'Cleared' };
    encounters.push(e);
    const b = beds.find(x => x.id === bedId); Object.assign(b, { status: 'Occupied', patientId: e.patientId, encounterId: e.id });
  });
  ['bd_W3_03', 'bd_W4_03', 'bd_PVT_02'].forEach(id => beds.find(b => b.id === id).status = 'Cleaning');
  ['bd_W3_08', 'bd_ICU_02'].forEach(id => beds.find(b => b.id === id).status = 'Reserved');
  beds.find(b => b.id === 'bd_W4_09').status = 'Blocked';

  /* ---------- Orders (CPOE) ---------- */
  const orders = [];
  const addOrder = (o) => { orders.push(Object.assign({ id: 'or_' + pad(orders.length + 1, 4), no: 'ORD-' + (70100 + orders.length), priority: 'Routine', notes: '', by: 'dr_01' }, o)); };
  const labFlow = ['Ordered', 'Ordered', 'Collected', 'Received', 'In progress', 'Resulted', 'Verified', 'Verified', 'Verified'];
  encounters.filter(e => e.type !== 'OPD' || e.start.startsWith(TODAY)).slice(0, 40).forEach((e, i) => {
    const t = labTests[(i * 5) % labTests.length];
    const st = e.status === 'Booked' || e.status === 'Checked in' ? null : labFlow[i % labFlow.length];
    if (st) addOrder({ type: 'lab', encounterId: e.id, patientId: e.patientId, code: t.code, name: t.name, status: st, priority: e.type === 'ER' || i % 7 === 0 ? 'Urgent' : 'Routine', orderedAt: at(e.start.slice(0, 10), Math.min(23, +e.start.slice(11, 13) + 1), int(0, 59)), by: e.doctorId });
    if (i % 3 === 0) { const t2 = labTests[(i * 3 + 2) % labTests.length]; addOrder({ type: 'lab', encounterId: e.id, patientId: e.patientId, code: t2.code, name: t2.name, status: 'Ordered', priority: 'Routine', orderedAt: at(e.start.slice(0, 10), Math.min(23, +e.start.slice(11, 13) + 1), int(0, 59)), by: e.doctorId }); }
    if (i % 4 === 1) { const r = radExams[(i * 7) % radExams.length]; addOrder({ type: 'rad', encounterId: e.id, patientId: e.patientId, code: r.code, name: r.name, status: ['Ordered', 'Scheduled', 'Performed', 'Reported', 'Approved'][i % 5], priority: e.type === 'ER' ? 'Urgent' : 'Routine', orderedAt: at(e.start.slice(0, 10), Math.min(23, +e.start.slice(11, 13) + 1), int(0, 59)), by: e.doctorId }); }
  });
  // Medication orders (prescriptions for OPD, inpatient medication orders for IPD)
  const rxSets = [[['it_001', '1 tablet', 'Once daily', 30], ['it_003', '1 tablet', 'At night', 30]], [['it_004', '1 capsule', 'Three times daily', 7], ['it_007', '2 tablets', 'Every 6 hours as needed', 5]], [['it_002', '1 tablet', 'Twice daily', 30]], [['it_010', '2 puffs', 'Every 4 hours as needed', 30], ['it_021', '1 tablet', 'Once daily', 10]], [['it_009', '1 capsule', 'Once daily before breakfast', 14]], [['it_008', '1 tablet', 'Three times daily after food', 5], ['it_023', 'Apply thinly', 'Twice daily', 7]]];
  encounters.filter(e => e.type === 'OPD' && e.start.startsWith(TODAY) && /Completed|In consultation/.test(e.status)).forEach((e, i) => {
    const set = rxSets[i % rxSets.length], rx = 'RX-26-' + (30400 + i);
    set.forEach(([itemId, dose, freq, days]) => { const it = items.find(x => x.id === itemId); addOrder({ type: 'med', setting: 'OPD', rxNo: rx, encounterId: e.id, patientId: e.patientId, itemId, code: it.code, name: it.name, dose, route: it.route, frequency: freq, days, qty: days * (/Twice/.test(freq) ? 2 : /Three|6 hours|4 hours/.test(freq) ? 3 : 1), status: i % 4 === 0 ? 'Dispensed' : i % 4 === 1 ? 'Verified' : 'Pending verification', orderedAt: e.end || e.start, by: e.doctorId }); });
  });
  const ipdMeds = [['it_013', '1 g', 'Once daily', 'Intravenous'], ['it_012', '40 mg', 'Once daily', 'Subcutaneous'], ['it_007', '1 g', 'Every 6 hours', 'Oral'], ['it_014', '1000 mL', 'Over 8 hours', 'Intravenous'], ['it_022', '4 mg', 'Every 8 hours as needed', 'Intravenous'], ['it_015', '2 mg', 'Every 4 hours as needed', 'Intravenous'], ['it_011', '18 units', 'At night', 'Subcutaneous'], ['it_026', '20 mg', 'Twice daily', 'Intravenous']];
  encounters.filter(e => e.type === 'IPD').forEach((e, i) => {
    [ipdMeds[i % 8], ipdMeds[(i + 3) % 8]].forEach(([itemId, dose, freq, route], k) => { const it = items.find(x => x.id === itemId); addOrder({ type: 'med', setting: 'IPD', encounterId: e.id, patientId: e.patientId, itemId, code: it.code, name: it.name, dose, route, frequency: freq, days: 5, qty: 5, status: (i + k) % 5 === 0 ? 'Pending verification' : 'Active', orderedAt: e.start, by: e.doctorId }); });
    addOrder({ type: 'diet', encounterId: e.id, patientId: e.patientId, code: 'DIET', name: pick(['Diabetic diet 1800 kcal', 'Low salt diet', 'Soft diet', 'Nil by mouth after midnight', 'Clear fluids']), status: 'Active', orderedAt: e.start, by: e.doctorId });
    addOrder({ type: 'care', encounterId: e.id, patientId: e.patientId, code: 'CARE', name: pick(['Vital signs every 4 hours', 'Strict intake and output chart', 'Blood glucose before meals and at bedtime', 'Fall precautions', 'Elevate head of bed 30 degrees', 'Wound check every shift']), status: (i % 3 === 0) ? 'Done' : 'Active', orderedAt: e.start, by: e.doctorId });
  });
  // Results for resulted/verified lab orders
  orders.filter(o => o.type === 'lab' && /Resulted|Verified/.test(o.status)).forEach((o, i) => {
    const params = labParams[o.code] || [['Result', '', 0, 0]];
    o.results = params.map(([name, unit, lo, hi], k) => {
      let v = lo === hi ? 0 : +(lo + (hi - lo) * (0.2 + rnd() * 0.6)).toFixed(hi > 50 ? 0 : 1);
      if ((i + k) % 6 === 0 && hi) v = +(hi * 1.35).toFixed(hi > 50 ? 0 : 1);
      if (o.code === 'TROP' && i % 2 === 0) v = 412;
      if (o.code === 'K' && i % 2 === 0) v = 6.4;
      const flag = v > hi ? 'H' : v < lo ? 'L' : '';
      return { name, value: v, unit, low: lo, high: hi, flag, critical: (o.code === 'TROP' && v > 100) || (o.code === 'K' && v > 6.0) };
    });
    o.resultedAt = at(o.orderedAt.slice(0, 10), Math.min(23, +o.orderedAt.slice(11, 13) + 2), int(0, 59));
    o.resultedBy = 'Hassan Bukhari'; if (o.status === 'Verified') { o.verifiedBy = 'Dr. Lina Haddad'; o.verifiedAt = o.resultedAt; }
  });

  /* ---------- Vitals (for charts) ---------- */
  const vitals = [];
  encounters.filter(e => e.type === 'IPD').forEach((e, i) => {
    for (let k = 0; k < 8; k++) {
      const day = addDays(e.start.slice(0, 10), Math.floor(k / 3)); if (day > TODAY) break;
      vitals.push({ id: 'vt_' + pad(vitals.length + 1, 4), patientId: e.patientId, encounterId: e.id, at: at(day, [6, 14, 22][k % 3], int(0, 30)), temp: +(36.6 + rnd() * (i % 4 === 1 ? 2.2 : 0.8)).toFixed(1), hr: int(68, i % 4 === 3 ? 128 : 98), sbp: int(108, i % 5 === 0 ? 168 : 142), dbp: int(64, 92), rr: int(14, 22), spo2: int(i % 6 === 5 ? 88 : 94, 99), pain: int(0, 6), by: pick(nurses).name });
    }
  });
  encounters.filter(e => e.type === 'OPD' && e.start.startsWith(TODAY) && !/Booked/.test(e.status)).forEach((e) => vitals.push({ id: 'vt_' + pad(vitals.length + 1, 4), patientId: e.patientId, encounterId: e.id, at: e.start, temp: +(36.5 + rnd() * 1.2).toFixed(1), hr: int(62, 104), sbp: int(104, 158), dbp: int(62, 96), rr: int(12, 20), spo2: int(95, 100), pain: int(0, 5), weight: int(20, 110), height: int(110, 190), by: 'Triage nurse' }));

  /* ---------- Invoices ---------- */
  const invoices = [];
  encounters.filter(e => e.status === 'Completed' || e.type === 'ER').slice(0, 56).concat(encounters.filter(e => e.type === 'IPD')).forEach((e, i) => {
    const p = patients.find(x => x.id === e.patientId) || {};
    const plan = plans.find(x => x.id === p.planId);
    const svcCode = e.type === 'ER' ? (e.triage <= 2 ? 'SRV-ER-1' : 'SRV-ER-3') : e.type === 'IPD' ? 'SRV-BED-W' : ((doctors.find(d => d.id === e.doctorId) || {}).grade === 'Consultant' ? 'SRV-CON-C' : 'SRV-CON-S');
    const sv = services.find(s => s.code === svcCode);
    const lines = [{ code: sv.code, desc: sv.name, qty: e.type === 'IPD' ? Math.max(1, Math.round((new Date(TODAY) - new Date(e.start.slice(0, 10))) / 864e5)) : 1, price: sv.price }];
    orders.filter(o => o.encounterId === e.id && (o.type === 'lab' || o.type === 'rad')).forEach(o => { const c = (o.type === 'lab' ? labTests : radExams).find(x => x.code === o.code); if (c) lines.push({ code: (o.type === 'lab' ? 'LAB-' : 'RAD-') + c.code, desc: c.name, qty: 1, price: c.price }); });
    const total = lines.reduce((s, l) => s + l.qty * l.price, 0);
    const pat = plan ? Math.min(total * plan.copayPct / 100 + plan.deductible, plan.maxCopay || total) : total;
    const paid = e.type === 'IPD' ? (i % 2 ? Math.round(pat / 2) : 0) : (i % 9 === 4 ? 0 : pat);
    invoices.push({ id: 'iv_' + pad(invoices.length + 1, 4), no: 'INV-26-' + (60300 + i), encounterId: e.id, patientId: e.patientId, date: e.start.slice(0, 10), type: e.type, lines, total: +total.toFixed(3), payerId: plan ? plan.payerId : null, planId: plan ? plan.id : null, payerAmount: +(total - pat).toFixed(3), patientAmount: +pat.toFixed(3), paid: +paid.toFixed(3), status: e.type === 'IPD' ? 'Interim' : paid >= pat ? 'Paid' : 'Unpaid', claimStatus: plan ? pick(['Not submitted', 'Not submitted', 'In batch', 'Submitted', 'Paid', 'Rejected']) : '', by: 'Fatima Al-Kandari' });
  });

  const allergiesMaster = ['Penicillin', 'Cephalosporins', 'Sulfa drugs', 'Aspirin', 'NSAIDs', 'Codeine', 'Morphine', 'Latex', 'Iodine contrast', 'Peanuts', 'Shellfish', 'Eggs'];

  const notifications = [
    { icon: 'bell-ring', title: 'Critical result: Troponin I 412 ng/L', text: 'Abdullah Al-Ajmi, Ward 3. Call logged by the lab.', at: '09:42' , href: 'lab/critical.html', opt: 'lab.critical' },
    { icon: 'bed-double', title: '3 beds waiting for cleaning', text: 'Ward 3 and Ward 4.', at: '09:10' , href: 'reception/beds.html', opt: 'reception.beds' },
    { icon: 'pill', title: '6 prescriptions waiting for verification', text: 'OPD pharmacy queue.', at: '08:55' , href: 'pharmacy/opd-queue.html', opt: 'pharmacy.disp.op' },
    { icon: 'shield-question-mark', title: 'Pre-authorization approved', text: 'GIG, CT abdomen and pelvis.', at: '08:31' , href: 'insurance/preauth.html', opt: 'insurance.claims.pre' },
    { icon: 'package-x', title: 'Ventolin inhaler below minimum', text: 'Outpatient Pharmacy: 6 left, minimum 120.', at: '08:02' , href: 'pharmacy/stock.html', opt: 'pharmacy.stock' },
  ];
  Object.assign(S, { notifications, doctors, nurses, payers, plans, patients, services, icd10, labTests, labParams, radExams, items, stock, vendors, wards, beds, encounters, orders, vitals, invoices, allergiesMaster });
})();
