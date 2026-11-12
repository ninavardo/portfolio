let seed = 11
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647

const TOWER_X = 1150
const bump = (x, c, w) => Math.exp(-(((x - c) / w) ** 2))
/** Hillside the old town climbs: Mtatsminda on the right, Narikala's ridge on the left. */
const hill = (x) => 178 - 78 * bump(x, TOWER_X, 230) - 34 * bump(x, 330, 170) - 18 * bump(x, 640, 140)

const HOUSES = []
for (let x = 0; x < 1440; x += 15) {
  for (let row = 0; row < 4; row++) {
    const y = hill(x) + row * 13 + rnd() * 5
    if (y > 214 || (Math.abs(x - TOWER_X) < 40 && row === 0) || (x > 220 && x < 440 && row < 2)) continue
    const w = 9 + rnd() * 7
    const h = 8 + rnd() * 9
    const windows = []
    for (let k = 0; k < 2; k++) if (rnd() < 0.55) windows.push({ x: 2 + k * (w / 2 - 1), y: 3 + rnd() * (h - 7) })
    HOUSES.push({ x: x + rnd() * 6, y: y - h, w, h, windows, roof: rnd() < 0.5 })
  }
}

const LIGHTS = Array.from({ length: 70 }, (_, i) => {
  const x = rnd() * 1440
  return { x, y: hill(x) + 8 + rnd() * 50, r: rnd() < 0.15 ? 1.7 : 1.05, warm: rnd() < 0.82, twinkle: i % 4 === 0, dur: 2 + rnd() * 3 }
}).filter((l) => l.y < 222)

const REFLECTIONS = Array.from({ length: 26 }, () => ({ x: rnd() * 1440, w: 1.5 + rnd() * 2, h: 6 + rnd() * 10, dur: 1.5 + rnd() * 2 }))

const NARIKALA = 'M228 150 l8 -4 v-12 h7 v4 h4 v-4 h7 v14 l22 -6 v-8 h6 v3 h4 v-3 h6 v12 l30 -5 v-16 h8 v4 h4 v-4 h8 v18 l26 2 v-10 h6 v3 h4 v-3 h6 v14 l20 6 V170 H228Z'

/** Tbilisi at night: the Mtatsminda TV tower, Narikala on its ridge, houses climbing the hills and the Kura below. */
export default function Skyline({ className = '' }) {
  return (
    <svg viewBox="0 0 1440 260" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="sky-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a2e6a" stopOpacity="0" />
          <stop offset="1" stopColor="#4a2e6a" stopOpacity="0.45" />
        </linearGradient>
        <radialGradient id="cloud" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#b9a6dc" stopOpacity="0.35" />
          <stop offset="1" stopColor="#b9a6dc" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g>
        <ellipse cx="0" cy="34" rx="120" ry="12" fill="url(#cloud)" />
        <ellipse cx="60" cy="28" rx="80" ry="10" fill="url(#cloud)" />
        <animateTransform attributeName="transform" type="translate" from="-200 0" to="1640 0" dur="160s" repeatCount="indefinite" />
      </g>

      {/* Far ridge and Mtatsminda */}
      <path d="M0 140 C 200 118 380 120 560 128 S 900 96 1040 82 S 1180 70 1260 84 S 1400 110 1440 112 V260 H0Z" fill="#1a1640" />

      {/* TV tower: three-legged red-and-white lattice mast */}
      <g transform={`translate(${TOWER_X} 98)`}>
        <path d="M-22 0 L-5 -48 M22 0 L5 -48 M0 4 L0 -48" stroke="#f3eefc" strokeWidth="2.2" />
        <path d="M-17.5 -12 L-14 -21 M17.5 -12 L14 -21 M-10.5 -30 L-7 -39 M10.5 -30 L7 -39" stroke="#ff4a44" strokeWidth="2.6" />
        <path d="M-19 -6 L12 -24 M19 -6 L-12 -24 M-12 -24 L7 -40 M12 -24 L-7 -40 M-19 -6 H19 M-12 -24 H12" stroke="#ffd8d2" strokeWidth="0.7" opacity="0.8" />
        <rect x="-9" y="-52" width="18" height="5" rx="1.5" fill="#f3eefc" />
        <path d="M-3 -52 L-2 -72 h4 L3 -52Z" fill="#ff4a44" />
        <rect x="-2.2" y="-66" width="4.4" height="5" fill="#f3eefc" />
        <rect x="-5" y="-74" width="10" height="3" fill="#ff4a44" />
        <path d="M0 -74 V-96" stroke="#f3eefc" strokeWidth="1.4" />
        <path d="M0 -84 V-90" stroke="#ff4a44" strokeWidth="1.6" />
        {[
          [0, -97, 2.4, '0s'],
          [-9, -50, 1.6, '0.6s'],
          [9, -50, 1.6, '1.2s'],
          [0, -75, 1.5, '0.3s'],
        ].map(([cx, cy, r, begin]) => (
          <circle key={`${cx}${cy}`} cx={cx} cy={cy} r={r} fill="#ff4d4d">
            <animate attributeName="opacity" values="1;0.2;1" dur="1.8s" begin={begin} repeatCount="indefinite" />
          </circle>
        ))}
      </g>

      <rect x="0" y="80" width="1440" height="100" fill="url(#sky-haze)" />

      {/* Old town hillside */}
      <path d={`M0 ${hill(0)} ${Array.from({ length: 49 }, (_, i) => `L${i * 30} ${hill(i * 30)}`).join(' ')} L1440 ${hill(1440)} V260 H0Z`} fill="#120f33" />
      <path d={NARIKALA} fill="#3a2a22" opacity="0.95" />
      <path d={NARIKALA} fill="none" stroke="#d9904f" strokeWidth="0.8" opacity="0.6" />
      <path d="M420 140 v-14 h3 v-10 l2 -3 l2 3 v10 h3 v14Z" fill="#c9d0f0" opacity="0.8" />
      {HOUSES.map((h, i) => (
        <g key={i} transform={`translate(${h.x.toFixed(1)} ${h.y.toFixed(1)})`}>
          <rect width={h.w.toFixed(1)} height={h.h.toFixed(1)} fill={i % 3 ? '#17143a' : '#1d1840'} />
          {h.roof && <path d={`M-1 0 L${(h.w / 2).toFixed(1)} -4 L${(h.w + 1).toFixed(1)} 0Z`} fill="#3a1f24" />}
          {h.windows.map((w, k) => (
            <rect key={k} x={w.x.toFixed(1)} y={w.y.toFixed(1)} width="2.4" height="3" fill={k % 2 ? '#ffd38a' : '#ffb347'} opacity="0.9" />
          ))}
        </g>
      ))}

      {LIGHTS.map((l, i) => (
        <circle key={i} cx={l.x.toFixed(1)} cy={l.y.toFixed(1)} r={l.r} fill={l.warm ? '#ffb347' : '#cfe6ff'} opacity="0.85">
          {l.twinkle && <animate attributeName="opacity" values="0.9;0.35;0.9" dur={`${l.dur.toFixed(1)}s`} repeatCount="indefinite" />}
        </circle>
      ))}

      {/* The Kura with reflected lights */}
      <path d="M0 222 C 300 214 560 224 760 220 S 1160 214 1440 220 V260 H0Z" fill="#0b0a26" />
      {REFLECTIONS.map((r, i) => (
        <rect key={i} x={r.x.toFixed(1)} y="226" width={r.w.toFixed(1)} height={r.h.toFixed(1)} fill="#ffb347" opacity="0.35">
          <animate attributeName="opacity" values="0.4;0.12;0.4" dur={`${r.dur.toFixed(1)}s`} repeatCount="indefinite" />
        </rect>
      ))}

      <g fill="none" stroke="#0d0b22" strokeWidth="1.4" strokeLinecap="round">
        <path d="M0 0 q4 -3 8 0 q4 -3 8 0" />
        <path d="M14 8 q3 -2.4 6 0 q3 -2.4 6 0" />
        <path d="M-12 10 q3 -2.4 6 0 q3 -2.4 6 0" />
        <animateTransform attributeName="transform" type="translate" values="300 60; 900 30; 1500 50" dur="45s" repeatCount="indefinite" />
      </g>
    </svg>
  )
}
