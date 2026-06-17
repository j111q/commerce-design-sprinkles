/* Sprinkles & Co. — squad PR dashboard (Direction B: editorial cream).
   Unified feed with All / Merged / Open / Draft tabs, like the original
   Woo Sprinkles dashboard. Mock data for now; live GitHub wiring comes
   once repos + handles are confirmed. */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "headline": "The Sprinkles Spree 🧁",
  "tabStyle": "Underline",
  "gradientGlow": 100,
  "gradientHeadline": false
} /*EDITMODE-END*/;

/* ---- unified feed ---------------------------------------------------- */
/* Sorted by real recency: each item carries `ts` (epoch ms) from the data
   generator, newest first. Falls back to 0 for any hand-authored item. */
const FEED = DASH.MERGED.map(function (pr) {
  return Object.assign({}, pr, { status: "Merged" });
}).concat(DASH.OPEN.slice()).sort(function (a, b) {return (b.ts || 0) - (a.ts || 0);});

/* "View all" → a GitHub search across every squad author's PRs in the
   tracked repos (same scope the data is built from). */
const SQUAD_SEARCH_URL =
  "https://github.com/search?type=pullrequests&q=" +
  encodeURIComponent("is:pr " +
    DASH.SQUAD.filter(function (p) {return p.handle;}).map(function (p) {return "author:" + p.handle;}).join(" ") + " " +
    (DASH.REPOS || []).map(function (r) {return "repo:" + r;}).join(" "));

/* Top surfaces a person has authored in, most-touched first (up to 3). */
function topAreasFor(pid) {
  const counts = {};
  FEED.forEach(function (pr) {
    if (pr.authors.indexOf(pid) === -1) return;
    counts[pr.area] = (counts[pr.area] || 0) + 1;
  });
  return Object.keys(counts).sort(function (a, b) {return counts[b] - counts[a];}).slice(0, 3);
}

const TAB_FILTERS = {
  "All": function () {return true;},
  "Merged": function (pr) {return pr.status === "Merged";},
  "Open": function (pr) {return pr.status === "Open" || pr.status === "Approved";},
  "Draft": function (pr) {return pr.status === "Draft";}
};
const TABS = Object.keys(TAB_FILTERS);

/* ---- atoms ----------------------------------------------------------- */
function SAvatar({ id, size = 26 }) {
  const p = DASH.person(id);
  const ring = {
    width: size, height: size, borderRadius: "50%", background: p.color,
    border: "2px solid var(--woo-cream)", boxSizing: "border-box", flexShrink: 0
  };
  if (p.avatar) {
    return (
      <img
        src={p.avatar + (p.avatar.indexOf("?") >= 0 ? "&" : "?") + "s=" + size * 2}
        alt={p.name}
        title={p.name}
        loading="lazy"
        className="sprk-avatar"
        style={Object.assign({}, ring, { objectFit: "cover", display: "inline-block" })} />);

  }
  return (
    <span
      title={p.name}
      className="sprk-avatar"
      style={Object.assign({}, ring, {
        color: p.fg, display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: Math.max(9, Math.round(size * 0.4)), fontWeight: 600, fontFamily: "var(--font-sans)"
      })}>
      {p.name.slice(0, 1)}</span>);

}

/* Clickable squad avatar — filters the feed by person. Active state gets a
   gradient ring; inactive ones dim while a filter is on. No counts anywhere. */
function SFilterAvatar({ id, active, dimmed, onClick, size = 36 }) {
  const p = DASH.person(id);
  return (
    <button
      onClick={onClick}
      title={active ? "Clear filter" : "Show PRs " + p.name + " touched"}
      aria-pressed={active}
      style={{
        border: "none", padding: 2, margin: 0, borderRadius: "50%", cursor: "pointer",
        background: active ?
        "linear-gradient(135deg, var(--woo-purple), var(--woo-pink), var(--woo-blue))" :
        "transparent",
        opacity: dimmed ? 0.4 : 1,
        transition: "opacity 0.1s ease-out",
        display: "inline-flex", flexShrink: 0
      }}>
      
			<SAvatar id={id} size={size} />
		</button>);

}

function SBadge({ pr }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 999,
    font: "600 11px/16px var(--font-sans)", letterSpacing: "0.04em",
    textTransform: "uppercase", padding: "3px 10px", flexShrink: 0,
    border: "1px solid transparent", boxSizing: "border-box", whiteSpace: "nowrap"
  };
  if (pr.status === "Merged") {
    return (
      <button
        onClick={DASH.sprinkleBurst}
        onMouseEnter={miniSparkle}
        title="Merged — click me"
        style={Object.assign({}, base, {
          background: "linear-gradient(105deg, var(--woo-blue-soft) 0%, var(--woo-lavender-pale) 50%, var(--woo-pink-soft) 100%)",
          color: "var(--woo-indigo-deep)", cursor: "pointer"
        })}>
        
				<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M16.7 7.1l-6.3 8.5-3.3-2.5-.9 1.2 4.5 3.4L17.9 8z" />
				</svg>
				Merged
			</button>);

  }
  const styles = {
    "Open": { borderColor: "var(--woo-purple)", color: "var(--woo-purple-dark)", background: "transparent" },
    "Approved": { borderColor: "var(--woo-blue)", color: "var(--woo-blue)", background: "transparent" },
    "Draft": { borderColor: "var(--woo-rule)", color: "var(--woo-ink-soft)", background: "transparent" }
  };
  return <span style={Object.assign({}, base, styles[pr.status])}>{pr.status}</span>;
}

/* Release status — whether the PR's work is live in a stable release or still
   gated behind a feature flag. A separate dimension from the Merged/Open status
   pill, so it gets its own softer, sentence-case lane with an icon. */
function SFlagBadge({ flagged }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 999,
    font: "600 10.5px/14px var(--font-sans)", letterSpacing: "0.01em",
    padding: "2px 8px 2px 7px", marginRight: 8, boxSizing: "border-box",
    whiteSpace: "nowrap", verticalAlign: "middle", border: "1px solid transparent"
  };
  if (flagged) {
    // Secondary / outline treatment — quieter than the filled "Public release".
    return (
      <span className="sprk-flag" title="Behind a feature flag — not in a public release yet"
        style={Object.assign({}, base, { background: "transparent", borderColor: "var(--woo-pink)", color: "var(--woo-pink)" })}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M14.4 6 14 4H5v17h2v-7h5.6l.4 2h7V6z" />
        </svg>
        Feature flagged
      </span>);

  }
  return (
    <span className="sprk-flag" title="Shipped in a public WooCommerce release"
      style={Object.assign({}, base, { background: "var(--woo-blue-soft)", color: "var(--woo-indigo-deep)" })}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
      </svg>
      Public release
    </span>);

}

function STabs({ active, onChange, tabStyle, counts }) {
  const pills = tabStyle === "Pills";
  return (
    <div className="sprk-tabs-scroll" role="tablist" style={{
      display: "flex", gap: pills ? 8 : 4
    }}>
			{TABS.map(function (t) {
        const isActive = t === active;
        const pillStyle = {
          border: "1px solid " + (isActive ? "var(--woo-purple)" : "var(--woo-rule)"),
          background: isActive ? "var(--woo-purple)" : "var(--woo-paper)",
          color: isActive ? "#fff" : "var(--woo-ink)",
          borderRadius: 999, padding: "7px 16px"
        };
        const underlineStyle = {
          border: "none", background: "transparent",
          color: isActive ? "var(--woo-ink)" : "var(--woo-ink-soft)",
          borderBottom: "2px solid " + (isActive ? "var(--woo-purple)" : "transparent"),
          borderRadius: 0, padding: "8px 14px 10px", marginBottom: -1
        };
        return (
          <button
            key={t}
            role="tab"
            aria-selected={isActive}
            onClick={function () {onChange(t);}}
            style={Object.assign({
              font: "600 14px/20px var(--font-sans)", cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 7,
              transition: "background 0.1s ease-out, color 0.1s ease-out"
            }, pills ? pillStyle : underlineStyle)}>
            
						{t}
						<span style={{
              font: "600 11px/16px var(--font-sans)",
              color: isActive ? pills ? "var(--woo-lavender-pale)" : "var(--woo-purple)" : "var(--woo-ink-soft)",
              opacity: 0.9
            }}>{counts[t]}</span>
					</button>);

      })}
		</div>);

}

/* Focus-area filter as a dropdown — shown on narrow widths (where the rail
   is hidden) so the surface filter collapses next to the tabs instead of
   stacking a whole card at the bottom. Mirrors the same `surface` state. */
function SurfaceSelect({ value, areas, onChange }) {
  return (
    <span className="sprk-area-select">
      <select
        aria-label="Filter by focus area"
        value={value || ""}
        onChange={function (e) {onChange(e.target.value || null);}}>
        <option value="">All focus areas</option>
        {areas.map(function (a) {
          return <option key={a.name} value={a.name}>{a.name} ({a.count})</option>;
        })}
      </select>
    </span>);

}

/* Designer (person) filter as a dropdown — the narrow-width counterpart to the
   "Who we are" rail roster, mirroring how SurfaceSelect backs the focus chips. */
function SquadSelect({ value, squad, onChange }) {
  return (
    <span className="sprk-area-select">
      <select
        aria-label="Filter by designer"
        value={value || ""}
        onChange={function (e) {onChange(e.target.value || null);}}>
        <option value="">All designers</option>
        {squad.map(function (p) {
          return <option key={p.id} value={p.id}>{p.name}</option>;
        })}
      </select>
    </span>);

}

/* Animated number — eases from its last shown value to the new one (so it
   counts up on load and rolls when filters change). Snaps under reduced motion. */
function CountUp({ value, dur = 750 }) {
  const [n, setN] = React.useState(0);
  const cur = React.useRef(0);
  React.useEffect(function () {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      cur.current = value;setN(value);return;
    }
    const from = cur.current;
    if (from === value) return;
    let raf, start;
    const step = function (ts) {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / dur);
      const v = Math.round(from + (value - from) * (1 - Math.pow(1 - p, 3)));
      cur.current = v;setN(v);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return function () {if (raf) cancelAnimationFrame(raf);};
  }, [value, dur]);
  return n;
}

/* Tiny randomised sparkle on merged-badge hover — never quite the same twice. */
function miniSparkle(e) {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const r = e.currentTarget.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const COLORS = ["#FF3B30", "#FF9500", "#FFD60A", "#34C759", "#2F6BFF", "#E84A9C", "#32ADE6", "#7F54B3"];
  const n = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const s = document.createElement("div");
    const angle = Math.random() * Math.PI * 2;
    const dist = 12 + Math.random() * 20;
    const dx = Math.cos(angle) * dist, dy = Math.sin(angle) * dist - 6;
    s.textContent = "✦";
    s.style.cssText =
    "position:fixed;left:" + cx + "px;top:" + cy + "px;font-size:" + (6 + Math.random() * 5) +
    "px;line-height:1;color:" + COLORS[Math.floor(Math.random() * COLORS.length)] +
    ";pointer-events:none;z-index:99999;transform:translate(-50%,-50%) scale(0.3);opacity:0;" +
    "transition:transform .5s cubic-bezier(.2,.8,.2,1),opacity .5s ease-out;";
    document.body.appendChild(s);
    requestAnimationFrame(function () {requestAnimationFrame(function () {
      s.style.transform = "translate(calc(-50% + " + dx + "px),calc(-50% + " + dy + "px)) scale(1) rotate(" + (Math.random() * 140 - 70) + "deg)";
      s.style.opacity = "1";
    });});
    setTimeout(function () {s.style.opacity = "0";}, 320);
    setTimeout(function () {s.remove();}, 650);
  }
}

/* Easter egg: click a card avatar and it does a random little dance. */
const AVATAR_TWIRLS = ["sprk-tw-spin", "sprk-tw-wobble", "sprk-tw-flip", "sprk-tw-bounce", "sprk-tw-pop"];
function avatarTwirl(e) {
  const av = e.currentTarget.querySelector(".sprk-avatar");
  if (!av || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
  AVATAR_TWIRLS.forEach(function (c) {av.classList.remove(c);});
  void av.offsetWidth; // restart the animation even on rapid re-clicks
  const cls = AVATAR_TWIRLS[Math.floor(Math.random() * AVATAR_TWIRLS.length)];
  av.classList.add(cls);
  const done = function () {av.classList.remove(cls);av.removeEventListener("animationend", done);};
  av.addEventListener("animationend", done);
}

/* ---- app ------------------------------------------------------------- */
function SprinklesApp() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [tab, setTab] = React.useState("All");
  const [person, setPerson] = React.useState(null);
  const [surface, setSurface] = React.useState(null);
  /* Sticky compact bar appears once the in-flow tabs scroll up past the top. */
  const [stuck, setStuck] = React.useState(false);
  const tabsAnchor = React.useRef(null);
  React.useEffect(function () {
    let raf = 0;
    const onScroll = function () {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        const el = tabsAnchor.current;
        if (el) setStuck(el.getBoundingClientRect().top < 60);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return function () { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);
  const D = DASH;
  const card = {
    background: "var(--woo-paper)", borderRadius: 16,
    border: "1px solid var(--woo-rule)", boxSizing: "border-box"
  };
  /* Feed scoped by the active person + surface filters (but NOT the tab) so
     the tab counts reflect what's actually reachable under those filters. */
  const scoped = FEED.filter(function (pr) {
    if (person && pr.authors.indexOf(person) === -1) return false;
    if (surface && pr.area !== surface) return false;
    return true;
  });
  const tabCounts = {};
  TABS.forEach(function (tb) {tabCounts[tb] = scoped.filter(TAB_FILTERS[tb]).length;});
  /* Focus-area chips act like facet counts: follow person + tab, but ignore
     the active focus-area filter so every chip remains comparable/clickable. */
  const focusAreaRows = FEED.filter(function (pr) {
    if (person && pr.authors.indexOf(person) === -1) return false;
    return TAB_FILTERS[tab](pr);
  });
  const focusAreaCounts = {};
  focusAreaRows.forEach(function (pr) {
    focusAreaCounts[pr.area] = (focusAreaCounts[pr.area] || 0) + 1;
  });
  const focusAreas = D.AREAS.map(function (a) {
    return Object.assign({}, a, { count: focusAreaCounts[a.name] || 0 });
  }).filter(function (a) {
    return !person || a.count > 0;
  });
  const rows = scoped.filter(TAB_FILTERS[tab]);
  const personAreas = person ? topAreasFor(person) : [];
  const glow = (t.gradientGlow || 0) / 100;

  /* Fun ticker stats — quirky tallies mined from the merged PR titles. */
  const _titles = D.MERGED.map(function (pr) {return pr.title.toLowerCase();});
  const _tally = function (re) {return _titles.filter(function (t) {return re.test(t);}).length;};
  const funFacts = [
    [/contrast/, "chasing better contrast"],
    [/colou?r|palette|gray|grey/, "wrangling colour"],
    [/\balign|alignment/, "about alignment"],
    [/7\.0|wordpress 7|wp 7/, "aligning to WordPress 7.0"],
    [/radius|rounded|corner/, "rounding corners"],
    [/token/, "tokenizing hardcoded values"],
    [/spacing|padding|margin/, "nudging spacing"],
    [/empty state/, "refreshing empty states"],
    [/focus/, "sharpening focus states"],
    [/quick edit/, "polishing quick edit"],
    [/label|copy|wording|message|notice|text/, "wordsmithing copy"],
    [/\bicon/, "touching up icons"]].
  map(function (r) {var n = _tally(r[0]);return n ? n + " PRs " + r[1] : null;}).filter(Boolean);
  funFacts.push(D.SQUAD.length + " designers and don’t ask us how many tokens");
  funFacts.push(D.TOTALS.merged + " merged across " + D.TOTALS.surfaces + " focus areas");
  funFacts.push("made with pull requests & 🧁");

  return (
    <div data-screen-label="Sprinkles & Co. dashboard" style={{ background: "var(--woo-cream)", color: "var(--woo-ink)", fontFamily: "var(--font-sans)", minHeight: "100vh", padding: "0 0 56px", position: "relative" }}>
			<style>{`
        .pr-title:hover { text-decoration: underline; text-decoration-color: var(--woo-purple); text-underline-offset: 2px; }
        .pr-title:focus-visible { outline: 2px solid var(--woo-purple); outline-offset: 3px; border-radius: 4px; }
        /* Responsive scaffold — horizontal rhythm + feed/rail columns. */
        .sprk-wrap { max-width: 1180px; margin: 0 auto; box-sizing: border-box; padding-left: 56px; padding-right: 56px; }
        .sprk-grid { display: grid; grid-template-columns: minmax(0, 1fr) 348px; gap: 28px; align-items: start; }
        .sprk-tabs-scroll { max-width: 100%; min-width: 0; overflow-x: auto; overflow-y: hidden; scrollbar-width: none; }
        .sprk-tabs-scroll::-webkit-scrollbar { display: none; }
        .sprk-tabs-scroll > button { flex: 0 0 auto; }
        .sprk-card { min-width: 0; max-width: 100%; }
        .sprk-card-main { min-width: 0; max-width: 100%; overflow-wrap: anywhere; }
        .sprk-meta { display: block; min-width: 0; max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
        @media (max-width: 920px) {
          /* Rail drops below the feed; it reads as a summary footer. */
          .sprk-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .sprk-wrap { padding-left: 20px; padding-right: 20px; }
          /* Cards stack: badge over title over avatars, so nothing gets crushed. */
          .sprk-card { flex-direction: column; gap: 12px !important; padding: 18px 20px !important; width: 100%; }
          .sprk-card-people { padding-left: 0 !important; }
        }
        /* Compact filter bar — hidden above the viewport until scrolled. */
        .sprk-stickybar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 50;
          background: rgba(246,241,237,0.82);
          -webkit-backdrop-filter: blur(14px) saturate(140%);
          backdrop-filter: blur(14px) saturate(140%);
          border-bottom: 1px solid var(--woo-rule);
          box-shadow: 0 6px 20px rgba(30,17,66,0.06);
          transform: translateY(-101%);
          transition: transform 0.22s cubic-bezier(0.2,0.8,0.2,1);
        }
        .sprk-stickybar.is-stuck { transform: translateY(0); }
        /* Desktop/tablet: tabs sit flush to the bar's bottom edge. */
        .sprk-bar-wrap { padding-top: 10px; padding-bottom: 0; }
        /* Surface map stays in view as the feed scrolls (desktop two-column only). */
        .sprk-rail { position: sticky; top: 72px; }
        .sprk-area-select { display: none; }
        .sprk-area-select select {
          -webkit-appearance: none; appearance: none; font: 600 13px/1 var(--font-sans);
          color: var(--woo-ink); background-color: var(--woo-paper);
          border: 1px solid var(--woo-rule); border-radius: 999px;
          padding: 8px 32px 8px 14px; cursor: pointer; max-width: 230px;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='%237F54B3' d='M0 0h10L5 6z'/></svg>");
          background-repeat: no-repeat; background-position: right 12px center;
        }
        .sprk-area-select select:focus-visible { outline: 2px solid var(--woo-purple); outline-offset: 2px; }
        .sprk-filters { display: none; align-items: flex-end; flex-wrap: wrap; gap: 10px; min-width: 0; }
        .sprk-bar-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-width: 0; }
        /* In-flow tab header — filters stack above the tab row on narrow viewports. */
        .sprk-tabhead { display: flex; flex-direction: column; gap: 12px; }
        .sprk-updated { font: 500 12px/18px var(--font-sans); color: var(--woo-ink-soft); margin: 10px 0 0; opacity: 0.78; }
        @media (max-width: 920px) {
          .sprk-rail { display: none !important; }
          .sprk-area-select { display: inline-flex; }
          .sprk-filters { display: inline-flex; }
          .sprk-wrap { padding-left: 28px; padding-right: 28px; }
        }
        @media (max-width: 600px) {
          .sprk-wrap { padding-left: 20px; padding-right: 20px; }
          .sprk-filters { display: grid; grid-template-columns: minmax(0, 1fr); flex-basis: 100%; width: 100%; }
          .sprk-filters .sprk-area-select { flex: 1; min-width: 0; }
          .sprk-area-select select { width: 100%; max-width: none; }
          .sprk-tabs-scroll { flex: 1 1 auto; }
          .sprk-tabs-scroll > button { padding-left: 10px !important; padding-right: 10px !important; }
          /* Sticky bar can wrap to two lines here; keep tabs flush to the bottom edge. */
          .sprk-bar-wrap { padding-top: 14px; padding-bottom: 0; }
        }
        /* Shimmering gradient ribbon (main + sticky strip) — colors drift across. */
        .sprk-ribbon {
          background: linear-gradient(90deg, var(--woo-purple), var(--woo-pink), var(--woo-blue), var(--woo-purple));
          background-size: 200% 100%;
          animation: sprk-shimmer 7s linear infinite;
        }
        @keyframes sprk-shimmer { from { background-position: 0% 0; } to { background-position: -200% 0; } }
        /* Fun-stats ticker — subtle monospace band right under the ribbon. */
        .sprk-marquee {
          position: relative; z-index: 1;
          overflow: hidden; white-space: nowrap; margin: 0;
          background: rgba(255,255,255,0.4);
          border-bottom: 1px solid var(--woo-rule);
          -webkit-mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent);
          mask-image: linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent);
        }
        .sprk-marquee-track {
          display: inline-flex; align-items: center; padding: 7px 0;
          animation: sprk-marquee 52s linear infinite; will-change: transform;
        }
        .sprk-marquee:hover .sprk-marquee-track { animation-play-state: paused; }
        .sprk-marquee-item {
          font: 500 12px/1 "Menlo", "Consolas", monospace;
          color: var(--woo-ink-soft); letter-spacing: 0.01em;
          display: inline-flex; align-items: center;
        }
        .sprk-marquee-sep { margin: 0 14px; color: var(--woo-pink); font-size: 11px; }
        @keyframes sprk-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        /* Subtle card hover-lift. */
        .sprk-card { transition: transform 0.14s ease, box-shadow 0.14s ease; }
        .sprk-card:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(30,17,66,0.08); }
        /* Avatar peek — squad faces tilt & pop on hover. */
        .sprk-avatar { transition: transform 0.16s cubic-bezier(.3,.7,.4,1); position: relative; }
        .sprk-avatar:hover { transform: scale(1.18) rotate(-5deg); z-index: 2; }
        /* Easter egg: random little dance when a card avatar is clicked. */
        .sprk-tw-spin   { animation: sprk-tw-spin   0.6s cubic-bezier(.3,.7,.4,1); }
        .sprk-tw-wobble { animation: sprk-tw-wobble 0.5s ease-in-out; }
        .sprk-tw-flip   { animation: sprk-tw-flip   0.6s ease-in-out; }
        .sprk-tw-bounce { animation: sprk-tw-bounce 0.6s cubic-bezier(.3,.7,.4,1); }
        .sprk-tw-pop    { animation: sprk-tw-pop    0.5s cubic-bezier(.3,.7,.4,1); }
        @keyframes sprk-tw-spin { to { transform: rotate(360deg); } }
        @keyframes sprk-tw-wobble { 0%,100% { transform: rotate(0); } 25% { transform: rotate(-18deg); } 75% { transform: rotate(18deg); } }
        @keyframes sprk-tw-flip { to { transform: rotateY(360deg); } }
        @keyframes sprk-tw-bounce { 0%,100% { transform: translateY(0); } 40% { transform: translateY(-10px); } 70% { transform: translateY(-4px); } }
        @keyframes sprk-tw-pop { 0% { transform: scale(1); } 40% { transform: scale(1.4) rotate(10deg); } 100% { transform: scale(1); } }
        /* Focus-area filter pills. */
        .sprk-chip {
          display: inline-flex; align-items: center; gap: 6px; border-radius: 999px;
          border: 1px solid var(--woo-rule); background: var(--woo-cream); color: var(--woo-ink);
          padding: 3px 9px; font: 500 12px/15px var(--font-sans); cursor: pointer;
          transition: background .12s ease-out, color .12s ease-out, border-color .12s ease-out, transform .12s ease-out;
        }
        .sprk-chip:hover { border-color: var(--woo-purple); background: var(--woo-lavender-pale); transform: translateY(-1px); }
        .sprk-chip.is-on { border-color: var(--woo-purple); background: var(--woo-purple); color: #fff; }
        .sprk-chip.is-on:hover { background: var(--woo-purple-dark); border-color: var(--woo-purple-dark); }
        .sprk-chip-n { font: 700 10.5px/13px var(--font-sans); color: var(--woo-purple); }
        .sprk-chip.is-on .sprk-chip-n { color: var(--woo-lavender-pale); }
        .sprk-chip-cloud { display: flex; flex-wrap: wrap; gap: 6px; }
        @media (prefers-reduced-motion: reduce) {
          .sprk-stickybar { transition: none; }
          .sprk-ribbon, .sprk-marquee-track { animation: none; }
          .sprk-card, .sprk-avatar, .sprk-chip { transition: none; }
        }
      `}</style>
			{/* Brand ribbon */}
			<div aria-hidden="true" className="sprk-ribbon" style={{ height: 4 }}></div>
			{/* Fun-stats ticker — quirky tallies drift by, right under the ribbon */}
			<div className="sprk-marquee" aria-hidden="true">
				<div className="sprk-marquee-track">
					{funFacts.concat(funFacts).map(function (fact, i) {
            return (
              <span key={i} className="sprk-marquee-item">
                {fact}
                <span className="sprk-marquee-sep">❤︎</span>
              </span>);

          })}
				</div>
			</div>
			{/* Compact filter bar — slides in on scroll so avatars + tabs stay reachable */}
			<div className={"sprk-stickybar" + (stuck ? " is-stuck" : "")} aria-hidden={!stuck}>
				<div aria-hidden="true" className="sprk-ribbon" style={{ height: 4 }}></div>
				<div className="sprk-wrap sprk-bar-wrap" style={{ display: "flex", flexDirection: "column", rowGap: 8 }}>
					<span className="sprk-filters">
						<SquadSelect value={person} squad={D.SQUAD} onChange={setPerson} />
						<SurfaceSelect value={surface} areas={D.AREAS} onChange={setSurface} />
					</span>
					<div className="sprk-bar-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
						<STabs active={tab} onChange={setTab} tabStyle={t.tabStyle} counts={tabCounts} />
					</div>
				</div>
			</div>
			{/* Soft gradient blobs behind the header */}
			<div aria-hidden="true" style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 540, pointerEvents: "none",
        opacity: glow,
        background:
        "radial-gradient(640px 400px at 8% -40px, rgba(232,222,248,0.95), transparent 65%), " +
        "radial-gradient(560px 360px at 72% -10px, rgba(201,219,255,0.55), transparent 62%), " +
        "radial-gradient(460px 300px at 94% 300px, rgba(250,209,232,0.55), transparent 56%)"
      }}></div>
			{/* Masthead */}
			<div className="sprk-wrap" style={{ paddingTop: 28, paddingBottom: 0, display: "flex", alignItems: "center", justifyContent: "flex-end", position: "relative" }}>
				<a href={SQUAD_SEARCH_URL} target="_blank" rel="noreferrer" style={{ font: "500 14px/20px var(--font-sans)", color: "var(--woo-purple-dark)", textDecoration: "none" }}>GitHub ↗</a>
			</div>

			{/* Editorial header */}
			<div className="sprk-wrap" style={{ paddingTop: 44, paddingBottom: 36, position: "relative" }}>
				<p style={{ font: "600 13px/16px var(--font-sans)", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--woo-purple)", margin: "0 0 16px" }}>
					Commerce design squad
				</p>
				<h1 style={Object.assign({
          fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "clamp(34px, 7vw, 56px)", lineHeight: 1.05, letterSpacing: "-0.03em", margin: "0 0 16px", textWrap: "balance"
        }, t.gradientHeadline ? {
          background: "linear-gradient(100deg, var(--woo-indigo) 0%, var(--woo-purple) 55%, var(--woo-purple-dark) 100%)",
          WebkitBackgroundClip: "text", backgroundClip: "text",
          WebkitTextFillColor: "transparent", color: "var(--woo-indigo)"
        } : {})}>
					{t.headline}
				</h1>
				<p style={{ font: "400 16px/1.6 'Menlo', 'Consolas', monospace", color: "var(--woo-ink-soft)", margin: 0, maxWidth: 640, textWrap: "pretty" }}>
					Five designers pushing pull requests in Woo.
					{" "}<strong style={{ color: "var(--woo-ink)", fontWeight: 700 }}><CountUp value={D.TOTALS.merged} /></strong> merged across <strong style={{ color: "var(--woo-ink)", fontWeight: 700 }}><CountUp value={D.TOTALS.surfaces} /></strong> focus areas since {D.TOTALS.since} — <strong style={{ color: "var(--woo-ink)", fontWeight: 700 }}><CountUp value={D.TOTALS.mergedPublic} /></strong> in public releases, <strong style={{ color: "var(--woo-ink)", fontWeight: 700 }}><CountUp value={D.TOTALS.mergedFlagged} /></strong> behind feature flags.
				</p>
				<p className="sprk-updated">{D.dataUpdatedLabel()}</p>
			</div>

			<div className="sprk-wrap sprk-grid">
				{/* Feed */}
				<div ref={tabsAnchor} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
					<div className="sprk-tabhead">
						<span className="sprk-filters">
							<SquadSelect value={person} squad={D.SQUAD} onChange={setPerson} />
							<SurfaceSelect value={surface} areas={D.AREAS} onChange={setSurface} />
						</span>
						<div className="sprk-tabrow" style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 12, borderBottom: "1px solid var(--woo-rule)" }}>
							<STabs active={tab} onChange={setTab} tabStyle={t.tabStyle} counts={tabCounts} />
						</div>
					</div>
					{rows.map(function (pr) {
            return (
              <div key={pr.status + pr.number} className="sprk-card" style={Object.assign({}, card, { padding: "20px 24px", display: "flex", alignItems: "flex-start", gap: 16 })}>
								<SBadge pr={pr} />
								<div className="sprk-card-main" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
									<a href={pr.url || "#"} target="_blank" rel="noreferrer" className="pr-title" style={{ font: "600 16px/22px var(--font-sans)", letterSpacing: "-0.01em", textWrap: "pretty", color: "var(--woo-ink)", textDecoration: "none" }}>{pr.title}</a>
									<span className="sprk-meta" style={{ font: "400 13px/18px var(--font-sans)", color: "var(--woo-ink-soft)" }}>
										{pr.status === "Merged" && <SFlagBadge flagged={pr.flagged} />}
										<span style={{ fontFamily: "Menlo, Consolas, monospace", fontSize: 12 }}>{pr.repo.split("/")[1]}#{pr.number}</span>
										{"  ·  "}{pr.area}{"  ·  "}{DASH.prWhen(pr)}
									</span>
								</div>
								<span className="sprk-card-people" style={{ display: "inline-flex", paddingLeft: 6 }}>
									{pr.authors.map(function (id) {
                    return <span key={id} onClick={avatarTwirl} title="boop" style={{ marginLeft: -6, display: "inline-flex", cursor: "pointer" }}><SAvatar id={id} size={26} /></span>;
                  })}
								</span>
							</div>);

          })}
					{rows.length === 0 &&
          <div style={Object.assign({}, card, { padding: "32px 24px", textAlign: "center", color: "var(--woo-ink-soft)", font: "400 14px/20px var(--font-sans)" })}>
							{person && surface ? "Nothing from " + D.person(person).name + " in " + surface + " here." :
              person ? "Nothing here from " + D.person(person).name + " — yet." :
              surface ? "Nothing in " + surface + " here." : "Nothing here yet."}
						</div>
          }
					<p style={{ font: "400 13px/18px var(--font-sans)", color: "var(--woo-ink-soft)", margin: "6px 0 0", fontStyle: "italic", textWrap: "pretty" }}>
						psst — click a merged badge for a little celebration.
					</p>
				</div>

				{/* Right rail */}
				<div className="sprk-rail" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
					<div style={Object.assign({}, card, { padding: 28 })}>
						<h2 style={{ font: "700 18px/24px var(--font-sans)", letterSpacing: "-0.015em", margin: "0 0 14px" }}>Who we are</h2>
						<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
							{D.SQUAD.map(function (p) {
								return (
									<SFilterAvatar
										key={p.id}
										id={p.id}
										size={38}
										active={person === p.id}
										dimmed={person !== null && person !== p.id}
										onClick={function () {setPerson(person === p.id ? null : p.id);}} />);
							})}
						</div>
						{person ?
						<p style={{ font: "400 13px/18px var(--font-sans)", color: "var(--woo-ink-soft)", margin: "14px 0 0", textWrap: "pretty", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", minHeight: 24 }}>
							<React.Fragment>
								Filtering by <strong style={{ color: "var(--woo-ink)", fontWeight: 600 }}>{D.person(person).name}</strong>
								<button onClick={function () {setPerson(null);}} style={{ border: "1px solid var(--woo-rule)", background: "var(--woo-paper)", borderRadius: 999, padding: "2px 10px", font: "600 12px/16px var(--font-sans)", color: "var(--woo-ink)", cursor: "pointer" }}>Clear</button>
							</React.Fragment>
						</p> : null}
						{person && personAreas.length > 0 ?
							<p style={{ font: "400 12.5px/18px var(--font-sans)", fontStyle: "italic", color: "var(--woo-ink-soft)", margin: "8px 0 0", textWrap: "pretty" }}>Top focus areas: {personAreas.join(", ")}</p> : null}
						<div style={{ borderTop: "1px solid var(--woo-rule)", margin: "24px 0 0", paddingTop: 24 }}>
							<h2 style={{ font: "700 18px/24px var(--font-sans)", letterSpacing: "-0.015em", margin: "0 0 4px" }}>Where we've been</h2>
							<p style={{ font: "400 13px/18px var(--font-sans)", color: "var(--woo-ink-soft)", margin: "0 0 16px", textWrap: "pretty", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", minHeight: 24 }}>
								{surface ?
								<React.Fragment>
									Filtering by <strong style={{ color: "var(--woo-ink)", fontWeight: 600 }}>{surface}</strong>
									<button onClick={function () {setSurface(null);}} style={{ border: "1px solid var(--woo-rule)", background: "var(--woo-paper)", borderRadius: 999, padding: "2px 10px", font: "600 12px/16px var(--font-sans)", color: "var(--woo-ink)", cursor: "pointer" }}>Clear</button>
								</React.Fragment> :
								"Filter by focus area"}
							</p>
							<div className="sprk-chip-cloud">
								{focusAreas.map(function (a) {
									const on = surface === a.name;
									return (
										<button
											key={a.name}
											onClick={function () {setSurface(on ? null : a.name);}}
											aria-pressed={on}
											title={on ? "Clear focus-area filter" : "Show PRs in " + a.name}
											className={"sprk-chip" + (on ? " is-on" : "")}>
											{a.name}
											<span className="sprk-chip-n">{a.count}</span>
										</button>);
								})}
							</div>
						</div>
					</div>
				</div>
			</div>

			<TweaksPanel>
				<TweakSection label="Identity" />
				<TweakText label="Headline" value={t.headline} onChange={function (v) {setTweak("headline", v);}} />
				<TweakSection label="Style" />
				<TweakRadio label="Tab style" value={t.tabStyle} options={["Pills", "Underline"]} onChange={function (v) {setTweak("tabStyle", v);}} />
				<TweakSlider label="Header glow" value={t.gradientGlow} min={0} max={100} step={5} onChange={function (v) {setTweak("gradientGlow", v);}} />
				<TweakToggle label="Gradient headline" value={t.gradientHeadline} onChange={function (v) {setTweak("gradientHeadline", v);}} />
			</TweaksPanel>
		</div>);

}

Object.assign(window, { SprinklesApp });
