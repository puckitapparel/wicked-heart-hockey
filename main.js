document.documentElement.classList.add('js');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// hero shutter
const sh = document.querySelector('.shutter');
requestAnimationFrame(() => setTimeout(() => sh && sh.classList.add('open'), 150));

// staggered entrances per section
const groups = [
  ['.about', '.about-title, .about-cols p'],
  ['.values', '.values-head h2, .values-head p'],
  ['.programs', '.programs-title, .programs-lede, .fit-btn'],
  ['.faq', '.band h2, .band h3, .band p'],
  ['.status', '.status-tag, .status-copy, .status-link'],
  ['.hs', '.hs-kicker, .hs-title, .hs-lede, .hs-card, .hs-ice'],
  ['.join', '.join-title span, .join-intro p, .join-points li'],
  ['.foot', '.foot-logo, .foot-menu nav a, .foot-blocks p'],
];
const io = new IntersectionObserver((es) => {
  es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { rootMargin: '0px 0px -8% 0px' });
groups.forEach(([sec, sel]) => {
  document.querySelectorAll(sec).forEach(s => {
    s.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add('rv');
      el.style.transitionDelay = (Math.min(i, 10) * 75) + 'ms';
      io.observe(el);
    });
  });
});
document.querySelectorAll('.verb-panel').forEach(p => io.observe(p));

// values fan: deal cards as the wrapper scrolls (desktop only)
const values = document.querySelector('.values');
const cards = [...document.querySelectorAll('.card')];
const wide = matchMedia('(min-width: 1181px)');
function deal() {
  if (!wide.matches || reduce) { cards.forEach(c => c.classList.remove('pending')); return; }
  const r = values.getBoundingClientRect();
  const total = values.offsetHeight - innerHeight;
  const prog = Math.min(1, Math.max(0, -r.top / total));
  cards.forEach((c, i) => c.classList.toggle('pending', i > 0 && prog < i / 4));
}
addEventListener('scroll', deal, { passive: true });
addEventListener('resize', deal);
deal();

// find your fit
const fitText = {
  youth: 'Our 10U and 12U tournament teams are built for players who compete and want to keep climbing.',
  girls: "Our girls' tournament teams are forming at 12U, 14U and 16U.",
  heart: 'Heart Squad is our team for neurodivergent athletes and athletes with special needs, with coaching and games built around how they play best.',
};
const table = document.querySelector('.lineup');
const out = document.querySelector('.fit-result');
const labels = { youth: ['10U team', '12U team'], girls: ['Girls 12U', 'Girls 14U', 'Girls 16U'], heart: ['Heart Squad'] };
const form = document.getElementById('interest-form');
// Google Sheet tracker (Apps Script web app). Leave blank to skip.
const TRACKER_URL = '';
document.querySelectorAll('.fit-btn').forEach(b => b.addEventListener('click', () => {
  const on = b.getAttribute('aria-pressed') !== 'true';
  document.querySelectorAll('.fit-btn').forEach(x => x.setAttribute('aria-pressed', 'false'));
  table.querySelectorAll('[data-fits]').forEach(tr => tr.classList.remove('match'));
  if (!on) { table.classList.remove('filtering'); out.textContent = ''; return; }
  const k = b.dataset.fit;
  b.setAttribute('aria-pressed', 'true');
  table.classList.add('filtering');
  table.querySelectorAll('[data-fits]').forEach(tr => tr.classList.toggle('match', tr.dataset.fits.split(' ').includes(k)));
  out.innerHTML = fitText[k] + ' <a href="#join">Fill out the interest form</a>';
  form.querySelectorAll('input[name="Interested in"]').forEach(c => { c.checked = labels[k].includes(c.value); });
  if (k === 'girls') { const g = form.querySelector('input[name="Team type"][value="Girls"]'); if (g) g.checked = true; }
}));

// interest form
const mhr = document.getElementById('mhr');
const mhrOpt = document.getElementById('mhr-opt');
const lvl = form.querySelector('[name="Current level"]');
function mhrRule() {
  mhr.required = false;
  mhr.setCustomValidity('');
  if (mhr.value.trim() && !/myhockeyrankings\.com/i.test(mhr.value)) mhr.setCustomValidity('Please paste your team link from myhockeyrankings.com');
}
lvl.addEventListener('change', mhrRule);
mhr.addEventListener('input', mhrRule);
form.querySelectorAll('input[type=checkbox][name="Interested in"]').forEach(c => c.addEventListener('change', mhrRule));
const status = form.querySelector('.form-status');
const btn = form.querySelector('button[type="submit"]');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  status.className = 'form-status';
  mhrRule();
  if (!form.checkValidity()) {
    const bad = form.querySelector(':invalid');
    status.textContent = bad === mhr ? 'Please paste your team link from myhockeyrankings.com, or leave it blank.' : 'Please fill in the required fields.';
    status.classList.add('err');
    if (bad) bad.focus();
    return;
  }
  const boxes = [...form.querySelectorAll('input[type=checkbox][name="Interested in"]')];
  const picks = boxes.filter(c => c.checked).map(c => c.value);
  let h = form.querySelector('input[type=hidden][name="Interested in"]');
  if (!h) { h = document.createElement('input'); h.type = 'hidden'; h.name = 'Interested in'; form.appendChild(h); }
  h.value = picks.length ? picks.join(', ') : 'Not specified';
  boxes.forEach(c => { c.disabled = true; });
  btn.disabled = true; btn.textContent = 'Sending...';
  addEventListener('pageshow', () => { boxes.forEach(c => { c.disabled = false; }); btn.disabled = false; btn.textContent = 'Submit interest form'; }, { once: true });
  try {
    const fd = new FormData(form);
    boxes.forEach(c => fd.delete('Interested in'));
    fd.set('Interested in', h.value);
    if (TRACKER_URL) {
      const tp = new URLSearchParams();
      for (const [k, v] of fd.entries()) if (k !== 'access_key' && typeof v === 'string') tp.set(k, v);
      if (!fd.has('Email updates')) tp.set('Email updates', 'No');
      fetch(TRACKER_URL, { method: 'POST', mode: 'no-cors', body: tp, keepalive: true }).catch(() => {});
    }
    const r = await fetch(form.action, { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.success === false) throw new Error(j.message || 'send failed');
    form.reset();
    form.classList.add('sent'); btn.textContent = 'Submitted';
    status.textContent = "Thanks. Your interest form is in, and we'll follow up by email.";
    status.classList.add('ok');
    status.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (err) {
    form.submit();
  }
});
if (location.hash === '#thanks') { form.classList.add('sent'); btn.textContent = 'Submitted'; btn.disabled = true; status.textContent = "Thanks. Your interest form is in, and we'll follow up by email."; status.classList.add('ok'); }
