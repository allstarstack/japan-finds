// CheatSheets.jsx
// /cheat-sheets index page — production component (V4: Composite)
//
// Aesthetic system (LOCKED — do not change without an updated brief):
//   PALETTE   Rice #F7F3EA · Ink #151515 · Concrete #E6E1D8 · Egg Sando Yellow #FFD84D
//             Alpha variants of Ink/Yellow/Concrete are allowed for tints/overlays.
//             No other colors.
//   FONTS     Space Grotesk 700 · Inter 400 · IBM Plex Mono 500 (those weights only).
//   IMAGERY   Functional 1.5px ink-stroke icons only. No Mt. Fuji / torii / blossoms /
//             Shibuya neon / shrines / AI-generated Japan photography.
//   VOICE     Direct, present-tense, no marketing-speak. Banned words list enforced.
//
// Structure:
//   - Featured row (timely + seasonal-in-season sheets) — 1-up mobile / 2-up desktop
//   - Evergreen reference grid — 1-col mobile / 3-col desktop
//   - All cards: hover (border darken + 2px lift), :focus-visible (2px ink outline),
//     :target (yellow inner ring + ink outer ring) for deep links
//
// Routing assumption: each sheet is a URL fragment (#sheet-id). If you switch to
// nested routes, the :target highlight will no longer fire — replace with a
// matching className applied based on the current route.

import React from 'react';

// ─── Shared data ─────────────────────────────────────────────────────
// 9 sheets. Each has: title, one-line tagline (≤12 words, present tense),
// category, icon, last-updated date, kind ("seasonal" | "timely" | "evergreen").
const CS_ITEMS = [
  { id:'events-2026',  title:'Japan Events 2026',     tagline:'Festivals, fireworks, and matsuri across the calendar year.',  cat:'Events',  icon:'calendar', updated:'2026·05·14', kind:'timely',   badge:'2026' },
  { id:'pack-summer',  title:'Pack for Summer',       tagline:'Beat humidity, mosquitoes, and the August sun.',               cat:'Packing', icon:'sun',      updated:'2026·05·02', kind:'seasonal', badge:'In season' },
  { id:'pack-winter',  title:'Pack for Winter',       tagline:'Layers, hand warmers, and what survives Hokkaido cold.',       cat:'Packing', icon:'snow',     updated:'2025·11·18', kind:'seasonal' },
  { id:'konbini',      title:'Konbini Picks',         tagline:'What to grab at 7-Eleven, FamilyMart, and Lawson.',            cat:'Food',    icon:'onigiri',  updated:'2026·04·22', kind:'evergreen' },
  { id:'suica',        title:'Suica & IC Cards',      tagline:'Pick a card, top it up, tap to ride.',                          cat:'Transit', icon:'iccard',   updated:'2026·03·09', kind:'evergreen' },
  { id:'train-rules',  title:'Train Etiquette',       tagline:'Quiet cars, queue spots, and which seat to take.',              cat:'Transit', icon:'train',    updated:'2026·02·11', kind:'evergreen' },
  { id:'jr-pass',      title:'JR Pass Math',          tagline:'Run your route and see if the pass pays off.',                  cat:'Transit', icon:'ticket',   updated:'2026·01·28', kind:'evergreen' },
  { id:'cash-cards',   title:'Cash & Card Norms',     tagline:'Where yen is required and where Visa is fine.',                cat:'Money',   icon:'yen',      updated:'2025·12·06', kind:'evergreen' },
  { id:'drugstore',    title:'Drugstore Picks',       tagline:'Painkillers, sunscreen, eye drops worth bringing home.',        cat:'Health',  icon:'pill',     updated:'2025·10·30', kind:'evergreen' },
];

// ─── Icon library (1.5px ink strokes, 24×24 viewBox) ────────────────
function CSIcon({ kind, size = 28, color = '#151515' }) {
  const s = size;
  const common = { width:s, height:s, viewBox:'0 0 24 24', fill:'none', stroke:color, strokeWidth:1.5, strokeLinecap:'round', strokeLinejoin:'round' };
  switch (kind) {
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3.5" y="5" width="17" height="15" rx="1.5" />
          <line x1="3.5" y1="9.5" x2="20.5" y2="9.5" />
          <line x1="8" y1="3" x2="8" y2="6.5" />
          <line x1="16" y1="3" x2="16" y2="6.5" />
          <rect x="7" y="12.5" width="2.4" height="2.4" rx="0.4" fill={color} stroke="none" />
          <rect x="11" y="12.5" width="2.4" height="2.4" rx="0.4" />
          <rect x="15" y="12.5" width="2.4" height="2.4" rx="0.4" />
          <rect x="7" y="16.5" width="2.4" height="2.4" rx="0.4" />
          <rect x="11" y="16.5" width="2.4" height="2.4" rx="0.4" />
        </svg>
      );
    case 'sun':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="3" x2="12" y2="5" />
          <line x1="12" y1="19" x2="12" y2="21" />
          <line x1="3" y1="12" x2="5" y2="12" />
          <line x1="19" y1="12" x2="21" y2="12" />
          <line x1="5.6" y1="5.6" x2="7" y2="7" />
          <line x1="17" y1="17" x2="18.4" y2="18.4" />
          <line x1="5.6" y1="18.4" x2="7" y2="17" />
          <line x1="17" y1="7" x2="18.4" y2="5.6" />
        </svg>
      );
    case 'snow':
      return (
        <svg {...common}>
          <line x1="12" y1="3" x2="12" y2="21" />
          <line x1="4.2" y1="7.5" x2="19.8" y2="16.5" />
          <line x1="4.2" y1="16.5" x2="19.8" y2="7.5" />
          <polyline points="10,5 12,3 14,5" />
          <polyline points="10,19 12,21 14,19" />
          <polyline points="5.5,5.5 4.2,7.5 6.5,8" />
          <polyline points="18.5,18.5 19.8,16.5 17.5,16" />
          <polyline points="5.5,18.5 4.2,16.5 6.5,16" />
          <polyline points="18.5,5.5 19.8,7.5 17.5,8" />
        </svg>
      );
    case 'onigiri': // triangle with nori band
      return (
        <svg {...common}>
          <path d="M12 4 L20 19 L4 19 Z" />
          <rect x="7" y="15.5" width="10" height="3.5" />
          <line x1="7" y1="15.5" x2="17" y2="15.5" />
        </svg>
      );
    case 'iccard':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M8 14 Q10 11 13 14" />
          <path d="M7 16 Q10 11 15 16" />
          <circle cx="17.5" cy="9" r="0.5" fill={color} stroke="none" />
        </svg>
      );
    case 'train':
      return (
        <svg {...common}>
          <rect x="5" y="3.5" width="14" height="14" rx="2.5" />
          <line x1="5" y1="11" x2="19" y2="11" />
          <rect x="7.5" y="6" width="3.5" height="3" rx="0.5" />
          <rect x="13" y="6" width="3.5" height="3" rx="0.5" />
          <circle cx="9" cy="14" r="0.6" fill={color} stroke="none" />
          <circle cx="15" cy="14" r="0.6" fill={color} stroke="none" />
          <line x1="7" y1="20" x2="9" y2="17.5" />
          <line x1="17" y1="20" x2="15" y2="17.5" />
        </svg>
      );
    case 'ticket':
      return (
        <svg {...common}>
          <path d="M3 9 Q3 8 4 8 L20 8 Q21 8 21 9 L21 11 Q19.5 11 19.5 12 Q19.5 13 21 13 L21 15 Q21 16 20 16 L4 16 Q3 16 3 15 L3 13 Q4.5 13 4.5 12 Q4.5 11 3 11 Z" />
          <line x1="9" y1="11" x2="9" y2="13" />
          <line x1="15" y1="11" x2="15" y2="13" />
        </svg>
      );
    case 'yen':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M8.5 7.5 L12 12.5 L15.5 7.5" />
          <line x1="12" y1="12.5" x2="12" y2="17" />
          <line x1="8.5" y1="13.5" x2="15.5" y2="13.5" />
          <line x1="8.5" y1="15.5" x2="15.5" y2="15.5" />
        </svg>
      );
    case 'pill':
      return (
        <svg {...common}>
          <rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-30 12 12)" />
          <line x1="9.5" y1="6.5" x2="14.5" y2="17.5" />
        </svg>
      );
    default: return null;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────
function kindLabel(kind) {
  if (kind === 'timely')   return 'Updated for 2026';
  if (kind === 'seasonal') return 'Seasonal';
  return 'Evergreen';
}

// ─── Shared section wrapper ──────────────────────────────────────────
function CSSection({ children, viewport, label, intro }) {
  const widths = { mobile: 375, desktop: 1200 };
  return (
    <div style={{
      width: widths[viewport], background: '#F7F3EA',
      border:'1px solid #E6E1D8',
      padding: viewport === 'mobile' ? '32px 20px 40px' : '64px 80px 80px',
      color:'#151515',
    }}>
      <div style={{
        fontFamily:'"IBM Plex Mono", monospace', fontSize:10, fontWeight:500,
        color:'#15151599', letterSpacing:'0.14em', textTransform:'uppercase',
        marginBottom: 14,
      }}>{label}</div>
      <h1 style={{ fontFamily:'"Space Grotesk", sans-serif', fontWeight:700, fontSize: viewport==='mobile'?34:56, letterSpacing:'-0.028em', margin:'0 0 10px', lineHeight:1.0 }}>
        Cheat sheets
      </h1>
      <p style={{ fontFamily:'"Inter", sans-serif', fontWeight:400, fontSize: viewport==='mobile'?15:18, color:'#151515', margin:'0 0 28px', lineHeight:1.5, maxWidth: viewport==='mobile' ? undefined : 640 }}>
        {intro}
      </p>
      {children}
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────
function CSFeatureCardV4({ item, viewport }) {
  return (
    <a href={`#${item.id}`} className="v4-feat" style={{
      display:'flex', flexDirection:'column',
      padding: viewport === 'mobile' ? '22px 22px 24px' : '28px',
      background:'#F7F3EA',
      border:'1px solid #151515',
      borderRadius: 4,
      textDecoration:'none', color:'inherit',
      transition:'transform 120ms ease, border-color 120ms ease',
      minHeight: viewport === 'mobile' ? undefined : 320,
    }}>
      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'center',
        marginBottom: 18,
      }}>
        <span style={{
          fontFamily:'"IBM Plex Mono", monospace', fontWeight:500, fontSize:10.5,
          color:'#151515', letterSpacing:'0.12em', textTransform:'uppercase',
        }}>
          {item.kind === 'timely' ? 'Right now · Events' : 'Right now · Packing'}
        </span>
        <CSIcon kind={item.icon} size={26} />
      </div>

      <div style={{
        fontFamily:'"Space Grotesk", sans-serif', fontWeight:700,
        fontSize: viewport === 'mobile' ? 30 : 36,
        lineHeight:1.0, letterSpacing:'-0.03em',
        marginBottom: 12,
        display:'flex', alignItems:'center', gap:10, flexWrap:'wrap',
      }}>
        <span>{item.title}</span>
        {item.kind === 'timely' && (
          <span style={{
            fontFamily:'"IBM Plex Mono", monospace', fontWeight:500,
            fontSize:11, letterSpacing:'0.08em',
            background:'#FFD84D', color:'#151515',
            padding:'3px 8px', borderRadius:2, alignSelf:'center',
          }}>2026</span>
        )}
      </div>

      <div style={{
        fontFamily:'"Inter", sans-serif', fontWeight:400,
        fontSize: viewport === 'mobile' ? 15 : 16,
        color:'#151515', lineHeight:1.5, marginBottom: 22, flex:1,
        maxWidth: viewport === 'mobile' ? undefined : 420,
      }}>
        {item.id === 'events-2026'
          ? 'Every festival, fireworks night, and matsuri worth planning around — sorted by month, dates locked for the 2026 calendar.'
          : 'Late-May through August: what to pack for humidity, train AC, mosquitoes, sunburn, and the rainy-season week most people forget.'}
      </div>

      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'center',
        paddingTop: 18, borderTop:'1px solid #E6E1D8',
      }}>
        <span style={{
          fontFamily:'"IBM Plex Mono", monospace', fontWeight:500, fontSize:10.5,
          color:'#15151599', letterSpacing:'0.06em',
        }}>UPD {item.updated}</span>
        <span style={{
          fontFamily:'"Space Grotesk", sans-serif', fontWeight:700, fontSize:15,
          display:'inline-flex', alignItems:'center', gap:6,
          paddingBottom:2, borderBottom:'1.5px solid #151515',
        }}>Open sheet <span style={{fontSize:16}}>→</span></span>
      </div>
    </a>
  );
}

function CSVariant4({ viewport }) {
  const featured = CS_ITEMS.filter(i => i.kind === 'timely' || i.id === 'pack-summer');
  const rest = CS_ITEMS.filter(i => !featured.includes(i));
  return (
    <CSSection
      viewport={viewport}
      label="Variant 04 · Composite (recommended)"
      intro="Reference pages for the stuff you'll forget mid-trip. Two sheets are current right now — the others stay good year-round."
    >
      <style>{`
        .v4-feat:hover, .v4-card:hover { transform: translateY(-2px); border-color:#151515 !important; }
        .v4-feat:focus-visible, .v4-card:focus-visible { outline:2px solid #151515; outline-offset:3px; }
        .v4-feat:target, .v4-card:target { box-shadow: inset 0 0 0 2px #FFD84D, inset 0 0 0 3px #151515; }
      `}</style>

      {/* Featured row — V3's top, drop-shadow removed */}
      <div style={{
        display:'grid',
        gridTemplateColumns: viewport === 'mobile' ? '1fr' : '1fr 1fr',
        gap: viewport === 'mobile' ? 12 : 18,
        marginBottom: viewport === 'mobile' ? 28 : 40,
      }}>
        {featured.map(it => <CSFeatureCardV4 key={it.id} item={it} viewport={viewport} />)}
      </div>

      {/* Section divider — renamed */}
      <div style={{
        display:'flex', alignItems:'center', gap:14, marginBottom: 14,
      }}>
        <span style={{
          fontFamily:'"IBM Plex Mono", monospace', fontWeight:500, fontSize:10.5,
          color:'#151515', letterSpacing:'0.14em', textTransform:'uppercase',
        }}>Evergreen reference · 07</span>
        <span style={{ flex:1, height:1, background:'#15151533' }} />
      </div>

      {/* V2 grid as "the rest" — full equal-weight cards, not compact rows */}
      <div style={{
        display:'grid',
        gridTemplateColumns: viewport === 'mobile' ? '1fr' : 'repeat(3, 1fr)',
        gap: viewport === 'mobile' ? 12 : 16,
      }}>
        {rest.map(it => (
          <a key={it.id} href={`#${it.id}`} className="v4-card" style={{
            display:'flex', flexDirection:'column',
            padding: viewport === 'mobile' ? '20px' : '22px',
            background:'#F7F3EA', border:'1px solid #E6E1D8', borderRadius: 4,
            textDecoration:'none', color:'inherit',
            transition:'border-color 120ms ease, transform 120ms ease',
            minHeight: viewport === 'mobile' ? undefined : 220,
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 16 }}>
              <div style={{
                width: 44, height: 44,
                display:'flex', alignItems:'center', justifyContent:'center',
                background:'#E6E1D880', border:'1px solid #E6E1D8', borderRadius: 4,
              }}>
                <CSIcon kind={it.icon} size={26} />
              </div>
              <span style={{
                fontFamily:'"IBM Plex Mono", monospace', fontWeight:500, fontSize:10,
                color:'#151515', letterSpacing:'0.08em', textTransform:'uppercase',
                padding:'4px 8px', border:'1px solid #151515', borderRadius:2,
              }}>{it.cat}</span>
            </div>
            <div style={{
              fontFamily:'"Space Grotesk", sans-serif', fontWeight:700,
              fontSize: viewport === 'mobile' ? 19 : 20,
              lineHeight:1.15, letterSpacing:'-0.02em', marginBottom: 7,
            }}>{it.title}</div>
            <div style={{
              fontFamily:'"Inter", sans-serif', fontWeight:400, fontSize: 14,
              color:'#151515', lineHeight:1.5, marginBottom: 16, flex:1,
            }}>{it.tagline}</div>
            <div style={{
              display:'flex', justifyContent:'space-between', alignItems:'center',
              paddingTop: 12, borderTop:'1px solid #E6E1D8',
            }}>
              <span style={{
                fontFamily:'"IBM Plex Mono", monospace', fontWeight:500, fontSize:10,
                color:'#15151599', letterSpacing:'0.06em',
              }}>UPD {it.updated}</span>
              <span style={{
                fontFamily:'"Space Grotesk", sans-serif', fontWeight:700, fontSize:13,
                display:'inline-flex', alignItems:'center', gap:5,
                paddingBottom:1, borderBottom:'1.5px solid #151515',
              }}>Open <span style={{fontSize:14}}>→</span></span>
            </div>
          </a>
        ))}
      </div>
    </CSSection>
  );
}

// (design-canvas window registration omitted — this file exports a real React component)

export default function CheatSheets({ viewport = 'desktop' }) {
  return <CSVariant4 viewport={viewport} />;
}
