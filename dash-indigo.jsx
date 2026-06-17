/* Direction C — "Indigo mission control": dark Woo indigo, pink merged accents. */

function IAvatar({ id, size = 26 }) {
	const p = DASH.person(id);
	if (p.avatar) {
		return <img src={p.avatar + (p.avatar.indexOf("?") >= 0 ? "&" : "?") + "s=" + size * 2} alt={p.name} title={p.name} loading="lazy"
			style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", background: p.color, border: "2px solid var(--woo-indigo-deep)", boxSizing: "border-box", flexShrink: 0, display: "inline-block" }} />;
	}
	return (
		<span
			title={p.name}
			style={{
				width: size, height: size, borderRadius: "50%", background: p.color, color: p.fg,
				display: "inline-flex", alignItems: "center", justifyContent: "center",
				fontSize: Math.max(9, Math.round(size * 0.4)), fontWeight: 600, fontFamily: "var(--font-sans)",
				border: "2px solid var(--woo-indigo-deep)", boxSizing: "border-box", flexShrink: 0
			}}
		>{p.name.slice(0, 1)}</span>
	);
}

function IMergedBadge() {
	return (
		<button
			onClick={DASH.sprinkleBurst}
			title="Merged"
			style={{
				display: "inline-flex", alignItems: "center", gap: 5, border: "1px solid rgba(232,74,156,0.45)",
				background: "rgba(232,74,156,0.15)", color: "var(--woo-pink)",
				borderRadius: 4, font: "600 11px/16px var(--font-sans)", letterSpacing: "0.04em",
				textTransform: "uppercase", padding: "2px 9px", cursor: "pointer", flexShrink: 0
			}}
		>
			<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
				<path d="M16.7 7.1l-6.3 8.5-3.3-2.5-.9 1.2 4.5 3.4L17.9 8z" />
			</svg>
			Merged
		</button>
	);
}

function DashIndigo() {
	const D = DASH;
	const panel = {
		background: "rgba(255,255,255,0.04)", border: "1px solid var(--woo-rule-on-dark)",
		borderRadius: 12, boxSizing: "border-box"
	};
	const maxCount = Math.max.apply(null, D.AREAS.map((a) => a.count));
	return (
		<div data-screen-label="C · Indigo mission control" style={{ background: "var(--woo-indigo-deep)", color: "#fff", fontFamily: "var(--font-sans)", padding: "0 0 56px", minHeight: "100%" }}>
			{/* Hero */}
			<div style={{ background: "var(--woo-indigo)", padding: "32px 56px 44px" }}>
				<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40 }}>
					<span style={{ font: "800 19px/24px var(--font-sans)", letterSpacing: "-0.02em" }}>The ship log</span>
					<a href="#" style={{ font: "500 13px/20px var(--font-sans)", color: "var(--woo-lavender)", textDecoration: "none" }}>GitHub ↗</a>
				</div>
				<p style={{ font: "600 13px/16px var(--font-sans)", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--woo-lavender)", margin: "0 0 12px" }}>
					Commerce design squad
				</p>
				<h1 style={{ font: "900 52px/1.05 var(--font-sans)", letterSpacing: "-0.03em", margin: "0 0 28px", maxWidth: 760 }}>
					Designers, shipping to production.
				</h1>
				<div style={{ display: "flex", gap: 56, alignItems: "flex-end" }}>
					{[
						{ n: D.TOTALS.merged, label: "PRs merged" },
						{ n: D.TOTALS.surfaces, label: "focus areas improved" },
						{ n: D.SQUAD.length, label: "designers" }
					].map((s) => (
						<div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
							<span style={{ font: "800 44px/1 var(--font-sans)", letterSpacing: "-0.02em" }}>{s.n}</span>
							<span style={{ font: "500 13px/18px var(--font-sans)", color: "var(--woo-lavender)" }}>{s.label}</span>
						</div>
					))}
					<div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
						<span style={{ display: "inline-flex", paddingLeft: 7 }}>
							{D.SQUAD.map((p) => (
								<span key={p.id} style={{ marginLeft: -7, display: "inline-flex" }}><IAvatar id={p.id} size={34} /></span>
							))}
						</span>
						<span style={{ font: "400 12px/16px var(--font-sans)", color: "var(--woo-lavender)" }}>
							{D.SQUAD.map((p) => p.name).join(" · ")} — since {D.TOTALS.since}
						</span>
					</div>
				</div>
			</div>

			{/* In flight strip */}
			<div style={{ padding: "32px 56px 0" }}>
				<h2 style={{ font: "600 12px/16px var(--font-sans)", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--woo-lavender)", margin: "0 0 14px" }}>In flight</h2>
				<div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
					{D.OPEN.map((pr) => (
						<div key={pr.number} style={Object.assign({}, panel, { padding: 18, display: "flex", flexDirection: "column", gap: 8 })}>
							<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
								<span style={{
									font: "600 10px/14px var(--font-sans)", letterSpacing: "0.06em", textTransform: "uppercase",
									color: pr.status === "Approved" ? "var(--woo-blue)" : pr.status === "Draft" ? "var(--woo-lavender)" : "#fff",
									border: "1px solid " + (pr.status === "Approved" ? "rgba(47,107,255,0.4)" : "var(--woo-rule-on-dark)"),
									borderRadius: 4, padding: "2px 7px"
								}}>{pr.status}</span>
								{pr.authors.map((id) => <IAvatar key={id} id={id} size={22} />)}
							</div>
							<span style={{ font: "500 14px/19px var(--font-sans)" }}>{pr.title}</span>
							<span style={{ font: "400 11px/15px var(--font-sans)", color: "var(--woo-lavender)" }}>{pr.area} · {pr.when}</span>
						</div>
					))}
				</div>
			</div>

			{/* Feed + map */}
			<div style={{ padding: "36px 56px 0", display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, alignItems: "start" }}>
				<div style={Object.assign({}, panel, { padding: 0 })}>
					<div style={{ padding: "16px 24px", borderBottom: "1px solid var(--woo-rule-on-dark)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
						<h2 style={{ font: "600 15px/20px var(--font-sans)", margin: 0 }}>Recently shipped</h2>
						<a href="#" style={{ font: "400 12px/16px var(--font-sans)", color: "var(--woo-lavender)", textDecoration: "none" }}>All merged PRs ↗</a>
					</div>
					{D.MERGED.map((pr, i) => (
						<div key={pr.number} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 24px", borderBottom: i < D.MERGED.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
							<IMergedBadge />
							<div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
								<span style={{ font: "500 14px/19px var(--font-sans)" }}>{pr.title}</span>
								<span style={{ font: "400 12px/16px var(--font-sans)", color: "var(--woo-lavender)" }}>
									<span style={{ fontFamily: "Menlo, Consolas, monospace", fontSize: 11 }}>{pr.repo.split("/")[1]}#{pr.number}</span>
									{"  ·  "}{pr.area}{"  ·  "}{pr.when}
								</span>
							</div>
							<span style={{ display: "inline-flex", paddingLeft: 7 }}>
								{pr.authors.concat(pr.reviewers).map((id) => (
									<span key={id} style={{ marginLeft: -7, display: "inline-flex" }}><IAvatar id={id} size={26} /></span>
								))}
							</span>
						</div>
					))}
				</div>

				<div style={Object.assign({}, panel, { padding: 24 })}>
					<h2 style={{ font: "600 15px/20px var(--font-sans)", margin: "0 0 4px" }}>Focus areas</h2>
					<p style={{ font: "400 12px/16px var(--font-sans)", color: "var(--woo-lavender)", margin: "0 0 18px" }}>Merged PRs by focus area</p>
					<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
						{D.AREAS.map((a) => (
							<div key={a.name} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
								<div style={{ display: "flex", justifyContent: "space-between", font: "500 13px/18px var(--font-sans)" }}>
									<span>{a.name}</span>
									<span style={{ color: "var(--woo-lavender)" }}>{a.count}</span>
								</div>
								<div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.08)" }}>
									<div style={{ height: 5, borderRadius: 3, width: (a.count / maxCount) * 100 + "%", background: "linear-gradient(90deg, var(--woo-purple), var(--woo-lavender))" }}></div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			<p style={{ font: "400 12px/16px var(--font-sans)", color: "var(--woo-lavender)", textAlign: "center", margin: "44px 0 0", opacity: 0.8 }}>
				Making the web a better place. &nbsp;·&nbsp; psst — click a merged badge.
			</p>
		</div>
	);
}

Object.assign(window, { DashIndigo });
