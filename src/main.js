import './style.css';
import 'lenis/dist/lenis.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import Lenis from 'lenis';
import { colorways, products, projects, quotes } from './data.js';
import { svg } from './art.js';
import { createScene } from './scene.js';
import { createCart, fmt } from './cart.js';
import { createAudio } from './audio.js';

gsap.registerPlugin(ScrollTrigger, SplitText, Draggable, InertiaPlugin, DrawSVGPlugin);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;
const isMobile = () => window.innerWidth < 768;
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

/* ---------------------------------------------------------------------------
   Dynamic content
--------------------------------------------------------------------------- */
let activeCw = colorways.find((c) => c.id === 'ember');

document.querySelector('.swatches').innerHTML = colorways.map((c) =>
  `<button class="swatch${c === activeCw ? ' is-active' : ''}" role="radio" aria-checked="${c === activeCw}" aria-label="${c.name}" data-cw="${c.id}" style="--c:${c.swatch}" data-cursor="${c.name}"><i></i></button>`).join('');

document.querySelector('.products').innerHTML = products.map((p, i) => `
  <article class="product">
    <div class="product__art"><span class="mono">0${i + 1}</span>${svg(p.art, p.color)}</div>
    <h3>${p.name}</h3><p class="product__type">${p.type}</p>
    <ul>${p.specs.map((s) => `<li>${s}</li>`).join('')}</ul>
    <div class="product__foot"><strong>${fmt(p.price)}</strong><button class="product__add" data-add="${p.id}" aria-label="Add ${p.name}" data-cursor="Add">+</button></div>
  </article>`).join('');

document.querySelector('.rail__track').innerHTML = projects.map((p, i) => `
  <article class="work">
    <div class="work__art" style="--c1:${p.c1};--c2:${p.c2}"><span class="mono">P—0${i + 1}</span>${svg(['one', 'studio', 'buds', 'one', 'studio'][i], p.c1)}<h3>${p.title}</h3></div>
    <div class="work__meta mono"><span>${p.kind}</span><span>${p.year}</span></div>
  </article>`).join('');

document.querySelector('.quote__text').textContent = `“${quotes[0].q}”`;
document.querySelector('.quote cite').textContent = `— ${quotes[0].who}`;
document.querySelector('.footer__word').innerHTML = [...'NOVA'].map((c) => `<span>${c}</span>`).join('');
document.querySelector('.loader__eq').innerHTML = '<i></i>'.repeat(32);
document.querySelector('.columns').innerHTML = '<i></i>'.repeat(10);

/* ---------------------------------------------------------------------------
   Smooth scroll, scene, audio
--------------------------------------------------------------------------- */
const lenis = reduced ? null : new Lenis({ lerp: 0.085 });
if (lenis) {
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  lenis.stop();
}
gsap.ticker.lagSmoothing(0);
const scrollToTarget = (t) => (lenis ? lenis.scrollTo(t, { duration: 1.6 }) : (typeof t === 'number' ? scrollTo(0, t) : t.scrollIntoView({ behavior: 'smooth' })));

const scene = createScene(document.getElementById('webgl'), activeCw);
gsap.ticker.add((t, dt) => scene.update(t, Math.min(dt / 1000, 0.05)));
const audio = createAudio(document.querySelector('.listen__viz'));

/* ---------------------------------------------------------------------------
   UI helpers
--------------------------------------------------------------------------- */
const toastEl = document.querySelector('.toast');
let toastTl;
gsap.set(toastEl, { xPercent: -50, yPercent: 150 });
function toast(msg) {
  toastEl.textContent = msg;
  toastTl?.kill();
  toastTl = gsap.timeline()
    .fromTo(toastEl, { yPercent: 150, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'expo.out' })
    .to(toastEl, { yPercent: 150, opacity: 0, duration: 0.4, ease: 'power2.in' }, '+=2.4');
}

if (finePointer) {
  document.body.classList.add('has-cursor');
  const cursor = document.querySelector('.cursor');
  const ring = cursor.querySelector('.cursor__ring');
  const dot = cursor.querySelector('.cursor__dot');
  const label = cursor.querySelector('.cursor__label');
  const rx = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' });
  const ry = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });
  const dx = gsap.quickTo(dot, 'x', { duration: 0.1 });
  const dy = gsap.quickTo(dot, 'y', { duration: 0.1 });
  window.addEventListener('pointermove', (e) => { rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY); });
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('[data-cursor], a, button, .rail__track');
    const text = t?.dataset.cursor || (t?.classList.contains('rail__track') ? 'Drag' : '');
    cursor.classList.toggle('is-hover', !!t);
    cursor.classList.toggle('has-label', !!text);
    cursor.classList.toggle('on-dark', !!e.target.closest('.listen, .footer'));
    if (text) label.textContent = text;
  });
  document.querySelectorAll('.magnetic').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.3);
      yTo((e.clientY - r.top - r.height / 2) * 0.4);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

/* ---------------------------------------------------------------------------
   Cart
--------------------------------------------------------------------------- */
const cart = createCart({ products, colorways, lenis, toast });
const bagBtn = document.querySelector('.nav__bag');
function fly(from, done) {
  const a = from.getBoundingClientRect(), b = bagBtn.getBoundingClientRect();
  const d = document.createElement('div');
  d.className = 'fly';
  document.body.appendChild(d);
  nav.classList.remove('is-hidden');
  gsap.set(d, { x: a.left + a.width / 2, y: a.top + a.height / 2 });
  gsap.timeline({ onComplete: () => { d.remove(); done(); } })
    .to(d, { x: b.left + b.width / 2, duration: 0.8, ease: 'power2.inOut' }, 0)
    .to(d, { y: b.top + b.height / 2, duration: 0.8, ease: 'back.in(1.4)' }, 0)
    .to(d, { scale: 0.4, duration: 0.8 }, 0);
}
document.addEventListener('click', (e) => {
  const add = e.target.closest('[data-add]');
  if (add) fly(add, () => cart.add(add.dataset.add));
  const one = e.target.closest('[data-add-one]');
  if (one) fly(one, () => cart.add('one', activeCw.id));
});

/* ---------------------------------------------------------------------------
   Colourways
--------------------------------------------------------------------------- */
const tint = document.querySelector('.tint');
const nameEl = document.querySelector('.colours__name');
tint.style.setProperty('--tint', activeCw.tint);
document.querySelector('.swatches').addEventListener('click', (e) => {
  const b = e.target.closest('.swatch');
  if (!b || b.dataset.cw === activeCw.id) return;
  activeCw = colorways.find((c) => c.id === b.dataset.cw);
  document.querySelectorAll('.swatch').forEach((s) => {
    s.classList.toggle('is-active', s === b);
    s.setAttribute('aria-checked', s === b);
  });
  scene.setColorway(activeCw);
  tint.style.setProperty('--tint', activeCw.tint);
  gsap.fromTo(scene.extra, { spin: 0 }, { spin: Math.PI * 2, duration: 1.4, ease: 'expo.inOut', onComplete: () => (scene.extra.spin = 0) });
  const old = nameEl.querySelector('span');
  const nu = document.createElement('span');
  nu.textContent = activeCw.name;
  gsap.timeline()
    .to(old, { yPercent: -110, duration: 0.45, ease: 'power3.in', onComplete: () => old.remove() })
    .add(() => nameEl.appendChild(nu))
    .fromTo(nu, { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: 'expo.out' });
});

/* ---------------------------------------------------------------------------
   Nav
--------------------------------------------------------------------------- */
const nav = document.querySelector('.nav');
document.querySelectorAll('a[href^="#"]').forEach((a) =>
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    e.preventDefault();
    if (id.length > 1) scrollToTarget(id === '#top' ? 0 : document.querySelector(id));
  }),
);
if (lenis) lenis.on('scroll', ({ scroll, direction }) => nav.classList.toggle('is-hidden', direction > 0 && scroll > 300));

document.querySelector('.footer__news').addEventListener('submit', (e) => {
  e.preventDefault();
  e.target.reset();
  toast('Subscribed. Welcome to NOVA.');
});

/* ---------------------------------------------------------------------------
   Listen section
--------------------------------------------------------------------------- */
const playBtn = document.querySelector('.play');
let listenActive = false;
playBtn.addEventListener('click', async () => {
  const on = await audio.toggle();
  playBtn.setAttribute('aria-pressed', on);
  playBtn.querySelector('.play__label').textContent = on ? 'Pause' : 'Play demo loop';
});
gsap.ticker.add((t) => listenActive && audio.draw(t));

/* ---------------------------------------------------------------------------
   Loader → intro
--------------------------------------------------------------------------- */
const fontsReady = Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 3000))]);
function loader() {
  const bars = gsap.utils.toArray('.loader__eq i');
  const eq = bars.map((b) => gsap.to(b, { scaleY: () => gsap.utils.random(0.15, 1), duration: () => gsap.utils.random(0.2, 0.45), ease: 'sine.inOut', repeat: -1, yoyo: true, repeatRefresh: true }));
  const pct = document.querySelector('.loader__pct');
  const c = { v: 0 };
  const count = gsap.to(c, { v: 100, duration: reduced ? 0.5 : 2.2, ease: 'power2.inOut', onUpdate: () => (pct.textContent = String(Math.round(c.v)).padStart(3, '0')) });
  return Promise.all([fontsReady, count.then()]).then(() => eq.forEach((t) => t.kill()));
}

function intro() {
  document.body.classList.remove('is-loading');
  ScrollTrigger.refresh();
  const cols = gsap.utils.toArray('.columns i');
  gsap.timeline({ onComplete: () => lenis?.start() })
    .to('.loader__eq i', { scaleY: 0.02, duration: 0.4, stagger: { each: 0.01, from: 'center' } })
    .to(cols, { scaleY: 1, duration: 0.7, stagger: { each: 0.04, from: 'start' }, ease: 'expo.inOut' }, 0.2)
    .set('.loader', { display: 'none' })
    .set(cols, { transformOrigin: 'top' })
    .to(cols, { scaleY: 0, duration: 0.8, stagger: { each: 0.04, from: 'start' }, ease: 'expo.inOut' })
    .set('.columns', { display: 'none' })
    .add('go', '-=0.6')
    .to(scene.intro, { v: 1, duration: 2.4, ease: 'expo.out' }, 'go')
    .from('.hero-bg__word', { yPercent: 100, opacity: 0, stagger: 0.12, duration: 1.6, ease: 'expo.out' }, 'go')
    .from('.hero__title .mask > span', { yPercent: 110, duration: 1.3, stagger: 0.1, ease: 'expo.out' }, 'go+=0.2')
    .from('.hero .tag, .hero__right > *, .hero__ticker span', { y: 24, opacity: 0, stagger: 0.06, duration: 1, ease: 'expo.out' }, 'go+=0.45')
    .from('.nav > *', { y: -30, opacity: 0, stagger: 0.08, duration: 1, ease: 'expo.out', clearProps: 'all' }, 'go+=0.3');
}

/* ---------------------------------------------------------------------------
   Scroll choreography
--------------------------------------------------------------------------- */
function buildScroll() {
  // Anatomy pin + callouts (created first: pins affect later triggers)
  const callouts = gsap.utils.toArray('.callout');
  const atl = gsap.timeline({
    scrollTrigger: {
      trigger: '.anatomy', start: 'top top', end: () => '+=' + innerHeight * 2.4, pin: true, scrub: 1,
      onUpdate: (s) => gsap.set('.anatomy__progress b', { scaleX: Math.min(1, s.progress / 0.7) }),
    },
  });
  callouts.forEach((c, i) => {
    atl.fromTo(c.querySelector('div'), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 }, 0.3 + i * 0.3)
      .fromTo(c.querySelector('path'), { drawSVG: 0 }, { drawSVG: '100%', duration: 0.3 }, 0.3 + i * 0.3);
  });
  atl.to({}, { duration: 0.8 });

  // Headphone poses (x / y are fractions of the half viewport)
  const P = (o) => ({ x: 0, y: 0, rotX: 0.12, rotY: -0.5, scale: 1, opacity: 1, explode: 0, waves: 0, ...o });
  const posesFor = (m) => ({
    hero: P(m ? { y: 0.26, scale: 1.05, waves: 1 } : { y: 0.04, waves: 1 }),
    sound: P(m ? { y: 0.3, rotY: 0.6, scale: 0.8, opacity: 0.12 } : { x: -0.5, rotY: 0.75, rotX: 0.05, scale: 0.85 }),
    anatomy: P(m ? { y: 0.05, rotY: -0.35, rotX: 0.3, scale: 0.8 } : { y: -0.04, rotY: -0.35, rotX: 0.28, scale: 0.9 }),
    anatomyEnd: P(m ? { y: 0.05, rotY: -0.15, rotX: 0.3, scale: 0.8, explode: 1 } : { y: -0.04, rotY: -0.15, rotX: 0.28, scale: 0.9, explode: 1 }),
    colours: P(m ? { y: 0.45, rotY: -0.5, scale: 0.9 } : { x: 0.42, rotY: -0.6, scale: 0.95 }),
    out: P(m ? { y: 1.5, rotY: 1, scale: 0.7, opacity: 0 } : { x: 0.42, y: 1.5, rotY: 1, scale: 0.7, opacity: 0 }),
  });
  let poses = posesFor(isMobile());
  ScrollTrigger.addEventListener('refreshInit', () => (poses = posesFor(isMobile())));
  const seg = (from, to, vars, map = (p) => p) => ({ from, to, map, st: vars.st || ScrollTrigger.create(vars) });
  const segments = [
    seg('hero', 'sound', { trigger: '.hero', start: 'top top', endTrigger: '.sound', end: 'center center' }),
    seg('sound', 'anatomy', { trigger: '.anatomy', start: 'top bottom', end: 'top top' }),
    seg('anatomy', 'anatomyEnd', { st: atl.scrollTrigger }, (p) => Math.min(1, p / 0.7)),
    seg('anatomyEnd', 'colours', { trigger: '.colours', start: 'top bottom', end: 'top 15%' }),
    seg('colours', 'out', { trigger: '.listen', start: 'top bottom', end: 'top 30%' }),
  ];
  gsap.ticker.add(() => {
    let active = segments[0], prog = 0;
    for (const s of segments) if (s.st.progress > 0) { active = s; prog = s.map(s.st.progress); }
    const a = poses[active.from], b = poses[active.to];
    for (const k in a) scene.pose[k] = a[k] + (b[k] - a[k]) * prog;
  });

  // Hero background words drift apart
  gsap.to('.hero-bg__word:first-child', { xPercent: -30, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero-bg__word--out', { xPercent: 30, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__left, .hero__right, .hero__ticker', { y: -80, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '60% top', scrub: true } });

  // Line reveals
  document.querySelectorAll('[data-lines]').forEach((el) => {
    const split = new SplitText(el, { type: 'lines', mask: 'lines', linesClass: 'line' });
    gsap.from(split.lines, { yPercent: 110, duration: 1.2, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' }, onComplete: () => split.revert() });
  });
  gsap.utils.toArray('.tag').forEach((t) => {
    if (t.closest('.hero')) return;
    gsap.from(t, { opacity: 0, x: -20, duration: 0.8, ease: 'expo.out', scrollTrigger: { trigger: t, start: 'top 90%' } });
  });

  // Stats
  document.querySelectorAll('[data-count]').forEach((el) => {
    const end = +el.dataset.count, prefix = el.dataset.prefix || '';
    const o = { v: 0 };
    gsap.to(o, { v: end, duration: 2, ease: 'expo.out', onUpdate: () => (el.textContent = prefix + Math.round(o.v)), scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
  gsap.utils.toArray('.stat').forEach((s, i) =>
    gsap.from(s, { y: 50, opacity: 0, duration: 1.1, delay: (i % 2) * 0.1, ease: 'expo.out', scrollTrigger: { trigger: s, start: 'top 90%' } }),
  );

  // Colours: tint the whole screen while this section is in view
  ScrollTrigger.create({
    trigger: '.colours', start: 'top 55%', end: 'bottom 45%',
    onToggle: (s) => gsap.to(tint, { opacity: s.isActive ? 1 : 0, duration: 0.8 }),
  });
  gsap.from('.swatch', { scale: 0, stagger: 0.07, duration: 0.8, ease: 'back.out(2)', scrollTrigger: { trigger: '.swatches', start: 'top 90%' } });

  // Listen
  ScrollTrigger.create({
    trigger: '.listen', start: 'top bottom', end: 'bottom top',
    onToggle: (s) => { listenActive = s.isActive; if (!s.isActive) { audio.stop(); playBtn.setAttribute('aria-pressed', false); playBtn.querySelector('.play__label').textContent = 'Play demo loop'; } },
  });
  gsap.fromTo('.listen', { clipPath: 'inset(8% 6% 8% 6% round 40px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: '.listen', start: 'top bottom', end: 'top top', scrub: true } });
  gsap.from('.play', { scale: 0.6, opacity: 0, duration: 1, ease: 'back.out(2)', scrollTrigger: { trigger: '.play', start: 'top 90%' } });

  // Shop
  gsap.from('.product', { y: 100, opacity: 0, stagger: 0.08, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.products', start: 'top 85%' } });

  // Studio rail: drag with inertia, skew by velocity
  const rail = document.querySelector('.rail');
  const track = document.querySelector('.rail__track');
  const works = gsap.utils.toArray('.work');
  const skewTo = gsap.quickTo(works, 'skewX', { duration: 0.5, ease: 'power3' });
  const [drag] = Draggable.create(track, {
    type: 'x', inertia: true, edgeResistance: 0.85, dragClickables: true,
    bounds: { minX: 0, maxX: 0 },
    onDrag() { skewTo(gsap.utils.clamp(-8, 8, InertiaPlugin.getVelocity(track, 'x') / -300)); },
    onThrowUpdate() { skewTo(gsap.utils.clamp(-8, 8, InertiaPlugin.getVelocity(track, 'x') / -300)); },
    onRelease() { gsap.delayedCall(0.4, () => skewTo(0)); },
    onThrowComplete() { skewTo(0); },
  });
  const setBounds = () => drag.applyBounds({ minX: Math.min(0, rail.clientWidth - track.scrollWidth - parseFloat(getComputedStyle(rail).paddingLeft) * 2), maxX: 0 });
  setBounds();
  window.addEventListener('resize', setBounds);
  gsap.from(works, { x: 200, opacity: 0, stagger: 0.08, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: rail, start: 'top 85%' } });

  // Quote: words ink in
  const words = new SplitText('.quote__text', { type: 'words' }).words;
  gsap.fromTo(words, { opacity: 0.12 }, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: '.quote', start: 'top 75%', end: 'bottom 60%', scrub: true } });

  // CTA lines slide in from the sides
  const [l1, l2] = document.querySelectorAll('.cta__title span');
  gsap.fromTo(l1, { xPercent: -40 }, { xPercent: 0, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'center center', scrub: true } });
  gsap.fromTo(l2, { xPercent: 40 }, { xPercent: 0, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'center center', scrub: true } });

  // Footer
  gsap.from('.footer__word span', { yPercent: 100, stagger: 0.08, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.footer__word', start: 'top 95%' } });

  ScrollTrigger.refresh();
}

fontsReady.then(buildScroll);
loader().then(intro);
