// Product illustrations (viewBox 0 0 240 240).
export const art = {
  one: (c) => `
    <path d="M52 124 C52 50 188 50 188 124" fill="none" stroke="${c}" stroke-width="14" stroke-linecap="round"/>
    <path d="M60 122 C62 66 178 66 180 122" fill="none" stroke="#111" stroke-opacity=".25" stroke-width="4" stroke-linecap="round"/>
    <rect x="30" y="112" width="52" height="84" rx="24" fill="${c}"/><rect x="158" y="112" width="52" height="84" rx="24" fill="${c}"/>
    <rect x="66" y="120" width="20" height="68" rx="10" fill="#141417"/><rect x="154" y="120" width="20" height="68" rx="10" fill="#141417"/>
    <rect x="38" y="140" width="8" height="28" rx="4" fill="#fff" opacity=".25"/><rect x="166" y="140" width="8" height="28" rx="4" fill="#fff" opacity=".25"/>
    <circle cx="44" cy="126" r="4" fill="#ff4f1f"/>`,
  studio: (c) => `
    <path d="M48 128 C48 40 192 40 192 128" fill="none" stroke="#9ea0a6" stroke-width="6"/>
    <path d="M54 118 C56 58 184 58 186 118" fill="none" stroke="${c}" stroke-width="16" stroke-linecap="round"/>
    <rect x="20" y="108" width="62" height="96" rx="20" fill="${c}"/><rect x="158" y="108" width="62" height="96" rx="20" fill="${c}"/>
    <circle cx="51" cy="156" r="20" fill="none" stroke="#9ea0a6" stroke-width="3"/><circle cx="189" cy="156" r="20" fill="none" stroke="#9ea0a6" stroke-width="3"/>
    <circle cx="51" cy="156" r="6" fill="#9ea0a6"/><circle cx="189" cy="156" r="6" fill="#9ea0a6"/>`,
  buds: (c) => `
    <rect x="60" y="118" width="120" height="84" rx="38" fill="${c}" stroke="#111" stroke-opacity=".12" stroke-width="2"/>
    <path d="M60 150 H180" stroke="#111" stroke-opacity=".18" stroke-width="2"/>
    <circle cx="120" cy="170" r="3" fill="#ff4f1f"/>
    <g transform="rotate(-18 88 78)"><ellipse cx="88" cy="78" rx="22" ry="26" fill="${c}" stroke="#111" stroke-opacity=".12" stroke-width="2"/><rect x="80" y="92" width="16" height="36" rx="8" fill="${c}" stroke="#111" stroke-opacity=".12" stroke-width="2"/><ellipse cx="80" cy="74" rx="8" ry="10" fill="#141417"/></g>
    <g transform="rotate(18 152 78)"><ellipse cx="152" cy="78" rx="22" ry="26" fill="${c}" stroke="#111" stroke-opacity=".12" stroke-width="2"/><rect x="144" y="92" width="16" height="36" rx="8" fill="${c}" stroke="#111" stroke-opacity=".12" stroke-width="2"/><ellipse cx="160" cy="74" rx="8" ry="10" fill="#141417"/></g>`,
  case: (c) => `
    <rect x="34" y="70" width="172" height="118" rx="54" fill="${c}"/>
    <path d="M40 128 H200" stroke="#111" stroke-opacity=".3" stroke-width="3" stroke-dasharray="4 5"/>
    <rect x="186" y="118" width="22" height="20" rx="6" fill="#d8c29a"/>
    <rect x="96" y="92" width="48" height="10" rx="5" fill="#fff" opacity=".3"/>`,
};
export const svg = (key, color, cls = '') => `<svg class="art ${cls}" viewBox="0 0 240 240" aria-hidden="true">${art[key](color)}</svg>`;
