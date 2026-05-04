// Bridge entre le HTML public (Romain) et le backend Supabase + Web3Forms.
// Ne modifie pas Romain's code : override window.submitBooking et synchronise
// localStorage avec les données réelles depuis Supabase.

(function () {
  const SUPABASE_URL = 'https://bbjpjbviehsxshvzkvla.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJianBqYnZpZWhzeHNodnprdmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MDEzODEsImV4cCI6MjA5MzQ3NzM4MX0.pfMilOBbViTbW92gEXgPjG3MkpbVgN_SL455I9o-9mw';
  const WEB3FORMS_KEY = 'a7079c4b-dcd4-4354-994e-f44e8f3e6047';

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
      overrideSubmitBooking();
    } catch (err) {
      console.error('[booking-bridge] init failed:', err);
    }
  }

  // Tire les résas + les blocages depuis Supabase et écrase localStorage
  // dans le format que Romain attend ({id, vehicle, prenom, ..., start, end, statut}).
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
        prenom: r.prenom || 'Réservé',
        nom: '',
        tel: '',
        email: '',
        start: r.start_date,
        end: r.end_date,
        statut: mapStatus(r.status),
        notes: '',
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
      });
    }

    localStorage.setItem('rbcapso_reservations', JSON.stringify(merged));

    if (typeof window.renderCal === 'function') {
      try { window.renderCal(); } catch (e) { /* renderCal may need an active modal */ }
    }
  }

  function mapStatus(s) {
    if (s === 'pending') return 'option';
    if (s === 'confirmee') return 'confirmee';
    if (s === 'completee') return 'confirmee';
    if (s === 'option') return 'option';
    return 'option';
  }

  function overrideSubmitBooking() {
    const orig = window.submitBooking;
    if (typeof orig !== 'function') {
      console.warn('[booking-bridge] window.submitBooking absent — override skipped');
      return;
    }

    window.submitBooking = async function () {
      const prenom = (document.getElementById('bPrenom') || {}).value;
      const nom    = (document.getElementById('bNom')    || {}).value;
      const email  = (document.getElementById('bEmail')  || {}).value;
      const tel    = (document.getElementById('bTel')    || {}).value;

      const data = {
        vehicle: window.vId,
        prenom: (prenom || '').trim(),
        nom: (nom || '').trim(),
        email: (email || '').trim(),
        tel: (tel || '').trim(),
        start: window.startD,
        end:   window.endD,
      };

      if (!data.prenom || !data.nom || !data.email || !data.tel || !data.start || !data.end) {
        return orig.call(this);
      }
      if (!['penelop', 'peggy', 'tente'].includes(data.vehicle)) {
        if (typeof window.showToast === 'function') window.showToast('⚠️ Véhicule invalide');
        return;
      }

      let supabaseOk = false;
      try {
        const { error } = await sb.rpc('submit_booking', {
          p_vehicle: data.vehicle,
          p_prenom: data.prenom,
          p_nom: data.nom,
          p_tel: data.tel,
          p_email: data.email,
          p_start: data.start,
          p_end: data.end,
          p_notes: null,
        });
        if (error) throw error;
        supabaseOk = true;
      } catch (err) {
        console.error('[booking-bridge] supabase submit failed:', err);
        if (typeof window.showToast === 'function') {
          window.showToast('❌ Erreur — appelez-nous ou réessayez dans quelques minutes');
        }
        return;
      }

      if (supabaseOk) {
        sendNotificationEmail(data).catch((err) =>
          console.warn('[booking-bridge] email notif failed:', err)
        );
      }

      orig.call(this);
    };
  }

  function sendNotificationEmail(data) {
    return fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: `Nouvelle demande: ${data.vehicle} ${data.start} → ${data.end}`,
        from_name: 'rb-capso.com',
        email: data.email,
        message:
          `Nouvelle demande de réservation reçue depuis rb-capso.com\n\n` +
          `Van : ${data.vehicle}\n` +
          `Dates : ${data.start} au ${data.end}\n` +
          `Client : ${data.prenom} ${data.nom}\n` +
          `Tél : ${data.tel}\n` +
          `Email : ${data.email}\n\n` +
          `→ Confirmer ou rejeter dans /calendar puis répondre au client sous 24h.`,
      }),
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
