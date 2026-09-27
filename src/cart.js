import gsap from 'gsap';
import { svg } from './art.js';

const KEY = 'nova-bag';
export const fmt = (n) => `$${n.toLocaleString('en-US')}`;

export function createCart({ products, colorways, lenis, toast }) {
  const byId = Object.fromEntries(products.map((p) => [p.id, p]));
  const cwById = Object.fromEntries(colorways.map((c) => [c.id, c]));
  const root = document.querySelector('.bag');
  const panel = root.querySelector('.bag__panel');
  const overlay = root.querySelector('.bag__overlay');
  const list = root.querySelector('.bag__list');
  const counts = document.querySelectorAll('[data-bag-count]');
  let items = load();
  let isOpen = false;
  gsap.set(panel, { xPercent: 100 });

  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY));
      return Array.isArray(d) ? d.filter((i) => byId[i.id]) : [];
    } catch { return []; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* ignore */ } }

  function render() {
    counts.forEach((el) => (el.textContent = items.reduce((s, i) => s + i.qty, 0)));
    root.querySelector('[data-subtotal]').textContent = fmt(items.reduce((s, i) => s + byId[i.id].price * i.qty, 0));
    root.querySelector('.bag__empty').hidden = items.length > 0;
    root.querySelector('.bag__checkout').disabled = !items.length;
    list.innerHTML = items.map((i, idx) => {
      const p = byId[i.id];
      const cw = i.cw && cwById[i.cw];
      return `<li class="bag__item">
        <div class="bag__thumb">${svg(p.art, cw ? cw.shell : p.color)}</div>
        <div class="bag__meta"><strong>${p.name}</strong><span>${cw ? cw.name + ' · ' : ''}${p.type}</span>
          <div class="bag__qty"><button data-act="dec" data-idx="${idx}" aria-label="Less">−</button>${i.qty}<button data-act="inc" data-idx="${idx}" aria-label="More">+</button></div></div>
        <div class="bag__right">${fmt(p.price * i.qty)}<button data-act="rm" data-idx="${idx}">Remove</button></div>
      </li>`;
    }).join('');
  }

  function add(id, cw = null) {
    const f = items.find((i) => i.id === id && i.cw === cw);
    if (f) f.qty++;
    else items.push({ id, cw, qty: 1 });
    save();
    render();
    gsap.fromTo(counts, { yPercent: -100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
    toast(`Added — ${byId[id].name}${cw ? ' · ' + cwById[cw].name : ''}`);
  }

  list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const idx = +b.dataset.idx;
    if (b.dataset.act === 'inc') items[idx].qty++;
    if (b.dataset.act === 'dec') items[idx].qty--;
    if (b.dataset.act === 'rm' || items[idx].qty <= 0) items.splice(idx, 1);
    save();
    render();
  });

  function open() {
    if (isOpen) return;
    isOpen = true;
    lenis?.stop();
    root.classList.add('is-open');
    gsap.timeline()
      .to(overlay, { autoAlpha: 1, duration: 0.5 })
      .to(panel, { xPercent: 0, duration: 0.9, ease: 'expo.out' }, 0)
      .fromTo(panel.querySelectorAll('.bag__item'), { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.05, duration: 0.6, ease: 'power3.out' }, 0.2);
  }
  function close() {
    if (!isOpen) return;
    isOpen = false;
    gsap.timeline({ onComplete: () => { root.classList.remove('is-open'); lenis?.start(); } })
      .to(panel, { xPercent: 100, duration: 0.6, ease: 'expo.in' })
      .to(overlay, { autoAlpha: 0, duration: 0.4 }, 0.2);
  }
  document.querySelectorAll('[data-open-bag]').forEach((b) => b.addEventListener('click', open));
  root.querySelectorAll('[data-close-bag]').forEach((b) => b.addEventListener('click', close));
  window.addEventListener('keydown', (e) => e.key === 'Escape' && close());
  root.querySelector('.bag__checkout').addEventListener('click', () => {
    items = [];
    save();
    render();
    close();
    toast('Thank you — demo store, no order was placed.');
  });
  render();
  return { add, open };
}
