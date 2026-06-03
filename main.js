/* NAV scroll */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 40));

/* Burger */
const burger = document.getElementById('burger');
const navLinks = document.querySelector('.nav-links');
burger.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

/* Scroll reveal with stagger */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObserver.unobserve(e.target); } });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

document.querySelectorAll('.problems-grid .problem-card, .steps-grid .step-card, .ingredients-grid .ingredient-card, .emotion-grid .emotion-card').forEach((el, i) => {
  el.style.transitionDelay = (i * 0.08) + 's';
});

/* Blood-value slider */
const slider     = document.getElementById('bloodval');
const sliderDisp = document.getElementById('bloodval-display');
const sliderStat = document.getElementById('bloodval-status');

function getStatus(v) {
  if (v < 20)  return { label: 'Kritischer Mangel', cls: 'status-deficient' };
  if (v < 30)  return { label: 'Deutlicher Mangel', cls: 'status-deficient' };
  if (v < 50)  return { label: 'Suboptimal — Ziel: 50–70 ng/ml', cls: 'status-insufficient' };
  if (v <= 70) return { label: 'Optimal ✓ (Zielbereich)', cls: 'status-optimal' };
  if (v <= 90) return { label: 'Leicht erhöht', cls: 'status-high' };
  return { label: 'Zu hoch — Supplementierung pausieren', cls: 'status-high' };
}

function updateSlider() {
  if (!slider) return;
  const v = +slider.value;
  slider.style.setProperty('--pct', v + '%');
  sliderDisp.textContent = v;
  const s = getStatus(v);
  sliderStat.textContent = s.label;
  sliderStat.className = 'status-label ' + s.cls;
}
if (slider) { slider.addEventListener('input', updateSlider); updateSlider(); }

/* BMI live */
function updateBMI() {
  const h = +document.getElementById('height').value;
  const w = +document.getElementById('weight').value;
  const el = document.getElementById('bmi-display');
  if (!el) return;
  if (!h || !w) { el.textContent = ''; return; }
  const bmi = w / ((h / 100) ** 2);
  let cat = bmi < 18.5 ? 'Untergewicht' : bmi < 25 ? 'Normalgewicht' : bmi < 30 ? 'Übergewicht' : 'Adipositas';
  el.textContent = `BMI: ${bmi.toFixed(1)} — ${cat}`;
  el.className = 'bmi-display bmi-visible';
}
['height', 'weight'].forEach(id => document.getElementById(id)?.addEventListener('input', updateBMI));

/* Calculator */
document.getElementById('calc-btn')?.addEventListener('click', calculate);

function calculate() {
  const blood  = +slider.value;
  const height = +document.getElementById('height').value || 170;
  const weight = +document.getElementById('weight').value || 75;
  const gender = document.getElementById('gender').value;
  const gut    = document.getElementById('gut').checked;
  const senior = document.getElementById('senior').checked;
  const indoor = document.getElementById('indoor').checked;
  const bmi    = weight / ((height / 100) ** 2);

  const deficit = Math.max(0, 60 - blood);
  let dose = deficit * 40 * (weight / 70);
  if (bmi >= 30) dose *= 1.5;
  else if (bmi >= 25) dose *= 1.2;
  if (gender === 'female') dose *= 0.92;
  if (gut)    dose *= 1.35;
  if (senior) dose *= 1.2;
  if (indoor) dose += 500;
  if (blood >= 50 && blood <= 70) dose = gender === 'female' ? 1500 : 2000;
  if (blood > 70) dose = 0;
  dose = Math.max(0, Math.min(10000, Math.round(dose / 500) * 500));

  const k2  = dose >= 4000 ? '200 µg' : '100 µg';
  const mag = '300–400 mg';
  const bor = '3 mg';

  let priority, desc;
  if (blood > 70)      { priority = 'Kein System nötig'; desc = 'Dein Wert liegt über dem Zielbereich. Pausiere und kontrolliere nach 8 Wochen.'; }
  else if (blood >= 50){ priority = 'Zielbereich erreicht ✓'; desc = 'Hervorragend! Halte deinen Status mit einer Erhaltungsorientierung stabil.'; }
  else if (blood >= 30){ priority = 'Suboptimaler Bereich'; desc = `Mit dieser Orientierung erreichst du 50–70 ng/ml in ca. 8–12 Wochen.`; }
  else if (blood >= 20){ priority = 'Deutlicher Mangel'; desc = 'Starte sofort mit dem Vitamin-D-System. Kontrolltest nach spätestens 8 Wochen.'; }
  else                  { priority = 'Kritischer Mangel'; desc = 'Sehr niedriger Wert. Ärztliche Begleitung empfohlen. Hohe Orientierung für 4 Wochen, dann Anpassung.'; }

  const tips = [];
  if (blood < 50) tips.push('D3 + K2 morgens zum Frühstück mit etwas Fett (z.B. Eier, Nüsse) einnehmen.');
  if (gut)        tips.push('Bei Malabsorption: sublinguales Vitamin D oder liposomale Form in Betracht ziehen.');
  if (senior)     tips.push('Ab 65: Haut synthetisiert deutlich weniger D aus Sonnenlicht — regelmäßige Messungen wichtig.');
  if (indoor)     tips.push('Büroalltag: In der Mittagspause 15 Min. direkte Sonne (ohne Glas) bringt im Sommer viel.');
  if (bmi >= 30)  tips.push('Fettgewebe speichert Vitamin D — Anstieg kann langsamer sein als erwartet. Geduld und Kontrolle.');
  tips.push('Unbedingt nach 12 Wochen einen Kontrolltest machen — so weißt du ob du im Zielbereich bist.');

  const pct = dose > 0 ? Math.min(dose / 8000, 1) : 0;
  const dashOffset = 327 - 327 * pct;

  document.getElementById('result-dose').textContent = dose > 0 ? dose.toLocaleString('de-DE') + ' IE' : '0 IE';
  document.getElementById('result-priority').textContent = priority;
  document.getElementById('result-desc').textContent = desc;
  document.getElementById('prot-d3').textContent  = dose > 0 ? dose.toLocaleString('de-DE') + ' IE' : 'Pausieren';
  document.getElementById('prot-k2').textContent  = dose > 0 ? k2 : 'Nicht nötig';
  document.getElementById('prot-mag').textContent = mag;
  document.getElementById('prot-bor').textContent = dose > 0 ? bor : 'Nicht nötig';
  document.getElementById('result-tips').innerHTML = tips.map(t => `<p>&#8594; ${t}</p>`).join('');

  const rtbFill = document.getElementById('rtb-fill');
  if (rtbFill) rtbFill.style.width = Math.min((blood / 100) * 100, 100) + '%';

  const ring = document.getElementById('ring-fill');
  if (ring) {
    ring.style.strokeDashoffset = 327;
    if (!ring.closest('svg').querySelector('defs')) {
      ring.closest('svg').insertAdjacentHTML('afterbegin', `<defs><linearGradient id="sunGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#E8890A"/><stop offset="100%" stop-color="#FFD166"/></linearGradient></defs>`);
    }
    requestAnimationFrame(() => {
      ring.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)';
      ring.style.strokeDashoffset = dashOffset;
    });
  }

  document.getElementById('result-placeholder').classList.add('hidden');
  document.getElementById('result-content').classList.remove('hidden');
  document.getElementById('calc-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* Smooth anchors */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const target = id === '#' ? document.body : document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
  });
});
