// "Going to Japan?" section — 3 mockup variants
// Strict brand palette: Rice White #F7F3EA, Ink Black #151515, Concrete Gray #E6E1D8
// Fonts: Space Grotesk 700 (head), Inter 400 (body), IBM Plex Mono 500 (label)

const GTJ = {
  rice: '#F7F3EA',
  ink: '#151515',
  concrete: '#E6E1D8',
  // Derivatives — used only for hairlines, NOT introduced colours.
  ink60: '#15151599',
  ink40: '#15151566',
  hair: '#15151514',
};

// Six sortables — covers connectivity, transport, money, insurance.
// Detail strings are ≤8 words, present tense.
const SORTABLES = [
  { cat:'Connectivity', brand:'Airalo',         name:'eSIM for Japan',         detail:'Activates before you land.',           icon:'sim'   },
  { cat:'Transport',    brand:'JRPass.com',     name:'JR Pass (nationwide)',   detail:'7 days unlimited Shinkansen.',         icon:'ticket'},
  { cat:'Transport',    brand:'Welcome Suica',  name:'IC card for tourists',   detail:'Tap to ride from day one.',            icon:'tap'   },
  { cat:'Insurance',    brand:'SafetyWing',     name:'Travel insurance',       detail:'Per-week coverage. Easy claims.',      icon:'shield'},
  { cat:'Money',        brand:'Wise',           name:'Multi-currency card',    detail:'Spend yen at the real rate.',          icon:'card'  },
  { cat:'Connectivity', brand:'Ninja WiFi',     name:'Pocket WiFi rental',     detail:'Pick up at the airport counter.',      icon:'wifi'  },
];

// --- Functional icons. Strictly rect/circle/line geometry; ink stroke only.
function GTJIcon({ kind, size = 28 }) {
  const s = { width:size, height:size, display:'block' };
  const stroke = GTJ.ink;
  const sw = 1.6;
  switch (kind) {
    case 'sim':
      return (
        <svg viewBox="0 0 28 28" style={s} fill="none" stroke={stroke} strokeWidth={sw}>
          {/* card body w/ clipped corner */}
          <path d="M7 3 L21 3 L25 7 L25 25 L7 25 Z" strokeLinejoin="miter" />
          {/* contact pad */}
          <rect x="11" y="10" width="10" height="11" />
          <line x1="11" y1="14" x2="21" y2="14" />
          <line x1="11" y1="18" x2="21" y2="18" />
          <line x1="16" y1="10" x2="16" y2="21" />
        </svg>
      );
    case 'ticket':
      return (
        <svg viewBox="0 0 28 28" style={s} fill="none" stroke={stroke} strokeWidth={sw}>
          <rect x="3" y="8" width="22" height="12" />
          {/* perforation */}
          <line x1="18" y1="8" x2="18" y2="20" strokeDasharray="1.2 1.6" />
          {/* notches */}
          <path d="M3 12 a2 2 0 0 1 0 4" />
          <path d="M25 12 a2 2 0 0 0 0 4" />
        </svg>
      );
    case 'tap':
      return (
        <svg viewBox="0 0 28 28" style={s} fill="none" stroke={stroke} strokeWidth={sw}>
          <rect x="3" y="6" width="22" height="16" rx="1" />
          {/* wifi arcs */}
          <path d="M11 14 a4 4 0 0 1 6 0" />
          <path d="M9 12 a7 7 0 0 1 10 0" />
          <circle cx="14" cy="17" r="0.9" fill={stroke} stroke="none" />
        </svg>
      );
    case 'shield':
      return (
        <svg viewBox="0 0 28 28" style={s} fill="none" stroke={stroke} strokeWidth={sw}>
          <path d="M14 3 L23 6 L23 14 C23 19 19 23 14 25 C9 23 5 19 5 14 L5 6 Z" />
          {/* simple cross — straight lines only */}
          <line x1="14" y1="10" x2="14" y2="18" />
          <line x1="10" y1="14" x2="18" y2="14" />
        </svg>
      );
    case 'card':
      return (
        <svg viewBox="0 0 28 28" style={s} fill="none" stroke={stroke} strokeWidth={sw}>
          <rect x="3" y="7" width="22" height="14" rx="1" />
          {/* mag stripe */}
          <rect x="3" y="11" width="22" height="2.4" fill={stroke} stroke="none" />
          {/* number bars */}
          <line x1="6"  y1="17" x2="10" y2="17" />
          <line x1="12" y1="17" x2="16" y2="17" />
        </svg>
      );
    case 'wifi':
      return (
        <svg viewBox="0 0 28 28" style={s} fill="none" stroke={stroke} strokeWidth={sw}>
          {/* router body */}
          <rect x="4" y="17" width="20" height="7" rx="1" />
          <circle cx="20" cy="20.5" r="0.9" fill={stroke} stroke="none" />
          {/* signal arcs */}
          <path d="M9 13 a6 6 0 0 1 10 0" />
          <path d="M6 10 a10 10 0 0 1 16 0" />
        </svg>
      );
    default: return <span />;
  }
}

// =========================================================================
// VARIANT 1 — ICON-FORWARD
// Functional iconography. Concrete strip activates on the right edge of card.
// =========================================================================

function V1Card({ item, w = 'auto' }) {
  return (
    <div style={{
      position:'relative',
      background: GTJ.rice,
      border: `1px solid ${GTJ.concrete}`,
      padding: '16px 16px 16px 16px',
      display:'flex', gap:14, alignItems:'flex-start',
      minHeight: 104,
    }}>
      {/* icon well */}
      <div style={{
        width: 44, height: 44, flexShrink:0,
        border: `1px solid ${GTJ.concrete}`,
        display:'flex', alignItems:'center', justifyContent:'center',
        background: GTJ.rice,
      }}>
        <GTJIcon kind={item.icon} size={24} />
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{
          fontFamily:'var(--fm)', fontWeight:500, fontSize:10,
          letterSpacing:'0.08em', textTransform:'uppercase',
          color: GTJ.ink, opacity:0.55, marginBottom:6,
        }}>{item.brand}</div>
        <div style={{
          fontFamily:'var(--fb)', fontWeight:700, fontSize:15, lineHeight:1.2,
          color: GTJ.ink, marginBottom:4,
        }}>{item.name}</div>
        <div style={{
          fontFamily:'var(--fb)', fontWeight:400, fontSize:13, lineHeight:1.35,
          color: GTJ.ink, opacity:0.7,
        }}>{item.detail}</div>
      </div>

      {/* active strip — concrete grey, top-to-bottom on right edge */}
      <div style={{
        position:'absolute', top:0, right:0, bottom:0, width:6,
        background: GTJ.concrete,
      }} />

      {/* affordance: small mono "OPEN →" tucked bottom-right */}
      <div style={{
        position:'absolute', right:18, bottom:12,
        fontFamily:'var(--fm)', fontWeight:500, fontSize:10,
        letterSpacing:'0.1em', color: GTJ.ink,
      }}>OPEN →</div>
    </div>
  );
}

function V1Mobile() {
  return (
    <div className="jf-frame" style={{ width:'100%', minHeight:'100%', padding:'40px 20px 56px' }}>
      <SectionHead />
      <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:10, marginTop:20 }}>
        {SORTABLES.map((s,i) => <V1Card key={i} item={s} />)}
      </div>
    </div>
  );
}

function V1Desktop() {
  return (
    <div className="jf-frame" style={{ width:'100%', minHeight:'100%', padding:'72px 80px 96px' }}>
      <SectionHeadDesktop />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginTop:36 }}>
        {SORTABLES.map((s,i) => <V1Card key={i} item={s} />)}
      </div>
    </div>
  );
}

// =========================================================================
// VARIANT 2 — ORDERED BY LEAD TIME
// 01–06 in lead-time order: longest pre-trip window first, on-arrival last.
// Numerals carry real meaning — the order is the differentiator.
// =========================================================================

// Explicit lead-time ordering for V2. The numerals 01–06 are earned by this order;
// the items themselves do not have a causal sequence, but they DO have honest
// lead-time windows. V1 and V3 keep the original SORTABLES order.
const V2_ORDERED = [
  { brand:'SafetyWing',    name:'Travel insurance',     detail:'Active before non-refundable bookings.', lead:'Before booking' },
  { brand:'Wise',          name:'Multi-currency card',  detail:'Order, receive, activate.',              lead:'2 weeks ahead' },
  { brand:'JRPass.com',    name:'JR Pass (nationwide)', detail:'Buy online, voucher arrives by mail.',   lead:'1 week ahead'  },
  { brand:'Ninja WiFi',    name:'Pocket WiFi rental',   detail:'Reserve airport-counter pickup.',        lead:'3 days ahead'  },
  { brand:'Airalo',        name:'eSIM for Japan',       detail:'Install now, activates on landing.',     lead:'Day before'    },
  { brand:'Welcome Suica', name:'IC card for tourists', detail:'Grab from an airport kiosk.',            lead:'On arrival'    },
];

function V2Card({ item, n, w='auto' }) {
  const nn = String(n).padStart(2,'0');
  return (
    <div style={{
      position:'relative',
      background: GTJ.rice,
      border: `1px solid ${GTJ.concrete}`,
      padding: '14px 16px 16px',
    }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
        <div style={{
          fontFamily:'var(--fm)', fontWeight:500, fontSize:11,
          letterSpacing:'0.12em', color: GTJ.ink, opacity:0.55,
        }}>{nn}</div>
        <div style={{
          fontFamily:'var(--fm)', fontWeight:500, fontSize:10,
          letterSpacing:'0.08em', textTransform:'uppercase',
          color: GTJ.ink, opacity:0.55,
        }}>{item.brand}</div>
      </div>

      {/* lead-time label — the real differentiator */}
      <div style={{
        marginTop: 14,
        display:'inline-block',
        padding:'3px 8px',
        border: `1px solid ${GTJ.concrete}`,
        background: GTJ.rice,
        fontFamily:'var(--fm)', fontWeight:500, fontSize:10,
        letterSpacing:'0.08em', textTransform:'uppercase',
        color: GTJ.ink,
      }}>{item.lead}</div>

      <div style={{ marginTop: 10 }}>
        <div style={{
          fontFamily:'var(--fb)', fontWeight:700, fontSize:16, lineHeight:1.2,
          color: GTJ.ink, marginBottom:4,
        }}>{item.name}</div>
        <div style={{
          fontFamily:'var(--fb)', fontWeight:400, fontSize:13, lineHeight:1.4,
          color: GTJ.ink, opacity:0.7,
        }}>{item.detail}</div>
      </div>

      {/* bottom rule + action */}
      <div style={{
        marginTop: 16, paddingTop: 12,
        borderTop: `1px solid ${GTJ.concrete}`,
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <span style={{
          fontFamily:'var(--fm)', fontWeight:500, fontSize:10,
          letterSpacing:'0.1em', textTransform:'uppercase', color: GTJ.ink,
        }}>Open →</span>
        <span style={{
          fontFamily:'var(--fm)', fontWeight:500, fontSize:10,
          letterSpacing:'0.1em', textTransform:'uppercase', color: GTJ.ink, opacity:0.55,
        }}>{nn}</span>
      </div>
    </div>
  );
}

function V2Mobile() {
  return (
    <div className="jf-frame" style={{ width:'100%', minHeight:'100%', padding:'40px 20px 56px' }}>
      <SectionHead />
      <div style={{
        marginTop:18, marginBottom:14,
        fontFamily:'var(--fm)', fontWeight:500, fontSize:10,
        letterSpacing:'0.12em', textTransform:'uppercase', color: GTJ.ink, opacity:0.55,
      }}>Earliest first · ordered by lead time</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:0, border:`1px solid ${GTJ.concrete}`, borderBottom:'none' }}>
        {V2_ORDERED.map((s,i) => (
          <div key={i} style={{ borderBottom:`1px solid ${GTJ.concrete}` }}>
            <V2RowMobile item={s} n={i+1} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Tighter mobile row for V2 — timeline-feel: lead-time pill on the left half,
// title/brand stacked next to it. The visual rhythm IS the differentiator.
function V2RowMobile({ item, n }) {
  const nn = String(n).padStart(2,'0');
  return (
    <div style={{ background: GTJ.rice, padding:'14px 16px', display:'flex', alignItems:'center', gap:14 }}>
      <div style={{
        flexShrink:0, width:30, textAlign:'left',
        fontFamily:'var(--fm)', fontWeight:500, fontSize:14,
        letterSpacing:'0.06em', color: GTJ.ink,
      }}>{nn}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{
          display:'flex', alignItems:'center', gap:8, marginBottom:5, flexWrap:'wrap',
        }}>
          <span style={{
            display:'inline-block', padding:'2px 7px',
            border:`1px solid ${GTJ.concrete}`, background: GTJ.rice,
            fontFamily:'var(--fm)', fontWeight:500, fontSize:9,
            letterSpacing:'0.08em', textTransform:'uppercase', color: GTJ.ink,
          }}>{item.lead}</span>
          <span style={{
            fontFamily:'var(--fm)', fontWeight:500, fontSize:9,
            letterSpacing:'0.1em', textTransform:'uppercase',
            color: GTJ.ink, opacity:0.55,
          }}>{item.brand}</span>
        </div>
        <div style={{
          fontFamily:'var(--fb)', fontWeight:700, fontSize:14, lineHeight:1.2,
          color: GTJ.ink, marginBottom:2,
        }}>{item.name}</div>
        <div style={{
          fontFamily:'var(--fb)', fontWeight:400, fontSize:12, lineHeight:1.35,
          color: GTJ.ink, opacity:0.7,
        }}>{item.detail}</div>
      </div>
      <div style={{
        flexShrink:0,
        fontFamily:'var(--fm)', fontWeight:500, fontSize:11,
        letterSpacing:'0.08em', textTransform:'uppercase', color: GTJ.ink,
        paddingLeft:8,
      }}>Open →</div>
    </div>
  );
}

function V2Desktop() {
  return (
    <div className="jf-frame" style={{ width:'100%', minHeight:'100%', padding:'72px 80px 96px' }}>
      <SectionHeadDesktop />
      <div style={{
        marginTop:28, marginBottom:18,
        fontFamily:'var(--fm)', fontWeight:500, fontSize:11,
        letterSpacing:'0.12em', textTransform:'uppercase', color: GTJ.ink, opacity:0.55,
      }}>Earliest first · ordered by lead time</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
        {V2_ORDERED.map((s,i) => <V2Card key={i} item={s} n={i+1} />)}
      </div>
    </div>
  );
}

// =========================================================================
// VARIANT 3 — CHIPS-AND-CARDS
// Top chip rail (Connectivity / Transport / Money / Insurance) filters below.
// =========================================================================

const V3_CATS = ['All', 'Connectivity', 'Transport', 'Money', 'Insurance'];

function V3Chip({ children, active, count }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:6,
      padding:'7px 12px',
      background: active ? GTJ.ink : 'transparent',
      color: active ? GTJ.rice : GTJ.ink,
      border: `1px solid ${active ? GTJ.ink : GTJ.concrete}`,
      borderRadius: 999,
      fontFamily:'var(--fm)', fontWeight:500, fontSize:11,
      letterSpacing:'0.06em', textTransform:'uppercase',
      whiteSpace:'nowrap',
    }}>
      {children}
      {count != null && (
        <span style={{
          fontFamily:'var(--fm)', fontWeight:500, fontSize:10,
          opacity: active ? 0.7 : 0.5, marginLeft:2,
        }}>{count}</span>
      )}
    </span>
  );
}

function V3Card({ item }) {
  return (
    <div style={{
      background: GTJ.rice,
      border: `1px solid ${GTJ.concrete}`,
      padding: '14px 16px',
      display:'flex', flexDirection:'column', gap:0,
      minHeight: 132,
    }}>
      <div style={{
        fontFamily:'var(--fm)', fontWeight:500, fontSize:9,
        letterSpacing:'0.1em', textTransform:'uppercase',
        color: GTJ.ink, opacity:0.55, marginBottom:8,
      }}>
        {item.cat} · {item.brand}
      </div>
      <div style={{
        fontFamily:'var(--fb)', fontWeight:700, fontSize:15, lineHeight:1.2,
        color: GTJ.ink, marginBottom:4,
      }}>{item.name}</div>
      <div style={{
        fontFamily:'var(--fb)', fontWeight:400, fontSize:13, lineHeight:1.4,
        color: GTJ.ink, opacity:0.7, marginBottom:14,
      }}>{item.detail}</div>

      {/* button-style affordance — clearly clickable, ink-on-rice */}
      <div style={{ marginTop:'auto' }}>
        <span style={{
          display:'inline-flex', alignItems:'center', gap:8,
          padding:'7px 12px 7px 14px',
          border:`1px solid ${GTJ.ink}`,
          borderRadius: 999,
          fontFamily:'var(--fm)', fontWeight:500, fontSize:11,
          letterSpacing:'0.06em', textTransform:'uppercase', color: GTJ.ink,
        }}>
          Open
          <span style={{ fontFamily:'var(--fh)', fontWeight:700 }}>→</span>
        </span>
      </div>
    </div>
  );
}

function V3Mobile() {
  // counts
  const counts = {
    Connectivity: SORTABLES.filter(s=>s.cat==='Connectivity').length,
    Transport:    SORTABLES.filter(s=>s.cat==='Transport').length,
    Money:        SORTABLES.filter(s=>s.cat==='Money').length,
    Insurance:    SORTABLES.filter(s=>s.cat==='Insurance').length,
  };
  return (
    <div className="jf-frame" style={{ width:'100%', minHeight:'100%', padding:'40px 0 56px' }}>
      <div style={{ padding:'0 20px' }}>
        <SectionHead />
      </div>
      {/* horizontal chip rail — overflow scrollable on mobile */}
      <div style={{
        marginTop:18, paddingLeft:20, paddingRight:20,
        display:'flex', gap:8, overflowX:'auto', whiteSpace:'nowrap',
        paddingBottom: 4,
      }}>
        <V3Chip active>All <span style={{opacity:0.7,marginLeft:2}}>6</span></V3Chip>
        <V3Chip count={counts.Connectivity >= 2 ? counts.Connectivity : null}>Connectivity</V3Chip>
        <V3Chip count={counts.Transport >= 2 ? counts.Transport : null}>Transport</V3Chip>
        <V3Chip count={counts.Money >= 2 ? counts.Money : null}>Money</V3Chip>
        <V3Chip count={counts.Insurance >= 2 ? counts.Insurance : null}>Insurance</V3Chip>
      </div>
      <div style={{ marginTop:18, padding:'0 20px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {SORTABLES.map((s,i) => <V3Card key={i} item={s} />)}
      </div>
    </div>
  );
}

function V3Desktop() {
  const counts = {
    Connectivity: SORTABLES.filter(s=>s.cat==='Connectivity').length,
    Transport:    SORTABLES.filter(s=>s.cat==='Transport').length,
    Money:        SORTABLES.filter(s=>s.cat==='Money').length,
    Insurance:    SORTABLES.filter(s=>s.cat==='Insurance').length,
  };
  return (
    <div className="jf-frame" style={{ width:'100%', minHeight:'100%', padding:'72px 80px 96px' }}>
      <SectionHeadDesktop />
      <div style={{ marginTop:28, display:'flex', gap:10, flexWrap:'wrap' }}>
        <V3Chip active>All <span style={{opacity:0.7,marginLeft:2}}>6</span></V3Chip>
        <V3Chip count={counts.Connectivity >= 2 ? counts.Connectivity : null}>Connectivity</V3Chip>
        <V3Chip count={counts.Transport >= 2 ? counts.Transport : null}>Transport</V3Chip>
        <V3Chip count={counts.Money >= 2 ? counts.Money : null}>Money</V3Chip>
        <V3Chip count={counts.Insurance >= 2 ? counts.Insurance : null}>Insurance</V3Chip>
      </div>
      <div style={{ marginTop:24, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
        {SORTABLES.map((s,i) => <V3Card key={i} item={s} />)}
      </div>
    </div>
  );
}

// =========================================================================
// Shared section heads + footer
// =========================================================================

function SectionHead() {
  return (
    <div>
      <h2 className="jf-hd" style={{
        margin:0,
        fontFamily:'var(--fh)', fontWeight:700,
        fontSize: 36, lineHeight:1.02, letterSpacing:'-0.025em',
        color: GTJ.ink,
      }}>Going to Japan?</h2>
      <div style={{
        marginTop: 10,
        fontFamily:'var(--fb)', fontWeight:400, fontSize:15, lineHeight:1.4,
        color: GTJ.ink, opacity:0.75,
      }}>Sort these before you fly.</div>
    </div>
  );
}

function SectionHeadDesktop() {
  return (
    <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:32, flexWrap:'wrap' }}>
      <div style={{ maxWidth: 720 }}>
        <h2 className="jf-hd" style={{
          margin:0,
          fontFamily:'var(--fh)', fontWeight:700,
          fontSize: 64, lineHeight:1.0, letterSpacing:'-0.03em',
          color: GTJ.ink,
        }}>Going to Japan?</h2>
        <div style={{
          marginTop: 16,
          fontFamily:'var(--fb)', fontWeight:400, fontSize:19, lineHeight:1.4,
          color: GTJ.ink, opacity:0.75,
        }}>Sort these before you fly.</div>
      </div>
      <div style={{
        fontFamily:'var(--fm)', fontWeight:500, fontSize:11,
        letterSpacing:'0.12em', textTransform:'uppercase',
        color: GTJ.ink, opacity:0.55,
      }}>6 items · pre-trip</div>
    </div>
  );
}

function FooterLine() { return null; }

// =========================================================================
// Annotation cards — what each variant uses, for brand verification
// =========================================================================

function NotesCard({ title, items }) {
  return (
    <div style={{ padding:'18px 18px 22px', fontFamily:'var(--fb)', color:'#5a4a2a', fontSize:12, lineHeight:1.55 }}>
      <div style={{
        fontFamily:'var(--fm)', fontWeight:500, fontSize:10,
        letterSpacing:'0.1em', textTransform:'uppercase',
        marginBottom: 10, opacity:0.7,
      }}>SPEC SHEET</div>
      <div style={{ fontFamily:'var(--fh)', fontWeight:700, fontSize:18, lineHeight:1.15, marginBottom:14, color:'#3a2e10' }}>{title}</div>
      {items.map((it,i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          <div style={{
            fontFamily:'var(--fm)', fontWeight:500, fontSize:9,
            letterSpacing:'0.1em', textTransform:'uppercase', opacity:0.65, marginBottom:2,
          }}>{it.k}</div>
          <div>{it.v}</div>
        </div>
      ))}
    </div>
  );
}

function V1Notes() {
  return <NotesCard title="Variant 1 — Icon-forward" items={[
    { k:'Palette', v:'Rice #F7F3EA · Ink #151515 · Concrete #E6E1D8. No other colours. Ink opacity (0.55 / 0.7 / 0.75) used for hierarchy only.' },
    { k:'Type', v:'Space Grotesk 700 (H2) · Inter 400 (detail) · IBM Plex Mono 500 (brand, action).' },
    { k:'Icons', v:'Functional only — SIM, ticket, IC tap, shield, card, WiFi router. Ink stroke, rect/circle/line geometry. No travel imagery.' },
    { k:'Affordance', v:'Concrete-grey strip on right edge (active state) + mono "OPEN →" bottom-right. Verb matches tap behaviour (outbound affiliate).' },
    { k:'Layout', v:'Mobile: 1-col stack, 10px gap, 6 cards. Desktop: 3-col grid, 14px gap.' },
    { k:'Copy check', v:'Title + subtitle unchanged from brief. Details ≤8 words, present tense. No banned words.' },
  ]} />;
}

function V2Notes() {
  return <NotesCard title="Variant 2 — Ordered by lead time" items={[
    { k:'Palette', v:'Rice · Ink · Concrete. No other colours.' },
    { k:'Type', v:'Same three fonts. Numerals 01–06 + lead-time labels in IBM Plex Mono 500.' },
    { k:'Differentiator (vs V1, V3)', v:'V2 answers "WHEN do I sort each one?" — reconceived from the dropped "do in order" claim. Items are ordered by their honest lead-time window: insurance before booking flights → IC card on arrival. The numerals 01–06 now do real work; the visual order = the temporal order.' },
    { k:'Lead-time labels', v:'01 Before booking · 02 2 weeks ahead · 03 1 week ahead · 04 3 days ahead · 05 Day before · 06 On arrival. Each renders as a small mono pill above the item name.' },
    { k:'Affordance', v:'Bottom rule + mono "OPEN →" + index numeral. Same verb as V1/V3 — matches outbound affiliate tap.' },
    { k:'Layout', v:'Mobile: single-column timeline (shared borders) — top-to-bottom reads as a real chronology. Desktop: 3-col grid keeps numerals + lead-time pills visible.' },
    { k:'Copy check', v:'Title + subtitle unchanged. Details ≤8 words. No banned words.' },
  ]} />;
}

function V3Notes() {
  return <NotesCard title="Variant 3 — Chips & cards" items={[
    { k:'Palette', v:'Rice · Ink · Concrete. Active chip = ink fill + rice text (still palette-legal).' },
    { k:'Type', v:'Same three fonts. Chips and category labels in mono.' },
    { k:'Chip rail', v:'All / Connectivity / Transport / Money / Insurance. Pattern matches /places + /eat. Singleton counts hidden — only shown when ≥2.' },
    { k:'Honest caveat', v:'Pattern is inherited, not earned at N=6. Filtering meaningfully reduces scan only at larger N. Justified here on wayfinding ("I just need transport"), not reduction. Weakest of the three on first-principles — kept as the "by what need" mental model option.' },
    { k:'Affordance', v:'Pill-button "Open →" with ink border — clearly clickable. Same verb as V1/V2.' },
    { k:'Layout', v:'Mobile: chip rail (h-scroll) + 2-col card grid. Desktop: chip rail + 3-col grid.' },
    { k:'Copy check', v:'Title + subtitle unchanged. Details ≤8 words. No banned words.' },
  ]} />;
}

Object.assign(window, {
  GTJ_V1Mobile: V1Mobile, GTJ_V1Desktop: V1Desktop, GTJ_V1Notes: V1Notes,
  GTJ_V2Mobile: V2Mobile, GTJ_V2Desktop: V2Desktop, GTJ_V2Notes: V2Notes,
  GTJ_V3Mobile: V3Mobile, GTJ_V3Desktop: V3Desktop, GTJ_V3Notes: V3Notes,
});
