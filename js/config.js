// ══════════════════════════════════════════════════════════════
// LES ROCHES — Supabase Configuration
// ══════════════════════════════════════════════════════════════

const SUPABASE_URL  = 'https://vrufclzcaswkdgrffdwm.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZydWZjbHpjYXN3a2RncmZmZHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTE2MjgsImV4cCI6MjA4OTg2NzYyOH0.cHllj6HZms7qf5PVc3LPy057r3rvCv6JyjfAfVlH34E';


/* Les Roches - disponibilites Beds24 (availability.json, sync auto) */
;(function(){function init(){if(!document.getElementById("sb-checkin"))return;var mm=document.documentElement.innerHTML.match(/booking2\.php\?propid=(\d+)/);if(!mm)return;var PROPID=mm[1],TODAY=new Date().toISOString().slice(0,10),availSet=null;function applyAll(){if(!availSet)return;var a=(document.getElementById("sb-checkin")||{}).value||"",b=(document.getElementById("sb-checkout")||{}).value||"",pc=a&&!b;document.querySelectorAll(".lrp-day[data-date]").forEach(function(c){var d=c.getAttribute("data-date");if(!d)return;var ok=pc?(d>a&&availSet.has(d)):(d>=TODAY&&availSet.has(d));if(ok)c.classList.remove("lrp-disabled");else c.classList.add("lrp-disabled");});}var pend=false;function sched(){if(pend)return;pend=true;setTimeout(function(){pend=false;applyAll();},30);}fetch("/availability.json?cb="+Date.now(),{cache:"no-store"}).then(function(r){return r.json();}).then(function(j){var v=j.villas&&j.villas[PROPID];if(!v||!v.available)return;availSet=new Set(v.available);applyAll();new MutationObserver(sched).observe(document.body,{childList:true,subtree:true});}).catch(function(){});}if(document.readyState!=="loading")init();else document.addEventListener("DOMContentLoaded",init);})();
