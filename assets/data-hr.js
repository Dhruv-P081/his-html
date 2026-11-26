/* HR and Payroll seed data (SOW V4 Module 12). Dummy data only.
 * Loaded after data-core.js. Every key is prefixed `hr`.
 *   hrStaff            staff not in the admin `employees` key (same field names)
 *   hrProfiles         HR details for every employee, keyed by employee id (grade, department, pay, bank, Civil ID,
 *                      nationality, licences[] = credentials, documents[])
 *   hrDesignations, hrGrades, hrLeaveTypes, hrPayComponents, hrShifts, hrLoanTypes, hrIndemnityRules   masters
 *   hrRosters, hrAttendance, hrAttImports, hrLeaves, hrOvertime, hrPayrollRuns, hrEosb, hrLoans, hrPayslipMails, hrBankFiles
 *   hrSettings         roster and payroll parameters
 */
(function () {
  const S = window.SEED;
  const TODAY = S.TODAY;
  let seed = 51226;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pad = (n, w) => String(n).padStart(w || 2, '0');
  const addDays = (d, n) => { const x = new Date(d + 'T00:00:00'); x.setDate(x.getDate() + n); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };
  const dow = (d) => new Date(d + 'T00:00:00').getDay();   // 0 Sunday ... 6 Saturday
  const hm = (mins) => { mins = ((mins % 1440) + 1440) % 1440; return pad(Math.floor(mins / 60)) + ':' + pad(mins % 60); };

  /* ---------- Masters ---------- */
  const hrGrades = [
    ['MED-C', 'Medical consultant', 3200, 5200, 30], ['MED-S', 'Medical specialist', 2200, 3200, 30], ['MED-R', 'Medical registrar', 1500, 2200, 30],
    ['NUR-3', 'Nursing, charge nurse', 850, 1200, 30], ['NUR-2', 'Nursing, staff nurse', 600, 850, 30], ['AH-3', 'Allied health, senior', 1000, 1500, 30],
    ['AH-2', 'Allied health', 650, 1000, 30], ['ADM-4', 'Administration, manager', 1800, 3000, 30], ['ADM-3', 'Administration, senior officer', 1100, 1800, 30],
    ['ADM-2', 'Administration, officer', 700, 1100, 30], ['ADM-1', 'Administration, assistant', 420, 900, 30], ['SUP-1', 'Support services', 200, 450, 30],
  ].map(([code, name, minBasic, maxBasic, leaveDays], i) => ({ id: 'hgr_' + pad(i + 1), code, name, minBasic, maxBasic, leaveDays, status: 'Active' }));

  const hrDesignations = [
    ['CONS', 'Consultant', 'MED-C', 'Doctor'], ['SPEC', 'Specialist', 'MED-S', 'Doctor'], ['REG', 'Registrar', 'MED-R', 'Doctor'],
    ['CN', 'Charge Nurse', 'NUR-3', 'Nurse'], ['SN', 'Staff Nurse', 'NUR-2', 'Nurse'], ['PHAR', 'Pharmacist', 'AH-3', 'Allied health'],
    ['LABT', 'Lab Technologist', 'AH-2', 'Allied health'], ['RADG', 'Radiographer', 'AH-2', 'Allied health'], ['PHYS', 'Physiotherapist', 'AH-3', 'Allied health'],
    ['DIET', 'Dietitian', 'AH-2', 'Allied health'], ['MGR', 'Manager', 'ADM-4', 'Administration'], ['OFFR', 'Officer', 'ADM-2', 'Administration'],
    ['RECP', 'Receptionist', 'ADM-1', 'Administration'], ['STOR', 'Storekeeper', 'SUP-1', 'Support'], ['DRV', 'Driver', 'SUP-1', 'Support'],
  ].map(([code, name, grade, category], i) => ({ id: 'hds_' + pad(i + 1), code, name, grade, category, status: 'Active' }));

  const hrLeaveTypes = [
    { code: 'AL', name: 'Annual leave', days: 30, paid: true, carry: true, gender: 'All', doc: false, note: 'Kuwait Labour Law: 30 days a year after the first year of service.' },
    { code: 'SL', name: 'Sick leave', days: 15, paid: true, carry: false, gender: 'All', doc: true, note: 'Full pay for the first 15 days; medical certificate required.' },
    { code: 'EL', name: 'Emergency leave', days: 5, paid: true, carry: false, gender: 'All', doc: false, note: '' },
    { code: 'CL', name: 'Compassionate leave', days: 3, paid: true, carry: false, gender: 'All', doc: false, note: 'Death of a first or second degree relative.' },
    { code: 'ML', name: 'Maternity leave', days: 70, paid: true, carry: false, gender: 'Female', doc: true, note: '70 days fully paid.' },
    { code: 'HJ', name: 'Hajj leave', days: 21, paid: true, carry: false, gender: 'All', doc: true, note: 'Once during service, after 2 years.' },
    { code: 'ID', name: 'Iddah leave', days: 130, paid: true, carry: false, gender: 'Female', doc: true, note: 'Muslim widow, 4 months and 10 days.' },
    { code: 'UL', name: 'Unpaid leave', days: 30, paid: false, carry: false, gender: 'All', doc: false, note: 'Deducted in payroll at the daily rate.' },
  ].map((x, i) => Object.assign({ id: 'hlt_' + pad(i + 1), count: x.code === 'ML' || x.code === 'ID' ? 'Calendar days' : 'Working days', status: 'Active' }, x));

  const hrPayComponents = [
    { code: 'HRA', name: 'Housing allowance', kind: 'Allowance', calc: 'Fixed amount', pct: '', cap: '', pifss: true, note: 'Paid monthly with salary.' },
    { code: 'TRN', name: 'Transport allowance', kind: 'Allowance', calc: 'Fixed amount', pct: '', cap: '', pifss: true, note: '' },
    { code: 'CLN', name: 'Clinical allowance', kind: 'Allowance', calc: 'Fixed amount', pct: '', cap: '', pifss: true, note: 'Doctors and licensed clinical staff.' },
    { code: 'SHF', name: 'Shift allowance', kind: 'Allowance', calc: 'Fixed amount', pct: '', cap: '', pifss: false, note: 'Rotating shift nursing staff.' },
    { code: 'CALL', name: 'On-call allowance', kind: 'Allowance', calc: 'Fixed amount', pct: '', cap: '', pifss: false, note: '' },
    { code: 'PHN', name: 'Phone allowance', kind: 'Allowance', calc: 'Fixed amount', pct: '', cap: '', pifss: false, note: '' },
    { code: 'OT', name: 'Overtime', kind: 'Allowance', calc: 'Per hour', pct: '', cap: '', pifss: false, note: 'Hourly rate = gross / 26 / 8, times 1.25, 1.5 or 2.0.' },
    { code: 'PIFSS', name: 'PIFSS social security (Kuwaiti)', kind: 'Deduction', calc: 'Percent of salary', pct: 10.5, cap: 2750, pifss: false, note: 'Employee share for Kuwaiti nationals, on salary up to the cap.' },
    { code: 'ABS', name: 'Absence deduction', kind: 'Deduction', calc: 'Per day', pct: '', cap: '', pifss: false, note: 'Unregularized absence at gross / 26 per day.' },
    { code: 'UNP', name: 'Unpaid leave deduction', kind: 'Deduction', calc: 'Per day', pct: '', cap: '', pifss: false, note: '' },
    { code: 'LOAN', name: 'Loan instalment', kind: 'Deduction', calc: 'Fixed amount', pct: '', cap: '', pifss: false, note: 'From the loan schedule.' },
  ].map((x, i) => Object.assign({ id: 'hpc_' + pad(i + 1), status: 'Active' }, x));

  const hrShifts = [
    ['M', 'Morning', '07:00', '15:00', 8, 'Work'], ['E', 'Evening', '15:00', '23:00', 8, 'Work'], ['N', 'Night', '23:00', '07:00', 8, 'Work'],
    ['D', 'Day (office)', '08:00', '16:00', 8, 'Work'], ['L', 'Long day', '07:00', '19:00', 12, 'Work'], ['NL', 'Long night', '19:00', '07:00', 12, 'Work'],
    ['OC', 'On call from home', '16:00', '08:00', 0, 'On call'], ['O', 'Day off', '', '', 0, 'Off'], ['AL', 'On leave', '', '', 0, 'Leave'], ['ML', 'Maternity leave', '', '', 0, 'Leave'],
  ].map(([code, name, start, end, hours, type], i) => ({ id: 'hsh_' + pad(i + 1), code, name, start, end, hours, type, grace: type === 'Work' ? 10 : '', status: 'Active' }));

  const hrLoanTypes = [
    { code: 'ADV', name: 'Salary advance', maxMultiple: 1, maxInst: 3, minService: 3, note: 'Up to one month basic salary.' },
    { code: 'PERS', name: 'Personal loan', maxMultiple: 4, maxInst: 24, minService: 12, note: 'Interest free; up to 4 times basic salary.' },
    { code: 'EMRG', name: 'Emergency loan', maxMultiple: 2, maxInst: 12, minService: 6, note: 'Medical or family emergency.' },
    { code: 'HOUS', name: 'Housing deposit loan', maxMultiple: 3, maxInst: 18, minService: 12, note: 'Rent deposit and first rent.' },
  ].map((x, i) => Object.assign({ id: 'hlo_' + pad(i + 1), status: 'Active' }, x));

  const hrIndemnityRules = [
    { code: 'ACC-1', name: 'Years 1 to 5: 15 days pay per year', type: 'Accrual', from: 0, to: 5, value: 15, unit: 'days per year', note: 'Kuwait Labour Law 6/2010, Article 51.' },
    { code: 'ACC-2', name: 'After 5 years: one month pay per year', type: 'Accrual', from: 5, to: 99, value: 26, unit: 'days per year', note: 'One month = 26 working days.' },
    { code: 'CAP', name: 'Total cannot exceed 1.5 years pay', type: 'Cap', from: '', to: '', value: 18, unit: 'months', note: 'Article 51.' },
    { code: 'DIV', name: 'Daily rate divisor', type: 'Divisor', from: '', to: '', value: 26, unit: 'days', note: 'Daily pay = monthly remuneration / 26.' },
    { code: 'RES-1', name: 'Resignation, under 3 years', type: 'Resignation share', from: 0, to: 3, value: 0, unit: '% of indemnity', note: 'Article 53.' },
    { code: 'RES-2', name: 'Resignation, 3 to 5 years', type: 'Resignation share', from: 3, to: 5, value: 50, unit: '% of indemnity', note: 'Half of the indemnity.' },
    { code: 'RES-3', name: 'Resignation, 5 to 10 years', type: 'Resignation share', from: 5, to: 10, value: 66.667, unit: '% of indemnity', note: 'Two thirds of the indemnity.' },
    { code: 'RES-4', name: 'Resignation, 10 years or more', type: 'Resignation share', from: 10, to: 99, value: 100, unit: '% of indemnity', note: 'Full indemnity.' },
  ].map((x, i) => Object.assign({ id: 'hir_' + pad(i + 1), sector: 'Private', status: 'Active' }, x));

  const hrSettings = { minRestHours: 11, maxWeeklyHours: 48, payDivisor: 26, hoursPerDay: 8, otRates: { Normal: 1.25, 'Rest day': 1.5, 'Public holiday': 2 } };

  /* ---------- Staff ---------- */
  // [name, designation, branchId, deptId, grade, gender, nationality, basic, join, shift, education]
  const extra = [
    ['Dr. Hanan Al-Sabah', 'Consultant, Internal Medicine', 'br_01', 'dp_01', 'MED-C', 'Female', 'Kuwaiti', 4100, '2011-10-02', 'D', 'MBBS (Kuwait University); FRCP (London)'],
    ['Dr. Tariq Mahmoud', 'Specialist Orthopaedic Surgeon', 'br_01', 'dp_01', 'MED-S', 'Male', 'Egyptian', 2600, '2018-08-19', 'D', 'MBBCh, MSc Orthopaedics (Ain Shams University)'],
    ['Dr. Priya Nair', 'Consultant Obstetrician', 'br_01', 'dp_01', 'MED-C', 'Female', 'Indian', 3800, '2014-02-09', 'D', 'MBBS, MD (Manipal); MRCOG'],
    ['Dr. Faisal Al-Otaibi', 'Specialist ENT', 'br_01', 'dp_01', 'MED-S', 'Male', 'Kuwaiti', 2700, '2019-09-15', 'D', 'MBBS (Kuwait University); Kuwait Board ENT'],
    ['Dr. Sameh Youssef', 'Consultant General Surgeon', 'br_01', 'dp_01', 'MED-C', 'Male', 'Egyptian', 3950, '2010-05-23', 'D', 'MBBCh, MD Surgery (Cairo University)'],
    ['Dr. Aisha Al-Mansour', 'Specialist Emergency Medicine', 'br_01', 'dp_01', 'MED-S', 'Female', 'Kuwaiti', 2900, '2020-01-12', 'L', 'MBBS (RCSI); Arab Board Emergency Medicine'],
    ['Dr. Mahmoud Saleh', 'Consultant Radiologist', 'br_01', 'dp_10', 'MED-C', 'Male', 'Jordanian', 3600, '2016-03-06', 'D', 'MD (University of Jordan); FRCR'],
    ['Dr. Lina Haddad', 'Consultant Pathologist', 'br_01', 'dp_06', 'MED-C', 'Female', 'Lebanese', 3500, '2017-11-05', 'D', 'MD (American University of Beirut); FRCPath'],
    ['Grace Fernandes', 'Staff Nurse', 'br_01', 'dp_03', 'NUR-2', 'Female', 'Indian', 720, '2015-06-21', 'M', 'BSc Nursing (Mangalore University)'],
    ['Anjali Menon', 'Staff Nurse', 'br_01', 'dp_03', 'NUR-2', 'Female', 'Indian', 690, '2019-03-10', 'M', 'BSc Nursing (Kerala University)'],
    ['Joy Dela Cruz', 'Staff Nurse', 'br_01', 'dp_03', 'NUR-2', 'Female', 'Filipino', 680, '2021-08-01', 'M', 'BSc Nursing (University of Santo Tomas)'],
    ['Huda Al-Azmi', 'Charge Nurse', 'br_01', 'dp_03', 'NUR-3', 'Female', 'Kuwaiti', 1150, '2012-12-02', 'M', 'BSc Nursing (Kuwait University)'],
    ['Mercy Thomas', 'Staff Nurse', 'br_01', 'dp_03', 'NUR-2', 'Female', 'Indian', 700, '2020-07-19', 'M', 'BSc Nursing (Rajiv Gandhi University)'],
    ['Rincy George', 'Staff Nurse', 'br_01', 'dp_03', 'NUR-2', 'Female', 'Indian', 660, '2023-01-15', 'M', 'BSc Nursing (Kerala University)'],
    ['Sheeba Varghese', 'Staff Nurse', 'br_01', 'dp_03', 'NUR-2', 'Female', 'Indian', 750, '2016-09-04', 'M', 'BSc Nursing (Mahatma Gandhi University)'],
    ['Princess Reyes', 'Staff Nurse', 'br_01', 'dp_03', 'NUR-2', 'Female', 'Filipino', 650, '2022-05-08', 'M', 'BSc Nursing (Far Eastern University)'],
    ['Nadia Al-Hajri', 'Staff Nurse', 'br_01', 'dp_03', 'NUR-2', 'Female', 'Kuwaiti', 840, '2024-02-11', 'M', 'BSc Nursing (Public Authority for Applied Education)'],
    ['Mariam Fawzi', 'Clinical Pharmacist', 'br_01', 'dp_04', 'AH-3', 'Female', 'Egyptian', 1180, '2019-10-06', 'D', 'PharmD (Cairo University)'],
    ['Sunil Mathew', 'Lab Technologist', 'br_01', 'dp_06', 'AH-2', 'Male', 'Indian', 760, '2017-04-23', 'D', 'BSc Medical Laboratory Technology'],
    ['Dalia Mostafa', 'Senior Lab Technologist', 'br_01', 'dp_06', 'AH-3', 'Female', 'Egyptian', 1050, '2014-11-16', 'D', 'BSc Laboratory Science (Alexandria University)'],
    ['Kareem Nassar', 'Radiographer', 'br_01', 'dp_10', 'AH-2', 'Male', 'Syrian', 740, '2020-06-14', 'D', 'BSc Medical Imaging (Damascus University)'],
    ['Abeer Al-Dosari', 'Physiotherapist', 'br_01', 'dp_09', 'AH-3', 'Female', 'Kuwaiti', 1250, '2021-01-10', 'D', 'BSc Physiotherapy (Kuwait University)'],
    ['Shaikha Al-Otaibi', 'Clinical Dietitian', 'br_01', 'dp_02', 'AH-2', 'Female', 'Kuwaiti', 980, '2022-09-18', 'D', 'BSc Clinical Nutrition (Kuwait University)'],
    ['Bader Al-Azmi', 'HR Manager', 'br_01', 'dp_05', 'ADM-4', 'Male', 'Kuwaiti', 2350, '2013-03-17', 'D', 'MBA Human Resources (Gulf University for Science and Technology)'],
    ['Vinod Pillai', 'Payroll Accountant', 'br_01', 'dp_05', 'ADM-3', 'Male', 'Indian', 1250, '2015-08-09', 'D', 'BCom, CMA (India)'],
    ['Hessa Al-Hajri', 'Receptionist', 'br_02', 'dp_08', 'ADM-1', 'Female', 'Kuwaiti', 880, '2023-04-02', 'D', 'Diploma in Business Administration'],
    ['Imran Khan', 'Medical Records Officer', 'br_01', 'dp_05', 'ADM-2', 'Male', 'Pakistani', 720, '2018-01-21', 'D', 'BSc Health Information Management'],
    ['Ramon Cruz', 'Housekeeping Supervisor', 'br_01', 'dp_05', 'SUP-1', 'Male', 'Filipino', 390, '2016-12-11', 'M', 'High school diploma'],
    ['Abdul Rahman Mia', 'Ambulance Driver', 'br_01', 'dp_05', 'SUP-1', 'Male', 'Bangladeshi', 260, '2019-05-05', 'M', 'Kuwait heavy vehicle licence'],
    ['Tarek Ibrahim', 'Biomedical Engineer', 'br_04', 'dp_09', 'ADM-3', 'Male', 'Egyptian', 1300, '2020-10-25', 'D', 'BSc Biomedical Engineering (Helwan University)'],
  ];
  const hrStaff = extra.map((r, i) => ({ id: 'emp_' + (2001 + i), empNo: 'E-' + (2001 + i), name: r[0], designation: r[1], branchId: r[2], education: r[10], hrStatus: 'Active', lastWorkingDate: null, lastSync: '2026-11-25 02:00' }));

  const base = {
    emp_1001: ['dp_05', 'ADM-4', 'Female', 'Kuwaiti', 2450, '2018-03-04', 'D'], emp_1002: ['dp_01', 'MED-C', 'Male', 'Kuwaiti', 4200, '2012-09-16', 'D'],
    emp_1003: ['dp_02', 'MED-S', 'Female', 'Kuwaiti', 2850, '2017-01-08', 'D'], emp_1004: ['dp_03', 'NUR-3', 'Female', 'Filipino', 980, '2013-05-12', 'D'],
    emp_1005: ['dp_08', 'ADM-3', 'Male', 'Lebanese', 1650, '2019-02-03', 'D'], emp_1006: ['dp_04', 'AH-3', 'Male', 'Egyptian', 1150, '2021-07-01', 'D'],
    emp_1007: ['dp_05', 'SUP-1', 'Male', 'Indian', 420, '2016-04-10', 'D'], emp_1008: ['dp_08', 'ADM-1', 'Female', 'Kuwaiti', 900, '2026-11-23', 'D'],
    emp_1009: ['dp_06', 'AH-2', 'Male', 'Pakistani', 780, '2022-02-13', 'D'], emp_1010: ['dp_09', 'MED-R', 'Male', 'Kuwaiti', 1950, '2024-09-01', 'D'],
    emp_1011: ['dp_05', 'ADM-3', 'Female', 'Jordanian', 1400, '2020-10-18', 'D'], emp_1012: ['dp_05', 'ADM-4', 'Female', 'Kuwaiti', 2600, '2019-06-30', 'D'],
    emp_1013: ['dp_07', 'MED-C', 'Female', 'Kuwaiti', 3900, '2015-06-14', 'D'], emp_1014: ['dp_10', 'AH-2', 'Male', 'Pakistani', 720, '2026-11-16', 'D'],
  };
  extra.forEach((r, i) => { base['emp_' + (2001 + i)] = [r[3], r[4], r[5], r[6], r[7], r[8], r[9]]; });
  const allEmp = S.employees.concat(hrStaff);
  const banks = ['NBOK', 'CBKU', 'GULB', 'KFHO', 'BBYN', 'BRGN', 'ABKK', 'WARB'];
  const credNo = { 'MOH professional licence': 'MOH-', 'Nursing registration': 'KNR-', BLS: 'AHA-BLS-', ACLS: 'AHA-ACLS-', PALS: 'AHA-PALS-', 'Malpractice insurance': 'GIG-MP-', 'Radiation safety certificate': 'KFAS-RS-' };
  const issuer = { 'MOH professional licence': 'Ministry of Health, Licensing Department', 'Nursing registration': 'MOH Nursing Services', BLS: 'American Heart Association', ACLS: 'American Heart Association', PALS: 'American Heart Association', 'Malpractice insurance': 'Gulf Insurance Group', 'Radiation safety certificate': 'Kuwait Radiation Protection Department' };
  // Expiry offsets from today chosen so the 90/60/30 day alert bands all have entries.
  const expOff = [-12, 400, 520, 27, 610, 700, 240, 58, 330, 450, 150, 800, 380, 88, 560, 290, 660, 18, 480, 205, 75, 365, 545, 120, 430];
  let credSeq = 0, docSeq = 0;
  const hrProfiles = {};
  allEmp.forEach((e, i) => {
    const [deptId, grade, gender, nationality, basic, join, shift] = base[e.id];
    const doctor = /^MED-/.test(grade), nurse = /^NUR-/.test(grade), allied = /^AH-/.test(grade);
    const y = 1965 + int(0, 32), dob = `${y}-${pad(int(1, 12))}-${pad(int(1, 28))}`;
    const civilId = String(y < 2000 ? 2 : 3) + dob.slice(2, 4) + dob.slice(5, 7) + dob.slice(8, 10) + String(int(10000, 99999));
    const bank = banks[i % banks.length];
    const iban = 'KW' + pad(int(10, 98)) + bank + String(int(1000000, 9999999)) + String(int(1000000, 9999999)) + String(int(10000000, 99999999));
    const allowances = [{ code: 'HRA', amount: Math.round(basic * (doctor ? 0.25 : 0.3) / 5) * 5 }, { code: 'TRN', amount: doctor ? 150 : basic > 1500 ? 120 : 60 }];
    if (doctor || allied) allowances.push({ code: 'CLN', amount: doctor ? 400 : 120 });
    if (nurse && shift !== 'D') allowances.push({ code: 'SHF', amount: 80 });
    if (doctor && grade !== 'MED-R') allowances.push({ code: 'CALL', amount: 250 });
    if (/ADM-4/.test(grade)) allowances.push({ code: 'PHN', amount: 30 });
    const licences = [];
    const addCred = (type) => {
      const off = expOff[credSeq % expOff.length] + (Math.floor(credSeq / expOff.length) * 3) % 9; credSeq++;
      const expiry = addDays(TODAY, off), years = type === 'BLS' || type === 'ACLS' || type === 'PALS' ? 2 : 1;
      licences.push({ id: 'hcr_' + pad(credSeq, 3), empId: e.id, type, number: credNo[type] + (type === 'MOH professional licence' ? (doctor ? 'D-' : nurse ? 'N-' : 'A-') : '') + int(10000, 99999), issuer: issuer[type],
        issued: addDays(expiry, -365 * years), expiry, scope: type === 'MOH professional licence' ? e.designation : '', renewals: [], reminders: off <= 90 ? [{ at: addDays(TODAY, -int(1, 20)) + ' 07:00', band: off <= 30 ? '30 days' : off <= 60 ? '60 days' : '90 days', to: 'HR and line manager' }] : [] });
    };
    if (doctor) { addCred('MOH professional licence'); addCred('BLS'); addCred('ACLS'); addCred('Malpractice insurance'); if (deptId === 'dp_02') addCred('PALS'); }
    else if (nurse) { addCred('MOH professional licence'); addCred('Nursing registration'); addCred('BLS'); if (grade === 'NUR-3') addCred('ACLS'); }
    else if (allied) { addCred('MOH professional licence'); addCred('BLS'); if (deptId === 'dp_10') addCred('Radiation safety certificate'); }
    const documents = [];
    const addDoc = (type, number, expiry, file) => { docSeq++; documents.push({ id: 'hdc_' + pad(docSeq, 3), type, number, expiry, file, uploadedBy: 'Bader Al-Azmi', uploadedAt: addDays(join < '2025-01-01' ? '2025-01-15' : join, int(0, 40)) + ' 10:' + pad(int(10, 59)) }); };
    const last = e.name.replace(/^Dr\.\s*/, '').split(' ').slice(-1)[0].toLowerCase().replace(/[^a-z]/g, '');
    addDoc('Civil ID copy', civilId, addDays(TODAY, int(40, 900)), `civil_id_${last}.pdf`);
    if (nationality !== 'Kuwaiti') { addDoc('Passport', String.fromCharCode(65 + (i % 26)) + int(1000000, 9999999), addDays(TODAY, int(200, 2400)), `passport_${last}.pdf`); addDoc('Residency (Article 18)', '18/' + int(100000, 999999), addDays(TODAY, i % 7 === 0 ? int(10, 70) : int(120, 700)), `residency_${last}.pdf`); }
    addDoc('Employment contract', 'CTR-' + join.slice(0, 4) + '-' + pad(i + 1, 3), '', `contract_${last}.pdf`);
    addDoc('Degree certificate', '', '', `degree_${last}.pdf`);
    hrProfiles[e.id] = {
      empId: e.id, deptId, grade, category: doctor ? 'Doctor' : nurse ? 'Nurse' : allied ? 'Allied health' : /^SUP/.test(grade) ? 'Support' : 'Administration',
      gender, nationality, dob, civilId, mobile: '+965 ' + int(5, 9) + int(100, 999) + ' ' + int(1000, 9999),
      email: (e.name.replace(/^Dr\.\s*/, '').split(' ')[0][0] + '.' + last).toLowerCase() + (e.branchId === 'br_04' ? '@alnoor.example' : '@tibbihealth.example'),
      address: `Block ${int(1, 12)}, Street ${int(1, 40)}, ${['Salmiya', 'Hawalli', 'Jabriya', 'Mangaf', 'Farwaniya', 'Rumaithiya', 'Fintas', 'Mahboula'][i % 8]}`,
      emergency: { name: '', relation: ['Spouse', 'Brother', 'Sister', 'Father'][i % 4], phone: '+965 ' + int(5, 9) + int(100, 999) + ' ' + int(1000, 9999) },
      joinDate: join, contract: nationality === 'Kuwaiti' ? 'Permanent' : 'Fixed term, 2 years renewable', probationEnd: addDays(join, 100), managerId: null, shift,
      basic, allowances, bank, iban, payMode: 'Bank transfer', alOpening: int(2, 18), licences, documents,
      basicHistory: [],
    };
  });
  // Line managers, salary increments and separations.
  Object.values(hrProfiles).forEach(p => { p.managerId = { dp_03: 'emp_1004', dp_01: 'emp_1002', dp_02: 'emp_1003', dp_04: 'emp_1006', dp_05: 'emp_2024', dp_06: 'emp_2008', dp_08: 'emp_1005', dp_07: 'emp_1013', dp_09: 'emp_1010', dp_10: 'emp_2007' }[p.deptId] || null; if (p.managerId === p.empId) p.managerId = p.deptId === 'dp_05' ? 'emp_1001' : null; });
  hrProfiles.emp_2009.basicHistory = [{ from: '2026-11-01', before: 680, after: 720, reason: 'Annual increment' }];
  hrProfiles.emp_2018.basicHistory = [{ from: '2026-11-01', before: 1100, after: 1180, reason: 'Promotion to clinical pharmacist' }];
  hrProfiles.emp_1004.emergency.name = 'Jose Santos';
  allEmp.forEach((e, i) => { if (!hrProfiles[e.id].emergency.name) hrProfiles[e.id].emergency.name = ['Ahmad', 'Ali', 'Mariam', 'Joseph', 'Sana', 'Rahul'][i % 6] + ' ' + e.name.split(' ').slice(-1)[0]; });

  /* ---------- Leave ---------- */
  const L = (no, empId, type, from, to, days, status, requestedBy, at, extra) => Object.assign({ id: 'hlv_' + no, no: 'LV-' + no, empId, type, from, to, days, reason: '', status, requestedBy, requestedAt: at, decidedBy: '', decidedAt: '', decisionNote: '' }, extra || {});
  const hrLeaves = [
    L(1001, 'emp_2009', 'AL', '2026-11-15', '2026-11-19', 5, 'Approved', 'Grace Fernandes', '2026-10-28 09:10', { reason: 'Family visit to Mangalore', decidedBy: 'Maria Santos', decidedAt: '2026-10-29 11:00' }),
    L(1002, 'emp_1007', 'AL', '2026-11-08', '2026-11-12', 5, 'Approved', 'Rajesh Kumar', '2026-10-20 08:40', { reason: 'Personal', decidedBy: 'Bader Al-Azmi', decidedAt: '2026-10-21 10:15' }),
    L(1003, 'emp_2019', 'SL', '2026-11-23', '2026-11-24', 2, 'Approved', 'Dalia Mostafa', '2026-11-23 07:45', { reason: 'Acute gastroenteritis, certificate attached', decidedBy: 'Dr. Lina Haddad', decidedAt: '2026-11-23 09:00' }),
    L(1004, 'emp_2003', 'AL', '2026-12-06', '2026-12-17', 10, 'Pending approval', 'Dr. Priya Nair', '2026-11-18 13:20', { reason: 'Annual vacation to India' }),
    L(1005, 'emp_2010', 'AL', '2026-12-20', '2026-12-31', 10, 'Pending approval', 'Anjali Menon', '2026-11-21 16:05', { reason: 'Year-end vacation' }),
    L(1006, 'emp_1005', 'EL', '2026-11-26', '2026-11-26', 1, 'Pending approval', 'Omar Haddad', '2026-11-25 08:05', { reason: 'Family emergency' }),
    L(1007, 'emp_2021', 'UL', '2026-11-18', '2026-11-19', 2, 'Approved', 'Kareem Nassar', '2026-11-10 10:30', { reason: 'Residency renewal travel', decidedBy: 'Bader Al-Azmi', decidedAt: '2026-11-11 09:20' }),
    L(1008, 'emp_2002', 'AL', '2026-08-02', '2026-08-20', 15, 'Approved', 'Dr. Tariq Mahmoud', '2026-07-01 12:00', { decidedBy: 'Dr. Khalid Al-Rashidi', decidedAt: '2026-07-02 08:30' }),
    L(1009, 'emp_1004', 'AL', '2026-07-05', '2026-07-30', 20, 'Approved', 'Maria Santos', '2026-06-01 09:00', { decidedBy: 'Bader Al-Azmi', decidedAt: '2026-06-02 10:00' }),
    L(1010, 'emp_2026', 'AL', '2026-11-29', '2026-12-03', 5, 'Rejected', 'Hessa Al-Hajri', '2026-11-16 11:40', { reason: 'Personal', decidedBy: 'Omar Haddad', decidedAt: '2026-11-17 09:00', decisionNote: 'Front office below minimum staffing that week. Please choose other dates.' }),
    L(1011, 'emp_2027', 'CL', '2026-10-12', '2026-10-12', 1, 'Cancelled', 'Imran Khan', '2026-10-11 18:00', { decidedBy: 'Imran Khan', decidedAt: '2026-10-11 20:10', decisionNote: 'No longer needed' }),
    L(1012, 'emp_2016', 'ML', '2026-10-04', '2026-12-12', 70, 'Approved', 'Bader Al-Azmi', '2026-09-20 10:00', { reason: 'Expected delivery 6 October', decidedBy: 'Maria Santos', decidedAt: '2026-09-21 08:30' }),
    L(1013, 'emp_1011', 'AL', '2026-12-24', '2026-12-31', 6, 'Pending approval', 'Layla Hussain', '2026-11-24 15:30', { reason: 'Year-end travel' }),
    L(1014, 'emp_2013', 'AL', '2026-12-13', '2026-12-17', 5, 'Pending approval', 'Mercy Thomas', '2026-11-22 10:10', { reason: 'Wedding in family' }),
  ];
  const onLeave = (empId, d) => hrLeaves.find(l => l.empId === empId && l.status === 'Approved' && l.from <= d && l.to >= d);

  /* ---------- Rosters (Nursing, weeks start on Sunday) ---------- */
  const nurses = allEmp.filter(e => hrProfiles[e.id].deptId === 'dp_03').map(e => e.id);
  const P = ['M', 'M', 'E', 'E', 'N', 'O', 'O'];
  const weekStarts = ['2026-11-01', '2026-11-08', '2026-11-15', '2026-11-22', '2026-11-29'];
  const rosterCode = {};
  const hrRosters = weekStarts.map((ws, w) => {
    const cells = {};
    nurses.forEach((id, i) => {
      cells[id] = Array.from({ length: 7 }, (_, k) => {
        const d = addDays(ws, k), lv = onLeave(id, d);
        if (lv) return lv.type === 'ML' ? 'ML' : 'AL';
        if (id === 'emp_1004') return k <= 4 ? 'D' : 'O';
        return P[(k + i * 2 + w) % 7];
      });
    });
    if (ws === '2026-11-29') { cells.emp_2011[1] = 'E'; cells.emp_2011[2] = 'M'; cells.emp_2013[3] = 'M+E'; }
    nurses.forEach(id => cells[id].forEach((c, k) => { rosterCode[id + '|' + addDays(ws, k)] = c; }));
    const pub = ws !== '2026-11-29';
    return { id: 'hro_' + (w + 1), no: 'ROS-NUR-' + ws.replace(/-/g, ''), deptId: 'dp_03', weekStart: ws, status: pub ? 'Published' : 'Draft', version: 1, cells,
      createdBy: 'Maria Santos', createdAt: addDays(ws, -10) + ' 10:00', submittedBy: pub ? 'Maria Santos' : '', submittedAt: pub ? addDays(ws, -8) + ' 12:00' : '', approvedBy: pub ? 'Bader Al-Azmi' : '', approvedAt: pub ? addDays(ws, -7) + ' 09:30' : '', note: '' };
  });

  /* ---------- Attendance (1 Nov to today) ---------- */
  const shiftOf = (c) => hrShifts.find(s => s.code === c);
  const toMin = (t) => +t.slice(0, 2) * 60 + +t.slice(3, 5);
  const hrAttendance = [];
  let attSeq = 0;
  for (let d = '2026-11-01'; d <= TODAY; d = addDays(d, 1)) {
    allEmp.forEach(e => {
      const p = hrProfiles[e.id];
      if (p.joinDate > d || (e.lastWorkingDate && e.lastWorkingDate < d) || e.hrStatus === 'Separated') return;
      const isNurse = nurses.includes(e.id) && e.id !== 'emp_1004';
      let code = isNurse ? rosterCode[e.id + '|' + d] : (dow(d) >= 5 ? 'O' : p.shift === 'L' && dow(d) === 4 ? 'O' : p.shift);
      const lv = onLeave(e.id, d);
      if (lv && !isNurse && dow(d) < 5) { attSeq++; hrAttendance.push({ id: 'hat_' + attSeq, empId: e.id, date: d, shift: p.shift, in: '', out: '', source: 'Leave', leave: lv.type, note: lv.no }); return; }
      if (!code || code.length > 3 && code !== 'M+E') return;
      const sh = shiftOf(code.split('+')[0]);
      if (!sh || sh.type !== 'Work') { if (sh && sh.type === 'Leave') { attSeq++; hrAttendance.push({ id: 'hat_' + attSeq, empId: e.id, date: d, shift: code, in: '', out: '', source: 'Leave', leave: code }); } return; }
      if (d === TODAY && toMin(sh.start) > 13 * 60) return;     // later shifts today have not started
      const r = rnd();
      const st = toMin(sh.start), en = toMin(sh.end) + (toMin(sh.end) <= st ? 1440 : 0);
      attSeq++;
      const rec = { id: 'hat_' + attSeq, empId: e.id, date: d, shift: code.split('+')[0], in: '', out: '', source: rnd() < 0.85 ? 'Device' : 'Manual' };
      if (r < (d === TODAY ? 0.06 : 0.025)) { /* absent */ }
      else {
        rec.in = hm(r < 0.05 ? st + int(12, 48) : st - int(2, 14));
        rec.out = d === TODAY ? '' : r < 0.065 ? "" : hm(en + int(0, 18));
      }
      hrAttendance.push(rec);
    });
  }
  // One regularized exception for the history.
  const ex = hrAttendance.find(a => a.date === '2026-11-03' && a.in && !a.out);
  if (ex) { ex.reg = { type: 'Missing punch', out: '16:05', reason: 'Device offline at exit gate; confirmed by supervisor', by: 'Bader Al-Azmi', at: '2026-11-04 09:12' }; }
  const hrAttImports = [
    { id: 'hai_1', no: 'IMP-1101', device: 'ZK Gate A (Salmiya main entrance)', file: 'zk_gate_a_2026-11-23.csv', rows: 41, imported: 39, rejected: 2, by: 'Vinod Pillai', at: '2026-11-24 07:30', period: '2026-11-23' },
    { id: 'hai_2', no: 'IMP-1102', device: 'ZK Gate B (staff entrance)', file: 'zk_gate_b_2026-11-24.csv', rows: 40, imported: 40, rejected: 0, by: 'Vinod Pillai', at: '2026-11-25 07:25', period: '2026-11-24' },
    { id: 'hai_3', no: 'IMP-1100', device: 'Suprema Hawalli clinic', file: 'hawalli_week47.csv', rows: 15, imported: 14, rejected: 1, by: 'Omar Haddad', at: '2026-11-21 08:10', period: '2026-11-16 to 2026-11-20' },
  ];

  /* ---------- Overtime ---------- */
  const OT = (n, empId, date, hours, type, status, by, extra) => Object.assign({ id: 'hot_' + n, no: 'OT-' + n, empId, date, hours, type, reason: '', status, requestedBy: by, requestedAt: date + ' 18:30', decidedBy: '', decidedAt: '', payrollMonth: date.slice(0, 7) }, extra || {});
  const hrOvertime = [
    OT(5001, 'emp_2010', '2026-09-14', 4, 'Normal', 'Paid', 'Maria Santos', { reason: 'Covered sick colleague', decidedBy: 'Bader Al-Azmi', decidedAt: '2026-09-15 09:00' }),
    OT(5002, 'emp_2006', '2026-09-19', 8, 'Rest day', 'Paid', 'Dr. Aisha Al-Mansour', { reason: 'ER surge cover', decidedBy: 'Dr. Khalid Al-Rashidi', decidedAt: '2026-09-20 08:00' }),
    OT(5003, 'emp_2011', '2026-10-08', 6, 'Normal', 'Paid', 'Maria Santos', { reason: 'Ward 3 staffing gap', decidedBy: 'Bader Al-Azmi', decidedAt: '2026-10-09 09:00' }),
    OT(5004, 'emp_2019', '2026-10-17', 5, 'Rest day', 'Paid', 'Dr. Lina Haddad', { reason: 'Analyzer validation', decidedBy: 'Bader Al-Azmi', decidedAt: '2026-10-18 10:00' }),
    OT(5005, 'emp_2028', '2026-10-24', 6, 'Rest day', 'Paid', 'Bader Al-Azmi', { reason: 'Deep cleaning, ICU', decidedBy: 'Sara Al-Mutairi', decidedAt: '2026-10-25 08:30' }),
    OT(5006, 'emp_2010', '2026-11-05', 6, 'Normal', 'Approved', 'Maria Santos', { reason: 'Covered evening shift', decidedBy: 'Bader Al-Azmi', decidedAt: '2026-11-06 09:00' }),
    OT(5007, 'emp_2011', '2026-11-07', 8, 'Rest day', 'Approved', 'Maria Santos', { reason: 'Ward 2 admissions surge', decidedBy: 'Bader Al-Azmi', decidedAt: '2026-11-08 08:40' }),
    OT(5008, 'emp_2019', '2026-11-11', 4, 'Normal', 'Approved', 'Dr. Lina Haddad', { reason: 'Backlog of stat samples', decidedBy: 'Bader Al-Azmi', decidedAt: '2026-11-12 09:00' }),
    OT(5009, 'emp_2006', '2026-11-14', 6, 'Rest day', 'Approved', 'Dr. Aisha Al-Mansour', { reason: 'ER cover, weekend', decidedBy: 'Dr. Khalid Al-Rashidi', decidedAt: '2026-11-15 08:00' }),
    OT(5010, 'emp_2021', '2026-11-12', 3, 'Normal', 'Approved', 'Dr. Mahmoud Saleh', { reason: 'CT list overrun', decidedBy: 'Bader Al-Azmi', decidedAt: '2026-11-13 09:30' }),
    OT(5011, 'emp_2013', '2026-11-20', 4, 'Rest day', 'Pending approval', 'Maria Santos', { reason: 'Covered night handover' }),
    OT(5012, 'emp_2028', '2026-11-21', 5, 'Rest day', 'Pending approval', 'Bader Al-Azmi', { reason: 'Ward 4 move' }),
    OT(5013, 'emp_2030', '2026-11-24', 6, 'Normal', 'Pending approval', 'Dr. Yousef Al-Shammari', { reason: 'Ventilator preventive maintenance' }),
    OT(5014, 'emp_2027', '2026-11-18', 3, 'Normal', 'Rejected', 'Imran Khan', { reason: 'Records scanning', decidedBy: 'Bader Al-Azmi', decidedAt: '2026-11-19 10:00', decisionNote: 'Not pre-approved by the manager.' }),
  ];

  /* ---------- Loans ---------- */
  const months = (start, n) => Array.from({ length: n }, (_, i) => { const [y, m] = start.split('-').map(Number); const t = y * 12 + (m - 1) + i; return Math.floor(t / 12) + '-' + pad(t % 12 + 1); });
  const LN = (n, empId, type, amount, inst, start, status, by, at, extra) => Object.assign({ id: 'hln_' + n, no: 'LN-' + n, empId, type, amount, instalments: inst, startMonth: start, status, purpose: '', requestedBy: by, requestedAt: at, decidedBy: '', decidedAt: '', decisionNote: '', paid: [] }, extra || {});
  const hrLoans = [
    LN(1001, 'emp_1004', 'PERS', 1800, 12, '2026-06', 'Active', 'Maria Santos', '2026-05-12 10:00', { purpose: 'Children school fees', decidedBy: 'Bader Al-Azmi', decidedAt: '2026-05-14 09:00', paid: months('2026-06', 5) }),
    LN(1002, 'emp_1007', 'ADV', 400, 2, '2026-10', 'Active', 'Rajesh Kumar', '2026-09-28 08:30', { purpose: 'Travel advance', decidedBy: 'Bader Al-Azmi', decidedAt: '2026-09-29 10:00', paid: ['2026-10'] }),
    LN(1003, 'emp_2011', 'PERS', 900, 6, '2026-12', 'Pending approval', 'Vinod Pillai', '2026-11-22 11:15', { purpose: 'Family medical expenses in Manila' }),
    LN(1004, 'emp_2009', 'EMRG', 600, 6, '2026-03', 'Closed', 'Grace Fernandes', '2026-02-20 09:00', { purpose: 'Father surgery', decidedBy: 'Bader Al-Azmi', decidedAt: '2026-02-22 10:00', paid: months('2026-03', 6) }),
    LN(1005, 'emp_2027', 'PERS', 3200, 24, '2026-12', 'Rejected', 'Imran Khan', '2026-11-10 14:00', { purpose: 'Car purchase', decidedBy: 'Bader Al-Azmi', decidedAt: '2026-11-11 09:40', decisionNote: 'Exceeds 4 times basic salary for this loan type.' }),
    LN(1006, 'emp_1006', 'PERS', 1200, 12, '2026-03', 'Active', 'Ahmed Farouk', '2026-02-15 12:00', { purpose: 'Apartment furnishing', decidedBy: 'Bader Al-Azmi', decidedAt: '2026-02-17 09:00', paid: months('2026-03', 8) }),
    LN(1007, 'emp_2015', 'HOUS', 1500, 15, '2026-09', 'Active', 'Sheeba Varghese', '2026-08-18 10:20', { purpose: 'Rent deposit, Mangaf', decidedBy: 'Bader Al-Azmi', decidedAt: '2026-08-19 08:50', paid: months('2026-09', 2) }),
  ];

  /* ---------- Payroll runs (lines are calculated by hr.js on first load) ---------- */
  const hrPayrollRuns = [
    { id: 'hpr_2609', no: 'PR-2026-09', month: '2026-09', status: 'Posted', lines: null, createdBy: 'Vinod Pillai', createdAt: '2026-09-20 09:00', calculatedAt: '2026-09-23 10:00', reviewedBy: 'Vinod Pillai', reviewedAt: '2026-09-24 11:00', approvedBy: 'Bader Al-Azmi', approvedAt: '2026-09-25 09:30', postedBy: 'Vinod Pillai', postedAt: '2026-09-26 12:00', payDate: '2026-09-28', journal: 'JV-26-0082' },
    { id: 'hpr_2610', no: 'PR-2026-10', month: '2026-10', status: 'Posted', lines: null, createdBy: 'Vinod Pillai', createdAt: '2026-10-20 09:00', calculatedAt: '2026-10-23 10:00', reviewedBy: 'Vinod Pillai', reviewedAt: '2026-10-24 11:00', approvedBy: 'Bader Al-Azmi', approvedAt: '2026-10-25 09:30', postedBy: 'Vinod Pillai', postedAt: '2026-10-26 12:00', payDate: '2026-10-28', journal: 'JV-26-0092' },
    { id: 'hpr_2611', no: 'PR-2026-11', month: '2026-11', status: 'Pending approval', lines: null, createdBy: 'Vinod Pillai', createdAt: '2026-11-20 09:00', calculatedAt: '2026-11-24 16:00', calculatedBy: 'Vinod Pillai', reviewedBy: 'Vinod Pillai', reviewedAt: '2026-11-24 17:10', payDate: '2026-11-29' },
  ];

  /* ---------- End of service ---------- */
  const hrEosb = [
    { id: 'heo_1001', no: 'EOS-1001', empId: 'emp_1009', reason: 'Resignation', lastDay: '2026-10-31', unpaidDays: 0, notes: 'Resigned with 30 days notice. Clearance completed.', status: 'Paid', createdBy: 'Vinod Pillai', createdAt: '2026-10-25 10:00', approvedBy: 'Bader Al-Azmi', approvedAt: '2026-10-28 09:00', paidAt: '2026-11-02', final: null },
    { id: 'heo_1002', no: 'EOS-1002', empId: 'emp_1006', reason: 'Resignation', lastDay: '2026-11-30', unpaidDays: 0, notes: 'Resignation letter dated 1 Nov 2026. Notice served.', status: 'Pending approval', createdBy: 'Vinod Pillai', createdAt: '2026-11-21 14:20', approvedBy: '', approvedAt: '', final: null },
  ];

  const hrPayslipMails = [];
  const hrBankFiles = [
    { id: 'hbf_1', no: 'BNK-2026-09', month: '2026-09', format: 'WPS-like CSV (draft)', rows: 0, total: 0, by: 'Vinod Pillai', at: '2026-09-26 13:00' },
    { id: 'hbf_2', no: 'BNK-2026-10', month: '2026-10', format: 'WPS-like CSV (draft)', rows: 0, total: 0, by: 'Vinod Pillai', at: '2026-10-26 13:00' },
  ];

  Object.assign(S, { hrStaff, hrProfiles, hrGrades, hrDesignations, hrLeaveTypes, hrPayComponents, hrShifts, hrLoanTypes, hrIndemnityRules, hrSettings,
    hrRosters, hrAttendance, hrAttImports, hrLeaves, hrOvertime, hrLoans, hrPayrollRuns, hrEosb, hrPayslipMails, hrBankFiles });
})();
