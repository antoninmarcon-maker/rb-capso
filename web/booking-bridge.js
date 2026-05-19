// Synchronise le calendrier public (rb-capso.com) avec les vraies donnees Supabase.
// Le formulaire de reservation submit directement via submitCalendarBooking dans index.html.
// Ce bridge ne fait QUE pousser les reservations + blocages dans localStorage au bon format V2.

(function () {
  const SUPABASE_URL = 'https://bbjpjbviehsxshvzkvla.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJianBqYnZpZWhzeHNodnprdmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MDEzODEsImV4cCI6MjA5MzQ3NzM4MX0.pfMilOBbViTbW92gEXgPjG3MkpbVgN_SL455I9o-9mw';
  const LS_KEY = 'rbcapso_reservations_v2';

  let sb = null;

  function loadSupabaseSDK() {
    return new Promise((resolve, reject) => {
      if (window.supabase && window.supabase.createClient) return resolve(window.supabase);
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      s.async = true;
      s.onload = () => resolve(window.supabase);
      s.onerror = () => reject(new Error('Failed to load supabase-js'));
      document.head.appendChild(s);
    });
  }

  async function init() {
    try {
      const lib = await loadSupabaseSDK();
      sb = lib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      await syncFromSupabase();
    } catch (err) {
      console.error('[booking-bridge] init failed:', err);
    }
  }

  // Tire reservations + blocages depuis Supabase et ecrase localStorage au format V2.
  // Format attendu par index.html : {id, vehicle, prenom, nom, tel, email, start, end, statut, notes, forfait}.
  async function syncFromSupabase() {
    const [resasResp, blocksResp] = await Promise.all([
      sb.from('reservations_public').select('*'),
      sb.from('availability_blocks').select('*'),
    ]);

    if (resasResp.error) console.warn('[booking-bridge] reservations:', resasResp.error.message);
    if (blocksResp.error) console.warn('[booking-bridge] blocks:', blocksResp.error.message);

    const resas = resasResp.data || [];
    const blocks = blocksResp.data || [];
    const merged = [];

    for (const r of resas) {
      merged.push({
        id: r.id,
        vehicle: r.vehicle,
        prenom: r.prenom || 'Reserve',
        nom: '',
        tel: '',
        email: '',
        start: r.start_date,
        end: r.end_date,
        statut: mapStatus(r.status),
        notes: '',
        forfait: r.forfait || '',
      });
    }

    for (const b of blocks) {
      merged.push({
        id: 'block-' + b.id,
        vehicle: b.vehicle,
        prenom: 'Indispo',
        nom: '',
        tel: '',
        email: '',
        start: b.start_date,
        end: b.end_date,
        statut: 'confirmee',
        notes: b.reason || '',
        forfait: '',
      });
    }

    localStorage.setItem(LS_KEY, JSON.stringify(merged));

    if (typeof window.renderCal === 'function') {
      try { window.renderCal(); } catch (e) { /* renderCal peut ne pas etre pret */ }
    }
  }

  function mapStatus(s) {
    if (s === 'pending') return 'option';
    if (s === 'confirmee') return 'confirmee';
    if (s === 'completee') return 'confirmee';
    if (s === 'option') return 'option';
    return 'option';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
