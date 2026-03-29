// ══════════════════════════════════════════════════════════════════
// Les Roches Retreat — Netlify Scheduled Function: iCal sync
// Runs every 2 hours via cron schedule in netlify.toml
// Fetches Airbnb/Booking.com iCal feeds and upserts blocked_dates
// ══════════════════════════════════════════════════════════════════

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // service role key (admin)

exports.handler = async function(event, context) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars');
    return { statusCode: 500, body: 'Missing env vars' };
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const startTime = Date.now();
  const results = [];

  try {
    // Fetch all villas with their iCal URLs
    const { data: icalRows, error: icalErr } = await sb
      .from('airbnb_ical')
      .select('villa_id, ical_url')
      .not('ical_url', 'is', null);

    if (icalErr) throw icalErr;
    if (!icalRows || icalRows.length === 0) {
      console.log('No iCal URLs configured');
      return { statusCode: 200, body: JSON.stringify({ message: 'No iCal URLs configured' }) };
    }

    for (const row of icalRows) {
      try {
        const dates = await fetchAndParseICal(row.ical_url, row.villa_id);
        if (dates.length === 0) {
          results.push({ villa_id: row.villa_id, synced: 0 });
          continue;
        }

        // Remove old airbnb-sourced blocked dates for this villa, then re-insert
        const { error: delErr } = await sb
          .from('blocked_dates')
          .delete()
          .eq('villa_id', row.villa_id)
          .eq('source', 'airbnb');

        if (delErr) throw delErr;

        // Batch upsert new blocked dates
        const rows = dates.map(d => ({
          villa_id: row.villa_id,
          date: d,
          source: 'airbnb',
        }));

        // Insert in chunks of 500 to avoid payload limits
        for (let i = 0; i < rows.length; i += 500) {
          const chunk = rows.slice(i, i + 500);
          const { error: insErr } = await sb
            .from('blocked_dates')
            .upsert(chunk, { onConflict: 'villa_id,date', ignoreDuplicates: true });
          if (insErr) throw insErr;
        }

        // Update last_sync timestamp
        await sb
          .from('airbnb_ical')
          .update({ last_sync: new Date().toISOString() })
          .eq('villa_id', row.villa_id);

        results.push({ villa_id: row.villa_id, synced: dates.length });
        console.log(`[sync-ical] ${row.villa_id}: synced ${dates.length} dates`);

      } catch (villaErr) {
        console.error(`[sync-ical] ${row.villa_id} failed:`, villaErr.message);
        results.push({ villa_id: row.villa_id, error: villaErr.message });
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(`[sync-ical] Completed in ${elapsed}ms`, results);
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, elapsed_ms: elapsed, results })
    };

  } catch (err) {
    console.error('[sync-ical] Fatal error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

// ─── iCal parser ────────────────────────────────────────────────────────────
// Minimal VCALENDAR/VEVENT parser — no external dependencies
async function fetchAndParseICal(url, villa_id) {
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'LesRochesRetreat/1.0 iCal-Sync' },
    signal: AbortSignal.timeout(15000)
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching ${url}`);
  const text = await resp.text();

  const dates = new Set();
  const lines = text.replace(/\r\n[ \t]/g, '').split(/\r?\n/);
  let inEvent = false;
  let dtstart = null, dtend = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { inEvent = true; dtstart = null; dtend = null; }
    else if (line === 'END:VEVENT') {
      if (inEvent && dtstart && dtend) {
        // Enumerate all nights between dtstart and dtend (exclusive of checkout)
        const cur = new Date(dtstart + 'T00:00:00Z');
        const end = new Date(dtend + 'T00:00:00Z');
        while (cur < end) {
          dates.add(cur.toISOString().split('T')[0]);
          cur.setUTCDate(cur.getUTCDate() + 1);
        }
      }
      inEvent = false;
    } else if (inEvent) {
      if (line.startsWith('DTSTART')) {
        dtstart = parseICalDate(line.split(':')[1] || line.split(';')[1]?.split(':')[1]);
      } else if (line.startsWith('DTEND')) {
        dtend = parseICalDate(line.split(':')[1] || line.split(';')[1]?.split(':')[1]);
      }
    }
  }

  return Array.from(dates).sort();
}

function parseICalDate(str) {
  if (!str) return null;
  str = str.trim();
  // DATE-TIME: 20240115T150000Z → 2024-01-15
  // DATE: 20240115 → 2024-01-15
  const m = str.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}
