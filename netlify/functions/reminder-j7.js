// ══════════════════════════════════════════════════════════════════
// Les Roches Retreat — Netlify Scheduled Function: J-7 reminder
// Runs every day at 09:00 UTC via cron schedule in netlify.toml
// Sends a pre-arrival email to guests whose check-in is in 7 days
// Uses EmailJS (same service as the booking confirmation emails)
// ══════════════════════════════════════════════════════════════════

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL        = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY= process.env.SUPABASE_SERVICE_KEY;
const EMAILJS_SERVICE_ID  = process.env.EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_J7 = process.env.EMAILJS_TEMPLATE_J7;   // J-7 template ID
const EMAILJS_PUBLIC_KEY  = process.env.EMAILJS_PUBLIC_KEY;     // public key (safe)

exports.handler = async function(event, context) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { statusCode: 500, body: 'Missing Supabase env vars' };
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Target date = today + 7 days
  const target = new Date();
  target.setUTCDate(target.getUTCDate() + 7);
  const targetDate = target.toISOString().split('T')[0];

  console.log(`[reminder-j7] Looking for reservations with checkin = ${targetDate}`);

  // Fetch confirmed reservations checking in in 7 days
  const { data: reservations, error } = await sb
    .from('reservations')
    .select('*')
    .eq('checkin', targetDate)
    .eq('status', 'confirmed');

  if (error) {
    console.error('[reminder-j7] Supabase error:', error.message);
    return { statusCode: 500, body: error.message };
  }

  if (!reservations || reservations.length === 0) {
    console.log('[reminder-j7] No reservations found for', targetDate);
    return { statusCode: 200, body: JSON.stringify({ sent: 0, date: targetDate }) };
  }

  const results = [];

  for (const res of reservations) {
    try {
      await sendJ7Email(res);
      results.push({ id: res.id, email: res.email, status: 'sent' });
      console.log(`[reminder-j7] Sent to ${res.email} (reservation ${res.id})`);

      // Mark email as sent by adding a note
      await sb
        .from('reservations')
        .update({ notes: (res.notes ? res.notes + '\n' : '') + `[J-7 email sent ${new Date().toISOString()}]` })
        .eq('id', res.id);

    } catch (err) {
      console.error(`[reminder-j7] Failed for reservation ${res.id}:`, err.message);
      results.push({ id: res.id, email: res.email, status: 'error', error: err.message });
    }
  }

  console.log('[reminder-j7] Done:', results);
  return { statusCode: 200, body: JSON.stringify({ sent: results.filter(r=>r.status==='sent').length, results }) };
};

// ─── EmailJS REST API ────────────────────────────────────────────────────────
async function sendJ7Email(res) {
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_J7 || !EMAILJS_PUBLIC_KEY) {
    console.warn('[reminder-j7] EmailJS not configured — skipping email');
    return;
  }

  const checkinDate = new Date(res.checkin + 'T00:00:00Z').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  const checkoutDate = res.checkout ? new Date(res.checkout + 'T00:00:00Z').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }) : '—';

  const templateParams = {
    guest_name:     (res.firstname || '') + ' ' + (res.lastname || ''),
    guest_email:    res.email,
    guest_whatsapp: res.whatsapp || '',
    villa_name:     res.villa_name || res.villa_id,
    checkin:        checkinDate,
    checkout:       checkoutDate,
    nights:         res.nights ? res.nights + ' nights' : '—',
    guests:         res.guests ? res.guests + ' guests' : '—',
    total:          res.total_usd ? '$' + res.total_usd.toLocaleString() : '—',
    deposit:        res.deposit_usd ? '$' + res.deposit_usd.toLocaleString() : '—',
    // Arrival info — customise in EmailJS template
    address:        'Santa Teresa, Puntarenas, Costa Rica',
    wifi_name:      'LesRoches_Guest',
    wifi_pass:      'contact-us',  // override in EmailJS template with actual password
    checkin_time:   '3:00 PM',
    checkout_time:  '11:00 AM',
    owner_whatsapp: process.env.OWNER_WHATSAPP || '+506 XXXX XXXX',
    owner_email:    process.env.OWNER_EMAIL || 'ian.gay@perrimond.eu',
  };

  const resp = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id:  EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_J7,
      user_id:     EMAILJS_PUBLIC_KEY,
      template_params: templateParams
    }),
    signal: AbortSignal.timeout(10000)
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`EmailJS HTTP ${resp.status}: ${txt}`);
  }
}
