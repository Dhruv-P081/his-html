/* App Settings seed (Administration > System > App Settings): portal colours,
 * release versions for every channel, and maintenance mode. Dummy data only.
 * Loaded after data-core.js. Adds window.SEED.appSettings. */
(function () {
  const S = window.SEED;
  S.appSettings = {
    schema: 2,
    theme: { preset: 'navy', primary: '', rail: '', radius: 'default', updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-11-02 10:15' },
    channels: [
      { id: 'web', name: 'Staff web portal', icon: 'monitor', current: '1.4.2', build: '2026.11.24.1', min: '', force: false, releasedAt: '2026-11-24', env: 'Production',
        live: true, store: 'https://his.tibbihealth.example', maint: false, msgEn: 'The staff portal is being updated. Please try again in a few minutes.', msgAr: 'يتم تحديث بوابة الموظفين. يرجى المحاولة مرة أخرى بعد بضع دقائق.' },
      { id: 'android', name: 'Patient app · Android', icon: 'smartphone', current: '1.3.0', build: '130', min: '1.2.0', force: false, releasedAt: '2026-11-18', env: 'Google Play',
        live: true, store: 'https://play.google.com/store/apps/details?id=com.tibbihealth.orbit', updateAvailable: false, maint: false, msgEn: "We're currently performing maintenance. Please check back shortly.", msgAr: 'نقوم حالياً بأعمال الصيانة. يرجى العودة بعد قليل.' },
      { id: 'ios', name: 'Patient app · iOS', icon: 'tablet-smartphone', current: '1.3.0', build: '130', min: '1.2.0', force: false, releasedAt: '2026-11-19', env: 'App Store',
        live: true, store: 'https://apps.apple.com/app/tibbi-orbit/id6741234567', updateAvailable: true, maint: false, msgEn: 'Back shortly — we are upgrading the app.', msgAr: '' },
      { id: 'api', name: 'Backend API', icon: 'server', current: '2.6.0', build: '2026.11.24.2', min: '', force: false, releasedAt: '2026-11-24', env: 'Production' },
    ],
    releases: [
      { id: 'rl_12', channel: 'web', version: '1.5.0', date: '2026-12-08', status: 'Scheduled', notes: 'Insurance e-claims batch export and Arabic print layouts.', by: 'Sara Al-Mutairi' },
      { id: 'rl_11', channel: 'web', version: '1.4.2', date: '2026-11-24', status: 'Live', notes: 'Pharmacy dispense fixes and faster patient search.', by: 'Sara Al-Mutairi' },
      { id: 'rl_10', channel: 'api', version: '2.6.0', date: '2026-11-24', status: 'Live', notes: 'HL7 lab result interface and audit export.', by: 'Tibbi IT Governance' },
      { id: 'rl_09', channel: 'ios', version: '1.3.0', date: '2026-11-19', status: 'Live', notes: 'Lab results with trends, family profiles.', by: 'Tibbi IT Governance' },
      { id: 'rl_08', channel: 'android', version: '1.3.0', date: '2026-11-18', status: 'Live', notes: 'Lab results with trends, family profiles.', by: 'Tibbi IT Governance' },
      { id: 'rl_07', channel: 'web', version: '1.4.1', date: '2026-11-10', status: 'Replaced', notes: 'Duty roster approval flow.', by: 'Sara Al-Mutairi' },
      { id: 'rl_06', channel: 'web', version: '1.4.0', date: '2026-11-03', status: 'Rolled back', notes: 'New billing screen. Rolled back after a rounding issue; fixed in 1.4.1.', by: 'Sara Al-Mutairi' },
      { id: 'rl_05', channel: 'android', version: '1.2.0', date: '2026-10-20', status: 'Replaced', notes: 'Appointment booking and online payment.', by: 'Tibbi IT Governance' },
      { id: 'rl_04', channel: 'ios', version: '1.2.0', date: '2026-10-21', status: 'Replaced', notes: 'Appointment booking and online payment.', by: 'Tibbi IT Governance' },
    ],
    /* Patient app push notifications, last 7 days (shown on App control). */
    push: { phones: 1284, people: 1102, sent: 9620, delivered: 9410, failed: 38, notSent: 172,
      reasons: [[124, 'the person has not signed in to the app on any phone yet (or signed out). The message waits in their in-app list.'], [48, 'notifications are turned off on the phone.']] },
    maintenance: {
      on: false, scope: ['web', 'android', 'ios'], from: '2026-11-29T01:00', to: '2026-11-29T03:00',
      msgEn: 'Tibbi Orbit is under planned maintenance. Please try again after 3:00 AM.',
      msgAr: 'نظام طبي أوربت تحت الصيانة المجدولة. يرجى المحاولة مرة أخرى بعد الساعة 3:00 صباحاً.',
      exemptRoles: ['ro_sys', 'ro_demo'], updatedBy: 'Sara Al-Mutairi', updatedAt: '2026-11-20 09:30',
    },
  };
})();
