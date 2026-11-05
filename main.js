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
  ['.cta', '.cta-title span, .cta-row .btn, .or, .cta-note'],
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
  ba: 'Our B and A tournament teams are built for players who compete and want to keep climbing.',
  aaa: 'Our AA and AAA tournament teams are built for players ready for the highest level of tournament hockey.',
  girls: "Girls' tournament teams run from B through AAA.",
  heart: 'Heart Squad is our team for neurodivergent athletes and athletes with special needs, with coaching and games built around how they play best.',
};
const table = document.querySelector('.lineup');
const out = document.querySelector('.fit-result');
const reg = document.getElementById('cta-register');
const labels = { ba: 'B or A level', aaa: 'AA or AAA level', girls: "girls' team", heart: 'Heart Squad' };
document.querySelectorAll('.fit-btn').forEach(b => b.addEventListener('click', () => {
  const on = b.getAttribute('aria-pressed') !== 'true';
  document.querySelectorAll('.fit-btn').forEach(x => x.setAttribute('aria-pressed', 'false'));
  table.querySelectorAll('[data-fits]').forEach(tr => tr.classList.remove('match'));
  if (!on) { table.classList.remove('filtering'); out.textContent = ''; return; }
  const k = b.dataset.fit;
  b.setAttribute('aria-pressed', 'true');
  table.classList.add('filtering');
  table.querySelectorAll('[data-fits]').forEach(tr => tr.classList.toggle('match', tr.dataset.fits.split(' ').includes(k)));
  out.innerHTML = fitText[k] + ' <a href="#join">Ask about a roster spot</a>';
  const body = encodeURIComponent(`Hi, I'm interested in a roster spot for my player.\n\nLooking at: ${labels[k]}\nPlayer birth year:\nAnything we should know:`);
  reg.href = `mailto:play@wickedhearthockey.com?subject=Roster%20interest&body=${body}`;
}));
