/* Direction B — "Editorial cream": Woo deck warmth, Inter display, paper cards. */

function EAvatar({ id, size = 26 }) {
	const p = DASH.person(id);
	if (p.avatar) {
		return <img src={p.avatar + (p.avatar.indexOf("?") >= 0 ? "&" : "?") + "s=" + size * 2} alt={p.name} title={p.name} loading="lazy"
			style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", background: p.color, border: "2px solid var(--woo-cream)", boxSizing: "border-box", flexShrink: 0, display: "inline-block" }} />;
	}
	return (
		<span
			title={p.name}
			style={{
				width: size, height: size, borderRadius: "50%", background: p.color, color: p.fg,
				display: "inline-flex", alignItems: "center", justifyContent: "center",
				fontSize: Math.max(9, Math.round(size * 0.4)), fontWeight: 600, fontFamily: "var(--font-sans)",
				border: "2px solid var(--woo-cream)", boxSizing: "border-box", flexShrink: 0
			}}
		>{p.name.slice(0, 1)}</span>
	);
}

function EMergedBadge({ fresh }) {
	return (
		<button
			onClick={DASH.sprinkleBurst}
			title="Merged"
			style={{
				display: "inline-flex", alignItems: "center", gap: 5, border: "none",
				background: fresh ? "var(--woo-pink)" : "var(--woo-purple)",
				color: "#fff",
				borderRadius: 999, font: "600 11px/16px var(--font-sans)", letterSpacing: "0.04em",
				textTransform: "uppercase", padding: "3px 10px", cursor: "pointer", flexShrink: 0
			}}
		>
			<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
				<path d="M16.7 7.1l-6.3 8.5-3.3-2.5-.9 1.2 4.5 3.4L17.9 8z" />
			</svg>
			{fresh ? "Just shipped" : "Merged"}
		</button>
	);
}

function DashCream() {
	const D = DASH;
	const editorialCard = {
		background: "var(--woo-paper)", borderRadius: 16, padding: 28,
		border: "1px solid var(--woo-rule)", boxSizing: "border-box"
	};
	return (
		<div data-screen-label="B · Editorial cream" style={{ background: "var(--woo-cream)", color: "var(--woo-ink)", fontFamily: "var(--font-sans)", padding: "0 0 56px", minHeight: "100%" }}>
			{/* Masthead */}
			<div style={{ padding: "28px 56px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
				<span style={{ font: "800 20px/24px var(--font-sans)", letterSpacing: "-0.02em" }}>Sprinkles&nbsp;&amp;&nbsp;Co.</span>
				<a href="#" style={{ font: "500 14px/20px var(--font-sans)", color: "var(--woo-purple-dark)", textDecoration: "none" }}>GitHub ↗</a>
			</div>

			{/* Editorial header */}
			<div style={{ padding: "48px 56px 40px", maxWidth: 980 }}>
				<p style={{ font: "600 13px/16px var(--font-sans)", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--woo-purple)", margin: "0 0 16px" }}>
					Commerce design squad
				</p>
				<h1 style={{ font: "800 56px/1.05 var(--font-sans)", letterSpacing: "-0.03em", margin: "0 0 16px" }}>
					We ship what we design.
				</h1>
				<p style={{ font: "400 19px/1.5 var(--font-sans)", color: "var(--woo-ink-soft)", margin: 0, maxWidth: 600 }}>
					Five designers pushing real improvements into Woo, in production, through pull requests.
					{" "}{D.TOTALS.merged} merged across {D.TOTALS.surfaces} focus areas since {D.TOTALS.since}.
				</p>
				<div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 24 }}>
					<span style={{ display: "inline-flex", paddingLeft: 8 }}>
						{D.SQUAD.map((p) => (
							<span key={p.id} style={{ marginLeft: -8, display: "inline-flex" }}><EAvatar id={p.id} size={36} /></span>
						))}
					</span>
					<span style={{ font: "500 14px/20px var(--font-sans)", color: "var(--woo-ink-soft)" }}>
						{D.SQUAD.map((p) => p.name).join(" · ")}
					</span>
				</div>
			</div>

			<div style={{ padding: "0 56px", display: "grid", gridTemplateColumns: "1fr 372px", gap: 28, alignItems: "start" }}>
				{/* Shipped feed */}
				<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
					<h2 style={{ font: "700 22px/28px var(--font-sans)", letterSpacing: "-0.015em", margin: "0 0 4px" }}>Recently shipped</h2>
					{D.MERGED.map((pr) => (
						<div key={pr.number} style={Object.assign({}, editorialCard, { padding: "20px 24px", display: "flex", alignItems: "flex-start", gap: 16 })}>
							<EMergedBadge fresh={pr.fresh} />
							<div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
								<span style={{ font: "600 16px/22px var(--font-sans)", letterSpacing: "-0.01em" }}>{pr.title}</span>
								<span style={{ font: "400 13px/18px var(--font-sans)", color: "var(--woo-ink-soft)" }}>
									<span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 12 }}>{pr.repo.split("/")[1]}#{pr.number}</span>
									{"  ·  "}{pr.area}{"  ·  "}{pr.when}
								</span>
							</div>
							<span style={{ display: "inline-flex", paddingLeft: 6 }}>
								{pr.authors.concat(pr.reviewers).map((id) => (
									<span key={id} style={{ marginLeft: -6, display: "inline-flex" }}><EAvatar id={id} size={26} /></span>
								))}
							</span>
						</div>
					))}
					<p style={{ font: "400 13px/18px var(--font-sans)", color: "var(--woo-ink-soft)", margin: "6px 0 0", fontStyle: "italic" }}>
						psst — click a merged badge for a little celebration.
					</p>
				</div>

				{/* Right rail */}
				<div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
					<div style={editorialCard}>
						<h2 style={{ font: "700 18px/24px var(--font-sans)", letterSpacing: "-0.015em", margin: "0 0 16px" }}>In flight</h2>
						<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
							{D.OPEN.map((pr) => (
								<div key={pr.number} style={{ display: "flex", flexDirection: "column", gap: 5, paddingBottom: 16, borderBottom: "1px solid var(--woo-rule)" }}>
									<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
										<span style={{
											font: "600 11px/16px var(--font-sans)", letterSpacing: "0.04em", textTransform: "uppercase",
											color: pr.status === "Approved" ? "var(--woo-blue)" : pr.status === "Draft" ? "var(--woo-ink-soft)" : "var(--woo-purple-dark)"
										}}>{pr.status}</span>
										<span style={{ display: "inline-flex" }}>{pr.authors.map((id) => <EAvatar key={id} id={id} size={22} />)}</span>
									</div>
									<span style={{ font: "500 14px/20px var(--font-sans)" }}>{pr.title}</span>
									<span style={{ font: "400 12px/16px var(--font-sans)", color: "var(--woo-ink-soft)" }}>{pr.area} · {pr.when}</span>
								</div>
							))}
						</div>
					</div>

					<div style={editorialCard}>
						<h2 style={{ font: "700 18px/24px var(--font-sans)", letterSpacing: "-0.015em", margin: "0 0 4px" }}>Where we've been</h2>
						<p style={{ font: "400 13px/18px var(--font-sans)", color: "var(--woo-ink-soft)", margin: "0 0 16px" }}>Merged PRs by focus area</p>
						<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
							{D.AREAS.map((a) => (
								<span key={a.name} style={{
									display: "inline-flex", alignItems: "center", gap: 7, borderRadius: 999,
									border: "1px solid var(--woo-rule)", background: "var(--woo-cream)",
									padding: "7px 14px", font: "500 13px/18px var(--font-sans)"
								}}>
									{a.name}
									<span style={{ font: "700 12px/16px var(--font-sans)", color: "var(--woo-purple)" }}>{a.count}</span>
								</span>
							))}
						</div>
					</div>
				</div>
			</div>

			<p style={{ font: "500 13px/18px var(--font-sans)", color: "var(--woo-ink-soft)", textAlign: "center", margin: "48px 0 0" }}>
				Making the web a better place — one PR at a time.
			</p>
		</div>
	);
}

Object.assign(window, { DashCream });
